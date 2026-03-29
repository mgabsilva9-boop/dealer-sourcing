# Operations Handoff: Phase 5 MVP Launch
## Post-Launch Monitoring & Escalation Guide

**Document Type**: Operations Runbook
**Effective Date**: 2026-03-28
**Audience**: DevOps, Operations Team, On-Call Engineers
**Owner**: @devops (Gage)

---

## 1. LAUNCH DAY CHECKLIST (2026-03-28)

### Hour 0-1: Pre-Launch Verification

- [ ] Backend health check: `curl https://api.dealer-sourcing.onrender.com/health`
  - Expected: `{ "status": "ok" }`
  - If down: Check Render dashboard, verify Neon connection

- [ ] Frontend load: `https://dealer-sourcing.vercel.app`
  - Expected: Page loads <3 seconds
  - If slow: Check Vercel CDN, clear cache if needed

- [ ] Database connectivity: Check Neon console
  - Expected: 0 connection errors
  - Active connections: 3-5 (normal)

- [ ] Metrics endpoint: `curl https://api.dealer-sourcing.onrender.com/api/metrics`
  - Expected: JSON with pool health
  - Pool utilization: 15-30% (normal)

### Hour 1-2: Initial Traffic Monitoring

- [ ] Monitor `/api/metrics` every 5 minutes
  - Watch for: Utilization spikes, error rate increases
  - Expected: Steady state (no sudden changes)

- [ ] Check Render logs for errors
  - Command: View in Render dashboard → Logs tab
  - Expected: Occasional 404s for static assets, no 500s

- [ ] Monitor Vercel analytics
  - Command: Vercel dashboard → Analytics
  - Expected: Traffic increasing gradually

- [ ] Verify RLS isolation (spot check)
  - Test: Two different users querying /api/sourcing/favorites
  - Expected: Each user sees only their own data

### Hour 2-8: Stability Verification

- [ ] Uptime check: 100% (no downtime)
- [ ] Error rate: <1%
- [ ] Response time P95: <500ms
- [ ] Database pool utilization: <50%
- [ ] No slow query alerts

- [ ] Notify stakeholders
  - Status: "MVP Phase 5 launched successfully"
  - Metrics: Uptime, concurrent users, error rate

---

## 2. DAILY OPERATIONS (Morning & EOD)

### Daily Morning Check (9:00 AM)

```bash
# 1. Backend health
curl https://api.dealer-sourcing.onrender.com/health

# Expected output:
# { "status": "ok", "timestamp": "2026-03-28T...", "uptime": "..." }

# 2. Metrics summary
curl https://api.dealer-sourcing.onrender.com/api/metrics

# Expected:
# - pool: { active_connections: 3-15, utilization_percent: 15-75 }
# - queries: { total_queries: 1000+, error_rate_percent: <1 }
# - alerts: { high_error_rate: false, slow_queries_detected: false }

# 3. Database status (Neon console)
# - Check: Automatic backups completed
# - Check: No replication lag
# - Check: Connection pool healthy
```

**Log these metrics**:
- Time checked: [timestamp]
- Pool utilization: [%]
- Active connections: [count]
- Error rate: [%]
- Response time P95: [ms]
- Status: [HEALTHY/WARNING/CRITICAL]

### Daily EOD Check (5:00 PM)

- [ ] Review day's error logs (Render dashboard)
- [ ] Check for slow query patterns
- [ ] Review RLS isolation logs
- [ ] Document any alerts or warnings
- [ ] Plan next day if issues found

---

## 3. MONITORING THRESHOLDS & ALERTS

### Status Definitions

| Status | Condition | Alert Level | Action |
|--------|-----------|-------------|--------|
| **HEALTHY** | Util <75%, Errors <1%, P95 <500ms | INFO | Monitor |
| **WARNING** | Util 75-90%, Errors 1-5%, P95 500-1000ms | WARN | Plan scaling |
| **CRITICAL** | Util >90%, Errors >5%, P95 >1000ms | ERROR | Scale immediately |

### Key Metrics & Thresholds

#### Connection Pool Utilization

**Metric**: `active_connections / max_connections * 100%`

| Range | Status | Action |
|-------|--------|--------|
| 0-50% | 🟢 HEALTHY | Continue monitoring |
| 51-75% | 🟡 WATCH | Monitor for trends |
| 76-90% | 🟠 WARNING | Plan scale-up (20→50) |
| 91-100% | 🔴 CRITICAL | Scale immediately |

