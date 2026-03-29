# Phase 6 Backlog - Priority & Delivery Plan

**Date**: 2026-03-28
**Status**: Ready for Sprint Planning
**Total Backlog**: 7 stories, 25 story points

---

## Executive Summary

**Phase 5 Completion**: 23 story points delivered
- Security audit: ✅ PASS (0 critical, 0 high)
- Performance: ✅ PASS (97%+ success at 50 concurrent users)
- QA gate: ✅ PASS (85% confidence)

**Phase 6 Priorities**:
1. Security: JWT rotation + Legacy RLS (8 points) - Week 1
2. Scalability: Redis caching (8 points) - Week 1-2
3. Refactoring: API consolidation + monitoring (10 points) - Week 2+

---

## Backlog at a Glance

```
┌─────────────────────────────────────────┐
│ PHASE 6 BACKLOG (25 pts total)          │
├─────────────────────────────────────────┤
│ Tier 1: Security + Scaling (16 pts)     │
│ ├─ STORY-601: JWT Rotation (5 pts)      │
│ ├─ STORY-602: Legacy RLS (3 pts)        │
│ └─ STORY-603: Redis Cache (8 pts)       │
├─────────────────────────────────────────┤
│ Tier 2: Refactoring + Ops (10 pts)      │
│ ├─ STORY-604: API Consolidation (5 pts) │
│ └─ STORY-606: Monitoring (5 pts)        │
├─────────────────────────────────────────┤
│ Tier 3: Deferred (16 pts)               │
│ ├─ STORY-605: UUID Migration (13 pts)   │
│ └─ STORY-607: Error Handling (3 pts)    │
└─────────────────────────────────────────┘
```

---

## Tier 1: Critical Path (Week 1-2, 16 pts)

### Recommended Delivery Sequence

```
MONDAY (Day 1)
├─ STORY-601 (JWT Rotation) START
│  └─ Owner: @dev | Duration: 3-4h | Effort: 5pts
│  └─ Status: Ready
│
└─ STORY-602 (Legacy RLS) START
   └─ Owner: @data-engineer | Duration: 1.5-2h | Effort: 3pts
   └─ Status: Ready

WEDNESDAY (Day 3)
├─ STORY-601 COMPLETE ✅
│
└─ STORY-603 (Redis) START
   └─ Owner: @dev + @data-engineer | Duration: 4-5h | Effort: 8pts
   └─ Status: Ready

FRIDAY (Day 5)
├─ STORY-602 COMPLETE ✅
│
└─ STORY-603 IN PROGRESS
   └─ Load testing (100 concurrent users)

MONDAY (Day 8, Week 2)
├─ STORY-603 COMPLETE ✅
│
└─ Tier 1 GATE: Security + Scaling Validation
   ├─ @qa: Load test passing (100 concurrent, p95 <300ms)
   ├─ @data-engineer: JWT rotation verified
   ├─ @data-engineer: Legacy RLS validated
   └─ Redis provider cost estimate <$20/month
```

**Wallclock Time**: 8 days (with dependencies)
**Effort**: 16 story points
**Team**: @dev (lead), @data-engineer (lead), @devops (optional)

---

## Tier 2: Polish (Week 2-3, 10 pts)

### Recommended Delivery Sequence

```
MONDAY (Week 2)
├─ STORY-604 (API Consolidation) START
│  └─ Owner: @dev | Duration: 2-3h | Effort: 5pts
│  └─ Dependencies: Phase 5 JWT working
│
└─ STORY-606 (Monitoring) START
   └─ Owner: @devops + @data-engineer | Duration: 3-4h | Effort: 5pts
   └─ Dependencies: STORY-502 pool monitoring

WEDNESDAY (Week 2)
├─ STORY-604 COMPLETE ✅
│  └─ All components using unified apiClient
│  └─ Zero regression on existing flows
│
└─ STORY-606 IN PROGRESS
   └─ Dashboard rendering metrics
   └─ Real-time updates working

FRIDAY (Week 2)
├─ STORY-606 COMPLETE ✅
│
└─ Tier 2 GATE: Code Quality + Visibility
   ├─ @qa: API consolidation regression tests passing
   ├─ @dev: Error handling consistent
   └─ @devops: Monitoring dashboard live
```

**Wallclock Time**: 5-6 days
**Effort**: 10 story points
**Team**: @dev, @devops, @data-engineer

---

## Tier 3: Deferred to Phase 7+ (16 pts)

### Rationale

**STORY-605 (UUID Migration - 13 pts)**:
- Effort: Very high (8-10 hours)
- Risk: Medium (zero-downtime requirement)
- Business Value: Low (legacy tables isolated from modern schema)
- Recommendation: After 100+ concurrent users validated in production

