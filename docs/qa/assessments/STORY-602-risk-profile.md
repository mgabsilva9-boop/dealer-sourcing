# STORY-602: Risk Profile Assessment

**Agente:** @qa (Quinn)
**Data:** 2026-03-29
**Overall Risk Level:** 🔴 **HIGH** (RLS changes are critical path)

---

## Risk Matrix

### Critical Risks (Probability × Impact = Score)

| # | Risk | Probability | Impact | Score | Detection | Mitigation |
|---|------|------------|--------|-------|-----------|-----------|
| **R1** | RLS policy doesn't enforce dealership isolation | 🟡 30% | 🔴 Critical | **9/10** | JWT auth test with 2 users | Run TC1.2, TC1.3, TC2.1 |
| **R2** | Cross-dealership data visible via direct SQL | 🟠 40% | 🔴 Critical | **9/10** | Attempt unauthorized query | Test with raw SQL queries |
| **R3** | Migration breaks FK constraints mid-execution | 🟡 20% | 🔴 Critical | **6/10** | Test idempotence 2x | Rollback script ready |
| **R4** | Performance regression on multi-dealership queries | 🟡 25% | 🟠 High | **5/10** | EXPLAIN ANALYZE benchmark | Index usage verification |
| **R5** | Backfill assigns dealership_id incorrectly | 🟡 35% | 🟠 High | **7/10** | Verify backfill counts | Manual data inspection |

---

### High Risks

| # | Risk | Probability | Impact | Score | Detection | Mitigation |
|---|------|------------|--------|-------|-----------|-----------|
| **R6** | RLS policy subquery returns NULL (user error) | 🟡 30% | 🟠 High | **5/10** | Query audit | Default dealership fallback |
| **R7** | Triggers fail during UPDATE on dealership records | 🟡 25% | 🟠 High | **5/10** | Trigger test | Test CASCADE behavior |
| **R8** | JWT missing dealership_id in app_metadata | 🟠 40% | 🟠 High | **6/10** | JWT inspection | App-level validation |
| **R9** | Index size impacts backup/restore performance | 🟡 15% | 🟠 High | **3/10** | Monitor index size | Archive strategy |

---

### Medium Risks

| # | Risk | Probability | Impact | Score | Detection | Mitigation |
|---|------|------------|--------|-------|-----------|-----------|
| **R10** | Backward compatibility: old queries break | 🟢 15% | 🟠 High | **3/10** | Regression test suite | Transparent RLS (auto-filtered) |
| **R11** | NULL dealership_id in legacy data | 🟡 25% | 🟠 Medium | **4/10** | Data audit | Backfill + NOT NULL constraint |
| **R12** | Admin user can bypass RLS accidentally | 🟢 10% | 🟠 High | **2/10** | Admin permission test | RLS applies to ALL roles |
| **R13** | Migration schema mismatch with Supabase | 🟢 10% | 🟠 Medium | **2/10** | Apply in staging first | Supabase migration CLI |

---

## Risk Heatmap

```
CRITICAL (9-10):
  ▓▓ R1: RLS doesn't isolate  [TCP BLOCKER]
  ▓▓ R2: Data leakage SQL     [TCP BLOCKER]

HIGH (5-8):
  ▓  R3: Migration breaks FK  [needs testing]
  ▓  R5: Backfill wrong       [data validation]
  ▓  R4: Performance regress  [benchmark]
  ▓  R8: JWT missing field    [app integration]

MEDIUM (2-4):
  ▒  R6-R13: Other risks      [mitigated by tests]
```

---

## Detailed Risk Analysis

### R1: RLS Policy Doesn't Enforce Isolation 🔴

**Description:**
RLS policies were rewritten from user-based to dealership-based. If policy logic is wrong, User A could see User B's data from another dealership.

**Why This Matters:**
- This is a **security vulnerability** (data breach)
- Affects core multi-tenant model
- Silent failure (no error, just wrong data)

**Detection Method:**
```sql
-- Test: User A (Dealership A) tries to read User B (Dealership B) data
-- Expected: 0 rows returned (RLS blocks)
SELECT * FROM interested_vehicles
WHERE dealership_id = (SELECT id FROM dealerships WHERE name = 'Loja B');
-- Actual user's dealership_id = Dealership A
-- Result should be: 0 rows (RLS blocks cross-dealership access)
```

**Mitigation:**
1. ✅ Run TC1.2 (cross-dealership read test)
2. ✅ Test with real JWT auth (not mock)
3. ✅ Penetration test with 2 simultaneous users
4. ✅ SQL audit logs reviewed

---

### R2: Cross-Dealership Data Visible via Direct SQL 🔴

**Description:**
If app bypasses ORM and uses raw SQL without RLS consideration, data could leak.

**Example Attack:**
```sql
-- Malicious query bypassing RLS filter
SELECT * FROM interested_vehicles
WHERE dealership_id = 'other-dealership-uuid'
AND user_id = auth.uid();
-- If auth.uid() belongs to Dealership A but dealership_id filter is ignored...
```

