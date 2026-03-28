# Phase 5 Quick Start - 30 Seconds to Launch

**Status**: 🟢 READY
**Goal**: Launch 3 parallel workstreams in <30 minutes
**Timeline**: 4-6 hours execution (parallel)

---

## 1️⃣ @dev (Dex) - Start HERE

### Your Task
Implement real JWT extraction (STORY-501)

### 3-Step Quick Start

```bash
# Step 1: Read your story
cat docs/stories/STORY-501.md

# Step 2: Modify auth middleware
# File: src/middleware/auth.js
# Change: Extract JWT claims (sub or user_id) instead of hardcoded UUID
# Add: req.user.id = decoded.sub || decoded.user_id

# Step 3: Update sourcing endpoints
# File: src/routes/sourcing.js
# Replace: '550e8400-e29b-41d4-a716-446655440000'
# With: req.user.id (5 places)

# Step 4: Write tests
npm test -- --testNamePattern="multi-user"

# Step 5: Validate RLS isolation
# Run app, create 2 test users, verify data isolation
npm run dev:server &
npm run dev &
```

### Success = All 40 tests pass + RLS works with 2+ users

**Time**: 2 hours | **Start**: Now | **Finish**: Hour 2

---

## 2️⃣ @data-engineer (Dara) - Start HERE

### Your Task
Add connection pool monitoring (STORY-502)

### 3-Step Quick Start

```bash
# Step 1: Read your story
cat docs/stories/STORY-502.md

# Step 2: Add pool metrics to database config
# File: src/config/database.js
# Add: Metrics object tracking active/idle/waiting connections

# Step 3: Create /metrics endpoint
# File: src/routes/metrics.js (new file)
# Endpoint: GET /metrics → returns JSON with pool stats

# Step 4: Load test
# Run: npm test -- --testNamePattern="load"
# or: Custom script with 50 concurrent requests

# Step 5: Document findings
# Create: docs/SCALING-STRATEGY.md
```

### Success = /metrics responding + load test complete + strategy documented

**Time**: 3-4 hours | **Start**: Now | **Finish**: Hour 3-4

---

## 3️⃣ @qa (Quinn) - Start AFTER hour 2

### Your Task
Validate Phase 5 (STORY-501 + STORY-502)

### 3-Step Quick Start

```bash
# Step 1: Wait for @dev to finish STORY-501
# Timeline: Start at Hour 2

# Step 2: Run regression tests
npm test  # All 40 tests should pass

# Step 3: Observe load test
# Monitor @data-engineer's load test
# Check: Response times, errors, pool metrics

# Step 4: Make go/no-go decision
# Create: PHASE-5-GATE-DECISION.yml
# Decision: PASS (✅) or FAIL (❌)
```

### Success = Gate decision made, signed off

**Time**: 2-3 hours | **Start**: Hour 2 | **Finish**: Hour 4-5

---

## 📋 For Everyone

### Before You Start (Checklist)

- [ ] PostgreSQL running (`psql -U postgres` works)
- [ ] npm install done (`npm list` shows all deps)
- [ ] .env configured (DATABASE_URL, JWT_SECRET)
- [ ] `npm test` runs without errors
- [ ] You've read your STORY file
- [ ] You've read PHASE-5-KICKOFF.md

### Kickoff Meeting (30 min)

```
Time: Hour 0
Who: @dev, @data-engineer, @qa, @pm, @architect
What:
  - Confirm assignments
  - Identify blockers
  - Set communication cadence
  - Agree on sign-off criteria
```

### Hourly Status (Optional)

```
Hour 1: "On track? Any blockers?"
Hour 2: "@dev done with STORY-501, @qa can start"
Hour 3: "@data-engineer load testing, monitor progress"
Hour 4: "@qa regression testing, decision pending"
Hour 5: "Phase 5 sign-off decision ✅ or ❌"
```

---

## 🚨 If You Get Stuck

### @dev Issue: Tests failing after JWT changes

**Problem**: One or more tests failing
**Solution**:
```bash
# Debug JWT extraction
npm test -- --testNamePattern="JWT"
# Check that decoded token has 'sub' or 'user_id'
# Check that req.user.id is set correctly
# Verify all 5 endpoints updated
```