**STORY-607 (Error Handling - 3 pts)**:
- Effort: Low (2 hours)
- Risk: Low
- Business Value: Low (current error handling is safe, just inconsistent)
- Recommendation: Include if Tier 2 completes early

### Deferral Criteria

Start STORY-605 only if:
- [ ] Phase 6 Tier 1 + Tier 2 complete
- [ ] Production running stable at 50+ concurrent users for 2+ weeks
- [ ] No urgent issues blocking team
- [ ] @data-engineer available for 2+ days

Start STORY-607 only if:
- [ ] Tier 1 + Tier 2 complete early (day 12+)
- [ ] No blockers on other work

---

## Story Dependencies

```
STORY-601 (JWT Rotation)
├─ Depends on: STORY-501 (Phase 5, complete)
└─ Blocks: None

STORY-602 (Legacy RLS)
├─ Depends on: Phase 5 RLS policies
├─ Blocks: STORY-605 (can start in parallel)
└─ Parallel with: STORY-601, STORY-603

STORY-603 (Redis Cache)
├─ Depends on: STORY-502 (Phase 5 metrics), STORY-504 (Phase 5 API)
├─ Blocks: None
├─ Parallel with: STORY-601, STORY-602
└─ After complete: Can reduce DB queries by 85%

STORY-604 (API Consolidation)
├─ Depends on: STORY-501 (Phase 5 JWT)
├─ Blocks: None
├─ Parallel with: STORY-606
└─ Independent of Tier 1

STORY-606 (Monitoring)
├─ Depends on: STORY-502 (Phase 5 metrics)
├─ Blocks: None
├─ Parallel with: STORY-604
└─ Independent of Tier 1

STORY-605 (UUID Migration)
├─ Depends on: STORY-602 (Legacy RLS)
├─ Blocks: Nothing (deferred)
└─ Earliest: Phase 7

STORY-607 (Error Handling)
├─ Depends on: None
├─ Blocks: Nothing
└─ Can start anytime (low priority)
```

---

## Acceptance Gates

### Tier 1 Gate (End of Week 1)

```
SECURITY ✅
├─ JWT secret rotation tested (old + new secrets verify)
├─ Legacy table RLS enabled (2+ user isolation verified)
├─ Zero data leakage found (security audit)
└─ STORY-601 + STORY-602 complete

SCALABILITY ✅
├─ Redis cache operational (hit rate >80%)
├─ Load test: 100 concurrent users passing
├─ p95 latency <300ms
├─ Pool utilization <75% at peak
└─ STORY-603 complete

READINESS ✅
├─ All acceptance criteria met
├─ Zero critical/high issues
├─ Integration tests passing
└─ Ready for production deployment
```

### Tier 2 Gate (End of Week 2)

```
CODE QUALITY ✅
├─ API client unified (single import, all endpoints)
├─ Zero regression on existing flows
├─ All components using new client
└─ STORY-604 complete

VISIBILITY ✅
├─ Monitoring dashboard live
├─ Real-time metrics updating
├─ Alert status displayed
├─ Mobile responsive
└─ STORY-606 complete

DOCUMENTATION ✅
├─ API client usage guide
├─ Monitoring dashboard guide
└─ All acceptance criteria documented
```

---

## Team Assignments

### Tier 1 (Week 1-2)

| Story | Owner | Support | Duration | Effort |
|-------|-------|---------|----------|--------|
| STORY-601 | @dev (Dex) | @devops | 3-4h | 5pts |
| STORY-602 | @data-engineer (Dara) | - | 1.5-2h | 3pts |
| STORY-603 | @dev (Dex) | @data-engineer | 4-5h | 8pts |
| QA/Load Test | @qa (Quinn) | @devops | 2-3h | - |

**Parallel Capacity**:
- @dev: Can handle STORY-601 + STORY-603 sequentially (not parallel)
- @data-engineer: Available for STORY-602 while @dev works on STORY-601
- @qa: Validation runs during week 2

### Tier 2 (Week 2-3)

| Story | Owner | Support | Duration | Effort |
|-------|-------|---------|----------|--------|
| STORY-604 | @dev (Dex) | @ux-design-expert | 2-3h | 5pts |
| STORY-606 | @devops (Gage) | @data-engineer | 3-4h | 5pts |

**Can Run in Parallel**: Yes (independent stories)

### Tier 3 (Deferred)

| Story | Owner | Support | Duration | Effort |
|-------|-------|---------|----------|--------|
| STORY-605 | @data-engineer (Dara) | @dev | 8-10h | 13pts |
| STORY-607 | @dev (Dex) | - | 2h | 3pts |

