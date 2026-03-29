# BACKEND RESTART & TROUBLESHOOTING GUIDE

**Created**: 2026-03-29
**Severity**: 🔴 CRITICAL
**Impact**: Backend API unavailable until restarted
**ETA to Resolution**: 5-10 minutes

---

## PROBLEM SUMMARY

The backend service (dealer-sourcing-api on Render) is returning HTTP 404 on the health endpoint instead of HTTP 200. This indicates the service is not running or is misconfigured.

**Impact**: Frontend cannot communicate with backend API; no data will load.

---

## QUICK FIX (5 minutes)

### Step 1: Access Render Dashboard
```
URL: https://dashboard.render.com
Username: [Your Render account]
```

### Step 2: Find the Service
1. In left sidebar, click "Services"
2. Find "dealer-sourcing-api"
3. Click to open

### Step 3: Restart Service
1. In the service page, look for the "More" menu (three dots)
2. Select "Restart"
3. Wait for status to change from "Spinning up..." to "Live"
   - This usually takes 30-60 seconds
4. Confirm with green checkmark ✅

### Step 4: Verify Health Endpoint
```bash
curl -I https://dealer-sourcing-api.onrender.com/health
```

**Expected Response**:
```
HTTP/1.1 200 OK
Content-Type: application/json
...
```

**Actual Response (if still broken)**:
```
HTTP/1.1 404 Not Found
```

---

## DEEPER TROUBLESHOOTING (If restart didn't work)

### Check 1: View Service Logs

In Render dashboard:
1. Click "dealer-sourcing-api" service
2. Click "Logs" tab
3. Look for error messages like:
   - `Error: listen EADDRINUSE` (port already in use)
   - `Error: Cannot find module` (missing dependency)
   - `Error: ECONNREFUSED` (database connection failed)

### Check 2: Verify Environment Variables

In Render dashboard for dealer-sourcing-api:
1. Click "Environment"
2. Verify these variables are set:
   ```
   NODE_ENV=production
   PORT=3000 (or auto-assigned)
   DATABASE_URL=postgresql://... (should be auto-populated)
   JWT_SECRET=8e5234717fe08f1c3541ca845945218c31bc5297f6c583debc0208b0d68f4659
   JWT_EXPIRE=7d
   ```

### Check 3: Verify Start Command

In Render dashboard settings:
1. Click "Settings"
2. Find "Start Command"
3. Should be: `node src/server.js`
4. If different, update and save

### Check 4: Rebuild from Source

Sometimes a clean rebuild fixes issues:
1. In Render dashboard, click "Deployments"
2. Find the latest deployment
3. Click the three dots → "Redeploy"
4. Wait for full rebuild
5. Check health endpoint again

---

## ADVANCED TROUBLESHOOTING (If still broken)

### Issue: "Address already in use" (EADDRINUSE)

**Cause**: Port 3000 is already occupied by another process

**Solution A** (via Render):
1. Go to service Settings
2. Change PORT to a different value (e.g., 3001)
3. Update render.yaml or environment
4. Redeploy

**Solution B** (via Git):
1. Update src/server.js to use different port fallback:
   ```javascript
   const PORT = process.env.PORT || 3000;
   ```
2. Or set PORT env var in Render to 3001
3. Commit and push (auto-redeploy)

### Issue: "Cannot find module" (Missing Dependencies)

**Cause**: Dependencies not installed during build

**Solution**:
1. Verify package.json has all dependencies listed
2. In Render settings, check "Build Command":
   ```
   npm install --production
   ```
3. If different, update to: `npm install && npm run build`
4. Commit and push to trigger rebuild

### Issue: "ECONNREFUSED" (Database Connection Failed)

**Cause**: PostgreSQL not available (expected in MVP mode)

**Status**: This is NORMAL. Server should gracefully fallback.

**Verify in Logs**:
```
⚠️ Banco não conectado - usando dados mockados (MVP mode)
Erro: banco de dados "dealer_sourcing" não existe
```

This is OK - server still starts and serves API with mock data.

### Issue: 502 Bad Gateway

**Cause**: Server crashed or not responding to Render health check

**Solution**:
1. Check Logs (Render dashboard → Logs)
2. Look for unhandled exceptions
3. Fix the issue locally, test:
   ```bash
   node src/server.js
   curl http://localhost:3000/health
   ```