### @data-engineer Issue: Load test causing pool exhaustion

**Problem**: Connection pool fills up during load test
**Solution**:
```bash
# Start smaller
# Reduce from 50 to 20 concurrent users
# Monitor: SELECT count(*) FROM pg_stat_activity
# Document findings for Phase 5+
```

### @qa Issue: Finding regressions

**Problem**: Some tests failing, not sure what broke
**Solution**:
```bash
# Identify which endpoint broke
npm test -- --verbose
# Compare with STORY-501/502 changes
# Ask @dev or @data-engineer what changed in that area
```

---

## 📞 Communication

### Slack Channel: #phase-5-dealer-sourcing

```
Hour 0: @pm announces "Phase 5 starting 🚀"
Hour 1: @dev posts progress
Hour 2: @data-engineer posts progress
Hour 3: @data-engineer starts load test
Hour 4: @qa starts validation
Hour 5: @qa announces "PASS ✅" or "FAIL ❌"
```

### Escalation Path

```
Minor blocker (1 person stuck)
  → Ask team in Slack

Major blocker (multiple people affected)
  → Ping @pm immediately

Critical issue (security, data loss)
  → Escalate to @architect
```

---

## 🎯 Definition of Done

### STORY-501 (JWT Implementation)
```
✅ src/middleware/auth.js extracts JWT claims
✅ src/routes/sourcing.js uses req.user.id
✅ 40 integration tests passing
✅ New multi-user tests passing
✅ RLS isolation verified (manual test)
✅ Code reviewed
```

### STORY-502 (Pool Monitoring)
```
✅ Pool metrics collecting in database.js
✅ GET /metrics endpoint responding
✅ Alert logic implemented and tested
✅ Load test completed (50 concurrent users)
✅ Scaling strategy documented
✅ Code reviewed
```

### Phase 5 Sign-Off
```
✅ STORY-501 complete & tested
✅ STORY-502 complete & documented
✅ All 40 regression tests passing
✅ Load test successful
✅ No new security vulnerabilities
✅ Performance unchanged (<1s endpoints)
✅ QA sign-off obtained
```

---

## 📊 Quick Timeline

```
Hour 0:  Kickoff (all hands, 30 min)
Hour 1:  @dev implementing STORY-501
Hour 1:  @data-engineer implementing STORY-502
Hour 2:  @dev finishes, tests running
Hour 3:  @data-engineer load test running
Hour 4:  @qa regression testing
Hour 4:  @dev continues STORY-505 (optional)
Hour 5:  @qa sign-off decision
Hour 5:  Celebration & retrospective
```

---

## 🏁 After Phase 5 (Next Steps)

### If PASS ✅
```
1. Deploy to production (Render + Vercel auto-deploys)
2. Monitor metrics for 1 week
3. Plan Phase 5+ (4 additional stories)
4. Schedule next phase kickoff
```

### If FAIL ❌
```
1. Identify root cause
2. @dev or @data-engineer fix issue
3. Re-run failing tests
4. @qa re-validates
5. New sign-off decision
```

---

## 📚 Documentation Map

| Document | Purpose | Read Time |
|----------|---------|-----------|
| **This file** | Quick start (30 sec) | ⚡ |
| **PHASE-5-KICKOFF.md** | Detailed plan (4-6 hr execution) | 15 min |
| **PHASE-5-STRATEGY-SUMMARY.md** | High-level overview | 10 min |
| **docs/stories/STORY-501.md** | Your task (@dev) | 10 min |
| **docs/stories/STORY-502.md** | Your task (@data-engineer) | 10 min |
| **docs/ARCHITECTURE.md** | System reference | 20 min |

---

## ⚡ TL;DR

**@dev**: Implement JWT extraction (2h) → All tests pass ✅
**@data-engineer**: Add pool monitoring (3h) → Load test complete ✅
**@qa**: Validate both (2h) → Sign-off ✅

**Total**: 7 hours sequential = **4-6 hours parallel** 🚀

**Start**: Now
**Finish**: Hour 4-6
**Next**: Phase 5+

---

**Let's go!** 🎯

-- Orion