---

## Timeline & Milestones

### Week 1 (Days 1-5)

```
MON (Start of phase)
├─ 09:00 - Phase 6 Kickoff Meeting (30 min)
│  └─ Review: STORY-601, STORY-602, STORY-603
│  └─ Confirm: team assignments, dependencies
│  └─ Identify: blockers, env setup
│
├─ 09:30 - STORY-601 begins (JWT Rotation)
│  └─ @dev: Design rotation strategy
│
└─ 09:30 - STORY-602 begins (Legacy RLS)
   └─ @data-engineer: Analyze legacy tables

TUE
├─ STORY-601: Implement versioned JWT + JWKS
│
└─ STORY-602: Create RLS policies

WED
├─ STORY-601: Testing + code review
│  └─ 17:00 - STORY-601 COMPLETE ✅
│
├─ STORY-602: Testing + validation
│
└─ STORY-603 begins (Redis Cache)
   └─ @dev + @data-engineer: Setup Redis provider

THU
├─ STORY-602: QA validation
│  └─ 17:00 - STORY-602 COMPLETE ✅
│
└─ STORY-603: Implement cache layer

FRI
├─ STORY-603: Load testing (100 concurrent)
│  └─ Measure: hit rate, latency, cost
│
└─ Week 1 Standup
   └─ Progress: 2/3 stories complete
   └─ Blockers: any issues with Redis setup?
```

**Week 1 Target**: STORY-601 + STORY-602 complete, STORY-603 in progress

### Week 2 (Days 6-10)

```
MON (Week 2)
├─ STORY-603: Final integration + testing
│  └─ Cache invalidation on updates
│  └─ Fallback to DB if Redis down
│
├─ STORY-604 begins (API Consolidation)
│  └─ @dev: Audit current api.js + sourcingAPI.js
│
└─ STORY-606 begins (Monitoring)
   └─ @devops: Design dashboard

TUE
├─ STORY-603: QA validation
│
├─ STORY-604: Implement unified client
│
└─ STORY-606: Build metrics backend

WED
├─ STORY-603: COMPLETE ✅
│  └─ 17:00 - Tier 1 Gate validation
│  └─ Security: JWT + RLS verified
│  └─ Scalability: 100 concurrent, p95 <300ms
│
├─ STORY-604: Update components
│
└─ STORY-606: Build dashboard UI

THU
├─ STORY-604: Testing + code review
│  └─ 17:00 - STORY-604 COMPLETE ✅
│
└─ STORY-606: Testing + mobile responsive

FRI
├─ STORY-606: COMPLETE ✅
│  └─ 17:00 - Tier 2 Gate validation
│  └─ Code quality: API consolidation verified
│  └─ Visibility: Monitoring dashboard live
│
└─ Week 2 Standup
   └─ Progress: 5/5 stories (Tier 1 + Tier 2) complete
   └─ Tier 1 Gate: PASS ✅
   └─ Tier 2 Gate: PASS ✅
```

**Week 2 Target**: All Tier 1 + Tier 2 stories complete (24 pts)

---

## Success Metrics (Exit Criteria)

### Tier 1 Success (Security + Scalability)

| Metric | Target | Measurement | Owner |
|--------|--------|-------------|-------|
| JWT secret rotation | Tested | STORY-601 acceptance tests | @dev |
| Legacy RLS policies | 4/4 tables | STORY-602 multi-user test | @data-engineer |
| Cache operational | >80% hit rate | Redis metrics | @dev |
| Load test passing | 100 concurrent | Load test report | @qa |
| Latency target | p95 <300ms | /api/metrics | @data-engineer |
| Zero data loss | Verified | Data integrity checks | @data-engineer |
| Production ready | Yes | Gate decision | @qa |

**Tier 1 Gate Decision**: PASS if all metrics met

### Tier 2 Success (Code Quality + Visibility)

| Metric | Target | Measurement | Owner |
|--------|--------|-------------|-------|
| API consolidation | 100% | All components using apiClient | @dev |
| Zero regression | 0 bugs | Integration tests + manual QA | @qa |
| Monitoring live | All metrics | Dashboard rendering | @devops |
| Dashboard response | <500ms | Dashboard load time | @devops |
| Mobile responsive | Yes | Tested on tablet | @devops |

**Tier 2 Gate Decision**: PASS if all metrics met

---

## Risk Register

### Tier 1 Risks

