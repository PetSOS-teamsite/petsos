import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { config as appConfig } from "./config";

if (!appConfig.auth.replitDomains && !appConfig.isDevelopment) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  // Use in-memory session store if database URL is not configured (development)
  let sessionStore;
  
  if (appConfig.database.url) {
    const pgStore = connectPg(session);
    sessionStore = new pgStore({
      conString: appConfig.database.url,
      createTableIfMissing: false,
      ttl: appConfig.session.maxAge,
      tableName: "sessions",
    });
  } else if (appConfig.isDevelopment) {
    console.warn('[Session] Using in-memory session store - sessions will not persist across restarts');
    // sessionStore will be undefined, which means express-session uses MemoryStore
  }
  
  return session({
    secret: appConfig.session.secret,
    store: sessionStore, // undefined = in-memory MemoryStore
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: appConfig.session.secure,
      maxAge: appConfig.session.maxAge,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  const firstName = claims["first_name"];
  const lastName = claims["last_name"];
  const name = claims["name"] || (firstName && lastName ? `${firstName} ${lastName}`.trim() : firstName || lastName || null);
  
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    name: name,
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Skip OIDC setup if REPLIT_DOMAINS is not configured (development mode)
  if (!appConfig.auth.replitDomains) {
    console.warn('[Auth] REPLIT_DOMAINS not configured - authentication will not work');
    passport.serializeUser((user: Express.User, cb) => cb(null, user));
    passport.deserializeUser((user: Express.User, cb) => cb(null, user));
    return;
  }

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  for (const domain of appConfig.auth.replitDomains.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  // Helper function to get the correct domain for authentication
  // Maps localhost to the first Replit domain for development
  const getAuthDomain = (hostname: string): string => {
    const domains = appConfig.auth.replitDomains.split(",");
    // If hostname is localhost or not in the list, use the first domain
    if (hostname === 'localhost' || !domains.includes(hostname)) {
      return domains[0];
    }
    return hostname;
  };

  app.get("/api/login", (req, res, next) => {
    const returnTo = req.query.returnTo as string;
    if (returnTo) {
      // Security: Validate returnTo to prevent open redirect attacks
      try {
        // Only allow relative paths (no protocol, no host)
        if (!returnTo.startsWith('/') || returnTo.startsWith('//')) {
          throw new Error('Invalid returnTo: must be relative path');
        }
        
        // Use URL parsing to normalize and validate the path
        const url = new URL(returnTo, `http://localhost`);
        const normalizedPath = url.pathname;
        
        // Reject if path contains traversal attempts or resolves outside root
        if (normalizedPath.includes('..') || !normalizedPath.startsWith('/')) {
          throw new Error('Invalid returnTo: path traversal detected');
        }
        
        // Store the normalized path in session
        (req.session as any).returnTo = normalizedPath;
      } catch (error) {
        // Invalid returnTo - don't set it, will use default redirect
        console.warn('Invalid returnTo parameter:', returnTo, error);
      }
    }
    const authDomain = getAuthDomain(req.hostname);
    passport.authenticate(`replitauth:${authDomain}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    const authDomain = getAuthDomain(req.hostname);
    console.log('[Auth Callback] Hostname:', req.hostname);
    console.log('[Auth Callback] Auth Domain:', authDomain);
    console.log('[Auth Callback] Query params:', req.query);
    console.log('[Auth Callback] Session ID:', (req.session as any)?.id);
    
    passport.authenticate(`replitauth:${authDomain}`, (err: any, user: any, info: any) => {
      if (err) {
        console.error('[Auth Callback] Authentication error:', err);
        return res.redirect("/api/login");
      }
      if (!user) {
        console.error('[Auth Callback] No user returned, info:', info);
        return res.redirect("/api/login");
      }
      
      console.log('[Auth Callback] User authenticated successfully:', user.claims?.email);
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          console.error('[Auth Callback] Login error:', loginErr);
          return res.redirect("/api/login");
        }
        
        // Explicitly save session
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error('[Auth Callback] Session save error:', saveErr);
          }
          console.log('[Auth Callback] Session saved, redirecting to:', (req.session as any).returnTo || '/');
          res.redirect((req.session as any).returnTo || '/');
        });
      });
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};

export const isAdmin: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // Get the user from the database to check their role
    const userId = user.claims.sub;
    const dbUser = await storage.getUser(userId);
    
    if (!dbUser || dbUser.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden - Admin access required" });
    }

    return next();
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};