4. Commit fix to GitHub
5. Trigger Render redeploy

---

## TESTING AFTER FIX

### Test 1: Health Check
```bash
curl https://dealer-sourcing-api.onrender.com/health
```
**Expected**: `{"status":"ok","timestamp":"...","uptime":...}`

### Test 2: CORS Check
```bash
curl -I -H "Origin: https://dealer-sourcing.vercel.app" \
     https://dealer-sourcing-api.onrender.com/health
```
**Expected**: Should include `Access-Control-Allow-Origin` header

### Test 3: Authentication Endpoint (Optional)
```bash
curl -X POST https://dealer-sourcing-api.onrender.com/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test"}'
```

### Test 4: Frontend Integration
1. Open https://dealer-sourcing.vercel.app
2. Try to login
3. Check browser console (F12) for errors
4. Should NOT see "CORS error" or "network error"

---

## FORCE REDEPLOY (Nuclear Option)

If Render restart/rebuild doesn't work:

### Option A: Push Empty Commit
```bash
git commit --allow-empty -m "trigger: force render redeploy"
git push origin main
```
This triggers Render's webhook and forces a full rebuild.

### Option B: Manual Trigger in Render

1. Go to Render dashboard
2. Click "dealer-sourcing-api" service
3. Click "Deployments" tab
4. Find latest deployment
5. Click three dots → "Redeploy"
6. Wait 2-5 minutes for rebuild

### Option C: Check GitHub Push Event

Render should automatically redeploy when main branch is updated.

```bash
# View git log to confirm push worked
git log --oneline | head -5

# Should show recent commits including:
# - f8e321c fix: update VITE_API_URL...
# - 4cb96eb docs(morning-briefing)...
```

---

## MONITORING AFTER FIX

### Keep Health Check Running
```bash
# Run this in a terminal to monitor health continuously
while true; do
  curl -s https://dealer-sourcing-api.onrender.com/health
  sleep 10
done
```

### Expected Uptime
Render starter plan: 99.5% uptime SLA

### Expected Response Time
- Health check: <100ms
- API endpoints: <500ms
- Sourcing list: <2s (due to scraping)

---

## PREVENTION FOR THE FUTURE

### 1. Set Up Alerting
In Render dashboard:
1. Click service → Settings
2. Enable "Health Check Alerts"
3. Set email notification

### 2. Use Cron Checks
Set up a monitoring service (e.g., Uptime Robot) to ping `/health` every 5 minutes.

### 3. Review Logs Regularly
Before issues occur:
1. Check logs 1x per day during development
2. Set up log aggregation for production

### 4. Test Locally First
Always verify backend works locally before pushing:
```bash
npm run dev:server  # In one terminal
npm run dev        # In another terminal
```

---

## ROLLBACK PROCEDURE (If Fix Breaks Something)

If restarting the service causes new problems:

### Option 1: Revert to Previous Deployment
In Render dashboard:
1. Click Deployments
2. Find previous "successful" deployment
3. Click three dots → "Redeploy"

### Option 2: Revert Git Commit
If the issue is in recent code:
```bash
git log --oneline | head -5
git revert [commit-hash]  # Revert the problematic commit
git push origin main      # Auto-triggers Render redeploy
```

### Option 3: Use GitHub Rollback
1. Go to GitHub Actions
2. Find failed deploy
3. Manually trigger redeploy of previous workflow

---

## SUCCESS CONFIRMATION

**All green?** You're ready for Phase 6.

```
✅ Backend /health returns 200
✅ Frontend loads from Vercel
✅ Frontend can reach backend API
✅ CORS headers present
✅ Database connection (or MVP mode active)
✅ No 5xx errors in logs
```

**Next**: Open MORNING-BRIEFING.md for Phase 6 launch sequence.

---

## SUPPORT CONTACTS

- **Render Status**: https://status.render.com
- **Render Docs**: https://render.com/docs
- **Vercel Status**: https://www.vercel-status.com
- **GitHub Issues**: Create issue if needed

---

**Last Updated**: 2026-03-29
**Created By**: @aios-master
**Critical**: YES - Blocks Phase 6 launch