| Risk | Prob | Severity | Mitigation | Owner |
|------|------|----------|-----------|-------|
| JWT rotation breaks old tokens | Medium | High | 30-day compatibility window | @dev |
| Redis becomes bottleneck | Low | Medium | Monitor miss rate, scale tier | @data-engineer |
| Legacy RLS breaks queries | Medium | High | Test in staging first | @data-engineer |
| Load test causes DB exhaustion | Low | Medium | Start with 10 users, ramp up | @qa |

**Contingency**: If any Tier 1 risk materializes, rollback and extend timeline 2-3 days

### Tier 2 Risks

| Risk | Prob | Severity | Mitigation | Owner |
|------|------|----------|-----------|-------|
| API consolidation breaks flows | Medium | High | Extensive regression tests | @dev |
| Monitoring dashboard too slow | Low | Low | Optimize query, use caching | @devops |

**Contingency**: If regression detected, revert to old clients until fixed

---

## Communication Plan

### Daily Standups

```
Time: 9:00 AM
Duration: 15 min
Attendees: @dev, @data-engineer, @devops, @qa, @pm

Format:
1. Yesterday: What was completed
2. Today: What will be started/completed
3. Blockers: Any issues? Who can help?
4. Metrics: Progress toward gate criteria
```

### Weekly Status

```
Time: Friday 4:00 PM
Duration: 30 min
Attendees: All team + @pm, @architect

Format:
1. Week summary: Points completed, velocity
2. Gate status: On track for Tier 1/2 gates?
3. Risk review: Any blockers escalated?
4. Next week: Priorities + calendar
```

### Phase 6 Completion

```
Time: TBD (after Tier 2 complete)
Duration: 60 min
Attendees: Full team

Agenda:
1. Demo: All stories + features
2. Metrics: Load test results, monitoring dashboard
3. Lessons learned: What went well? What to improve?
4. Phase 7 planning: Next priorities
```

---

## Rollback & Contingency Plan

### Tier 1 Rollback

If Tier 1 gate fails (load test, security issue), rollback procedure:

```
STEP 1: Identify Issue (15 min)
├─ @qa determines root cause
├─ @data-engineer analyzes metrics
└─ Recommend: rollback or hotfix

STEP 2: Decision (5 min)
├─ If hotfix possible: proceed (1-2 hour fix window)
└─ If rollback needed: revert to Phase 5 (stable state)

STEP 3: Rollback (30 min)
├─ Revert Redis (disable caching)
├─ Revert JWT (use simple version)
├─ Revert Legacy RLS (no policies on legacy tables)
└─ Redeploy backend + frontend

STEP 4: Validation (15 min)
├─ Smoke test: Phase 5 functionality restored
├─ Verify: 50 concurrent users passing
└─ Declare: Phase 5 stable or Phase 6 hotfix mode

STEP 5: Resume (next day)
├─ Address root cause (2-3 hour investigation)
├─ Re-implement with fix
└─ Re-test before gate
```

**Total Rollback Time**: 60 minutes (no data loss, back to Phase 5 state)

### Tier 2 Rollback (if API consolidation breaks)

```
STEP 1: Revert api.js (5 min)
├─ Restore old api.js + sourcingAPI.js
├─ Revert component imports
└─ No data changes

STEP 2: Redeploy (5 min)
└─ Frontend rebuild + deploy to Vercel

STEP 3: Validation (5 min)
└─ Verify all flows working

Total: 15 minutes downtime
```

---

## Success Definition

### Phase 6 Complete When:

```
✅ Tier 1 Gate PASS
   ├─ STORY-601: JWT rotation verified
   ├─ STORY-602: Legacy RLS enabled + tested
   ├─ STORY-603: Redis cache live (>80% hit rate)
   ├─ Load test: 100 concurrent, p95 <300ms
   └─ All acceptance criteria met

✅ Tier 2 Gate PASS
   ├─ STORY-604: API consolidation complete
   ├─ STORY-606: Monitoring dashboard live
   ├─ Zero regression on existing features
   └─ All acceptance criteria met

✅ Production Deployment
   ├─ All code reviewed + merged
   ├─ Full regression test suite passing
   ├─ Monitoring active + alerting configured
   └─ Team trained on new features

✅ Post-Deployment (Week 3+)
   ├─ Monitor /api/metrics daily
   ├─ Check error rates (0 spikes)
   ├─ Gather production feedback
   └─ Plan Phase 7 (UUID migration or new features)
```

---

## Document Status

```
Created: 2026-03-28
Version: 1.0.0
Status: Ready for Kickoff
Next Update: After Phase 6 Week 1 Standup
```

---

**Prepared by**: @sm (River - Scrum Master)
**For**: dealer-sourcing MVP team
**Phase**: Phase 6 Sprint Planning

---
