# Phase 6 Stories - Quick Reference Card

**Print this. Post it on your desk.** ✨

---

## All 7 Stories at a Glance

### Tier 1: Critical Path (Week 1-2, 16 pts)

| ID | Title | Owner | Effort | Duration | Status |
|----|-------|-------|--------|----------|--------|
| **601** | JWT Secret Rotation | @dev | 5pts | 3-4h | 🟢 Ready |
| **602** | Legacy Table RLS | @data-engineer | 3pts | 1.5-2h | 🟢 Ready |
| **603** | Redis Caching | @dev + @data-eng | 8pts | 4-5h | 🟢 Ready |

### Tier 2: Polish (Week 2-3, 10 pts)

| ID | Title | Owner | Effort | Duration | Status |
|----|-------|-------|--------|----------|--------|
| **604** | API Client Consolidation | @dev | 5pts | 2-3h | 🟢 Ready |
| **606** | Monitoring Dashboard | @devops | 5pts | 3-4h | 🟢 Ready |

### Tier 3: Deferred (16 pts)

| ID | Title | Owner | Effort | Duration | Status |
|----|-------|-------|--------|----------|--------|
| **605** | Schema UUID Migration | @data-engineer | 13pts | 8-10h | 📋 Phase 7+ |
| **607** | Error Handling Framework | @dev | 3pts | 2h | 📋 Phase 7+ |

---

## Acceptance Criteria by Story

### STORY-601: JWT Secret Rotation (5 pts)

```
✅ Support multiple active JWT secrets (current + previous)
✅ New tokens signed with current version
✅ Old tokens verify against all active versions
✅ Secret version in JWT header (kid claim)
✅ JWKS endpoint working
✅ Backward compatibility: 30-day window
✅ Rotation procedure documented
✅ All tests passing
```

**Owner**: @dev | **Duration**: 3-4h | **Blocker**: No

---

### STORY-602: Legacy Table RLS (3 pts)

```
✅ RLS enabled on legacy_inventory
✅ RLS enabled on legacy_expenses
✅ RLS enabled on legacy_crm_data
✅ RLS enabled on legacy_history
✅ Multi-user isolation verified
✅ Zero data leakage
✅ Query performance OK
✅ All tests passing
```

**Owner**: @data-engineer | **Duration**: 1.5-2h | **Blocker**: No

---

### STORY-603: Redis Caching (8 pts)

```
✅ Redis connection working
✅ Cache strategy documented (keys, TTLs)
✅ Hotpaths cached (vehicle list, search)
✅ Cache invalidation working
✅ Fallback to DB if Redis down
✅ Hit rate >80% (measured)
✅ Load test: 100 concurrent, p95 <300ms
✅ Cost <$20/month estimate
```

**Owner**: @dev + @data-engineer | **Duration**: 4-5h | **Blocker**: No

---

### STORY-604: API Client Consolidation (5 pts)

```
✅ Unified apiClient.js created
✅ All endpoints use same client
✅ Consistent error handling
✅ Unified timeout (5s)
✅ Token management centralized
✅ All components updated
✅ Zero regression
✅ All tests passing
```

**Owner**: @dev | **Duration**: 2-3h | **Blocker**: No

---

### STORY-606: Monitoring Dashboard (5 pts)

```
✅ /dashboard/metrics accessible
✅ Real-time pool utilization graph
✅ Query latency (p50/p95/p99)
✅ Request rate graph
✅ Cache hit rate displayed
✅ Alert status (green/yellow/red)
✅ 24-hour history retained
✅ Mobile responsive
```

**Owner**: @devops | **Duration**: 3-4h | **Blocker**: No

---

## Week-by-Week Checklist

### Week 1

```
DAY 1 (Monday)
[ ] Phase 6 Kickoff (30 min)
[ ] STORY-601 starts (JWT)
[ ] STORY-602 starts (Legacy RLS)

DAY 3 (Wednesday)
[ ] STORY-601 COMPLETE
[ ] STORY-603 starts (Redis)

DAY 5 (Friday)
[ ] STORY-602 COMPLETE
[ ] STORY-603 in progress (load testing)
[ ] Week 1 Standup
```

### Week 2

```
DAY 6 (Monday)
[ ] STORY-603 final validation
[ ] STORY-604 starts (API)
[ ] STORY-606 starts (Monitoring)

DAY 8 (Wednesday)
[ ] STORY-603 COMPLETE
[ ] Tier 1 Gate validation
[ ] STORY-604 in progress
[ ] STORY-606 in progress

DAY 10 (Friday)
[ ] STORY-604 COMPLETE
[ ] STORY-606 COMPLETE
[ ] Tier 2 Gate validation
[ ] Week 2 Standup
[ ] All Tier 1 + Tier 2 COMPLETE ✅
```

---

## Gate Criteria

### Tier 1 Gate (End Week 1)

Must pass ALL of:

