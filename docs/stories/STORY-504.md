# STORY-504: Unify Database Schema - UUID vs INTEGER Keys

**Phase**: Phase 5+
**Assignee**: @data-engineer
**Story Points**: 13
**Priority**: LOW
**Status**: Ready for Development
**Gate**: Tracked as LOW-002 in Phase 4 QA Review

---

## Summary

Dual schema problem: 6 tables use UUID primary keys (modern, secure), 4 tables use INTEGER foreign keys (legacy, incompatible). This creates confusion and limits horizontal scaling. Phase 5+ needs unified schema strategy.

## Current State
- **UUID tables**: users, vehicles_cache, interested_vehicles, search_queries, vehicle_validations, migrations
- **INTEGER tables**: inventory, customers, expenses, transactions (these use integer FKs to vehicles)

## Acceptance Criteria

- [ ] **AC-1**: All tables migrated to UUID primary keys
- [ ] **AC-2**: Foreign key relationships consistent
- [ ] **AC-3**: Zero-downtime migration with rollback plan
- [ ] **AC-4**: Application code updated for new schema
- [ ] **AC-5**: RLS policies still functional post-migration

## Tasks

### Task 1: Plan migration strategy
- Decide: migrate all to UUID or revert to INTEGER?
- **Recommendation**: Migrate to UUID for security + consistency
- Plan rollback sequence
- Identify breaking changes

**Effort**: 2 hours

### Task 2: Create migration script (INTEGER → UUID)
```sql
-- Phase 1: Create UUID columns
ALTER TABLE inventory ADD COLUMN id_uuid UUID DEFAULT gen_random_uuid();
-- Phase 2: Migrate data
UPDATE inventory SET id_uuid = gen_random_uuid();
-- Phase 3: Drop old, rename new
ALTER TABLE inventory DROP CONSTRAINT inventory_pkey;
ALTER TABLE inventory DROP COLUMN id;
ALTER TABLE inventory RENAME COLUMN id_uuid TO id;
ALTER TABLE inventory ADD PRIMARY KEY (id);
```

**Location**: `db/migrations/003_unify-schema-uuid.sql`
**Effort**: 2 hours

### Task 3: Update application code
- Update all queries referencing id columns
- Verify ORMs/query builders handle UUID
- Update seed data

**Location**: `src/routes/*.js`, `src/models/*.js`
**Effort**: 3 hours

### Task 4: Update RLS policies for UUID
- Ensure policies work with UUID comparison
- Test user isolation post-migration

**Location**: `db/migrations/003_unify-schema-uuid.sql` (RLS section)
**Effort**: 1 hour

### Task 5: Migration dry-run & validation
- Test on staging with real data
- Measure downtime
- Validate all queries still work
- Document rollback procedure

**Effort**: 2 hours

## Dependencies

- Must have rollback plan (critical data)
- Requires maintenance window or zero-downtime strategy
- All queries must be validated post-migration

## Definition of Done

✅ All tables use UUID primary keys
✅ Foreign key relationships intact
✅ RLS policies verified
✅ No query breakage
✅ Rollback plan documented

## Risks

- Large tables (if any) may cause downtime
- Application query changes could introduce bugs
- Need comprehensive testing post-migration

## Notes

- UUID adds ~16 bytes per row (not significant)
- Benefits: security (no sequential IDs), distributed systems compatibility
- If reverting to INTEGER: need justification (rarely recommended)
- Consider ULID as alternative (sortable UUID)

---

**Created By**: @aios-master (Orion)
**Date**: 2026-03-28
**Target Phase**: Phase 5+
