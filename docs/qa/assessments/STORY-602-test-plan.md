# STORY-602: Integration Test Plan

**Agente:** @qa (Quinn)
**Fase:** Phase 2 - Integration Tests
**Data:** 2026-03-29
**Status:** Planning (awaiting test data from user)

---

## Test Strategy

### Scope
- RLS policies enforcement with real JWT auth
- Dealership-based data isolation
- Performance with dealership_id indexes
- Backward compatibility with existing queries

### Out of Scope
- Frontend UI testing (STORY-700)
- Load testing (STORY-701)
- Disaster recovery (STORY-702)

---

## Test Design: Given-When-Then

### Test Suite 1: RLS Isolation

#### TC1.1: User reads only own dealership's data
```gherkin
Given: User A logged into Dealership A
When:  User A queries interested_vehicles
Then:  Only records with dealership_id = Dealership A returned
```

#### TC1.2: User cannot read other dealership's data
```gherkin
Given: User A (Dealership A) and User B (Dealership B) both logged in
When:  User A attempts to query interested_vehicles
Then:  RLS blocks Dealership B records (returns 0)
```

#### TC1.3: User cannot write to other dealership
```gherkin
Given: User A (Dealership A) authenticated
When:  User A attempts INSERT into interested_vehicles with dealership_id = Dealership B
Then:  RLS policy rejects INSERT (403/permission denied)
```

#### TC1.4: User cannot update other dealership's record
```gherkin
Given: User A (Dealership A) and record R owned by Dealership B
When:  User A attempts UPDATE on record R
Then:  RLS policy rejects UPDATE (0 rows affected)
```

---

### Test Suite 2: Multiple Dealerships

#### TC2.1: Dealership A operations don't affect B
```gherkin
Given: Dealership A with 10 interested_vehicles, Dealership B with 5
When:  User A creates new interested_vehicle
Then:  Dealership A has 11, Dealership B still has 5
```

#### TC2.2: Search queries isolation
```gherkin
Given: User A (Dealership A) and User B (Dealership B)
When:  User A executes search, User B executes search
Then:  Each user only sees their dealership's search_queries
```

#### TC2.3: Validation scores don't leak
```gherkin
Given: Admin at Dealership A validates vehicle score = 95
When:  User at Dealership B queries vehicles_cache
Then:  Validation score visible (cache is shared) but user knows data is shared
```

---

### Test Suite 3: Performance

#### TC3.1: Queries with dealership_id index use index
```gherkin
Given: 50K interested_vehicles across 5 dealerships
When:  Query: SELECT * FROM interested_vehicles WHERE dealership_id = $1
Then:  EXPLAIN shows index scan (not seq scan)
And:   Query time < 50ms
```

#### TC3.2: Composite index effective
```gherkin
Given: Index on (dealership_id, status)
When:  Query: SELECT * FROM interested_vehicles WHERE dealership_id = $1 AND status = $2
Then:  EXPLAIN shows index bitmap scan or index scan
And:   Query time < 100ms
```

#### TC3.3: Foreign key lookups performant
```gherkin
Given: Dealership lookups on user access
When:  100 concurrent queries with dealership_id filtering
Then:  p95 latency < 200ms
```

---

### Test Suite 4: Data Integrity

#### TC4.1: Foreign key constraint enforced
```gherkin
Given: dealership_id column has FK to dealerships(id)
When:  Attempt INSERT with non-existent dealership_id
Then:  Database rejects with FK constraint error
```

#### TC4.2: User dealership_id cannot be null
```gherkin
Given: users table has NOT NULL on dealership_id
When:  Attempt INSERT user without dealership_id
Then:  Database rejects with NOT NULL constraint error
```

#### TC4.3: Trigger updates timestamps correctly
```gherkin
Given: New interested_vehicle record created
When:  Record is updated
Then:  updated_at timestamp changes automatically
```

---

### Test Suite 5: Backward Compatibility

#### TC5.1: Existing queries still work
```gherkin
Given: App code using old query patterns (without dealership filter)
When:  Query executed
Then:  RLS automatically restricts results (no app changes needed)
```

#### TC5.2: NULL dealership_id handled gracefully
```gherkin
Given: Edge case: record with NULL dealership_id (shouldn't happen, but...)
When:  User queries
Then:  Record excluded from results (RLS)
```

---

## Acceptance Criteria Traceability

| AC | Test Case(s) | Status |
|----|--------------|--------|
| AC1: Dealership isolation via RLS | TC1.1, TC1.2, TC1.3, TC1.4 | 🔴 Pending |
| AC2: No data leakage | TC2.1, TC2.2, TC2.3 | 🔴 Pending |
| AC3: Performance with indexes | TC3.1, TC3.2, TC3.3 | 🔴 Pending |
| AC4: Data integrity constraints | TC4.1, TC4.2, TC4.3 | 🔴 Pending |
| AC5: Backward compatible | TC5.1, TC5.2 | 🔴 Pending |

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| RLS policy doesn't work with JWT | Medium | Critical | Test with real JWT auth, not mock |
| Performance regression on queries | Low | High | Run EXPLAIN ANALYZE on 10+ queries |
| ForeignKey breaks existing records | Low | Critical | Validate FK integrity before/after migration |
| Cross-dealership data visible | Low | Critical | Penetration test with 2 simultaneous users |
| Migration fails mid-execution | Low | High | Test idempotence (run 2x) |

---

## NFR Validation

### Security
- [ ] No cross-dealership data leakage
- [ ] RLS policies cannot be bypassed via raw SQL
- [ ] ForeignKey constraints prevent orphaned records

### Performance
- [ ] Single-dealership queries < 100ms (50K records)
- [ ] Index usage verified with EXPLAIN ANALYZE
- [ ] No N+1 query patterns introduced

### Reliability
- [ ] Migration is idempotent (safe to run 2x)
- [ ] Rollback strategy defined (if needed)
- [ ] Triggers work correctly

### Maintainability
- [ ] RLS policies documented in code
- [ ] Index strategy documented
- [ ] Backfill logic clear (Loja A seed)

---

## Test Execution Checklist

- [ ] Setup: Create local database
- [ ] Setup: Apply migrations 001 + 002
- [ ] Setup: Insert test data (Dara's specific data)
- [ ] Run: `validate_dealership_rls.sql` script
- [ ] Run: Manual SQL tests (TC1.1-5.2)
- [ ] Run: EXPLAIN ANALYZE performance tests
- [ ] Run: JWT auth integration tests (if app available)
- [ ] Verify: No console errors in logs
- [ ] Document: Test results and evidence

---

## Success Criteria

✅ **PASS:** All 5 test suites pass + no performance regression
⚠️ **CONCERNS:** 1-2 issues found, medium severity (mitigated)
❌ **FAIL:** Critical issues preventing deployment
🔷 **WAIVED:** Issues accepted with explicit approval + timeline

---

## Next Steps

1. User provides test data (dealerships, users, vehicles)
2. @qa inserts test data into local database
3. Execute validation script
4. Run manual test cases (Given-When-Then)
5. Generate gate decision document

---

**Status:** Awaiting test data from user
**Estimated Duration:** Phase 2 = 2-4 hours (depending on data complexity)
