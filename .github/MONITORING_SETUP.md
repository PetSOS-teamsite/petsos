# GitHub Actions Monitoring Setup

Your automated deployment monitoring is now configured! 🎉

## What's Been Set Up

### 1. **Deployment Monitor** (`.github/workflows/monitor-deployments.yml`)

**Runs:**
- ⏰ Every 6 hours automatically
- 🔄 After every push to `main` branch
- 🖱️ Manually from GitHub Actions tab

**What it does:**
- ✅ Checks both petsos.site and petsos-app.onrender.com
- ✅ Compares bundle versions (JS & CSS)
- ✅ Verifies all 8 key pages are accessible
- ✅ Creates GitHub issue if sites are out of sync
- ✅ Auto-closes issue when sites are back in sync

### 2. **Deployment Notifications** (`.github/workflows/deployment-notification.yml`)

**Runs:**
- 🔄 After every push to `main` branch

**What it does:**
- ⏳ Waits 60 seconds for deployment to propagate
- ✅ Verifies both sites deployed successfully
- 📊 Creates deployment summary
- 🏷️ Adds status badge to commit

## How It Works

### When Deployments Are In Sync ✅

```
🚀 Push to main
    ↓
📦 Both sites auto-deploy
    ↓
⏳ Wait 60 seconds
    ↓
✅ Monitor checks both sites
    ↓
🟢 All good - no action needed
```

### When Deployments Are Out of Sync ⚠️

```
⚠️ Monitor detects issue
    ↓
📝 Creates GitHub issue with label "deployment-sync"
    ↓
🔔 You get notified
    ↓
🔧 You fix the issue (manual deploy, etc.)
    ↓
✅ Next monitor run detects sync
    ↓
🔒 Auto-closes the issue
```

## Viewing Results

### Check Workflow Status

1. Go to your GitHub repository
2. Click **Actions** tab
3. See recent workflow runs

### View Deployment Issues

1. Go to **Issues** tab
2. Look for issues with label `deployment-sync`
3. These are automatically created/closed

### Manual Trigger

1. Go to **Actions** tab
2. Click **Monitor Deployments** workflow
3. Click **Run workflow** button
4. Select `main` branch
5. Click **Run workflow**

## What Gets Checked

Both workflows verify these pages:

| Page | URL | Purpose |
|------|-----|---------|
| Homepage | `/` | Landing page |
| FAQ | `/faq` | FAQ page (previously had issues) |
| Resources | `/resources` | Resource center |
| Districts | `/districts` | District index |
| Clinics | `/clinics` | Clinic directory |
| Emergency | `/emergency` | Emergency form |
| Login | `/login` | Login page |
| Health | `/health` | API health check |

## Customizing the Schedule

To change how often monitoring runs, edit `.github/workflows/monitor-deployments.yml`:

```yaml
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
```

Common schedules:
- Every hour: `'0 * * * *'`
- Every 3 hours: `'0 */3 * * *'`
- Every 12 hours: `'0 */12 * * *'`
- Daily at 9am HKT: `'0 1 * * *'` (9am HKT = 1am UTC)

## Troubleshooting

### Workflow not running

- Check that the workflow files are in `.github/workflows/` directory
- Verify GitHub Actions is enabled in repository settings
- Ensure you've pushed the workflow files to GitHub

### False positives

- The workflow waits 60 seconds after deployment
- If your deployment takes longer, increase the wait time
- Edit `deployment-notification.yml` and change `sleep 60` to `sleep 120`

### Notifications not received

- Check GitHub notification settings
- Go to Settings → Notifications
- Enable "Actions" notifications

## Next Steps

1. **Push to GitHub** - The workflows will activate once pushed
2. **Enable Actions** - Ensure GitHub Actions is enabled in repo settings
3. **First Run** - Manually trigger the workflow to test it
4. **Monitor** - Check the Actions tab after 6 hours

## Support

If you have issues:
1. Check the Actions tab for error logs
2. Review the workflow YAML files
3. Ensure both sites are accessible
4. Verify the monitoring script works locally: `npx tsx scripts/monitor-deployments.ts`
