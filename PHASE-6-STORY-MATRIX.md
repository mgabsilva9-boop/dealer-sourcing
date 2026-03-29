# Phase 6 Story Matrix - Complete Overview

**Date**: 2026-03-28
**Total Stories**: 7 | **Total Points**: 25 | **Recommended Scope**: 16+10 (Tier 1+2)

---

## Story Comparison Matrix

| ID | Title | Points | Duration | Owner | Tier | Priority | Risk | Blocker | Dependencies |
|----|-------|--------|----------|-------|------|----------|------|---------|--------------|
| 601 | JWT Secret Rotation | 5 | 3-4h | @dev | 1 | HIGH | MED | No | STORY-501 ✅ |
| 602 | Legacy Table RLS | 3 | 1.5-2h | @data-eng | 1 | HIGH | MED | No | Phase 5 RLS |
| 603 | Redis Caching | 8 | 4-5h | @dev+@data-eng | 1 | HIGH | LOW | No | STORY-504 ✅ |
| 604 | API Consolidation | 5 | 2-3h | @dev | 2 | MED | MED | No | STORY-501 ✅ |
| 606 | Monitoring Dashboard | 5 | 3-4h | @devops | 2 | MED | LOW | No | STORY-502 ✅ |
| 605 | UUID Migration | 13 | 8-10h | @data-eng | 3 | LOW | MED-HIGH | Yes | STORY-602 ✅ |
| 607 | Error Handling | 3 | 2h | @dev | 3 | LOW | LOW | No | None |

**✅ = Complete from Phase 5**

---

## Acceptance Criteria Checklist by Story

### STORY-601: JWT Secret Rotation (5 pts)

```
Security
  [ ] AC-1: Multiple active JWT secrets supported
  [ ] AC-2: New tokens use current version
  [ ] AC-3: Old tokens verify against all versions
  [ ] AC-4: Secret version in JWT header (kid)
  [ ] AC-5: Automatic rotation scheduled (monthly)

Functionality
  [ ] AC-6: JWKS endpoint (/api/.well-known/jwks.json)
  [ ] AC-7: 30-day backward compatibility window
  [ ] AC-8: All endpoints use versioned verification

Testing
  [ ] All tests passing
  [ ] Code review passed
  [ ] Load test: JWKS endpoint <100ms
```

**Owner**: @dev | **Effort**: 5 pts | **Duration**: 3-4h | **Blocker**: None

---

### STORY-602: Legacy Table RLS (3 pts)

```
Coverage
  [ ] AC-1: legacy_inventory RLS enabled
  [ ] AC-2: legacy_expenses RLS enabled
  [ ] AC-3: legacy_crm_data RLS enabled
  [ ] AC-4: legacy_history RLS enabled

Functionality
  [ ] AC-5: User isolation verified (2+ users)
  [ ] AC-6: Zero data leakage detected
  [ ] AC-7: Query performance OK

Testing
  [ ] All tests passing
  [ ] Code review passed
  [ ] Security audit clean
```

**Owner**: @data-engineer | **Effort**: 3 pts | **Duration**: 1.5-2h | **Blocker**: None

---

### STORY-603: Redis Caching (8 pts)

```
Infrastructure
  [ ] AC-1: Redis connection working
  [ ] AC-2: Connection pooling configured
  [ ] AC-3: Fallback to DB if Redis down

Implementation
  [ ] AC-4: Cache strategy documented
  [ ] AC-5: Hotpaths cached (vehicle list, search)
  [ ] AC-6: Cache invalidation on updates

Performance
  [ ] AC-7: Hit rate >80% verified
  [ ] AC-8: Load test: 100 concurrent, p95 <300ms

Operations
  [ ] Cost <$20/month estimate
  [ ] Monitoring integrated
```

**Owner**: @dev + @data-engineer | **Effort**: 8 pts | **Duration**: 4-5h | **Blocker**: None

---

### STORY-604: API Client Consolidation (5 pts)

```
Design
  [ ] AC-1: Unified apiClient.js designed
  [ ] AC-2: Error handling strategy defined
  [ ] AC-3: Timeout strategy (5s default)

Implementation
  [ ] AC-4: All endpoints use same client
  [ ] AC-5: Consistent error format
  [ ] AC-6: Token management centralized
  [ ] AC-7: All components importing updated

Testing
  [ ] AC-8: Zero regression on existing flows
  [ ] All tests passing
  [ ] Code review passed
```

**Owner**: @dev | **Effort**: 5 pts | **Duration**: 2-3h | **Blocker**: None

---

### STORY-606: Monitoring Dashboard (5 pts)

```
Backend
  [ ] AC-1: /api/metrics/history endpoint
  [ ] AC-2: Pool utilization data
  [ ] AC-3: Query latency calculations

Frontend
  [ ] AC-4: /dashboard/metrics page
  [ ] AC-5: Real-time graphs (10s refresh)
  [ ] AC-6: Alert status display

Features
  [ ] AC-7: 24-hour history retention
  [ ] AC-8: Mobile responsive

Testing
  [ ] All tests passing
  [ ] Code review passed
  [ ] Load test: dashboard <500ms
```

