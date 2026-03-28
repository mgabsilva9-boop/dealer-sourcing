# STORY-501: JWT Implementation - Extract User ID from Claims

**Phase**: Phase 5
**Assignee**: @dev
**Story Points**: 3
**Priority**: MEDIUM
**Status**: Ready for Development
**Gate**: Tracked as MED-001 in Phase 4 QA Review

---

## Summary

Replace hardcoded test UUID with actual JWT token parsing. Currently all requests route through a single test user `550e8400-e29b-41d4-a716-446655440000`. Phase 5 requires extracting real user IDs from JWT claims for true multi-tenant isolation.

## Acceptance Criteria

- [ ] **AC-1**: Extract user ID from JWT claims (`sub` or `user_id`) in auth middleware
- [ ] **AC-2**: All sourcing endpoints route requests to actual authenticated user (not hardcoded)
- [ ] **AC-3**: Tests pass with multiple user IDs
- [ ] **AC-4**: RLS isolation verified with at least 2 different user accounts
- [ ] **AC-5**: Integration tests updated to generate valid JWT tokens

## Tasks

### Task 1: Modify auth middleware to extract userId from JWT
```javascript
// Current: hardcoded
const userId = '550e8400-e29b-41d4-a716-446655440000';

// Target:
const token = req.headers.authorization?.split(' ')[1];
const decoded = jwt.verify(token, process.env.JWT_SECRET);
const userId = decoded.sub || decoded.user_id;
req.user.id = userId;
```

**Location**: `src/middleware/auth.js:15-25`
**Effort**: 30 min

### Task 2: Update sourcing.js to use req.user.id instead of hardcoded UUID
- Replace all `'550e8400-e29b-41d4-a716-446655440000'` with `req.user.id`
- Verify 5 endpoints affected: GET /list, /search, /:id, POST /interested, GET /favorites

**Location**: `src/routes/sourcing.js` (multiple lines)
**Effort**: 20 min

### Task 3: Update database.js getCurrentUserId()
- Remove hardcoded UUID
- Receive userId from middleware (req.user.id)
- Update all query calls to pass actual user context

**Location**: `src/config/database.js:32-36`
**Effort**: 15 min

### Task 4: Update integration tests with JWT generation
- Create helper function to generate valid JWT tokens with different user IDs
- Add test cases for multiple users
- Verify RLS isolation with 2+ users querying same data

**Location**: `test/integration/sourcing.test.js`
**Effort**: 45 min

### Task 5: Manual QA - RLS Isolation Verification
- Create 2 test users in database
- User A marks vehicle as interested
- User B queries /favorites → should NOT see User A's interests
- User B marks same vehicle → both have 1 record in interested_vehicles

**Effort**: 15 min

## Dependencies

- Phase 4 must be complete (JWT infrastructure in place)
- PostgreSQL RLS policies must be functioning (verified in Phase 4)

## Definition of Done

✅ Code follows project patterns
✅ All 40 integration tests pass
✅ New tests cover multi-user scenarios
✅ RLS isolation validated with different users
✅ Code reviewed by @qa
✅ No hardcoded UUIDs remain

## Notes

- This is a **critical security fix** - moves from single-tenant to true multi-tenant
- JWT extraction is simple (1-2 lines), most effort is in testing
- Post-implementation: consider adding middleware to validate JWT structure
- Future: implement refresh token rotation (Phase 5+)

---

**Created By**: @aios-master (Orion)
**Date**: 2026-03-28
**Target Phase**: Phase 5
