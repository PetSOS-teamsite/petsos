# Sentry Error Tracking Integration

## Overview

PetSOS includes Sentry error tracking for both backend (Node.js) and frontend (React) to capture and monitor errors in real-time. This helps identify and debug issues quickly, especially in production environments.

## Features

### Backend Error Tracking
- Automatic error capture in Express middleware
- Performance monitoring with configurable trace sampling
- Sensitive data filtering (authorization headers, cookies)
- Error context including request path, method, and status code

### Frontend Error Tracking
- React ErrorBoundary for graceful error handling
- Session replay for debugging user issues
- Performance monitoring with browser tracing
- Breadcrumb tracking for debugging
- User-friendly error UI with recovery options

## Setup

### 1. Create a Sentry Account

1. Go to [sentry.io](https://sentry.io) and sign up
2. Create a new project for both your backend and frontend (or use one project for both)
3. Copy your DSN (Data Source Name) from the project settings

### 2. Configure Environment Variables

Add the following environment variables to your Replit project:

**Backend (required for server-side error tracking):**
```
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

**Frontend (required for client-side error tracking):**
```
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

> **Note**: You can use the same DSN for both or create separate projects in Sentry for better organization.

### 3. Restart the Application

After adding the environment variables, restart the application for changes to take effect.

## How It Works

### Backend Integration

1. **Initialization**: Sentry is initialized in `server/sentry.ts` at server startup (`server/index.ts`)

2. **Middleware Setup**: Three key handlers are configured:
   - **Request Handler**: Creates execution context and captures request metadata
   - **Tracing Handler**: Creates performance traces for each request
   - **Error Handler**: Automatically captures unhandled errors with full context

3. **Privacy**: Comprehensive sensitive data scrubbing across all event fields:
   - Headers (authorization, cookies)
   - Query parameters (tokens, API keys)
   - Request bodies (passwords, secrets)
   - Extra context and breadcrumbs
   - Uses recursive scrubbing to handle nested objects

### Frontend Integration

1. **Initialization**: Sentry is initialized early in `client/src/App.tsx` before any components render

2. **ErrorBoundary**: Wraps the entire application to catch React errors:
   ```tsx
   <ErrorBoundary>
     <App />
   </ErrorBoundary>
   ```

3. **Error UI**: When an error occurs, users see a friendly error page with options to:
   - Try again (reset error boundary)
   - Go home (navigate to homepage)

4. **Session Replay**: Records user sessions with privacy controls:
   - All input fields are masked automatically
   - 10% of normal sessions, 100% of error sessions are recorded
   
5. **Privacy**: Comprehensive sensitive data scrubbing across all event fields:
   - Headers (authorization, cookies, session IDs)
   - Query parameters (tokens, API keys)
   - Request data (passwords, secrets)
   - Extra context, contexts, and breadcrumbs
   - Uses recursive scrubbing to handle nested objects

## Manual Error Reporting

### Backend

Use the `captureException` function from `server/sentry.ts`:

```typescript
import { captureException } from './sentry';

try {
  // Your code
} catch (error) {
  captureException(error, {
    customContext: 'Additional debug info',
    userId: user.id,
  });
}
```

### Frontend

Use Sentry directly from `@/lib/sentry`:

```typescript
import { Sentry } from '@/lib/sentry';

try {
  // Your code
} catch (error) {
  Sentry.captureException(error);
}
```

## Configuration

### Sample Rates

The current configuration uses different sample rates for development and production:

**Backend (`server/sentry.ts`):**
- Development: 100% trace sampling
- Production: 10% trace sampling

**Frontend (`client/src/lib/sentry.ts`):**
- Development: 100% trace sampling
- Production: 10% trace sampling
- Session replay: 10% of normal sessions, 100% of error sessions

You can adjust these rates in the respective configuration files.

### Privacy & Compliance

Sentry integration respects user privacy with comprehensive protection:

1. **Sensitive data filtering**: Comprehensive recursive scrubbing of:
   - Authorization headers, cookies, session IDs
   - Passwords, tokens, API keys, secrets
   - Request bodies, query parameters, headers
   - Extra context, contexts, and breadcrumbs
   - All nested objects up to 5 levels deep
   
2. **No PII collection**: User personal information is not automatically collected

3. **Session replay privacy**:
   - All input fields are masked by default (`maskAllInputs: true`)
   - Only UI interactions are captured, not sensitive input values
   - 10% of normal sessions, 100% of error sessions
   
4. **GDPR compliant**: Can be disabled entirely by removing DSN environment variables

## Disabling Sentry

To disable Sentry error tracking:

1. Remove or leave empty the `SENTRY_DSN` and `VITE_SENTRY_DSN` environment variables
2. Restart the application

The app will log "Sentry DSN not provided - error tracking disabled" and continue to work normally without error tracking.

## Error Boundary Features

The React ErrorBoundary provides:

1. **Error Display**: Shows a user-friendly error message with the error details
2. **Recovery Options**:
   - "Try Again" button: Resets the error boundary and attempts to re-render
   - "Go Home" button: Navigates to the homepage
3. **Automatic Reporting**: Errors are automatically sent to Sentry with React component stack traces

## Best Practices

1. **Use descriptive error messages**: Make errors easy to understand and debug
2. **Add context to manual captures**: Include relevant data to help debug issues
3. **Test error scenarios**: Verify that errors are properly captured and displayed
4. **Monitor regularly**: Check Sentry dashboard for new errors and trends
5. **Set up alerts**: Configure Sentry to notify your team of critical errors

## Troubleshooting

### Errors not appearing in Sentry

1. Verify DSN is correctly set in environment variables
2. Check console for initialization messages
3. Ensure network allows connections to sentry.io
4. Verify sample rate isn't filtering out your errors

### ErrorBoundary not catching errors

1. ErrorBoundary only catches errors in React components during render
2. Errors in event handlers need manual `try/catch` with `Sentry.captureException()`
3. Async errors need manual capture

## Related Files

- `server/sentry.ts` - Backend Sentry configuration
- `client/src/lib/sentry.ts` - Frontend Sentry configuration
- `client/src/components/ErrorBoundary.tsx` - React ErrorBoundary component
- `server/index.ts` - Backend integration point
- `client/src/App.tsx` - Frontend integration point