**Owner**: @devops | **Effort**: 5 pts | **Duration**: 3-4h | **Blocker**: None

---

### STORY-605: UUID Migration (13 pts) [DEFERRED]

```
Planning
  [ ] AC-1: Migration strategy documented
  [ ] AC-2: Zero-downtime approach designed
  [ ] AC-3: Rollback plan tested

Migration Stages
  [ ] AC-4: Stage 1 - Prepare (new columns)
  [ ] AC-5: Stage 2 - Migrate (swap PKs)
  [ ] AC-6: Stage 3 - Cleanup (drop old columns)

Validation
  [ ] AC-7: Zero data loss (row counts match)
  [ ] AC-8: Query performance OK
  [ ] AC-9: All foreign keys updated
  [ ] AC-10: Rollback procedure verified

Testing
  [ ] Load test: 100 concurrent passing
  [ ] All tests passing
  [ ] Code review passed
```

**Owner**: @data-engineer | **Effort**: 13 pts | **Duration**: 8-10h | **Blocker**: STORY-602

---

### STORY-607: Error Handling Framework (3 pts) [DEFERRED]

```
Design
  [ ] AC-1: Error code taxonomy
  [ ] AC-2: Error response format standardized

Implementation
  [ ] AC-3: CustomError class
  [ ] AC-4: All endpoints updated
  [ ] AC-5: Stack traces never exposed

Testing
  [ ] AC-6: Error responses consistent
  [ ] All tests passing
  [ ] Code review passed
```

**Owner**: @dev | **Effort**: 3 pts | **Duration**: 2h | **Blocker**: None

---

## Effort Distribution

### By Story Points

```
3 pts:   STORY-602, STORY-607 (2 stories)
5 pts:   STORY-601, STORY-604, STORY-606 (3 stories)
8 pts:   STORY-603 (1 story)
13 pts:  STORY-605 (1 story)
─────────────────────────────
TOTAL:   25 points (7 stories)
```

### By Team

```
@dev:             STORY-601 (5) + STORY-603 (4) + STORY-604 (5) + STORY-607 (3) = 17 pts
@data-engineer:   STORY-602 (3) + STORY-603 (4) + STORY-605 (13) = 20 pts
@devops:          STORY-606 (5) = 5 pts
```

### By Category

```
SECURITY:    STORY-601 (5) + STORY-602 (3) = 8 pts
SCALABILITY: STORY-603 (8) = 8 pts
REFACTORING: STORY-604 (5) + STORY-606 (5) + STORY-607 (3) = 13 pts
DATA:        STORY-605 (13) = 13 pts
─────────────────────────
TOTAL:       25 pts (7 stories)
```

---

## Timeline Gantt Chart

```
Week 1
│
Monday    ├─ STORY-601 ──────────┬─ (3-4h, @dev)
          ├─ STORY-602 ──┬──────── (1.5-2h, @data-eng)
          │              │
Wednesday │              ├─ ✅ DONE
          └─ STORY-603 ──────────────┬─ (4-5h, @dev+@data-eng)
                                     │
                                     │
Friday    └─────────────────────────┤

Week 2
│
Monday    ├─ STORY-603 continues ──┬─ Load testing
          ├─ STORY-604 ──────────┬─── (2-3h, @dev)
          └─ STORY-606 ──────────┬─── (3-4h, @devops)
                                │
Wednesday │                    ├─ ✅ DONE
          └─ STORY-603 ✅ DONE  │
                              │
Friday    └─ STORY-604 ✅ ────┴─ STORY-606 ✅

Gate: TIER 1 ✅ | TIER 2 ✅
```

---

## Blocking & Dependency Map

```
Phase 5 Complete (23 pts)
├─ STORY-501 JWT ✅
├─ STORY-502 Pool ✅
├─ STORY-503 Neon ✅
├─ STORY-504 API Endpoints ✅
└─ STORY-505 (optional) ✅

Phase 6 Dependencies:

STORY-601 (JWT Rotation)
└─ Requires: STORY-501 ✅

STORY-602 (Legacy RLS)
└─ Requires: Phase 5 RLS policies ✅

STORY-603 (Redis Cache)
├─ Requires: STORY-502 ✅ (metrics)
└─ Requires: STORY-504 ✅ (API endpoints)

STORY-604 (API Consolidation)
└─ Requires: STORY-501 ✅ (JWT)

STORY-606 (Monitoring)
└─ Requires: STORY-502 ✅ (pool metrics)

STORY-605 (UUID Migration) [DEFERRED]
└─ Requires: STORY-602 ✅ (legacy RLS first)

STORY-607 (Error Handling) [DEFERRED]
└─ Requires: None
```

