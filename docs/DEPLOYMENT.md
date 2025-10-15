# PetSOS Deployment Guide

## Overview

This guide helps you deploy PetSOS to production platforms **independent of Replit**. Your application is architected with clean separation between Replit-specific features and core functionality, making migration straightforward.

---

## Current Architecture Analysis

### ✅ Already Independent (No Changes Needed)
- **Database**: Neon PostgreSQL (cloud-hosted, works anywhere)
- **External Services**: WhatsApp API, Gmail API, Google Analytics, Sentry
- **Frontend**: React + Vite (portable)
- **Backend**: Node.js + Express (runs anywhere)
- **Session Storage**: PostgreSQL-backed (via `connect-pg-simple`)

### ⚠️ Replit-Specific Components (Need Replacement)
1. **Authentication** (`server/replitAuth.ts`)
   - Currently uses Replit's OIDC for SSO
   - **Solution**: Already have Google OAuth + Email/Password auth as fallback ✅
   - **Action**: Remove Replit auth, keep existing Google/local strategies

2. **Environment Variables**
   - `REPLIT_DOMAINS` - Used for auth callback URLs
   - **Solution**: Replace with your production domain

3. **Port Configuration**
   - Currently binds to `0.0.0.0:5000`
   - **Solution**: Already configurable via `PORT` environment variable ✅

---

## Platform Comparison (2025)

| Platform | Best For | Monthly Cost | Setup Difficulty | Notes |
|----------|----------|--------------|------------------|-------|
| **Render** | Startups, quick deploy | $19 app + $7 DB | ⭐⭐⭐⭐⭐ Easy | Heroku alternative, auto-deploy from Git |
| **Railway** | Personal projects | ~$10-20 | ⭐⭐⭐⭐⭐ Easy | Zero-config, pay-as-you-go |
| **DigitalOcean** | Cost-effective production | $10 app + $15 DB | ⭐⭐⭐⭐ Easy | Transparent pricing |
| **AWS Elastic Beanstalk** | Enterprise, scaling | $30-100+ | ⭐⭐⭐ Moderate | Full AWS ecosystem |
| **Google Cloud Run** | Serverless containers | Free tier / pay-per-use | ⭐⭐⭐ Moderate | Auto-scaling, cost-efficient |
| **Azure App Service** | Microsoft ecosystem | $30-80 | ⭐⭐⭐ Moderate | Enterprise compliance |

**Recommendation**: Start with **Render** or **Railway** for easiest migration, then scale to AWS/GCP as needed.

---

## Quick Start: Deploy to Render (Recommended)

### Step 1: Prepare Your Code

1. **Remove Replit Auth** (optional, keep as fallback):
```bash
# In server/auth.ts, comment out Replit strategy
# Users can still login via Google OAuth or Email/Password
```

2. **Update Environment Variables**:
Create `.env.production` file:
```env
NODE_ENV=production
PORT=10000
DATABASE_URL=<your-neon-connection-string>
SESSION_SECRET=<generate-secure-random-string>
REPLIT_DOMAINS=https://your-app.onrender.com

# Google OAuth (keep existing)
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>

# Optional Services
SENTRY_DSN=<your-sentry-dsn>
VITE_GA_MEASUREMENT_ID=<your-ga-id>
```

### Step 2: Deploy to Render

1. **Create Render Account**: https://render.com
2. **Create Web Service**:
   - Connect your GitHub repo
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: Node
   - **Region**: Choose closest to your users (Hong Kong → Singapore)

3. **Add Environment Variables**:
   - Copy all variables from `.env.production`
   - Render auto-detects `PORT=10000`

4. **Database**:
   - Use your existing Neon PostgreSQL
   - Add `DATABASE_URL` to Render environment variables
   - Connection string format:
     ```
     postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require
     ```

5. **Deploy**:
   - Render auto-deploys on every Git push
   - Build time: ~2-3 minutes
   - Your app will be live at `https://petsos.onrender.com`

6. **Custom Domain** (optional):
   - Add your domain in Render dashboard
   - Update DNS records (CNAME to Render)
   - SSL certificate auto-provisioned

### Step 3: Update OAuth Callback URLs

Update your Google OAuth settings:
- **Authorized redirect URIs**:
  ```
  https://your-app.onrender.com/api/auth/google/callback
  ```

