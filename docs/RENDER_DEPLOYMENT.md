# PetSOS Render Deployment Guide

## Step-by-Step Deployment to Render

This guide will walk you through deploying PetSOS to Render in ~15 minutes.

---

## Prerequisites

✅ **What You Already Have**:
- GitHub repository with your PetSOS code
- Neon PostgreSQL database (already configured)
- Google OAuth credentials (if using)
- All code is production-ready

✅ **What You Need to Create**:
- Render account (free to sign up)
- Production environment variables

---

## Step 1: Prepare Your Code (Already Done! ✅)

Your application is already configured with:
- ✅ Health check endpoint at `/health`
- ✅ Production build scripts (`npm run build`, `npm start`)
- ✅ Render blueprint (`render.yaml`) for easy deployment
- ✅ Environment-based configuration

---

## Step 2: Create Render Account

1. **Go to**: https://render.com
2. **Sign up** with GitHub (recommended) or email
3. **Connect GitHub**: Authorize Render to access your repositories

---

## Step 3: Create Web Service

### Option A: One-Click Deploy (Easiest)

1. Push your code to GitHub (including the `render.yaml` file)
2. In Render dashboard, click **"New +"** → **"Blueprint"**
3. Connect your GitHub repository
4. Render will auto-detect `render.yaml` and configure everything
5. **Skip to Step 4** to configure environment variables

### Option B: Manual Setup

1. In Render dashboard, click **"New +"** → **"Web Service"**
2. **Connect your GitHub repository**
3. **Configure the service**:
   - **Name**: `petsos-app` (or your preferred name)
   - **Region**: Choose closest to your users:
     - `Singapore` (recommended for Hong Kong/Asia)
     - `Frankfurt` (Europe)
     - `Oregon` (US West)
   - **Branch**: `main` (or your production branch)
   - **Root Directory**: Leave blank
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Starter ($19/month)

4. **Advanced Settings**:
   - **Health Check Path**: `/health`
   - **Auto-Deploy**: Yes (recommended)

---

## Step 4: Configure Environment Variables

In the Render dashboard, add these environment variables:

### Required Variables

```bash
# Core Configuration
NODE_ENV=production
PORT=10000

# Database - Use your existing Neon connection string
DATABASE_URL=postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/petsos?sslmode=require

# Session Secret - Generate with: openssl rand -hex 32
SESSION_SECRET=<paste-your-generated-secret-here>

# Production Domain - Will be provided by Render after first deploy
# Format: https://petsos-app.onrender.com (update after Step 5)
REPLIT_DOMAINS=https://petsos-app.onrender.com
```

### Google OAuth (Recommended)

```bash
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Optional Services

```bash
# Sentry Error Tracking
SENTRY_DSN=https://your-key@sentry.io/project-id
VITE_SENTRY_DSN=https://your-frontend-key@sentry.io/project-id

# Google Analytics
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Regional Defaults
DEFAULT_COUNTRY=HK
DEFAULT_COUNTRY_CODE=+852
DEFAULT_LANGUAGE=zh-HK
```

### How to Add Variables in Render:

1. In your web service settings, go to **"Environment"** tab
2. Click **"Add Environment Variable"**
3. Enter **Key** and **Value**
4. Click **"Save Changes"**
5. Render will auto-redeploy with new variables

---

## Step 5: Deploy!

1. Click **"Create Web Service"** (or "Deploy" if using Blueprint)
2. Render will:
   - Clone your repository
   - Run `npm install && npm run build`
   - Start the app with `npm start`
   - Provision SSL certificate
   - Assign a URL: `https://your-app.onrender.com`

3. **Monitor the deploy**:
   - Watch the build logs in real-time
   - Look for `"serving on port 10000"` in logs
   - Health check should pass at `/health`

4. **First deploy takes ~3-5 minutes**

---

## Step 6: Update Production Domain

After your first successful deploy:

1. **Copy your Render URL**: `https://petsos-app.onrender.com`
2. **Update environment variable**:
   - Go to Environment tab
   - Update `REPLIT_DOMAINS` to your Render URL
   - Click "Save Changes" (auto-redeploys)

---

## Step 7: Update Google OAuth Callback

If using Google OAuth:

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your OAuth 2.0 Client ID
3. **Add Authorized Redirect URI**:
   ```
   https://your-app.onrender.com/api/auth/google/callback
   ```
4. Click **"Save"**

---

## Step 8: Test Your Deployment

### Test Checklist:

1. **Health Check** ✅
   ```bash
   curl https://your-app.onrender.com/health
   # Expected: {"status":"healthy","timestamp":"...","uptime":...}
   ```

2. **Frontend Loads** ✅
   - Visit: `https://your-app.onrender.com`
   - Should see PetSOS homepage

3. **Authentication** ✅
   - Click "Sign In"
   - Try Google OAuth login
   - Try Email/Password login

4. **Emergency Request Flow** ✅
   - Create a pet profile
   - Submit emergency request
   - Verify clinic broadcast

5. **Admin Dashboard** ✅
   - Login as admin
   - Access `/admin`
   - Verify all features work

---

## Step 9: Custom Domain (Optional)

### Add Your Own Domain

1. **In Render Dashboard**:
   - Go to your web service → "Settings" → "Custom Domains"
   - Click "Add Custom Domain"
   - Enter your domain: `petsos.com` or `app.petsos.com`