**Scale-Up Procedure** (if >90%):
```bash
# 1. Edit Render environment or database config
MAX_CONNECTIONS=50  # was 20

# 2. Restart backend service
# Render: Trigger redeploy from GitHub

# 3. Verify new pool size
curl https://api.dealer-sourcing.onrender.com/api/metrics
# Expected: utilization should drop to 40-50%

# 4. Document in incident tracker
# "Scaled pool from 20→50 at [TIME] due to sustained >90% utilization"
```

#### Error Rate

**Metric**: `(total_errors / total_queries) * 100%`

| Range | Status | Action |
|-------|--------|--------|
| <1% | 🟢 HEALTHY | Normal |
| 1-5% | 🟡 WATCH | Investigate logs |
| 5-10% | 🟠 WARNING | Check database health |
| >10% | 🔴 CRITICAL | Rollback or escalate |

**Investigate Error Rate**:
```bash
# 1. Check Render logs for patterns
#    Look for: connection timeouts, query errors, auth failures

# 2. Check Neon database health
#    Query: SELECT count(*) FROM pg_stat_activity;
#    Expected: Normal connection count

# 3. If errors all from specific endpoint
#    Investigate: Database RLS policies, query logic

# 4. If widespread errors
#    Options: Rollback last deploy, scale pool, restart service
```

#### Response Time (P95)

**Metric**: 95th percentile request latency

| Range | Status | Action |
|-------|--------|--------|
| <300ms | 🟢 EXCELLENT | Normal |
| 300-500ms | 🟡 WATCH | Monitor for degradation |
| 500-1000ms | 🟠 WARNING | Check for slow queries |
| >1000ms | 🔴 CRITICAL | Query optimization needed |

**Optimize Slow Responses**:
```bash
# 1. Check /api/metrics for slow_queries
curl https://api.dealer-sourcing.onrender.com/api/metrics | grep slow

# 2. Identify slow query (>1000ms)
# Common culprits:
# - Missing index on user_id
# - RLS policy re-evaluating on every row
# - JOIN with vehicles_cache without limit

# 3. Add index or optimize query
# Example: CREATE INDEX idx_interested_vehicles_user_id
# Then: Restart service to clear cache

# 4. Verify improvement
# Check: Response time P95 should drop 20-30%
```

---

## 4. WEEKLY OPERATIONS CHECKLIST

### Every Monday Morning

- [ ] Review past week's metrics
  - Peak utilization: [%]
  - Peak error rate: [%]
  - Peak concurrent users: [count]
  - Any alerts or warnings: [list]

- [ ] Check for patterns
  - Is utilization trending up?
  - Are certain endpoints slower?
  - Are there time-of-day patterns?

- [ ] Plan for next week
  - Do we need to scale?
  - Should we optimize queries?
  - Any tech debt to address?

### Every Friday EOW

- [ ] Backup verification
  - Neon: Check automatic backup completed
  - Status: Last backup time and size

- [ ] Security review
  - Any failed auth attempts? (check logs)
  - RLS isolation still working? (test)
  - Secrets rotated? (if applicable)

- [ ] Update team status
  - Brief team on system health
  - Flag any scaling needs
  - Plan Phase 5+ work

---

## 5. COMMON ISSUES & RESOLUTIONS

### Issue 1: Pool Utilization >90%

**Symptoms**:
- Slow requests (P95 >1000ms)
- Some requests timing out
- Error rate increasing
- `/api/metrics` shows `active_connections` near 20

**Resolution**:

```bash
# Step 1: Confirm the issue
curl https://api.dealer-sourcing.onrender.com/api/metrics

# Step 2: Increase pool size
# Edit environment: MAX_CONNECTIONS=50 (or use Render UI)

# Step 3: Redeploy backend
# Option A: git push to GitHub (auto-triggers Render deploy)
# Option B: Manual redeploy in Render dashboard

# Step 4: Verify fix
sleep 30  # Wait for deploy
curl https://api.dealer-sourcing.onrender.com/api/metrics
# Expected: active_connections drops to 10-15

# Step 5: Document
# Incident: Pool scaling from 20→50
# Trigger: Sustained >90% utilization for 2+ hours
# Resolution: Config change + redeploy
# Time to resolve: 10-15 minutes
```

