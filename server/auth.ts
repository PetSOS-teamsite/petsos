import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import bcrypt from "bcrypt";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { config as appConfig } from "./config";

// Helper function to sanitize user data before sending to client
export function sanitizeUser(user: any) {
  if (!user) return null;
  const { passwordHash, password, ...sanitized } = user;
  return sanitized;
}

// Google OAuth Configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const BASE_URL = process.env.REPLIT_DOMAINS 
  ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
  : 'http://localhost:5000';

export function getSession() {
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
  }
  
  return session({
    secret: appConfig.session.secret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: appConfig.session.secure,
      maxAge: appConfig.session.maxAge,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Passport session serialization
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Google OAuth Strategy
  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: GOOGLE_CLIENT_ID,
          clientSecret: GOOGLE_CLIENT_SECRET,
          callbackURL: `${BASE_URL}/api/auth/google/callback`,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            if (!email) {
              return done(new Error("No email found in Google profile"));
            }

            // Check if user exists
            let user = await storage.getUserByEmail(email);

            if (!user) {
              // Create new user from Google profile
              user = await storage.createUser({
                email: email,
                firstName: profile.name?.givenName || "",
                lastName: profile.name?.familyName || "",
                profileImageUrl: profile.photos?.[0]?.value,
                role: "user",
              });
            }

            done(null, user);
          } catch (error) {
            done(error as Error);
          }
        }
      )
    );

    // Google OAuth routes
    app.get(
      "/api/auth/google",
      (req, res, next) => {
        const returnTo = req.query.returnTo as string;
        if (returnTo && returnTo.startsWith('/')) {
          (req.session as any).returnTo = returnTo;
        }
        next();
      },
      passport.authenticate("google", { scope: ["profile", "email"] })
    );

    app.get(
      "/api/auth/google/callback",
      passport.authenticate("google", { failureRedirect: "/login" }),
      (req, res) => {
        const returnTo = (req.session as any).returnTo || "/profile";
        delete (req.session as any).returnTo;
        res.redirect(returnTo);
      }
    );
  } else {
    console.warn('[Auth] Google OAuth not configured - set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET');
  }

  // Local Strategy (Email/Phone + Password)
  passport.use(
    new LocalStrategy(
      { usernameField: "identifier", passwordField: "password", passReqToCallback: true },
      async (req, identifier, password, done) => {
        try {
          // Check if identifier is a phone number (starts with +) or email
          let user;
          const isPhone = identifier?.startsWith('+');
          
          if (isPhone) {
            user = await storage.getUserByPhone(identifier);
          } else {
            user = await storage.getUserByEmail(identifier);
          }
          
          if (!user || !user.passwordHash) {
            return done(null, false, { message: "Invalid credentials" });
          }

          const isValidPassword = await bcrypt.compare(password, user.passwordHash);
          
          if (!isValidPassword) {
            return done(null, false, { message: "Invalid credentials" });
          }

          done(null, user);
        } catch (error) {
          done(error);
        }
      }
    )
  );

  // Local auth routes
  app.post("/api/auth/login", (req, res, next) => {
    // Prepare identifier: combine phone + countryCode or use email
    const { email, phone, countryCode } = req.body;
    const identifier = phone && countryCode ? `${countryCode}${phone}` : email;
    
    // Replace req.body with normalized identifier for passport
    req.body.identifier = identifier;
    
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Internal server error" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }
        return res.json({ success: true, user: sanitizeUser(user) });
      });
    })(req, res, next);
  });

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, phone, countryCode, password, firstName, lastName } = req.body;

      if ((!email && !phone) || !password) {
        return res.status(400).json({ message: "Email or phone number, and password are required" });
      }

      // Format phone number with country code if provided
      const fullPhone = phone && countryCode ? `${countryCode}${phone}` : phone;

      // Check if user already exists
      if (email) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser) {
          return res.status(400).json({ message: "Email already registered" });
        }
      }
      
      if (fullPhone) {
        const existingUser = await storage.getUserByPhone(fullPhone);
        if (existingUser) {
          return res.status(400).json({ message: "Phone number already registered" });
        }
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const user = await storage.createUser({
        email: email || null,
        phone: fullPhone || null,
        passwordHash,
        firstName: firstName || "",
        lastName: lastName || "",
        role: "user",
      });

      // Log user in
      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Registration successful but login failed" });
        }
        return res.json({ success: true, user: sanitizeUser(user) });
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/user", (req, res) => {
    if (req.isAuthenticated()) {
      res.json(sanitizeUser(req.user));
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

export const isAdmin: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = req.user as any;
  if (user?.role !== 'admin') {
    return res.status(403).json({ message: "Forbidden - Admin access required" });
  }

  next();
};