---

## Alternative: Deploy to Railway

### Quick Deploy (2 minutes)

1. **Install Railway CLI**:
```bash
npm install -g @railway/cli
railway login
```

2. **Deploy**:
```bash
railway init
railway up
```

3. **Add Environment Variables**:
```bash
railway variables set DATABASE_URL=<neon-connection-string>
railway variables set SESSION_SECRET=<random-secret>
railway variables set NODE_ENV=production
```

4. **Database**:
   - Use existing Neon PostgreSQL
   - Or provision Railway PostgreSQL: `railway add postgresql`

5. **Custom Domain**:
```bash
railway domain
# Follow prompts to add custom domain
```

---

## Docker Deployment (AWS, GCP, Azure)

### Create Dockerfile

```dockerfile
# Production Dockerfile for PetSOS
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build frontend
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy dependencies and built files
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/package*.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 5000

CMD ["node", "server/index.js"]
```

### Docker Compose (Local Testing)

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    container_name: petsos-app
    restart: always
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: production
      PORT: 5000
      DATABASE_URL: ${DATABASE_URL}
      SESSION_SECRET: ${SESSION_SECRET}
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
      GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET}
    networks:
      - petsos-network

networks:
  petsos-network:
    driver: bridge
```

### Deploy to AWS Elastic Container Service (ECS)

```bash
# 1. Build and tag image
docker build -t petsos-app .
docker tag petsos-app:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/petsos-app:latest

# 2. Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/petsos-app:latest

# 3. Deploy via ECS (use AWS Console or CLI)
# Configure task definition with environment variables
# Set up load balancer for HTTPS
```

---

## Environment Variables Reference

### Required Variables

```env
# Core Configuration
NODE_ENV=production
PORT=5000

# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require

# Session Security
SESSION_SECRET=<generate-with-openssl-rand-hex-32>

# Authentication Callback URL
REPLIT_DOMAINS=https://your-production-domain.com
```

### Optional Services

```env
# Google OAuth
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>

# Gmail Integration
GMAIL_CLIENT_ID=<gmail-client-id>
GMAIL_CLIENT_SECRET=<gmail-client-secret>
GMAIL_REDIRECT_URI=https://your-domain.com/api/gmail/callback
GMAIL_REFRESH_TOKEN=<refresh-token>

# OpenAI (if using AI features)
OPENAI_API_KEY=<your-openai-key>

# Monitoring
SENTRY_DSN=<backend-sentry-dsn>
VITE_SENTRY_DSN=<frontend-sentry-dsn>

# Analytics
VITE_GA_MEASUREMENT_ID=<google-analytics-id>

# Regional Defaults
DEFAULT_COUNTRY=HK
DEFAULT_COUNTRY_CODE=+852
DEFAULT_LANGUAGE=zh-HK
```

### Generate Secure Secrets

```bash
# Session secret
openssl rand -hex 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Database Migration

Your Neon PostgreSQL database works seamlessly with any hosting platform.

### Connection String Format

```
postgresql://[user]:[password]@[hostname]-pooler.region.aws.neon.tech/[database]?sslmode=require
```

**Key Points**:
- Use `-pooler` suffix for connection pooling (recommended)
- Always include `sslmode=require`
- Neon supports up to 10,000 concurrent connections with pooling

### Update Connection in Production

No changes needed! Your current `server/db.ts` already uses:
```typescript
const db = drizzle(sql(process.env.DATABASE_URL!));
```

Just set `DATABASE_URL` in your production environment variables.

---

## SSL/HTTPS Configuration

### Render/Railway (Automatic)
- SSL certificates auto-provisioned
- HTTPS enforced by default
- No configuration needed

### AWS/GCP/Azure (Manual)
1. **Use Application Load Balancer** (AWS) or equivalent
2. **Provision SSL certificate** via AWS Certificate Manager
3. **Terminate SSL at load balancer**, forward HTTP to app
4. **Update session config** in `server/config.ts`:
   ```typescript
   session: {
     secure: true, // Already configured for production
     cookie: {
       httpOnly: true,
       sameSite: 'lax',
       secure: isProduction
     }
   }
   ```

---

## CI/CD Setup