**Prevention**:
- Monitor daily (see Section 2)
- Alert when hitting 75% (plan scaling)
- Don't wait for 90% to react

### Issue 2: High Error Rate (>5%)

**Symptoms**:
- `/api/metrics` shows `error_rate_percent > 5`
- Users reporting failed requests
- Render logs full of errors

**Resolution**:

```bash
# Step 1: Check error logs
# Render dashboard → Logs → Filter by ERROR

# Step 2: Categorize errors
# - Connection errors? → Check Neon status
# - Auth errors? → Check JWT secret
# - Query errors? → Check database schema
# - Timeout errors? → Check pool size

# Example patterns:
# "ECONNREFUSED" → Database down
# "Invalid signature" → JWT secret mismatch
# "relation ... does not exist" → Schema issue
# "ETIMEDOUT" → Pool exhausted

# Step 3: Fix based on category
# Connection errors:
#   - Check Neon console
#   - Verify DATABASE_URL correct
#   - Restart Render service

# Auth errors:
#   - Verify JWT_SECRET matches
#   - Check token format (Bearer token)
#   - Test JWT generation

# Schema errors:
#   - Verify migrations ran
#   - Check table exists in Neon
#   - Restore from backup if corrupted

# Pool errors:
#   - Increase pool size (see Issue 1)
#   - Check for connection leaks
#   - Restart service if stuck
```

### Issue 3: Database Unreachable

**Symptoms**:
- `GET /health` returns error
- All API calls fail
- `/api/metrics` shows 0 connections

**Resolution**:

```bash
# Step 1: Check Neon status
# https://neon.tech/app/status
# Look for: Service incidents, maintenance

# Step 2: Verify connection string
# Render dashboard → Environment variables
# Check: DATABASE_URL is set and valid

# Step 3: Test connection manually
# Option: SSH into Render, run:
psql "$DATABASE_URL" -c "SELECT NOW();"

# Step 4: If connection fails
# Option A: Restart Render service
#   - Dashboard → Restart → Confirm
# Option B: Restore from backup
#   - Neon console → Backup → Restore
# Option C: Contact Neon support
#   - https://neon.tech/support

# Step 5: Verify recovery
curl https://api.dealer-sourcing.onrender.com/health
# Expected: 200 OK
```

### Issue 4: Slow Queries (P95 >500ms)

**Symptoms**:
- Users report laggy interface
- `/api/metrics` shows `average_query_time_ms > 200`
- Slow queries detected (slow_query_rate > 5%)

**Resolution**:

```bash
# Step 1: Identify slow queries
curl https://api.dealer-sourcing.onrender.com/api/metrics | jq '.queries.slow_queries'

# Step 2: Common causes
# - Missing index: Add index on filter column
# - RLS re-evaluating: Check RLS policy
# - Large result set: Add LIMIT or pagination
# - Complex JOIN: Simplify query or denormalize

# Step 3: Add missing indexes
# Example: Index on interested_vehicles(user_id)
# SQL: CREATE INDEX CONCURRENTLY idx_iov_user_id
#      ON interested_vehicles(user_id);

# Step 4: Verify improvement
# Wait 10 minutes for stats to update
curl https://api.dealer-sourcing.onrender.com/api/metrics
# Expected: slow_query_rate drops to <1%
```

### Issue 5: RLS Isolation Not Working

**Symptoms**:
- User A can see User B's data
- RLS policy returns NULL
- All users get same results

**Resolution**:

```bash
# Step 1: Verify RLS is enabled
psql "$DATABASE_URL" -c "
  SELECT tablename, rowsecurity
  FROM pg_tables
  WHERE schemaname = 'public';
"
# Expected: rowsecurity = true for modern tables

# Step 2: Check RLS policy
psql "$DATABASE_URL" -c "
  SELECT policyname, polcmd, qual
  FROM pg_policies
  WHERE tablename = 'interested_vehicles';
"

# Step 3: Test isolation manually
psql "$DATABASE_URL" -c "
  SET app.current_user_id = 'user-001';
  SELECT COUNT(*) FROM interested_vehicles;
  -- Should return User 001's count only
"

# Step 4: If failing
# - Restore backup from before RLS change
# - Or re-create policies
# - Test with multiple users

# Step 5: Verify fix
# Deploy test to /api/sourcing/favorites
# Query with User A token → See A's data
# Query with User B token → See B's data
# (no cross-contamination)
```

