import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initSentry, setupSentryMiddleware, setupSentryErrorHandler, captureException } from "./sentry";
import { config } from "./config";
import { ensureTranslationsExist } from "./seed-translations";
import { startNotificationScheduler } from "./services/notification-scheduler";
import fs from "fs";
import path from "path";
// Schema refresh trigger: 2025-12-03

const app = express();

// Initialize Sentry first, before any other middleware
initSentry();

// Setup Sentry request and tracing handlers
setupSentryMiddleware(app);

// Enable trust proxy for accurate client IP tracking behind reverse proxies/CDNs
// Required for rate limiting to work correctly in production
app.set('trust proxy', true);

// Enable gzip compression for all responses (improves load time significantly)
app.use(compression({
  level: 6, // Balanced compression level (1-9, 6 is default)
  threshold: 1024, // Only compress responses larger than 1KB
  filter: (req, res) => {
    // Don't compress if client doesn't accept gzip
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use default filter for other cases
    return compression.filter(req, res);
  }
}));

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

// Use Render's git commit hash as version identifier for cache busting
const BUILD_VERSION = process.env.RENDER_GIT_COMMIT || Date.now().toString();

// Smart caching strategy for optimal performance
app.use((req, res, next) => {
  const reqPath = req.path;
  
  // Check if file is in /assets/ directory (Vite's hashed output, e.g., /assets/index-7C31a2f4.js)
  // Vite uses mixed-case alphanumeric hashes, so we check for the /assets/ path pattern
  const isHashedAsset = reqPath.startsWith('/assets/') && /[-\.][A-Za-z0-9]{8,}\.(js|css|woff2?|ttf|eot)$/i.test(reqPath);
  
  if (isHashedAsset) {
    // Hashed assets can be cached for 1 year (immutable)
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (reqPath === '/' || reqPath.endsWith('.html')) {
    // HTML files should not be cached (to get latest JS/CSS references)
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Build-Version', BUILD_VERSION);
  } else if (reqPath.match(/\.(png|jpg|jpeg|gif|webp|svg|ico)$/i)) {
    // Images can be cached for 1 week
    res.setHeader('Cache-Control', 'public, max-age=604800');
  } else if (reqPath.match(/\.(js|css)$/i)) {
    // Non-hashed JS/CSS - short cache with revalidation
    res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
  }
  
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Ensure translations exist in the database (auto-seed if empty)
  await ensureTranslationsExist();
  
  const server = await registerRoutes(app);

  // Setup Sentry error handler AFTER routes but BEFORE other error handlers
  setupSentryErrorHandler(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (config.isDevelopment) {
    await setupVite(app, server);
  } else {
    // In production, intercept HTML requests and inject version into asset URLs
    // This bypasses Cloudflare's edge cache by creating unique URLs per deployment
    app.use((req, res, next) => {
      if (req.path === '/' || req.path.endsWith('.html')) {
        const distPath = path.resolve(import.meta.dirname, "public");
        const indexPath = path.resolve(distPath, "index.html");
        
        fs.readFile(indexPath, "utf-8", (err: any, html: string) => {
          if (err) {
            next();
            return;
          }
          
          // Inject version parameter into all JS and CSS asset URLs
          const versionedHtml = html
            .replace(
              /<script([^>]*)\ssrc="([^"?]+\.js)"/g,
              `<script$1 src="$2?v=${BUILD_VERSION}"`
            )
            .replace(
              /<link([^>]*)\shref="([^"?]+\.css)"/g,
              `<link$1 href="$2?v=${BUILD_VERSION}"`
            );
          
          res.setHeader('Content-Type', 'text/html');
          res.send(versionedHtml);
        });
      } else {
        next();
      }
    });
    
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  server.listen({
    port: config.port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${config.port}`);
    
    // Start the notification scheduler
    startNotificationScheduler();
  });
})();