**Mitigation:**
1. ✅ RLS applies to **ALL** queries (ORM, raw SQL, even stored procs)
2. ✅ Test with raw SQL directly
3. ✅ Verify RLS enabled at table level: `SELECT * FROM pg_tables WHERE tablename = 'interested_vehicles' AND rowsecurity = true;`

---

### R3: Migration Breaks FK Constraints 🟠

**Description:**
Migration adds FK references to `dealerships` table. If:
- `dealerships` table doesn't exist
- Backfill produces NULL dealership_id
- FK cascade DELETE has unexpected behavior

**Mitigation:**
1. ✅ Test idempotence (run migration 2x, should pass both times)
2. ✅ Verify FK constraint: `SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = 'users' AND constraint_type = 'FOREIGN KEY';`
3. ✅ Test CASCADE behavior: Delete dealership → what happens to users?

---

### R5: Backfill Assigns dealership_id Incorrectly 🟠

**Description:**
Migration backfills existing users/records to Dealership A. If:
- Dealership A UUID is fetched incorrectly
- Not all records get dealership_id
- Multiple dealerships exist already (wrong assignment)

**Detection:**
```sql
-- Count backfilled records
SELECT dealership_id, COUNT(*)
FROM users
GROUP BY dealership_id;

-- Expected: All existing users assigned to ONE dealership (Loja A)
-- If split across multiple: backfill is wrong
```

**Mitigation:**
1. ✅ Count records before/after migration
2. ✅ Verify all records have dealership_id (no NULLs)
3. ✅ Manual inspection of sample records

---

### R4: Performance Regression 🟡

**Description:**
New indexes + FK lookups could slow queries if not used correctly.

**Queries to Benchmark:**
```sql
-- Query 1: Simple dealership filter
SELECT COUNT(*) FROM interested_vehicles
WHERE dealership_id = $1;  -- Should use index

-- Query 2: Dealership + status filter
SELECT * FROM interested_vehicles
WHERE dealership_id = $1 AND status = 'interested';  -- Should use composite index

-- Query 3: JOIN with FK lookup
SELECT iv.* FROM interested_vehicles iv
JOIN users u ON iv.user_id = u.id
WHERE u.dealership_id = $1;  -- Should use indexes on both sides
```

**Acceptance Criteria:**
- p50 latency < 50ms (50K records)
- p95 latency < 100ms
- Index usage confirmed (no seq scans)

---

## Test Phases by Risk Level

### Phase 2A: Critical Risk Mitigation (before integration tests)
1. ✅ Validate migration syntax (Dara completed)
2. ✅ Check RLS policies are present in SQL file
3. ✅ Verify FK constraints defined

### Phase 2B: Integration Tests (this phase)
1. ⏳ Execute on local database
2. ⏳ Test R1, R2, R3, R5 (critical risks)
3. ⏳ Benchmark R4 (performance)

### Phase 2C: Smoke Tests (before production)
1. ⏳ Test on staging database
2. ⏳ Simulate real JWT auth
3. ⏳ Multi-user concurrent access

---

## Risk Decision Matrix

### If R1 or R2 Fails (RLS doesn't work)
- **Gate Decision:** ❌ **FAIL**
- **Action:** Return to @data-engineer, rewrite RLS policies
- **Cannot Proceed Until:** RLS proven to work

### If R3 Fails (Migration breaks)
- **Gate Decision:** ❌ **FAIL**
- **Action:** Debug migration SQL, test rollback
- **Cannot Proceed Until:** Migration runs cleanly 2x

### If R4 Fails (Performance < 100ms p95)
- **Gate Decision:** ⚠️ **CONCERNS** (unless query >> 100ms)
- **Action:** Add index, rerun EXPLAIN ANALYZE
- **Can Proceed With:** Performance issue tracked + 7-day deadline

### If R5 Fails (Backfill wrong)
- **Gate Decision:** ❌ **FAIL**
- **Action:** Correct backfill logic, verify all records
- **Cannot Proceed Until:** All records verified

---

## Evidence Collection Checklist

- [ ] Migration runs successfully on local database
- [ ] Idempotence verified (run 2x, no errors)
- [ ] TC1.1-1.4 tests PASS (RLS isolation)
- [ ] TC2.1-2.3 tests PASS (multi-dealership)
- [ ] TC3.1-3.3 EXPLAIN ANALYZE results documented
- [ ] TC4.1-4.3 constraint tests PASS
- [ ] TC5.1-5.2 backward compatibility verified
- [ ] No console/log errors during tests
- [ ] Performance benchmarks recorded

---

## Risk Sign-Off

| Risk | Owner | Status | Evidence |
|------|-------|--------|----------|
| R1-R2 (RLS) | @data-engineer + @qa | ⏳ Testing | Will attach test results |
| R3 (Migration) | @qa | ⏳ Testing | Idempotence test log |
| R4 (Performance) | @qa | ⏳ Testing | EXPLAIN output |
| R5 (Backfill) | @qa | ⏳ Testing | Record count verification |

**Final Gate Decision:** Awaiting test results

---

**Next:** Insert test data → Run tests → Document results

-- Quinn, analisando riscos 🛡️