---

## 6. CAPACITY PLANNING

### Current Capacity

```yaml
Configuration:
  pool_size: 20 connections
  target_users: 10-20 concurrent
  tested_capacity: 50 concurrent (97% success)

Performance Baseline:
  response_time_p95: 380ms
  throughput: 12.5 req/sec
  error_rate: <3%
```

### Growth Projections

| Concurrent Users | Pool Size | Expected P95 | Risk Level |
|-----------------|-----------|-------------|-----------|
| 10-20 (Current) | 20 | 300-400ms | LOW |
| 20-40 | 30 | 350-450ms | LOW |
| 40-60 | 40 | 400-550ms | MEDIUM |
| 60-100 | 50-60 | 500-700ms | MEDIUM |
| 100+ | PgBouncer | <500ms | HIGH |

### When to Scale

**Trigger 1: Utilization >75% for >4 hours**
- Action: Scale from 20→50 connections
- Timeline: Within next business day
- Effort: 15 minutes
- Risk: LOW

**Trigger 2: Error rate >5%**
- Investigation: Check logs, verify RLS
- Action: May need query optimization or scale
- Timeline: Urgent (within 2 hours)
- Risk: MEDIUM

**Trigger 3: Response time P95 >1000ms**
- Investigation: Check for slow queries
- Action: Add indexes, optimize queries, or scale
- Timeline: Urgent (within 2 hours)
- Risk: MEDIUM

---

## 7. ESCALATION PROCEDURES

### Level 1: Info (Green)
**Condition**: All metrics healthy
**Check**: Daily morning & EOD
**Action**: Log metrics, continue monitoring
**Owner**: Ops team (daily)

### Level 2: Watch (Yellow)
**Condition**: One metric in warning zone (75-90%)
**Check**: Every 4 hours
**Action**:
- Investigate cause
- Plan scaling within 1-2 days
- Optimize if possible
**Owner**: Ops + DevOps lead

**Example**:
```
Time: 2026-03-30 14:00
Event: Pool utilization at 78%
Action: Ops team notified, DevOps planning scale-up for next sprint
```

### Level 3: Alert (Orange)
**Condition**: One metric in critical zone (>90%) OR multiple yellow
**Check**: Every 1 hour
**Action**:
- Immediate investigation
- Scale within 1-2 hours
- Consider rollback if needed
**Owner**: DevOps lead (primary)
**Notify**: @devops, @po, tech lead

**Example**:
```
Time: 2026-03-30 15:30
Event: Pool utilization at 92%
Action: DevOps team scaling from 20→50 connections
Estimated resolution: 15 minutes
```

### Level 4: Critical (Red)
**Condition**: Database down OR multiple critical metrics OR cascading failures
**Check**: Real-time alerts
**Action**:
- War room (Slack + call)
- Investigate root cause
- Execute rollback or recovery plan
- Notify all stakeholders
**Owner**: @devops (lead), @po (comms), tech lead
**SLA**: Acknowledge within 5 min, update every 15 min

**Example**:
```
Time: 2026-03-30 16:45
Event: Database unreachable - all API calls failing
Action: War room started, investigating Neon status
Status: Likely connection issue, checking DATABASE_URL
Recovery: Restart Render service or restore backup
Notification: All stakeholders notified, ETA 30 minutes
```

### Escalation Contact Chain

```
Level 1-2 (Info/Watch):
→ Ops team (daily check) → Slack #ops channel

Level 3 (Alert):
→ @devops (primary) → Slack #incidents → Optional call if >30 min

Level 4 (Critical):
→ @devops (page/call immediately)
→ @po (notify)
→ Tech lead on-call
→ War room: Slack #incidents + video call
```

---

## 8. RUNBOOK: Emergency Scaling

### Scenario: Pool Utilization >90%

**Time Required**: 10-15 minutes
**Steps**:

