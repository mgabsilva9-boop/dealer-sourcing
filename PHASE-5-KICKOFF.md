# Phase 5 Kickoff - Parallelized Workstreams

**Date**: 2026-03-28
**Duration Target**: 8-10 hours (Phase 5), 12-15 hours (Phase 5+)
**Status**: Ready to Launch
**Gate**: Phase 4 PASS (94% confidence)

---

## Executive Summary

Phase 5 consolidates MVP tech debt into 3 **parallel workstreams**, executed simultaneously by specialized agents:

1. **Backend Security & Auth** (@dev) - JWT real implementation
2. **Database Infrastructure** (@data-engineer) - Pool monitoring + observability
3. **QA Validation** (@qa) - Regression testing, sign-off

Parallelization reduces 10-hour sequential timeline to **4-6 hours wall-clock time**.

---

## Workstream 1: Backend Security & Auth

**Owner**: @dev (Dex - The Builder)
**Duration**: 2-3 hours
**Critical**: YES (blocks Phase 5 sign-off)

### Stories to Implement

#### STORY-501: JWT Implementation (2 hours)

```
Task Breakdown:
├─ Modify auth middleware (30 min)
│  └─ Extract userId from JWT claims (sub or user_id)
│  └─ Attach to req.user.id
├─ Update sourcing.js (20 min)
│  └─ Replace hardcoded UUID with req.user.id
│  └─ Verify 5 endpoints affected
├─ Update tests (45 min)
│  └─ Generate valid JWT tokens
│  └─ Multi-user test scenarios
│  └─ RLS isolation verification
└─ Manual QA (15 min)
   └─ User A marks interested
   └─ User B cannot see User A's data
```

**Success Criteria**:
- ✅ 40 integration tests pass
- ✅ RLS isolation verified (2+ users)
- ✅ No hardcoded UUIDs remain
- ✅ Code review passed

**Dependencies**: None (Phase 4 complete)

**Blockers**:
- If JWT signature verification fails → check JWT_SECRET env var
- If tests fail → regenerate test tokens

**Effort**: 2 hours (STORY-501)

#### STORY-505: API Client Consolidation (1 hour, optional parallel)

```
Task Breakdown:
├─ Create unified apiClient.js (1 hour)
│  └─ Merge api.js + sourcingAPI.js
│  └─ Unified localStorage key
│  └─ Consistent timeout handling (5s)
├─ Update App.jsx (30 min)
├─ Update SourcingList.jsx (15 min)
└─ Tests (30 min)
```

**Can start AFTER STORY-501** or in parallel if capacity available.

### Parallel Execution with @data-engineer

While @dev works on JWT (1-2 hours), @data-engineer can:
- Start pool monitoring setup (non-blocking)
- Load test environment preparation
- No dependency on JWT implementation

---

## Workstream 2: Database Infrastructure

**Owner**: @data-engineer (Dara - The Sage)
**Duration**: 3-4 hours
**Critical**: MEDIUM (nice-to-have for Phase 5)

### Stories to Implement

#### STORY-502: Connection Pool Monitoring (3 hours)

```
Task Breakdown:
├─ Add pool metrics collection (30 min)
│  └─ src/config/database.js
│  └─ Track: active, idle, waiting connections
├─ Create /metrics endpoint (20 min)
│  └─ Prometheus format (optional, simple JSON ok)
│  └─ Register in src/server.js
├─ Implement exhaustion alerts (30 min)
│  └─ Warn at 75% (15 connections)
│  └─ Error at 90% (18 connections)
│  └─ Log with timestamps
├─ Load test (60 min)
│  └─ 50 concurrent users
│  └─ Measure response times
│  └─ Identify bottlenecks
└─ Documentation (30 min)
   └─ Scaling strategy
   └─ Monitoring procedures
```

**Success Criteria**:
- ✅ /metrics endpoint returning pool stats
- ✅ Load test completed
- ✅ Scaling thresholds documented
- ✅ Alert logic verified

**Dependencies**: None (connection pool already configured)

**Blockers**:
- If load test causes connection exhaustion → verify pool max = 20
- If alerts not firing → check threshold logic

**Effort**: 3-4 hours (STORY-502)

#### STORY-504: Schema Unification (8 hours, Phase 5+)

**NOT in Phase 5 kickoff** - too large. Scheduled for Phase 5+ planning.

### Parallel Execution with @dev

- **While @dev implements JWT** (hours 0-2): @data-engineer starts metrics endpoint
- **While @dev writes tests** (hours 2-3): @data-engineer runs load test
- **No blocking dependencies** - can execute in parallel

---

## Workstream 3: QA Validation

**Owner**: @qa (Quinn - Quality Guardian)
**Duration**: 2-3 hours
**Critical**: YES (Phase 5 sign-off gate)

### QA Activities

#### Regression Test Suite (1 hour)

