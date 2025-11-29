import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initSentry, setupSentryMiddleware, setupSentryErrorHandler, captureException } from "./sentry";
import { config } from "./config";
import fs from "fs";
import path from "path";
// Schema refresh trigger: 2025-11-29

const app = express();

// Initialize Sentry first, before any other middleware
initSentry();

// Setup Sentry request and tracing handlers
setupSentryMiddleware(app);

// Enable trust proxy for accurate client IP tracking behind reverse proxies/CDNs
// Required for rate limiting to work correctly in production
app.set('trust proxy', true);

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

// Prevent caching to avoid users loading old JS bundles
app.use((req, res, next) => {
  // Aggressive cache prevention for HTML, JS, and CSS files
  if (req.path === '/' || req.path.endsWith('.html') || req.path.endsWith('.js') || req.path.endsWith('.css')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    // Tell Cloudflare to bypass cache
    res.setHeader('CDN-Cache-Control', 'no-store');
    res.setHeader('Cloudflare-CDN-Cache-Control', 'no-store');
    // Add version header for debugging
    res.setHeader('X-Build-Version', BUILD_VERSION);
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
  });
})();
