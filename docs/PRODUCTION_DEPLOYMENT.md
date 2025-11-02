# Production Deployment Configuration for petsos.site

This document explains how to configure your production deployment to use Google OAuth and email/password authentication **without** Replit branding.

## Required Environment Variables

### 1. Production URL
Set this to your custom domain:
```
PRODUCTION_URL=https://petsos.site
```

### 2. Google OAuth Credentials
Configure Google OAuth for petsos.site:
```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

**Important:** Make sure your Google Cloud Console OAuth 2.0 Client has these authorized redirect URIs:
- `https://petsos.site/api/auth/google/callback`

### 3. Session Secret
Required for secure session management:
```
SESSION_SECRET=your_secure_random_string_here
```

### 4. Database URL
Your Neon PostgreSQL connection string:
```
DATABASE_URL=your_postgresql_connection_string
```

### 5. REMOVE Replit Auth Variables (Production Only)
**DO NOT SET** these variables in production to avoid Replit branding:
- ❌ `REPLIT_DOMAINS` - Remove or leave unset
- ❌ `REPL_ID` - Remove or leave unset  
- ❌ `ISSUER_URL` - Remove or leave unset

When these are not set, the app will use Google OAuth and email/password authentication only.

## Authentication Flow (Production)

With the above configuration, users will be able to log in via:

1. **Google OAuth** - Click "Continue with Google" button
   - Redirects to Google's consent screen (no Replit branding)
   - Returns to petsos.site after approval
   
2. **Email/Password** - Enter credentials directly
   - No external redirect
   - Fully white-labeled

3. **Phone/Password** - Hong Kong phone number with country code
   - No external redirect
   - Fully white-labeled

## Deployment Steps

1. **Set environment variables** in your deployment platform (Replit Deployments, Render, Vercel, etc.)

2. **Google Cloud Console Setup:**
   - Go to https://console.cloud.google.com/apis/credentials
   - Select your OAuth 2.0 Client ID
   - Add `https://petsos.site/api/auth/google/callback` to Authorized redirect URIs
   - Save changes

3. **Deploy** your application with the new environment variables

4. **Test** the authentication flow:
   - Visit https://petsos.site
   - Click login
   - Try Google OAuth - should show Google's consent screen (not Replit's)
   - Try email/password - should work directly

## Troubleshooting

### Still seeing Replit consent screen?
- Check that `REPLIT_DOMAINS`, `REPL_ID`, and `ISSUER_URL` are NOT set in production
- Clear your browser cookies/cache
- Try incognito mode

### Google OAuth not working?
- Verify `PRODUCTION_URL=https://petsos.site` is set
- Check Google Console has the correct callback URL
- Ensure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct

### Session issues?
- Confirm `SESSION_SECRET` is set
- Verify `DATABASE_URL` points to production database
- Check that the `sessions` table exists in your database