```
Task Breakdown:
├─ Re-run all 40 integration tests
│  └─ Verify no breakage from JWT changes
│  └─ Check RLS isolation (new multi-user tests)
├─ Performance regression check
│  └─ Endpoint response times
│  └─ Database query performance
└─ Security validation
   └─ JWT extraction working correctly
   └─ No hardcoded values remain
```

#### Load Test Observation (1 hour)

```
Task Breakdown:
├─ Monitor @data-engineer's load test
├─ Verify no errors under 50 concurrent users
├─ Check response times acceptable (<2s)
└─ Document results
```

#### Phase 5 Sign-Off Decision (1 hour)

```
Task Breakdown:
├─ Review all regression results
├─ Validate against Phase 5 gate criteria
├─ Make go/no-go decision
├─ Document sign-off (new gate decision doc)
└─ Communicate to team
```

**Success Criteria**:
- ✅ All regressions cleared
- ✅ Load test results acceptable
- ✅ Security validation passed
- ✅ Sign-off document created

**Dependencies**:
- Depends on STORY-501 completion (JWT implementation)
- Depends on STORY-502 completion (pool monitoring)

---

## Execution Timeline

### Phase 5 Parallel Execution (Wall-Clock Time)

```
Timeline (4-6 hours wall-clock)

START (Hour 0)
│
├─ @dev ──────────────────────────────────────── JWT Implementation (2h)
│  │
│  ├─ Auth middleware (0.5h)
│  ├─ sourcing.js updates (0.3h)
│  └─ Tests + manual QA (1.2h)
│
├─ @data-engineer ──────────────────────────── Pool Monitoring (3h)
│  │
│  ├─ Metrics collection (0.5h)
│  ├─ /metrics endpoint (0.3h)
│  ├─ Load test setup (0.5h)
│  └─ Load test execution (1.7h)
│
└─ @qa ─────────────────────────────────────── Validation (2h, starts at hour 2)
   │
   ├─ Regression testing (1h, starts when @dev finishes)
   ├─ Load test observation (1h, parallel with execution)
   └─ Sign-off (0.5h, final)

COMPLETE (Hour 4-6)
│
✅ Phase 5 Gate Decision: PASS/FAIL
```

### Synchronization Points

| Time | Event | Who | Action |
|------|-------|-----|--------|
| **Hour 0** | Phase 5 Kickoff | All | Confirm assignment, timeline, blockers |
| **Hour 1** | Midpoint Check | @dev, @data-engineer | Any blockers? Adjust timeline? |
| **Hour 2** | @dev Completes STORY-501 | @dev, @qa | JWT ready for QA testing |
| **Hour 3** | @data-engineer Completes Load Test | @data-engineer, @qa | Results ready for validation |
| **Hour 4** | @qa Regression Testing Complete | @qa | Decision point |
| **Hour 4.5** | Phase 5 Sign-Off Decision | @qa, @pm, @architect | Gate: PASS or FAIL |
| **Hour 5** | Stakeholder Communication | @pm | Update roadmap, announce phase completion |

---

## Story Ownership & Assignments

### STORY-501: JWT Implementation

| Task | Owner | Duration |
|------|-------|----------|
| Auth middleware extraction | @dev | 30 min |
| sourcing.js updates (5 endpoints) | @dev | 20 min |
| Test generation + multi-user tests | @dev | 45 min |
| Manual RLS validation | @dev + @qa | 15 min |

**Success Gate**: All 40 tests + new tests passing, RLS isolated

### STORY-502: Pool Monitoring

| Task | Owner | Duration |
|------|-------|----------|
| Metrics collection | @data-engineer | 30 min |
| /metrics endpoint | @data-engineer | 20 min |
| Alert logic | @data-engineer | 30 min |
| Load test execution | @data-engineer | 60 min |
| Documentation | @data-engineer | 30 min |

**Success Gate**: Load test complete, scaling documented, alerts working

### STORY-505: API Client Consolidation (Optional, Phase 5)

| Task | Owner | Duration |
|------|-------|----------|
| Unified apiClient.js creation | @dev | 1 hour |
| App.jsx + SourcingList migration | @dev | 1 hour |
| Testing | @dev | 1 hour |

**Condition**: Only if @dev completes STORY-501 early (optional parallel)

---

## Risk Assessment

### Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| JWT extraction breaks queries | Medium | High | Test multi-user RLS immediately |
| Load test exhausts pool too quickly | Medium | Medium | Start with 10 users, ramp to 50 gradually |
| Pool monitoring adds overhead | Low | Low | Metrics endpoint is lightweight |
| RLS policies fail with UUID changes | Low | High | Pre-test on staging clone |
| Tests take longer than expected | Medium | Medium | Parallelize test execution |

### Contingency Plans

**If JWT extraction breaks RLS**:
1. Revert sourcing.js changes
2. Debug JWT extraction (check JWT_SECRET)
3. Re-test with valid tokens
4. Estimated recovery: 30 min

**If load test causes connection pool exhaustion**:
1. Reduce concurrent users to 20 (current pool max)
2. Add connection pooling monitoring
3. Document findings for Phase 5+
4. Estimated recovery: 15 min

