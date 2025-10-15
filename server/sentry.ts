import * as Sentry from '@sentry/node';
import { Express, Request, Response, NextFunction } from 'express';
import { config } from './config';

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
  const { sentryDsn, sentryTracesSampleRate, sentryEnv } = config.monitoring;
  
  // Only initialize Sentry if DSN is provided
  if (!sentryDsn) {
    console.log('Sentry DSN not provided - error tracking disabled');
    return false;
  }

  Sentry.init({
    dsn: sentryDsn,
    environment: sentryEnv,
    
    // Performance monitoring
    tracesSampleRate: sentryTracesSampleRate,
    
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

  console.log(`Sentry initialized for ${sentryEnv} environment`);
  return true;
}

export function setupSentryMiddleware(app: Express) {
  if (!config.monitoring.sentryDsn) {
    return;
  }

  // In Sentry v8+, tracing and request handling is auto-instrumented via OpenTelemetry
  // No explicit middleware needed
}

export function setupSentryErrorHandler(app: Express) {
  if (!config.monitoring.sentryDsn) {
    return;
  }

  // Error handler must be registered after all routes but before other error handlers
  // Using the new v8+ API
  Sentry.setupExpressErrorHandler(app);
}

export function captureException(error: Error, context?: Record<string, any>) {
  // Only capture if Sentry is initialized
  if (!config.monitoring.sentryDsn) {
    console.error('Cannot capture exception - Sentry not initialized:', error);
    return;
  }

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