```bash
# Step 1: Confirm issue (1 min)
curl https://api.dealer-sourcing.onrender.com/api/metrics | jq '.connection.utilization_percent'
# Expected: >90

# Step 2: Alert team (1 min)
# Slack #incidents: "Pool utilization critical (92%), scaling from 20→50"

# Step 3: Update config (2 min)
# Option A: Render Dashboard
#   - Navigate: Settings → Environment Variables
#   - Find: MAX_POOL_SIZE (or database-related config)
#   - Change: 20 → 50
#   - Save

# Option B: Git-based deploy
#   - Edit: api/lib/db.js or environment config
#   - Change: max: 50
#   - Commit: "ops: scale pool from 20→50 (emergency scaling)"
#   - Push: git push origin main

# Step 4: Trigger deploy (2 min)
# Render automatically redeploys on git push
# Or manually: Render dashboard → Redeploy

# Step 5: Verify scaling (5 min)
sleep 30  # Wait for deploy
curl https://api.dealer-sourcing.onrender.com/api/metrics | jq '
  {
    pool_size: .connection.pool_max,
    active: .connection.active_connections,
    utilization: .connection.utilization_percent
  }
'
# Expected:
# {
#   "pool_size": 50,
#   "active": 15-25,
#   "utilization": 40-50  (dropped from 90+)
# }

# Step 6: Confirm recovery (1 min)
curl https://api.dealer-sourcing.onrender.com/health
# Expected: 200 OK

# Step 7: Document incident (2 min)
# Incident log: "Scaled pool 20→50 at [TIME] due to >90% utilization"
# Slack update: "✅ Scaling complete. Utilization now 42%. Monitoring closely."
```

---

## 9. MAINTENANCE WINDOWS

### Planned Maintenance

**Database Backups** (Automated):
- Frequency: Daily (Neon automatic)
- Window: 2:00 AM - 3:00 AM UTC
- Expected downtime: 0 (continuous backup)

**Security Updates** (If Needed):
- Frequency: As needed
- Window: 3:00 AM - 4:00 AM UTC (off-peak)
- Expected downtime: <5 minutes
- Notification: 24 hours advance notice

**Scaling/Optimization** (If Needed):
- Frequency: Weekly (if needed)
- Window: Tuesday 2:00 PM UTC
- Expected downtime: 0-5 minutes
- Notification: 1 week advance notice

### Blackout Dates

- [None scheduled initially]
- Plan ahead for major holidays/events

---

## 10. CONTACTS & DOCUMENTATION

### Team Contacts

| Role | Name | Slack | On-Call |
|------|------|-------|---------|
| DevOps Lead | @devops (Gage) | #engineering | 24/7 |
| Backend Lead | @data-engineer (Dara) | #engineering | Business hours |
| QA Lead | @qa (Quinn) | #qa | Business hours |
| Product Owner | @po (Pax) | #product | Business hours |

### Key Documentation

- **Scaling Strategy**: `docs/SCALING-STRATEGY.md`
- **Performance Baseline**: `db/audits/PERFORMANCE_ANALYSIS_PHASE5.md`
- **Smoke Tests**: `db/tests/SMOKE_TEST_PHASE5.md`
- **Security Audit**: `db/audits/SECURITY_AUDIT_PHASE5.md`
- **Approval Document**: `PHASE-5-APPROVAL-DOCUMENT.md` (this file)

### External Services Dashboards

- **Render Backend**: https://render.com/dashboard
- **Vercel Frontend**: https://vercel.com/dashboard
- **Neon Database**: https://neon.tech/app/projects
- **GitHub**: https://github.com/mgabsilva9-boop/dealer-sourcing
- **Slack**: https://threeonflorida.slack.com

---

## 11. SUCCESS CRITERIA (Week 1)

✅ If all of these are true, Phase 5 launch is **SUCCESSFUL**:

- [ ] Uptime >99.5% (no more than 20 minutes downtime)
- [ ] Error rate <1% (healthy application state)
- [ ] Response time P95 <500ms (acceptable user experience)
- [ ] Pool utilization stays <75% (no scaling needed)
- [ ] Zero RLS violations detected (data isolation working)
- [ ] No security incidents (all access logs clean)
- [ ] Users report positive feedback
- [ ] No rollback required

---

## SIGN-OFF

**Operations Team**: Ready to assume production monitoring
**DevOps Lead**: @devops (Gage) - Approved
**Date**: 2026-03-28

---

*Operations Handoff Complete*
*Ready for Phase 5 MVP Launch*