**If QA finds regressions**:
1. Assign @dev to fix
2. Re-run regression suite
3. Delay sign-off 1-2 hours if needed
4. Escalate if blockers remain

---

## Deliverables

### Code Artifacts

- ✅ `src/middleware/auth.js` - JWT extraction from claims
- ✅ `src/routes/sourcing.js` - Use req.user.id instead of hardcoded UUID
- ✅ `test/integration/sourcing.test.js` - Multi-user test scenarios (new)
- ✅ `src/config/database.js` - Pool metrics collection
- ✅ `src/routes/metrics.js` - /metrics endpoint (new)

### Documentation

- ✅ `PHASE-5-KICKOFF.md` - This document
- ✅ `PHASE-5-DELIVERY.md` - Phase 5 completion report (created after)
- ✅ `docs/SCALING-STRATEGY.md` - Pool monitoring strategy
- ✅ `PHASE-5-GATE-DECISION.yml` - QA sign-off gate

### Stories

- ✅ STORY-501: JWT Implementation (complete)
- ✅ STORY-502: Pool Monitoring (complete)
- ✅ STORY-505: API Client Consolidation (optional)

---

## Phase 5+ Roadmap

After Phase 5 sign-off, Phase 5+ includes:

| Story | Title | Effort | Priority |
|-------|-------|--------|----------|
| STORY-503 | Redis Caching | 4h | LOW |
| STORY-504 | Schema UUID Unification | 8h | LOW |
| STORY-506 | App.jsx Refactoring | 6h | LOW |
| STORY-507 | Horizontal Scaling | 4h | LOW |

**Recommendation**: Prioritize based on business needs:
- **Security focus**: STORY-504 (schema consistency)
- **Performance focus**: STORY-503 (Redis caching)
- **Scalability focus**: STORY-507 (horizontal scaling)
- **Maintainability focus**: STORY-506 (App.jsx refactor)

---

## Communication Plan

### Kickoff (Hour 0)

📢 **Announcement**: Phase 5 starts now!

```
@dev: Start STORY-501 (JWT implementation)
@data-engineer: Start STORY-502 (pool monitoring)
@qa: Prepare regression test suite
@pm: Update stakeholders on timeline
```

### Midpoint Check (Hour 1)

🔄 **Status Update**: Any blockers? On track?

### Completion (Hour 4-5)

✅ **Sign-Off**: Phase 5 gate decision (PASS/FAIL)

### Celebration (Hour 5)

🎉 **Milestone**: Phase 5 complete, roadmap updated, Phase 5+ planned

---

## Success Criteria

### Phase 5 PASS Conditions

- ✅ STORY-501 (JWT) implemented and tested
- ✅ STORY-502 (Pool monitoring) operational
- ✅ All 40 integration tests passing
- ✅ New multi-user RLS tests passing
- ✅ Load test completed (50 users)
- ✅ No security vulnerabilities found
- ✅ Performance metrics unchanged (<1s endpoints)
- ✅ QA sign-off obtained
- ✅ Documentation complete

### Phase 5 FAIL Conditions

- ❌ JWT extraction breaks critical functionality (>5 tests failing)
- ❌ RLS isolation not verified with multiple users
- ❌ Load test reveals pool exhaustion at <25 concurrent users
- ❌ Security vulnerabilities found
- ❌ Performance degrades (endpoints >2s)

---

## Handoff to Phase 5+

### Transition Artifacts

1. **Phase 5 Delivery Report** (`PHASE-5-DELIVERY.md`)
   - Stories completed
   - Metrics achieved
   - Issues discovered

2. **Phase 5+ Roadmap** (Updated)
   - Next 4 stories prioritized
   - Resource allocation
   - Timeline estimates

3. **Operational Runbook** (New)
   - How to monitor pool metrics
   - How to scale up connections
   - Alert thresholds and responses

---

## Sign-Off & Approval

| Role | Name | Status | Date |
|------|------|--------|------|
| **Dev Lead** | @dev (Dex) | Approved | 2026-03-28 |
| **Database Lead** | @data-engineer (Dara) | Approved | 2026-03-28 |
| **QA Lead** | @qa (Quinn) | Ready | 2026-03-28 |
| **Product Manager** | @pm (Morgan) | Approved | 2026-03-28 |
| **Architect** | @architect (Aria) | Approved | 2026-03-28 |

---

## Quick Start Commands

```bash
# Phase 5 Development Setup
npm install
npm run dev:server &
npm run dev &

# Run regression tests
npm test

# Start JWT implementation
# → Head to STORY-501.md for details

# Start pool monitoring
# → Head to STORY-502.md for details

# Monitor progress
tail -f .logs/phase5-progress.log
```

---

**Document Created**: 2026-03-28
**Prepared By**: @aios-master (Orion)
**Status**: 🟢 Ready to Launch Phase 5
**Next Step**: Execute Workstream 1 (STORY-501 with @dev)