2. **Update DNS Records** (at your domain registrar):
   
   **For root domain** (`petsos.com`):
   ```
   Type: A
   Name: @
   Value: <Render IP provided>
   ```

   **For subdomain** (`app.petsos.com`):
   ```
   Type: CNAME
   Name: app
   Value: your-app.onrender.com
   ```

3. **SSL Certificate**:
   - Render auto-provisions SSL (Let's Encrypt)
   - Takes ~5-10 minutes to activate
   - HTTPS enforced automatically

4. **Update Environment Variables**:
   - Update `REPLIT_DOMAINS` to your custom domain
   - Update Google OAuth callback URL

---

## Monitoring & Maintenance

### Render Dashboard Features

**Metrics** (built-in):
- CPU/Memory usage
- Response time
- Request rate
- Error rate

**Logs**:
- Real-time streaming logs
- Searchable log history
- Download logs for analysis

**Auto-Deploy**:
- Every `git push` triggers deploy
- Review builds before going live
- One-click rollback to previous version

### Set Up Alerts

1. **In Render Dashboard** → "Notifications"
2. Add email/Slack for:
   - Deploy failures
   - Service crashes
   - High error rates

### Database Backups

Your Neon database has:
- ✅ Daily automatic backups
- ✅ Point-in-time recovery
- ✅ Access in Neon dashboard

---

## Scaling Your Application

### Current Setup:
- **Plan**: Starter ($19/month)
- **Resources**: 512MB RAM, 0.5 CPU
- **Good for**: 0-10K monthly active users

### When to Scale:

**Traffic: 10K-100K users**
- Upgrade to **Standard** plan ($25/month)
- 2GB RAM, 1 CPU
- Better performance

**Traffic: 100K+ users**
- Upgrade to **Pro** plan ($85/month)
- 4GB RAM, 2 CPU
- Horizontal auto-scaling
- Consider adding:
  - Redis caching (Render add-on)
  - CDN (Cloudflare - free tier)
  - Read replicas (Neon)

---

## Troubleshooting

### Issue: Build Fails

**Symptom**: Deploy fails during `npm install` or `npm run build`

**Solutions**:
1. Check build logs for specific errors
2. Verify `package.json` scripts are correct
3. Ensure all dependencies are in `dependencies` (not just `devDependencies`)
4. Try local build: `npm run build`

### Issue: App Crashes on Start

**Symptom**: Build succeeds but app won't start

**Solutions**:
1. Check runtime logs in Render dashboard
2. Verify `DATABASE_URL` is set correctly
3. Ensure `SESSION_SECRET` is configured
4. Check that `PORT=10000` (Render's assigned port)

### Issue: Database Connection Fails

**Symptom**: "Cannot connect to database" errors

**Solutions**:
1. Verify `DATABASE_URL` includes `?sslmode=require`
2. Use `-pooler` hostname for connection pooling
3. Check Neon database status
4. Verify IP is not blocked (Neon allows all by default)

### Issue: Google OAuth Not Working

**Symptom**: OAuth redirect fails or shows error

**Solutions**:
1. Verify callback URL in Google Console matches exactly:
   ```
   https://your-app.onrender.com/api/auth/google/callback
   ```
2. No trailing slashes
3. Use `https://` (not `http://`)
4. Check `REPLIT_DOMAINS` environment variable

### Issue: Session Not Persisting

**Symptom**: Users logged out after refresh

**Solutions**:
1. Verify `SESSION_SECRET` is set
2. Check database has `session` table
3. Ensure cookies are enabled in browser
4. Check `trust proxy` is enabled (already configured ✅)

---

## Cost Breakdown

### Monthly Costs:

| Service | Plan | Cost |
|---------|------|------|
| **Render Web Service** | Starter | $19/mo |
| **Neon PostgreSQL** | Scale (1GB) | $19/mo |
| **Cloudflare CDN** | Free | $0 |
| **Sentry Monitoring** | Developer | $0 (free tier) |
| **Google Analytics** | Standard | $0 |
| **Total** | | **~$38/month** |

### Free Tier Options:

- **Render**: 750 hours/month free (but sleeps after inactivity - not recommended for production)
- **Neon**: Free tier available (0.5GB storage - okay for testing)

---

## Next Steps After Deployment

1. ✅ **Test all features thoroughly**
2. ✅ **Set up monitoring alerts**
3. ✅ **Configure custom domain** (if desired)
4. ✅ **Share your production URL with users!**
5. 📊 **Monitor analytics and error rates**
6. 🔄 **Plan regular updates and maintenance**

---

## Production Checklist

Before going live, verify:

- [ ] All environment variables configured
- [ ] Google OAuth callback URL updated
- [ ] Health check passing (`/health` returns 200)
- [ ] Frontend loads correctly
- [ ] User authentication works (Google + Email)
- [ ] Emergency request flow tested end-to-end
- [ ] Admin dashboard accessible
- [ ] Database connection stable
- [ ] SSL certificate active (https://)
- [ ] Sentry error tracking configured
- [ ] Google Analytics tracking
- [ ] Custom domain configured (optional)
- [ ] Monitoring alerts set up
- [ ] Team has access to Render dashboard

---

## Support Resources

- **Render Docs**: https://render.com/docs
- **Render Status**: https://status.render.com
- **Neon Docs**: https://neon.tech/docs
- **PetSOS Deployment Guide**: `/docs/DEPLOYMENT.md`

**Questions?** Check logs first, then consult the troubleshooting section above.

---

**🚀 You're ready to deploy! Follow the steps above and your PetSOS app will be live in ~15 minutes.**
