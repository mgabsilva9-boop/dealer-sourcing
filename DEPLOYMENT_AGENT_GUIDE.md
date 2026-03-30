# 🤖 DEPLOYMENT GUIDE FOR AGENTS/SQUADS

**Target Audience:** @dev, @devops, Squads
**Read Time:** 5 min
**Blocking Checklist:** Must complete before pushing to `main`

---

## 🎯 Quick Summary

**Goal:** Deploy code to production without breaking things.

**Principle:** VALIDATE → COMMIT → DEPLOY (in that exact order!)

**Time:** ~10 minutes for experienced devs, ~30 min first time

---

## ✅ THE EXACT STEPS TO FOLLOW

### Step 1️⃣ : Run Validation (REQUIRED)

```bash
cd /path/to/dealer-sourcing
bash DEPLOYMENT_VALIDATION.sh production
```

**Expected output:**
```
✅ ALL CHECKS PASSED - READY FOR DEPLOYMENT
```

**If it fails:** READ THE ERROR and fix it before moving to Step 2!

#### Common Failures & Fixes

| Error | Fix |
|-------|-----|
| `DATABASE_URL is empty` | Edit `.env.production` with your Neon connection string |
| `Build failed` | Run `npm install --legacy-peer-deps`, then re-run validation |
| `Git has uncommitted changes` | Run `git add .` and `git commit -m "description"` |
| `Database connection failed` | Check DATABASE_URL is correct and you have internet |

---

### Step 2️⃣: Commit Your Changes

```bash
git add -A
git commit -m "type: short description

Optional detailed explanation if needed.

Fix: #123  (if closing an issue)
"
```

**Commit type examples:**
- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation
- `refactor:` code cleanup
- `chore:` dependencies, configs

**Example:**
```bash
git commit -m "fix: configure Railway env vars for production

- Add DATABASE_URL to .env.production
- Update VITE_API_URL to point to Railway backend
- Configure CORS for Vercel frontend domain
"
```

---

### Step 3️⃣: Push to GitHub

```bash
git push origin main
```

**What happens automatically:**
1. GitHub receives your code
2. Vercel detects push → starts building frontend
3. Railway detects push → starts deploying backend
4. Both deploy in parallel

**Monitor:**
- Vercel: https://vercel.com/dashboard
- Railway: https://railway.app/dashboard

---

### Step 4️⃣: Verify Deployment

Wait ~2-5 minutes, then check:

```bash
# 1. Frontend loaded?
curl -s https://dealer-sourcing-frontend.vercel.app | head -20

# 2. API responds?
curl -s https://dealer-sourcing-api-production.up.railway.app/health | jq .

# 3. Expected: {"status":"online"}
```

---

## 🚨 CRITICAL: Railway Environment Variables

**These MUST be set in Railway before first deploy:**

| Variable | Value | Where to find |
|----------|-------|---------------|
| `NODE_ENV` | `production` | Set manually |
| `DATABASE_URL` | PostgreSQL connection string | Neon → SQL Editor → Connection String |
| `JWT_SECRET` | Random 32 char string | Generate with `openssl rand -hex 32` |
| `FRONTEND_URL` | `https://dealer-sourcing-frontend.vercel.app` | Known |
| `CORS_ORIGIN` | Same as FRONTEND_URL | Known |
| `PORT` | `8080` | Set manually |

**How to set them:**
1. Go to: https://railway.app/dashboard
2. Click your project
3. Click "Variables" tab
4. Add each variable
5. Click "Redeploy"

**Or use automated script:**
```bash
bash SETUP_RAILWAY_AUTOMATED.sh
```

---

## ⚠️ DO NOT SKIP THESE

### BEFORE PUSHING:
- [ ] `DEPLOYMENT_VALIDATION.sh` passed all checks
- [ ] Reviewed `.env.production` (no sensitive data exposed)
- [ ] Did `git add` and `git commit`
- [ ] No uncommitted changes (`git status` shows clean)

### AFTER PUSHING:
- [ ] Checked Vercel deploy status
- [ ] Checked Railway deploy status
- [ ] Tested frontend loads
- [ ] Tested API responds
- [ ] No obvious errors in logs

---

## 🆘 If Something Goes Wrong

### Frontend Blank Page
1. Check Vercel logs: https://vercel.com/dashboard → your project → Deployments
2. Check browser console (F12) for errors
3. Check `VITE_API_URL` in `vercel.json` points to Railway

### API 404 / CORS Error
1. Check Railway logs: https://railway.app/dashboard → Deployments
2. Verify `DATABASE_URL` is set in Railway Variables
3. Verify `CORS_ORIGIN` matches your Vercel domain

### Database Connection Failed
1. Verify `DATABASE_URL` in Railway Variables
2. Test connection: `psql $DATABASE_URL -c "SELECT 1"`
3. Check database exists: `psql $DATABASE_URL -l | grep dealer_sourcing`

### Need Help?
- Read: `TECNICA_EXECUCAO_DEPLOY.md` (full documentation)
- Ask: Tag @devops or @dev in team chat

---

## 📋 One-Page Checklist

Print this and check off each box:

```
PRE-DEPLOYMENT
☐ Ran: bash DEPLOYMENT_VALIDATION.sh production
☐ Output: ✅ ALL CHECKS PASSED
☐ Reviewed .env.production
☐ Tested build locally: npm run build

GIT OPERATIONS
☐ git status shows clean working tree
☐ git add -A
☐ git commit -m "..."
☐ git push origin main

VERIFY DEPLOYMENT
☐ Vercel status: Ready (check dashboard)
☐ Railway status: Ready (check dashboard)
☐ Frontend loads: https://dealer-sourcing-frontend.vercel.app
☐ API responds: curl https://dealer-sourcing-api-production.up.railway.app/health
☐ No errors in browser console
☐ No errors in Railway logs

DONE ✅
```

---

## 🔄 If You Made a Mistake

**Pushed code that breaks things?**

1. **Quick rollback (if < 5 min):**
   ```bash
   git revert HEAD
   git push origin main
   # This creates a new commit that undoes your changes
   ```

2. **Fix and re-deploy:**
   - Fix the bug in code
   - `git add -A && git commit -m "fix: description"`
   - `git push origin main`
   - Monitor deploy status

3. **Tell the team** what happened and how you're fixing it

---

## 📚 Learn More

- Full technique: `TECNICA_EXECUCAO_DEPLOY.md`
- Validation script: `DEPLOYMENT_VALIDATION.sh`
- Railway setup: `SETUP_RAILWAY_AUTOMATED.sh`
- Vercel docs: https://vercel.com/docs
- Railway docs: https://docs.railway.app

---

**Remember:** ⏰ 5 minutes to validate beats ⚠️ hours debugging production!

Go forth and deploy responsibly! 🚀
