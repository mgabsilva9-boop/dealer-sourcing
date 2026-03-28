# Phase 6: Production Deployment - Render

**Date**: 2026-03-28
**Status**: Ready for Deployment
**Target**: Render Platform

---

## Prerequisites

✅ **Backend**: Phase 4 complete (5 endpoints, 40 tests)
✅ **QA**: Phase 5 complete (PASS gate, 94/100 score)
✅ **Render Account**: Active
✅ **GitHub Integration**: Connected
✅ **JWT Secret**: Generated (`8e5234717fe08f1c3541ca845945218c31bc5297f6c583debc0208b0d68f4659`)

---

## Deployment Steps

### Step 1: Render Dashboard Setup

1. Go to https://dashboard.render.com
2. Create new **PostgreSQL Database**:
   - Name: `dealer-sourcing-db`
   - Plan: Starter (free)
   - Region: Choose closest to your users
   - Save the connection string (will be auto-populated as `DATABASE_URL`)

3. Create new **Web Service**:
   - Name: `dealer-sourcing-api`
   - GitHub repo: `dealer-sourcing`
   - Branch: `main`
   - Runtime: `Node`
   - Build command: `npm install --production`
   - Start command: `node src/server.js`

### Step 2: Environment Variables

In Render Dashboard, add these environment variables:

| Key | Value | Source |
|-----|-------|--------|
| `DATABASE_URL` | (auto-populated from PostgreSQL) | Render Auto |
| `JWT_SECRET` | `8e5234717fe08f1c3541ca845945218c31bc5297f6c583debc0208b0d68f4659` | Copy from .env |
| `NODE_ENV` | `production` | Set |
| `PORT` | `3000` | Set |
| `ALLOWED_ORIGINS` | `https://dealer-sourcing.onrender.com` | Set |

### Step 3: Connect Database to API

1. Link PostgreSQL to Web Service:
   - In Web Service → Environment
   - Add DATABASE_URL environment variable
   - Select "From Database" and choose `dealer-sourcing-db`

2. This populates `DATABASE_URL` automatically with:
   ```
   postgresql://[user]:[password]@[host]:5432/dealer_sourcing?sslmode=require
   ```

### Step 4: Deploy

Render auto-deploys on git push. To deploy:

**Option A: Auto-deploy (Recommended)**
```bash
git add render.yaml
git commit -m "chore: add render.yaml for production deployment"
git push origin main
# Render automatically detects and deploys
```

**Option B: Manual deploy**
1. Go to Render Dashboard
2. Click Web Service → Manual Deploy
3. Select `main` branch
4. Click "Deploy"

### Step 5: Run Migrations

Once deployed, run migrations on production database:

1. **Via Render Shell**:
   - Go to Web Service → Shell
   - Run: `node db/migrate.js apply`

2. **Verify migrations**:
   ```bash
   curl https://dealer-sourcing-api.onrender.com/health
   # Expected: { status: "ok" }
   ```

### Step 6: Verify Deployment

Test all 5 endpoints:

```bash
# Get health
curl https://dealer-sourcing-api.onrender.com/health

# Get vehicle list
curl "https://dealer-sourcing-api.onrender.com/sourcing/list?limit=5"

# Get specific vehicle
curl "https://dealer-sourcing-api.onrender.com/sourcing/1"

# Search vehicles
curl "https://dealer-sourcing-api.onrender.com/sourcing/search?make=Honda&priceMax=100000"

# Get user favorites (requires bearer token)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "https://dealer-sourcing-api.onrender.com/sourcing/favorites"

# Mark vehicle as interested (requires bearer token)
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notes": "Interested in this vehicle"}' \
  "https://dealer-sourcing-api.onrender.com/sourcing/1/interested"
```

---

## Production Checklist

- [ ] PostgreSQL database created on Render
- [ ] Web service created and connected to database
- [ ] Environment variables configured
- [ ] JWT_SECRET set securely (not hardcoded)
- [ ] CORS whitelist configured
- [ ] Health endpoint responding (`/health` returns `200`)
- [ ] All 5 API endpoints tested:
  - [ ] GET /sourcing/list
  - [ ] GET /sourcing/search
  - [ ] GET /sourcing/:id
  - [ ] POST /sourcing/:id/interested
  - [ ] GET /sourcing/favorites
- [ ] Database migrations applied successfully
- [ ] Smoke tests passing against production
- [ ] Monitoring configured (optional but recommended)

---

## Database Setup Instructions (If Manual)

If Render doesn't auto-apply migrations, run manually:

```bash
# SSH into Render Shell
# Then run:
node db/migrate.js apply

# Verify schema:
psql $DATABASE_URL -c "\dt"  # List tables
psql $DATABASE_URL -c "\dp"  # List RLS policies
```

---

## Expected Endpoints in Production

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/health` | GET | Health check | ✅ |
| `/sourcing/list` | GET | List all vehicles | ✅ |
| `/sourcing/search` | GET | Search with filters | ✅ |
| `/sourcing/:id` | GET | Vehicle details | ✅ |
| `/sourcing/:id/interested` | POST | Mark as interested | ✅ |
| `/sourcing/favorites` | GET | User favorites (RLS) | ✅ |

---

## Monitoring & Logging

**Render Logs**: 
- Go to Web Service → Logs
- Tail logs in real-time
- Search for errors

**Recommended: Setup Sentry**
```bash
npm install @sentry/node

# In src/server.js:
import * as Sentry from "@sentry/node";
Sentry.init({ dsn: process.env.SENTRY_DSN });
```

Add to Render environment variables:
```
SENTRY_DSN=https://[key]@[account].ingest.sentry.io/[project]
```

---

## Rollback Plan

If production deployment fails:

1. **Revert Git**:
   ```bash
   git revert HEAD
   git push origin main
   # Render auto-redeploys with previous version
   ```

2. **Rollback Database**:
   ```bash
   # Via Render Shell:
   node db/migrate.js rollback
   ```

3. **Manual Rollback**:
   - Render Dashboard → Deployments
   - Select previous successful deployment
   - Click "Redeploy"

---

## Performance Expectations

- Response time: ~100-200ms (slightly higher than local due to network)
- Database queries: <50ms (optimized with indices)
- Concurrent requests: Supported (connection pooling max 20)
- Rate limits: None configured (can add via CloudFlare if needed)

---

## Next Steps (Phase 6+)

After successful deployment:

1. **Monitoring** (Optional - Phase 6):
   - Setup error tracking (Sentry)
   - Setup performance monitoring
   - Configure alerts

2. **Frontend Integration** (Phase 7):
   - Update API base URL in frontend
   - Configure CORS for frontend domain
   - Test end-to-end flows

3. **Future Optimizations** (Phase 5+ from QA):
   - Implement JWT extraction (currently hardcoded test UUID)
   - Setup connection pool monitoring
   - Implement Redis caching for distributed deployment
   - Add more specific error messages

---

## Support

For Render-specific issues:
- [Render Documentation](https://render.com/docs)
- [Render Support](https://support.render.com)

For application issues:
- Check logs: `Render Dashboard → Logs`
- Review code: `src/routes/sourcing.js`
- Test locally: `npm run dev`

---

**Status**: 🟢 Ready for Production Deployment
**Phase**: Phase 6
**Date**: 2026-03-28
