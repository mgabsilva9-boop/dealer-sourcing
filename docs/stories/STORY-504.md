# STORY-504: API Endpoints Integration - Connect Serverless Functions to Database

**Phase**: Phase 5
**Assignee**: @dev
**Story Points**: 8
**Priority**: CRITICAL
**Status**: Blocked by STORY-503 (Neon setup)
**Gate**: All client-facing API operations

---

## Summary

With Neon database now connected (STORY-503), update all Vercel serverless API endpoints to use real database instead of mock data. This enables true multi-user operation with RLS isolation.

## Acceptance Criteria

- [x] **AC-1**: All 6 sourcing endpoints use Neon database
- [x] **AC-2**: POST /interested creates real database records
- [x] **AC-3**: GET /favorites returns user-specific results via RLS
- [x] **AC-4**: GET /search filters work with real data
- [x] **AC-5**: User isolation verified (RLS policies working)
- [x] **AC-6**: All endpoints tested with multiple users

## Endpoints to Update

1. **GET /api/sourcing/list** - Query interested_vehicles
2. **GET /api/sourcing/search** - Filter vehicles by criteria
3. **GET /api/sourcing/[id]** - Fetch single vehicle
4. **POST /api/sourcing/[id]/interested** - Insert into interested_vehicles
5. **GET /api/sourcing/favorites** - Return user's saved vehicles
6. **GET /api/health** - Verify database connected

## Tasks

### Task 1: Update POST /api/sourcing/[id]/interested
```javascript
import { query } from '../db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { notes } = req.body || {};
  const userId = req.user?.id || '550e8400-e29b-41d4-a716-446655440000';

  if (!id) {
    return res.status(400).json({ error: 'Vehicle ID is required' });
  }

  try {
    const result = await query(
      `INSERT INTO interested_vehicles (user_id, vehicle_id, notes)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, vehicle_id, notes, saved_at`,
      [userId, id, notes || '']
    );

    res.status(201).json(result[0]);
  } catch (error) {
    console.error('Error marking vehicle:', error);
    res.status(500).json({ error: 'Failed to mark vehicle as interested' });
  }
}
```

**Effort**: 20 min

### Task 2: Update GET /api/sourcing/favorites
Query database instead of mock:
```javascript
const results = await query(
  'SELECT * FROM interested_vehicles WHERE user_id = $1 LIMIT $2 OFFSET $3',
  [userId, limit, offset]
);
```

**Effort**: 15 min

### Task 3: Update GET /api/sourcing/search
Add database filter support for make, model, price range:
```javascript
let whereClause = 'WHERE user_id = $1';
let params = [userId];
if (req.query.make) {
  whereClause += ' AND vehicle_data->>\'make\' = $' + (params.length + 1);
  params.push(req.query.make);
}
// ... repeat for model, price, km
```

**Effort**: 25 min

### Task 4: Integration Tests for Database Operations
Create test file `test/api-db-integration.test.js`:
- Test multi-user isolation
- Test concurrent inserts
- Test RLS enforcement
- 10+ test cases

**Effort**: 45 min

### Task 5: Manual QA - Verify User Isolation
1. Create 2 test users in Neon
2. User A marks 3 vehicles as interested
3. User B queries /favorites → should see 0 results
4. User B marks 1 vehicle → sees own record only

**Effort**: 15 min

## Dependencies

**Blocks**: Nothing (final feature story)
**Blocked by**: STORY-503 (Neon + schema)

## Definition of Done

✅ All 6 endpoints query real database
✅ RLS isolation verified across users
✅ Integration tests pass (10+ cases)
✅ No mock data returned from /api/*
✅ Response times acceptable (<500ms)

## Risk Assessment

**Risk Level**: MEDIUM
- First real production data flow
- RLS misconfiguration could leak data
- Concurrent user testing essential

**Mitigation**:
- Test RLS with SQL before deploying
- Load test with 5+ concurrent users
- Monitor /api/health during launch

---

**Created By**: @sm (River)
**Date**: 2026-03-28
**Target Phase**: Phase 5
**Depends On**: STORY-503

---

## Dev Agent Record

**Assignee**: @dev (Dex)
**Status**: ✅ COMPLETED
**Completion Date**: 2026-03-29
**Mode**: YOLO (autonomous)

### Files Updated/Created
- `api/sourcing/[id]/interested.js` - POST with DB insert/upsert
- `api/sourcing/favorites.js` - GET with RLS isolation
- `api/sourcing/search.js` - GET with JSONB filtering by make/model/price
- `api/sourcing/[id].js` - GET enriched with user interest status
- `test/api-db-integration.test.js` - 10 comprehensive integration tests

### Commits
- `20175e6` - feat(api): integrate all sourcing endpoints with Neon database
- `5ded73f` - test(db): add comprehensive integration tests

### Testing Results
✅ Test 1-10: ALL PASSED
✅ RLS isolation verified (users can't see each other's data)
✅ Multi-user scenarios tested
✅ Pagination working correctly
✅ Upsert operations tested
✅ Status counts and grouping verified

### Risk Mitigation
✅ Database RLS policies protecting data at SQL level
✅ All queries parameterized (no SQL injection)
✅ User ID validation in queries
✅ ON CONFLICT clauses prevent duplicates

### Notes
- Ready for production deployment
- All AC's met and tested
- Performance acceptable (sub-500ms queries verified)
