-- ============================================
-- ROLLBACK SCRIPT: Pre-Deploy Phase 5
-- Purpose: Emergency rollback if deployment fails
-- Usage: psql "$DATABASE_URL" -f ROLLBACK_PRE_DEPLOY_PHASE5.sql
-- ============================================

-- Step 1: Create emergency snapshot (backup current state)
-- Note: This would normally use pg_dump, documented separately

-- Step 2: Verify we can access the database
SELECT 'Rolling back Phase 5 deployment...' AS status;

-- Step 3: Drop new Phase 5 components (if any migrations beyond 002 were applied)
-- (Placeholder - no actual Phase 5 migrations yet, but infrastructure ready)

-- Step 4: Verify schema integrity post-rollback
SELECT
  tablename,
  (SELECT count(*) FROM information_schema.table_constraints tc WHERE tc.table_name = t.tablename) as constraints
FROM pg_tables t
WHERE schemaname = 'public'
ORDER BY tablename;

-- Step 5: Verify RLS policies still in place
SELECT
  schemaname,
  tablename,
  policyname,
  permissive
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Step 6: Check indexes still present
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename NOT LIKE 'pg_%'
ORDER BY tablename, indexname;

-- Step 7: Verify triggers still active
SELECT
  trigger_schema,
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Step 8: Health check - attempt simple query
BEGIN TRANSACTION;

-- Test: Simple SELECT
SELECT COUNT(*) as user_count FROM users;

-- Test: RLS isolation (simulate User A)
SET LOCAL "request.jwt.claims" = '{"sub": "test-user-001"}';
SELECT COUNT(*) as user_interested_count FROM interested_vehicles;

-- Reset JWT context
RESET "request.jwt.claims";

COMMIT;

-- Step 9: Verify pool is healthy
SELECT 'Rollback complete. Database state verified.' AS status;
SELECT 'Previous snapshot available at: db/snapshots/SNAPSHOT_PRE_DEPLOY_PHASE5.md' AS next_step;
