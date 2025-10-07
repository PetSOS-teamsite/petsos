import * as Sentry from '@sentry/react';
import { config } from './config';

const SENSITIVE_KEYS = ['password', 'token', 'api_key', 'apikey', 'secret', 'authorization', 'cookie', 'sessionid', 'auth'];

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
  const { sentryDsn, sentryTracesSampleRate, sentryReplaysSampleRate, sentryEnv } = config.monitoring;
  
  // Only initialize Sentry if DSN is provided
  if (!sentryDsn) {
    console.log('Sentry DSN not provided - error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    environment: sentryEnv,
    
    // Performance monitoring
    tracesSampleRate: sentryTracesSampleRate,
    
    // Replay sessions for debugging
    replaysSessionSampleRate: sentryReplaysSampleRate,
    replaysOnErrorSampleRate: 1.0,
    
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
        maskAllInputs: true, // Mask all input fields for privacy
      }),
    ],
    
    // Filter out sensitive data
    beforeSend(event) {
      // Scrub request headers
      if (event.request?.headers) {
        event.request.headers = scrubSensitiveData(event.request.headers);
      }
      
      // Scrub query params
      if (event.request?.query_string) {
        event.request.query_string = scrubSensitiveData(event.request.query_string);
      }
      
      // Scrub request data
      if (event.request?.data) {
        event.request.data = scrubSensitiveData(event.request.data);
      }
      
      // Scrub extra context
      if (event.extra) {
        event.extra = scrubSensitiveData(event.extra);
      }
      
      // Scrub contexts
      if (event.contexts) {
        event.contexts = scrubSensitiveData(event.contexts);
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

  console.log(`Frontend Sentry initialized for ${sentryEnv} environment`);
}

export { Sentry };