**Status**: ✅ All Phase 5 dependencies met. Ready to start Phase 6.

---

## Risk Assessment Matrix

| Story | Technical Risk | Execution Risk | Business Risk | Mitigation |
|-------|---|---|---|---|
| 601 | MEDIUM | LOW | LOW | 30-day compatibility window |
| 602 | MEDIUM | LOW | LOW | Test in staging, gradual rollout |
| 603 | LOW | MEDIUM | LOW | Monitor hit rate, scale tier |
| 604 | MEDIUM | LOW | LOW | Extensive regression tests |
| 606 | LOW | LOW | LOW | Simple tech (React charts) |
| 605 | MEDIUM-HIGH | HIGH | MEDIUM | Multi-stage migration, rollback plan |
| 607 | LOW | LOW | LOW | Non-critical, can defer |

**Overall Phase 6 Risk**: LOW (good practices, documented mitigations)

---

## Success Metrics by Story

| Story | Key Metric | Target | Measurement |
|-------|---|---|---|
| 601 | JWT rotation tested | ✅ working | Integration tests |
| 602 | RLS enforcement | 4/4 tables | Multi-user tests |
| 603 | Cache performance | >80% hit rate | Metrics endpoint |
| 604 | Consolidation | 100% coverage | Component audit |
| 606 | Dashboard | <500ms load | Performance test |
| 605 | Migration | 0 data loss | Row count validation |
| 607 | Error codes | All endpoints | Code audit |

---

## Phase 6 Exit Criteria

**Tier 1 Gate (MUST PASS)**:
- [ ] STORY-601 acceptance criteria 100% met
- [ ] STORY-602 acceptance criteria 100% met
- [ ] STORY-603 acceptance criteria 100% met
- [ ] Load test: 100 concurrent, p95 <300ms
- [ ] Zero critical/high severity issues
- [ ] @qa sign-off obtained

**Tier 2 Gate (MUST PASS)**:
- [ ] STORY-604 acceptance criteria 100% met
- [ ] STORY-606 acceptance criteria 100% met
- [ ] Zero regression on existing features
- [ ] All tests passing (80%+ coverage)
- [ ] @qa sign-off obtained

**Phase 6 Complete When**:
- ✅ Tier 1 Gate PASS
- ✅ Tier 2 Gate PASS
- ✅ All code merged + reviewed
- ✅ Deployment documented
- ✅ Monitoring active + alerting configured

---

## Recommended Reading Order

### For Kickoff Meeting
1. PHASE-6-QUICK-REFERENCE.md (2 min)
2. PHASE-6-STORY-MATRIX.md (5 min) ← You are here
3. PHASE-6-BACKLOG-PRIORITY.md (10 min - timeline + assignments)

### For Story Implementation
1. PHASE-6-STORIES.md (detailed spec for your story)
2. Relevant Phase 5 audit (for context on phase-dependent work)

### For Gate Decisions
1. PHASE-6-QUICK-REFERENCE.md (acceptance checklist)
2. Story acceptance criteria (from PHASE-6-STORIES.md)
3. Load test results / security audit results

---

## Quick Reference by Role

### Product Manager (@pm)
- Tier 1 scope: 8 pts security + 8 pts scalability
- Tier 2 scope: 5 pts code quality + 5 pts visibility
- Timeline: 10 days (2 weeks wall-clock)
- Gates: Security validated, 100 concurrent verified

### Dev Lead (@dev)
- STORY-601 (JWT): 5 pts, 3-4h, high priority
- STORY-603 (Redis): 8 pts, 4-5h, requires @data-engineer
- STORY-604 (API): 5 pts, 2-3h, clean up code
- Total effort: ~12-13 hours

### Data Engineer (@data-engineer)
- STORY-602 (RLS): 3 pts, 1.5-2h, security fix
- STORY-603 (Redis): 8 pts, 4-5h, support @dev
- STORY-605 (UUID): 13 pts, 8-10h, deferred
- Total effort for Tier 1+2: ~11-12 hours

### DevOps (@devops)
- STORY-606 (Monitoring): 5 pts, 3-4h, dashboard
- Support: Infrastructure, Redis provider, monitoring
- Total effort: ~3-4 hours

### QA Lead (@qa)
- Load testing: 100 concurrent users, p95 <300ms
- Gate validation: Tier 1 + Tier 2 criteria
- Regression testing: Zero breaking changes
- Total effort: ~4-5 hours

---

## Version Control & History

```
Created: 2026-03-28
Version: 1.0.0
Status: Ready for Backlog Refinement

Prepared by: @sm (River - Scrum Master)
Based on: Phase 5 audit + performance analysis

Next Update: After Phase 6 Kickoff
```

---

**Use this matrix to**:
- Understand story complexity + effort
- Plan team assignments + timeline
- Track acceptance criteria
- Make gate decisions
- Manage risks + dependencies

**Share this with**: Entire team (print + post on wall)