### GitHub Actions (Automated Deployment)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Render

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Build
        run: npm run build
        
      - name: Deploy to Render
        uses: johnbeynon/render-deploy-action@v0.0.8
        with:
          service-id: ${{ secrets.RENDER_SERVICE_ID }}
          api-key: ${{ secrets.RENDER_API_KEY }}
```

### Render Auto-Deploy (Recommended)
- **No CI/CD needed** - Render auto-deploys on Git push
- **Build logs** available in dashboard
- **Rollback** to previous deploy with one click

---

## Post-Deployment Checklist

- [ ] Remove Replit auth or mark as optional
- [ ] Update `REPLIT_DOMAINS` to production domain
- [ ] Set secure `SESSION_SECRET`
- [ ] Update Google OAuth callback URLs
- [ ] Configure Sentry for error tracking
- [ ] Set up Google Analytics
- [ ] Test emergency request flow end-to-end
- [ ] Verify WhatsApp/Gmail integrations
- [ ] Set up custom domain
- [ ] Enable SSL/HTTPS
- [ ] Configure backups (Neon auto-backups daily)
- [ ] Set up monitoring/alerting

---

## Monitoring & Performance

### Sentry (Already Integrated)
```env
SENTRY_DSN=<your-backend-dsn>
VITE_SENTRY_DSN=<your-frontend-dsn>
```

### Neon Database Metrics
- Monitor connection pool usage in Neon dashboard
- Set up alerts for query performance
- Enable query caching for frequently accessed data

### Application Metrics
- **Render**: Built-in metrics (CPU, memory, response time)
- **Railway**: Resource usage dashboard
- **AWS**: CloudWatch integration

---

## Scaling Strategy

### Phase 1: Launch (0-10K users)
- **Platform**: Render/Railway single instance
- **Database**: Neon Free tier (3GB storage)
- **Cost**: ~$25-40/month

### Phase 2: Growth (10K-100K users)
- **Platform**: Add auto-scaling (Render Pro)
- **Database**: Neon Scale tier
- **CDN**: Cloudflare for static assets
- **Cost**: ~$100-300/month

### Phase 3: Scale (100K+ users)
- **Platform**: AWS ECS with auto-scaling
- **Database**: Neon Business tier with read replicas
- **Caching**: Redis for session/query caching
- **Load Balancing**: Multi-region deployment
- **Cost**: $500-2000+/month

---

## Troubleshooting

### Common Issues

**Issue**: "Cannot connect to database"
- **Fix**: Ensure `DATABASE_URL` includes `?sslmode=require`
- **Fix**: Use `-pooler` hostname for connection pooling

**Issue**: "Session not persisting"
- **Fix**: Set `SESSION_SECRET` environment variable
- **Fix**: Ensure `trust proxy` is enabled for HTTPS

**Issue**: "Google OAuth redirect mismatch"
- **Fix**: Update authorized redirect URIs in Google Console
- **Fix**: Use exact production domain (no trailing slash)

**Issue**: "WhatsApp messages failing"
- **Fix**: Verify phone numbers have country code prefix
- **Fix**: Check WhatsApp API credentials

---

## Cost Estimates

### Recommended Stack (Render + Neon)

| Service | Plan | Monthly Cost |
|---------|------|--------------|
| Render Web Service | Starter | $19 |
| Neon PostgreSQL | Scale | $19 (1GB storage + compute) |
| Cloudflare CDN | Free | $0 |
| Sentry | Developer | Free (10K events) |
| Google Analytics | Standard | Free |
| **Total** | | **~$38/month** |

### Alternative Stack (AWS)

| Service | Configuration | Monthly Cost |
|---------|--------------|--------------|
| EC2 Instance | t3.small | $15 |
| RDS PostgreSQL | db.t3.micro | $15 |
| Application Load Balancer | Basic | $16 |
| Route 53 | Domain + DNS | $1 |
| CloudWatch | Logs + Metrics | $5 |
| **Total** | | **~$52/month** |

---

## Next Steps

1. **Choose Platform**: Recommend Render for easiest migration
2. **Update Code**: Remove Replit-specific auth (optional)
3. **Configure Env**: Set production environment variables
4. **Deploy**: Follow platform-specific guide above
5. **Test**: Verify all features work in production
6. **Monitor**: Set up Sentry and analytics
7. **Scale**: Add caching/CDN as traffic grows

**Questions?** Review the platform-specific docs or ask for help with specific deployment issues.
