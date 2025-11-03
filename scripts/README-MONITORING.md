# PetSOS Deployment Monitoring

This directory contains scripts to monitor and verify that your two deployments (petsos.site and petsos-app.onrender.com) are in sync.

## Quick Health Check

For a quick check of both sites:

```bash
bash scripts/deployment-health-check.sh
```

This will:
- ✅ Check if both sites are accessible
- ✅ Verify the /health endpoint
- ✅ Test homepage and FAQ page
- ✅ Compare bundle versions
- ✅ Show if sites are in sync

## Comprehensive Monitoring

For a detailed analysis:

```bash
npx tsx scripts/monitor-deployments.ts
```

This will:
- ✅ Check all 8 key pages on both sites
- ✅ Extract and compare bundle versions (JS & CSS)
- ✅ Report any discrepancies
- ✅ Exit with status code 0 (success) or 1 (issues found)

## Setting Up Automated Monitoring

### Option 1: GitHub Actions (Recommended)

Create `.github/workflows/monitor-deployments.yml`:

```yaml
name: Monitor Deployments

on:
  schedule:
    # Run every 6 hours
    - cron: '0 */6 * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  monitor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm install tsx
      
      - name: Run monitoring script
        run: npx tsx scripts/monitor-deployments.ts
      
      - name: Notify on failure
        if: failure()
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: '⚠️ Deployment Sync Issue Detected',
              body: 'The monitoring script detected that petsos.site and petsos-app.onrender.com are out of sync. Please check the workflow logs for details.'
            })
```

### Option 2: Cron Job (Linux/Mac)

Add to your crontab:

```bash
# Check deployments every 6 hours
0 */6 * * * cd /path/to/petsos && npx tsx scripts/monitor-deployments.ts >> /var/log/petsos-monitor.log 2>&1
```

### Option 3: Render Cron Job

In your Render dashboard:
1. Create a new "Cron Job" service
2. Set schedule: `0 */6 * * *` (every 6 hours)
3. Command: `npx tsx scripts/monitor-deployments.ts`

## What to Do When Sites Are Out of Sync

If the monitoring detects issues:

### 1. Check Recent Deployments

```bash
# Check git commits
git log --oneline -5

# Check what's on GitHub
git fetch origin
git log origin/main --oneline -5
```

### 2. Verify Render Auto-Deploy

- Go to https://dashboard.render.com
- Check your `petsos-app` service
- Verify "Auto-Deploy" is enabled
- Look for recent deployment events

### 3. Manual Trigger Render Deployment

If Render hasn't auto-deployed:

```bash
# Make an empty commit to trigger deployment
git commit --allow-empty -m "Trigger Render redeploy"
git push origin main
```

### 4. Check Production Deployment

For petsos.site:
- If it's deployed via Replit Deployments, check the deployment logs
- If using another service, check that service's deployment status

## Monitoring Output Examples

### ✅ Good Output (Sites in Sync)

```
🚀 PetSOS Deployment Monitor
================================

✅ Both deployments are IN SYNC!
   Bundle: CIDSpQZ8
   CSS: zT4gZeY3
   All 8 pages accessible on both sites
```

### ⚠️ Alert Output (Sites Out of Sync)

```
🚀 PetSOS Deployment Monitor
================================

⚠️  DEPLOYMENTS OUT OF SYNC!

Issues found:
  1. Bundle mismatch: Production (CIDSpQZ8) vs Render (BecKtqTA)
  2. Page /faq returns 404 on Production
```

## Troubleshooting

### Script fails with network error

- Check your internet connection
- Verify both sites are accessible in a browser
- Check if there's a DNS issue

### Bundle versions show as null

- The HTML structure may have changed
- Manually check the page source for bundle references
- Update the regex in `monitor-deployments.ts` if needed

### False positives

- Clear your local DNS cache
- Try running the script from a different network
- Check if there's a CDN cache issue

## Integration with CI/CD

You can integrate this into your deployment workflow:

```bash
# In your deploy script
npm run build
npm run deploy

# Wait a bit for deployment to propagate
sleep 30

# Verify both sites are in sync
npx tsx scripts/monitor-deployments.ts || echo "Warning: Sites may be out of sync"
```

## Support

If you encounter issues with monitoring:
1. Check the script output for specific errors
2. Verify both URLs are accessible
3. Review recent deployment logs
4. Contact your deployment platform support if needed
