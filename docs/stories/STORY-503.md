# STORY-503: Neon PostgreSQL Integration - Connect Vercel to Database

**Phase**: Phase 5
**Assignee**: @data-engineer
**Story Points**: 5
**Priority**: CRITICAL
**Status**: Ready for Development
**Gate**: Infrastructure blocking all API operations

---

## Summary

Vercel serverless deployment requires managed PostgreSQL database. Phase 5 MVP pivoted from Render to Vercel full-stack architecture. Neon PostgreSQL provides serverless Postgres with RLS support. This story connects Vercel API routes to Neon database with proper schema, migrations, and RLS policies.

## Acceptance Criteria

- [ ] **AC-1**: Neon project created (us-east-1 region, PostgreSQL 15)
- [ ] **AC-2**: CONNECTION_STRING obtained and added to Vercel environment variables
- [ ] **AC-3**: Database schema initialized (interested_vehicles, search_queries tables)
- [ ] **AC-4**: RLS policies enabled and verified for user isolation
- [ ] **AC-5**: Connection pool configured and tested from Vercel serverless functions
- [ ] **AC-6**: /api/health endpoint returns 200 OK with database connectivity confirmed

## Tasks

### Task 1: Create Neon PostgreSQL Project
1. Go to https://neon.tech
2. Sign in with GitHub
3. Create project: `dealer-sourcing-db`
4. Region: `us-east-1`
5. PostgreSQL version: `15`
6. Copy CONNECTION_STRING

**Location**: Neon dashboard
**Effort**: 5 min

### Task 2: Add DATABASE_URL to Vercel Environment Variables
1. Log into Vercel dashboard
2. Select `dealer-sourcing` project
3. Settings → Environment Variables
4. Add `DATABASE_URL = [paste-neon-connection-string]`
5. Trigger redeployment (automatic)

**Location**: Vercel dashboard
**Effort**: 3 min

### Task 3: Initialize Database Schema
Execute in Neon SQL Editor:

```sql
CREATE TABLE interested_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  vehicle_id TEXT NOT NULL,
  vehicle_data JSONB,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'interested',
  saved_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, vehicle_id)
);

CREATE TABLE search_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  query_params JSONB,
  results_count INTEGER,
  searched_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE interested_vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_isolation ON interested_vehicles
  FOR ALL
  USING (user_id = current_setting('app.current_user_id')::UUID)
  WITH CHECK (user_id = current_setting('app.current_user_id')::UUID);

CREATE INDEX idx_interested_vehicles_user_id ON interested_vehicles(user_id);
CREATE INDEX idx_search_queries_user_id ON search_queries(user_id);
```

**Location**: Neon SQL Editor
**Effort**: 10 min

## Dependencies

- Vercel full-stack deployment (in progress)
- JWT auth middleware in place (STORY-501)

## Definition of Done

✅ Neon project created and accessible
✅ DATABASE_URL in Vercel environment variables
✅ Schema created with RLS policies
✅ /api/health endpoint shows database connected
✅ RLS isolation verified with test data

## Risk Assessment

**Risk Level**: MEDIUM
- Critical for MVP (blocks all data operations)
- RLS requires careful testing

---

**Created By**: @sm (River)
**Date**: 2026-03-28
**Target Phase**: Phase 5