```
SECURITY
[ ] JWT rotation tested (old + new secrets work)
[ ] Legacy RLS enabled on 4 tables
[ ] Zero data leakage found

SCALABILITY
[ ] Redis cache hit rate >80%
[ ] Load test: 100 concurrent passing
[ ] p95 latency <300ms
[ ] Pool utilization <75% at peak

QUALITY
[ ] All tests passing
[ ] Zero critical issues
[ ] Code reviewed
```

### Tier 2 Gate (End Week 2)

Must pass ALL of:

```
CODE QUALITY
[ ] API consolidation: all components updated
[ ] Zero regression on existing flows
[ ] All tests passing

VISIBILITY
[ ] Monitoring dashboard live
[ ] All metrics displaying
[ ] Mobile responsive

DOCUMENTATION
[ ] API client guide written
[ ] Monitoring dashboard guide written
```

---

## Key Risks & Mitigations

| Story | Risk | Mitigation |
|-------|------|-----------|
| 601 | JWT breaks old tokens | 30-day compatibility window |
| 602 | RLS breaks legacy queries | Test in staging first |
| 603 | Redis bottleneck | Monitor hit rate, scale if needed |
| 604 | API consolidation breaks | Extensive regression tests |
| 606 | Dashboard slow | Cache queries, optimize |

---

## Key Files & Locations

### Story Details
- Full story descriptions: `PHASE-6-STORIES.md`
- Detailed acceptance criteria: `PHASE-6-STORIES.md` (each story)
- Task breakdowns: `PHASE-6-STORIES.md` (each story)

### Planning
- Priority & timeline: `PHASE-6-BACKLOG-PRIORITY.md`
- Team assignments: `PHASE-6-BACKLOG-PRIORITY.md`
- Risk register: `PHASE-6-BACKLOG-PRIORITY.md`

### Reference
- This card: `PHASE-6-QUICK-REFERENCE.md` (you are here)

### Phase 5 (Dependency Reference)
- Phase 5 summary: `PHASE-5-STRATEGY-SUMMARY.md`
- Security audit: `db/audits/SECURITY_AUDIT_PHASE5.md`
- Performance analysis: `db/audits/PERFORMANCE_ANALYSIS_PHASE5.md`
- QA review: `docs/qa/QA-REVIEW-PHASE-5.md`

---

## Communication Shortcuts

### Daily Standup
**Time**: 9:00 AM
**Format**: What done? What next? Blockers?
**Duration**: 15 min

### Weekly Status
**Time**: Friday 4:00 PM
**Format**: Points done, gate status, risks, next week
**Duration**: 30 min

### Blockers/Escalation
**To**: @pm (Morgan) + @architect (Aria)
**Include**: Story, blocker description, impact, proposed solution

---

## Effort Estimates (Fibonacci)

```
3 pts = 1.5 hours
5 pts = 2.5-3 hours
8 pts = 4-5 hours
13 pts = 8-10 hours
```

**Phase 6 Scope**:
- Tier 1: 16 pts (10-12 hours engineering)
- Tier 2: 10 pts (6-8 hours engineering)
- Tier 3 (deferred): 16 pts (10-12 hours engineering)

---

## Success Metrics (Measure These)

```
After Phase 6 Complete:

SECURITY ✅
└─ Zero security vulnerabilities (MED-001, LOW-001 fixed)

SCALABILITY ✅
└─ Support 100+ concurrent users
└─ p95 latency <300ms
└─ Cache hit rate >80%

CODE QUALITY ✅
└─ Unified API client (single import)
└─ Error handling consistent
└─ All tests passing (80%+ coverage)

VISIBILITY ✅
└─ Monitoring dashboard live
└─ Team can see pool utilization in real-time
└─ Alerts configured
```

---

## Recommended Reading

1. **Before Kickoff**:
   - `PHASE-6-STORIES.md` (all 7 stories detailed)
   - `PHASE-6-BACKLOG-PRIORITY.md` (timeline + assignments)

2. **During Phase 6**:
   - This card (quick reference)
   - Story details as needed
   - `PHASE-6-BACKLOG-PRIORITY.md` (risk/contingency)

3. **Gate Decisions**:
   - Story acceptance criteria (checklist)
   - Load test results
   - Security validation results

---

## Quick Commands

```bash
# View Phase 6 backlog
cat PHASE-6-STORIES.md

# View timeline & assignments
cat PHASE-6-BACKLOG-PRIORITY.md

# View this card
cat PHASE-6-QUICK-REFERENCE.md

# View Phase 5 security audit (for context)
cat db/audits/SECURITY_AUDIT_PHASE5.md

# View Phase 5 performance analysis (for context)
cat db/audits/PERFORMANCE_ANALYSIS_PHASE5.md
```

---

## Version Info

```
Created: 2026-03-28
Version: 1.0.0
Last Updated: 2026-03-28
Status: Ready for Kickoff
```

---

**Prepared by**: @sm (River - Scrum Master)
**For**: dealer-sourcing MVP team
**Phase**: Phase 6 Sprint Planning

Keep this handy. Share with your team. Update during execution.
