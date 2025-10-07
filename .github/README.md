# CI/CD Pipeline Documentation

This directory contains GitHub Actions workflows for continuous integration and deployment.

## Workflows

### 1. CI Workflow (`ci.yml`)

**Triggers:** 
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Jobs:**
- **Lint and Type Check**: Runs TypeScript type checking
- **Test**: Runs test suite with PostgreSQL + PostGIS database
  - ⚠️ **Note**: Currently optional. Test script must be added to package.json for proper CI validation.
  - CI will show a warning if no test script is configured but will continue to build.
- **Build**: Builds the application and uploads artifacts

**Database Setup:**
- Uses `postgis/postgis:15-3.3` Docker image
- Automatically runs PostGIS setup script
- Pushes database schema before tests

### 2. Deploy Workflow (`deploy.yml`)

**Triggers:**
- Push to `main` branch
- Manual workflow dispatch

**Jobs:**
- Type checking
- Build application
- Prepare deployment artifacts (manual deployment required)
- Run database migrations (when configured)
- Deployment notifications

**Note:** This workflow does not automatically deploy to Replit. You must configure one of the following deployment methods:
- Replit CLI: `replit deploy`
- Git-based: `git push replit main`
- API-based: Configure Replit API deployment in the workflow

**Environment Variables Required:**
- `REPLIT_DEPLOY_TOKEN`: Replit API token for deployments
- `PRODUCTION_DATABASE_URL`: Production database connection string
- `REPL_ID`: Replit repl ID

### 3. Database Operations Workflow (`database.yml`)

**Triggers:** 
- Manual workflow dispatch only

**Operations:**
- `setup-postgis`: Install PostGIS extension and configure geo-spatial features
- `push-schema`: Push latest schema changes to database
- `migrate`: Complete migration (PostGIS + schema push)

**Environments:**
- Development
- Staging
- Production

## Setup Instructions

### 1. Configure GitHub Secrets

Add the following secrets to your GitHub repository:

**For Production Environment:**
```
Settings → Secrets and variables → Actions → New repository secret
```

Required secrets:
- `REPLIT_DEPLOY_TOKEN`: Your Replit deployment token
- `PRODUCTION_DATABASE_URL`: Production database connection string
- `REPL_ID`: Your Replit repl ID

**For Multiple Environments:**
```
Settings → Environments → New environment
```

Create environments (`development`, `staging`, `production`) and add environment-specific secrets:
- `DATABASE_URL`: Environment-specific database connection

### 2. Enable GitHub Actions

1. Go to repository **Settings → Actions → General**
2. Under "Actions permissions", select:
   - ✅ Allow all actions and reusable workflows
3. Under "Workflow permissions", select:
   - ✅ Read and write permissions
   - ✅ Allow GitHub Actions to create and approve pull requests

### 3. Configure Replit Deployment

To enable automated deployments to Replit:

1. Generate a Replit deployment token (contact Replit support or use Replit API)
2. Add token to GitHub secrets as `REPLIT_DEPLOY_TOKEN`
3. Update the deployment command in `deploy.yml` with your specific Replit deployment endpoint

### 4. Database Migration Strategy

**Development:**
```bash
npm run db:push
```

**Staging/Production:**
Use the Database Operations workflow:
1. Go to **Actions → Database Operations**
2. Click **Run workflow**
3. Select operation and environment
4. Click **Run workflow**

## Workflow Status Badges

Add to your README.md:

```markdown
![CI](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/ci.yml/badge.svg)
![Deploy](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/deploy.yml/badge.svg)
```

## Best Practices

1. **Always run CI checks** before merging PRs
2. **Test database migrations** in staging before production
3. **Use workflow_dispatch** for manual deployments when needed
4. **Monitor deployment health checks** for quick rollback if needed
5. **Keep secrets secure** and rotate them regularly

## Troubleshooting

### CI Workflow Fails

**Type Check Errors:**
```bash
npm run check
```
Fix TypeScript errors before pushing.

**Build Errors:**
```bash
npm run build
```
Ensure all dependencies are properly installed.

### Database Migration Fails

**PostGIS Setup:**
```bash
npx tsx scripts/setup-postgis.ts
```
Ensure PostGIS extension is available in your PostgreSQL instance.

**Schema Push:**
```bash
npm run db:push -- --force
```
Use `--force` flag to override schema conflicts.

### Deployment Fails

**Check logs:**
1. Go to Actions tab
2. Click on failed workflow run
3. Review step logs for errors

**Common issues:**
- Missing environment variables
- Database connection timeout
- Invalid Replit deployment token
- Health check endpoint not responding

## Adding New Workflows

1. Create new `.yml` file in `.github/workflows/`
2. Define triggers, jobs, and steps
3. Test workflow with `workflow_dispatch` trigger first
4. Document in this README

## Security Notes

- Never commit secrets or API keys
- Use GitHub encrypted secrets for sensitive data
- Limit workflow permissions to minimum required
- Regularly audit and rotate access tokens
- Use environment protection rules for production
