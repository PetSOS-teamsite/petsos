import * as Sentry from '@sentry/node';
import { Express, Request, Response, NextFunction } from 'express';

const SENSITIVE_KEYS = ['password', 'token', 'api_key', 'apikey', 'secret', 'authorization', 'cookie', 'auth'];

function scrubSensitiveData(data: any, depth = 0): any {
  if (depth > 5 || !data) return data;
  
  if (typeof data === 'string') {
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => scrubSensitiveData(item, depth + 1));
  }
  
  if (typeof data === 'object') {
    const scrubbed: any = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.some(k => lowerKey.includes(k))) {
        scrubbed[key] = '[REDACTED]';
      } else {
        scrubbed[key] = scrubSensitiveData(value, depth + 1);
      }
    }
    return scrubbed;
  }
  
  return data;
}

export function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  
  // Only initialize Sentry if DSN is provided
  if (!dsn) {
    console.log('Sentry DSN not provided - error tracking disabled');
    return false;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    
    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Filter out sensitive data
    beforeSend(event) {
      // Scrub sensitive headers
      if (event.request?.headers) {
        event.request.headers = scrubSensitiveData(event.request.headers);
      }
      
      // Scrub query params
      if (event.request?.query_string) {
        event.request.query_string = scrubSensitiveData(event.request.query_string);
      }
      
      // Scrub request body/data
      if (event.request?.data) {
        event.request.data = scrubSensitiveData(event.request.data);
      }
      
      // Scrub extra context
      if (event.extra) {
        event.extra = scrubSensitiveData(event.extra);
      }
      
      // Scrub breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(breadcrumb => ({
          ...breadcrumb,
          data: scrubSensitiveData(breadcrumb.data),
        }));
      }
      
      return event;
    },
  });

  console.log(`Sentry initialized for ${process.env.NODE_ENV} environment`);
  return true;
}

export function setupSentryMiddleware(app: Express) {
  const dsn = process.env.SENTRY_DSN;
  
  if (!dsn) {
    return;
  }

  // Request handler creates a separate execution context using domains
  app.use(Sentry.Handlers.requestHandler({
    ip: true, // Include user IP
  }) as any);
  
  // TracingHandler creates a trace for every incoming request
  app.use(Sentry.Handlers.tracingHandler() as any);
}

export function setupSentryErrorHandler(app: Express) {
  const dsn = process.env.SENTRY_DSN;
  
  if (!dsn) {
    return;
  }

  // Error handler must be registered after all routes but before other error handlers
  app.use(Sentry.Handlers.errorHandler() as any);
}

export function captureException(error: Error, context?: Record<string, any>) {
  if (context) {
    Sentry.withScope((scope) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
}

export { Sentry };
