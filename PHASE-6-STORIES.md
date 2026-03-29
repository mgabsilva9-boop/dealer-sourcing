# Phase 6 Story Backlog - Tech Debt & Scalability

**Date**: 2026-03-28
**Prepared By**: @sm (River - Scrum Master)
**Status**: Ready for Backlog Refinement
**Total Effort**: 25 story points across 7 stories

---

## Executive Summary

Phase 5 is complete with 23 story points delivered. Security audit identified 4 low-risk items plus performance analysis revealed scaling requirements. Phase 6 prioritizes:

1. **Risk Mitigation** (Security + Performance)
2. **Scalability** (100+ concurrent users)
3. **Refactoring** (Code quality + maintainability)

### Phase 6 Priority Matrix

```
┌─────────────────────────────────────────┐
│ SECURITY (Top Priority)                 │
├─────────────────────────────────────────┤
│ STORY-601: JWT Secret Rotation (MED-001)│ 5pts
│ STORY-602: Legacy Table RLS (LOW-001)   │ 3pts
├─────────────────────────────────────────┤
│ PERFORMANCE (Scaling for 100+ users)    │
├─────────────────────────────────────────┤
│ STORY-603: Redis Caching (Performance)  │ 8pts
│ STORY-604: API Client Consolidation     │ 5pts
│ STORY-605: Schema UUID Migration (data) │ 13pts
├─────────────────────────────────────────┤
│ REFACTORING (Polish + Maintainability)  │
├─────────────────────────────────────────┤
│ STORY-606: Monitoring Dashboard (OPS)   │ 5pts
│ STORY-607: Error Handling Framework     │ 3pts
└─────────────────────────────────────────┘
```

**Recommended Phase 6 Scope**: STORY-601 + STORY-602 + STORY-603 (16 pts, ~2 weeks)

---

## STORY-601: JWT Secret Rotation Strategy

**Priority**: HIGH (Security - Risk Mitigation)
**Effort**: 5 story points
**Estimated Duration**: 3-4 hours
**Owner**: @dev + @devops
**Status**: Ready to Start

### Business Context

Currently, JWT_SECRET is a static environment variable. If compromised, all tokens become vulnerable. Industry best practice requires periodic rotation without invalidating existing tokens.

**Risk**: MED-001 (identified in Phase 5 security audit)
**Impact**: All JWT-protected endpoints vulnerable to key compromise
**Mitigation**: Implement versioned key rotation with zero downtime

### Acceptance Criteria

- [ ] AC-1: Support multiple active JWT secrets (current + previous)
- [ ] AC-2: New tokens signed with current secret version
- [ ] AC-3: Old tokens verify against previous secret versions
- [ ] AC-4: Secret version tracked in JWT header (kid claim)
- [ ] AC-5: Automatic rotation scheduled (monthly)
- [ ] AC-6: Rotation procedure documented (DBA + DevOps)
- [ ] AC-7: Backward compatibility: existing tokens valid for 30 days post-rotation
- [ ] AC-8: All endpoints use versioned JWT verification

### Task Breakdown

```
TASK-601-1: Design Rotation Strategy (30 min)
├─ JSON Web Key Set (JWKS) endpoint
├─ Key versioning scheme
├─ Rotation frequency (monthly)
└─ Backward compatibility window (30 days)

TASK-601-2: Implement Versioned JWT (1.5h)
├─ Create secrets manager module
│  ├─ Load multiple secrets from env
│  ├─ Track key versions
│  └─ Support kid (key ID) in JWT header
├─ Update middleware/auth.js
│  ├─ Sign tokens with current version
│  └─ Verify against all active versions
└─ Test all scenarios

TASK-601-3: JWKS Endpoint (45 min)
├─ GET /api/.well-known/jwks.json
├─ Returns public keys + versions
├─ Cache-friendly headers
└─ Integration tests

TASK-601-4: Rotation Procedure (30 min)
├─ Script: scripts/rotate-jwt-secret.js
├─ Update environment variables
├─ Redeploy without downtime
├─ Smoke test active/old tokens
└─ Document runbook for DevOps

TASK-601-5: Testing (1h)
├─ Unit tests: key versioning
├─ Integration tests: token rotation
├─ Load test: JWKS endpoint under 100+ concurrent
├─ Backward compatibility test (30-day window)
```

### Dependencies

- Phase 5 JWT implementation (STORY-501) must be complete
- Environment variable structure in place (DATABASE_URL pattern)

### Technical Notes

**Implementation Approach**:
```javascript
// Pseudo-code structure
const secrets = {
  current: process.env.JWT_SECRET_CURRENT,    // v2 (newest)
  previous: process.env.JWT_SECRET_PREVIOUS,  // v1 (30-day validity)
};

// Sign with current version
jwt.sign(payload, secrets.current, {
  keyid: 'v2',  // Include version in header
  expiresIn: '7d'
});

// Verify against all active versions
jwt.verify(token, secrets.current) ||
jwt.verify(token, secrets.previous)
```

### Risk Mitigation

| Risk | Probability | Mitigation |
|------|------------|-----------|
| Keys stored in env variables | Low | Use Render/Vercel secrets manager, document security |
| Rotation breaks active sessions | Low | 30-day backward compatibility window |
| JWKS endpoint becomes bottleneck | Low | Add caching headers, CDN friendly |

### Acceptance Criteria Checklist

- [ ] Secrets manager module created
- [ ] JWKS endpoint responding (GET /api/.well-known/jwks.json)
- [ ] Tokens verify with both current + previous secrets
- [ ] Rotation script tested in staging
- [ ] Documentation: docs/SECURITY-JWT-ROTATION.md
- [ ] All integration tests passing

---

## STORY-602: Legacy Table RLS Policies

**Priority**: HIGH (Security - Risk Mitigation)
**Effort**: 3 story points
**Estimated Duration**: 1.5-2 hours
**Owner**: @data-engineer
**Status**: Ready to Start

### Business Context

Phase 5 security audit identified 4 legacy tables without RLS policies:
- legacy_inventory
- legacy_expenses
- legacy_crm_data
- legacy_history

These tables are isolated from modern schema but should enforce RLS for data governance compliance.

**Risk**: LOW-001 (identified in security audit)
**Impact**: Legacy data not protected at database level
**Mitigation**: Add RLS policies to all legacy tables

### Acceptance Criteria

- [ ] AC-1: RLS enabled on legacy_inventory table
- [ ] AC-2: RLS enabled on legacy_expenses table
- [ ] AC-3: RLS enabled on legacy_crm_data table
- [ ] AC-4: RLS enabled on legacy_history table
- [ ] AC-5: All policies follow user_id isolation pattern
- [ ] AC-6: Policies tested with multi-user scenarios
- [ ] AC-7: Zero data leakage verified (users can't see others' data)
- [ ] AC-8: No performance regression on legacy table queries

### Task Breakdown

```
TASK-602-1: Analyze Legacy Tables (20 min)
├─ legacy_inventory: Check schema + PKs
├─ legacy_expenses: Check user relationship
├─ legacy_crm_data: Check ownership model
└─ legacy_history: Check audit column structure

TASK-602-2: RLS Policy Design (30 min)
├─ User isolation pattern (user_id or owner_id)
├─ Permissions matrix: SELECT/INSERT/UPDATE/DELETE
├─ Consistency with modern table policies
└─ Document policy rationale

TASK-602-3: Create Policies (45 min)
├─ legacy_inventory RLS
├─ legacy_expenses RLS
├─ legacy_crm_data RLS
└─ legacy_history RLS

TASK-602-4: Testing (25 min)
├─ Multi-user scenario tests
├─ Data isolation verification
├─ Query performance validation
└─ Integration test suite
```

### Dependencies

- Phase 5 RLS implementation (STORY-501) as reference
- Access to production-like test database with legacy data

### Technical Notes

**RLS Policy Template**:
```sql
-- Example for legacy_inventory
ALTER TABLE legacy_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_inventory"
  ON legacy_inventory FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "users_insert_own_inventory"
  ON legacy_inventory FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Similar for UPDATE, DELETE
```

### Risk Mitigation

| Risk | Probability | Mitigation |
|------|------------|-----------|
| Policy breaks existing queries | Medium | Test query performance first, migrate gradually |
| User relationship unclear | Low | Use Phase 5 schema audit as reference |
| Backward compatibility issue | Low | Legacy tables isolated, limited production usage |

### Acceptance Criteria Checklist

- [ ] RLS enabled on all 4 legacy tables
- [ ] Multi-user tests passing (2+ users isolated)
- [ ] Query performance baseline documented
- [ ] Security audit passing (0 data leakage)
- [ ] Documentation: docs/LEGACY-RLS-MIGRATION.md

---

## STORY-603: Redis Caching Layer for Scalability

**Priority**: MEDIUM (Performance - Scalability)
**Effort**: 8 story points
**Estimated Duration**: 4-5 hours
**Owner**: @dev + @data-engineer
**Status**: Ready to Start

### Business Context

Current in-memory cache is lost on server restart and not distributed. For 100+ concurrent users, need distributed caching layer to reduce database load and improve response times.

**From Phase 5 Analysis**:
- Current pool utilization: 40% average, 97%+ under 50 concurrent users
- Level 2 scaling (100+ users): Redis recommended
- In-memory cache hit rate: 85%+ (validation of ROI)

**Business Goal**: Support 100+ concurrent users with <300ms p95 latency

### Acceptance Criteria

- [ ] AC-1: Redis connection pool established
- [ ] AC-2: Cache key strategy documented (patterns + TTLs)
- [ ] AC-3: Hotpaths cached (vehicle list, search results)
- [ ] AC-4: Cache invalidation strategy implemented
- [ ] AC-5: Fallback to database if Redis unavailable
- [ ] AC-6: Hit rate tracked via metrics
- [ ] AC-7: Load test: 100 concurrent users, p95 <300ms
- [ ] AC-8: Cost analysis: Redis tier appropriate for traffic

### Task Breakdown

```
TASK-603-1: Redis Setup (45 min)
├─ Choose provider (Redis Cloud, Railway, upstash)
├─ Environment config: REDIS_URL
├─ Connection pooling strategy
├─ SSL/TLS verification
└─ Local development setup (Docker container)

TASK-603-2: Cache Layer Design (1h)
├─ Identify hotpaths (vehicle list, search, user favorites)
├─ Key strategy: vehicles:make:model:price_range:sort
├─ TTLs: 5min (search), 1h (vehicles), 24h (config)
├─ Invalidation triggers (on INSERT/UPDATE/DELETE)
└─ Cache-aside vs write-through pattern

TASK-603-3: Implement Caching (1.5h)
├─ Create lib/cache.js (Redis wrapper)
│  ├─ get(key) with fallback
│  ├─ set(key, value, ttl)
│  ├─ invalidate(pattern) for updates
│  └─ health check endpoint
├─ Update sourcing routes
│  ├─ GET /search → check cache first
│  ├─ GET /favorites → check cache first
│  └─ POST /interested → invalidate relevant keys
└─ Update vehicle routes
   ├─ GET /vehicles → check cache
   └─ POST /vehicles (admin) → invalidate

TASK-603-4: Metrics & Monitoring (45 min)
├─ Track cache hits/misses
├─ Add to /api/metrics endpoint
├─ Grafana dashboard (optional)
├─ Alert on high miss rate (>30% = tuning needed)

TASK-603-5: Testing (1.5h)
├─ Unit tests: cache get/set/invalidate
├─ Integration tests: with real Redis
├─ Fallback test: cache down, use DB
├─ Load test: 100 concurrent, measure hit rate + latency
├─ Cost analysis: estimate monthly spend
```

### Dependencies

- Redis provider account (paid or free tier)
- Phase 5 sourcing endpoints (STORY-504) as baseline
- Metrics endpoint (STORY-502) for monitoring

### Technical Notes

**Cache Strategy**:
```javascript
// Pattern: Cache aside with database fallback
async function getVehicles(make, model, filters) {
  const key = `vehicles:${make}:${model}:${hash(filters)}`;

  // Try cache first
  let result = await redis.get(key);
  if (result) {
    metrics.cache_hit++;
    return JSON.parse(result);
  }

  // Cache miss: fetch from DB
  metrics.cache_miss++;
  result = await db.query(makeQuery(filters));

  // Store in cache (5-min TTL)
  await redis.set(key, JSON.stringify(result), 'EX', 300);

  return result;
}

// Invalidation on updates
async function addInterested(userId, vehicleId) {
  await db.insert(...);

  // Clear related caches
  await redis.invalidate('interested:*');
  await redis.invalidate('user:*');
}
```

### Cost Analysis

| Provider | Free Tier | Paid | Notes |
|----------|-----------|------|-------|
| Redis Cloud | 30MB | $7/mo (100MB) | Easy setup, reliable |
| Railway | Included | Pay-as-you-go | Integrated with Render |
| Upstash | 10K ops/day | $0.2/100K ops | Serverless-friendly |

**Recommendation**: Redis Cloud $7/mo for simplicity (100MB handles 85%+ cache at current load)

### Risk Mitigation

| Risk | Probability | Mitigation |
|------|------------|-----------|
| Redis becomes bottleneck | Low | Monitor hit rate, scale tier if needed |
| Cache consistency issues | Medium | Aggressive invalidation, short TTLs |
| Network latency Redis | Low | Co-locate region with Render |
| Cost overruns | Low | Monitor operations, set alerts |

### Acceptance Criteria Checklist

- [ ] Redis connection working in staging
- [ ] Cache hit rate >80% (measured)
- [ ] Load test: 100 concurrent, p95 <300ms
- [ ] Fallback to DB if Redis down
- [ ] Metrics tracked in /api/metrics
- [ ] Cost analysis: <$20/mo estimate
- [ ] Documentation: docs/CACHING-STRATEGY.md

---

## STORY-604: API Client Consolidation

**Priority**: MEDIUM (Refactoring - Maintainability)
**Effort**: 5 story points
**Estimated Duration**: 2-3 hours
**Owner**: @dev + @ux-design-expert
**Status**: Ready to Start

### Business Context

Currently have two separate API clients (api.js + sourcingAPI.js) with inconsistent error handling, timeout strategies, and token management. Creates maintenance burden and increases bug surface.

**From Phase 5**: STORY-505 deferred to Phase 5+. Now consolidate into single client.

**Goal**: Single source of truth for all API communication

### Acceptance Criteria

- [ ] AC-1: Unified apiClient.js created
- [ ] AC-2: All endpoints use same client (sourcing, vehicles, search, auth)
- [ ] AC-3: Consistent error handling (try-catch patterns)
- [ ] AC-4: Unified timeout strategy (5s default, configurable)
- [ ] AC-5: localStorage key consistent (token_key, user_key)
- [ ] AC-6: Request/response logging for debugging
- [ ] AC-7: All App.jsx + component imports updated
- [ ] AC-8: Zero regression in existing functionality

### Task Breakdown

```
TASK-604-1: Audit Current Clients (30 min)
├─ api.js: Auth endpoints, error handling, retry logic
├─ sourcingAPI.js: Sourcing endpoints, token management
├─ Compare: timeout, headers, error patterns
└─ Document differences + consolidate approach

TASK-604-2: Design Unified Client (45 min)
├─ Base HTTP client (request/response interceptors)
├─ Error handling (network, auth, validation)
├─ Token injection (Bearer in headers)
├─ Timeout + retry strategy
├─ Request/response logging
└─ API endpoint registry (constants)

TASK-604-3: Implement apiClient.js (1h)
├─ Create src/lib/apiClient.js
├─ HTTP methods: get, post, put, delete
├─ Auth interceptor: token from localStorage
├─ Error handler: map to user-friendly messages
├─ Timeout: 5s default (configurable)
└─ Logger: console + error tracking

TASK-604-4: Migrate Components (45 min)
├─ App.jsx: replace api.js + sourcingAPI.js
├─ SourcingList.jsx: use unified client
├─ VehicleDetail.jsx: use unified client
├─ Profile.jsx: use unified client
├─ Search.jsx: use unified client
└─ Update all imports + test each component

TASK-604-5: Testing (45 min)
├─ Unit tests: apiClient methods
├─ Integration tests: auth flow
├─ Integration tests: sourcing flow
├─ Component tests: error handling
├─ Regression tests: all screens functional
```

### Dependencies

- Phase 5 JWT implementation (STORY-501) verified
- Current api.js + sourcingAPI.js working

### Technical Notes

**Unified Client Pattern**:
```javascript
// src/lib/apiClient.js
class APIClient {
  constructor(baseURL = process.env.REACT_APP_API_URL) {
    this.baseURL = baseURL;
    this.timeout = 5000;
  }

  async request(method, endpoint, data = null, config = {}) {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...config.headers,
    };

    try {
      const response = await fetch(
        `${this.baseURL}${endpoint}`,
        {
          method,
          headers,
          body: data ? JSON.stringify(data) : null,
          signal: AbortSignal.timeout(this.timeout),
        }
      );

      if (!response.ok) {
        throw new APIError(response.statusText, response.status);
      }

      return response.json();
    } catch (error) {
      logger.error(`${method} ${endpoint}`, error);
      throw error;
    }
  }

  get(endpoint, config) { return this.request('GET', endpoint, null, config); }
  post(endpoint, data, config) { return this.request('POST', endpoint, data, config); }
  // ... put, delete
}

export const apiClient = new APIClient();
```

### Risk Mitigation

| Risk | Probability | Mitigation |
|------|------------|-----------|
| Breaking change in endpoints | Low | Test each component after migration |
| Token handling regression | Medium | Extra tests on auth flow |
| Performance impact | Low | Same HTTP layer, should be neutral |

### Acceptance Criteria Checklist

- [ ] apiClient.js created and tested
- [ ] All App.jsx + components use unified client
- [ ] Error handling consistent across app
- [ ] All integration tests passing
- [ ] No regression in user flows
- [ ] Documentation: docs/API-CLIENT-USAGE.md

---

## STORY-605: Schema UUID Migration (Data Migration)

**Priority**: LOW (Refactoring - Technical Debt)
**Effort**: 13 story points
**Estimated Duration**: 8-10 hours (multi-day)
**Owner**: @data-engineer (Lead) + @dev (Support)
**Status**: Ready for Phase 6+ (post-scaling)

### Business Context

Legacy tables use SERIAL (INTEGER) primary keys while modern tables use UUID. This creates:
- Dual-schema maintenance burden
- Inconsistent ID patterns
- Potential for ID collision in future integrations

Phase 5 audit identified this as LOW priority (isolated from modern schema). Post-scaling (after 100+ users validated), consolidate to UUID-only schema.

**From Phase 5 Audit**:
- legacy_inventory: SERIAL
- legacy_expenses: SERIAL
- legacy_crm_data: SERIAL
- legacy_history: SERIAL

**Goal**: 100% UUID schema, zero dependencies on SERIAL

### Acceptance Criteria

- [ ] AC-1: Zero-downtime migration strategy documented
- [ ] AC-2: legacy_inventory migrated to UUID
- [ ] AC-3: legacy_expenses migrated to UUID
- [ ] AC-4: legacy_crm_data migrated to UUID
- [ ] AC-5: legacy_history migrated to UUID
- [ ] AC-6: All foreign keys updated (legacy + cross-schema)
- [ ] AC-7: Indexes rebuilt post-migration
- [ ] AC-8: Backward compatibility window (old IDs queryable for 30 days)
- [ ] AC-9: Rollback plan verified (tested in staging)
- [ ] AC-10: Zero data loss verified (row count before/after)

### Task Breakdown

```
TASK-605-1: Migration Design & Planning (1.5h)
├─ Analyze each legacy table
│  ├─ Row count, query patterns, FK relationships
│  └─ Downtime budget: 0 (production requirement)
├─ Design zero-downtime approach
│  ├─ Dual-write pattern (SERIAL + UUID)
│  ├─ Cutover strategy
│  └─ Rollback procedure
└─ Document migration runbook

TASK-605-2: Stage 1 - Prepare (2h, low risk)
├─ Create UUID columns (legacy_inventory_id_new)
├─ Populate from SERIAL (batch inserts, 10k rows at a time)
├─ Create indexes on new UUID columns
├─ Enable triggers for dual-write (SERIAL + UUID in sync)
└─ Test: old queries still work + new UUID columns populated

TASK-605-3: Stage 2 - Migrate (2h, medium risk)
├─ Swap primary key definitions
├─ Update application code to use UUID
├─ Gradual cutover: 10% → 50% → 100% traffic
├─ Monitor error rates, latency, connection pool
└─ If issues: rollback to SERIAL (documented procedure)

TASK-605-4: Stage 3 - Cleanup (1.5h, low risk)
├─ Drop old SERIAL columns (legacy columns renamed)
├─ Drop old indexes
├─ Update foreign keys (cross-schema + internal)
├─ Rebuild statistics
└─ Verify zero data loss

TASK-605-5: Testing (1.5h)
├─ Pre-migration: backup verification
├─ During migration: error rate monitoring
├─ Post-migration: query performance comparison
├─ Rollback test: restore from backup, validate
├─ Load test: 100 concurrent users on migrated schema

TASK-605-6: Documentation (30 min)
├─ Migration playbook: step-by-step
├─ Rollback procedure: tested + timed
├─ Impact analysis: application code changes
├─ Timeline: migration window + contingencies
```

### Dependencies

- STORY-602 (legacy table RLS) completed first
- STORY-603 (Redis caching) recommended (reduces db impact)
- Production backup in place
- Replica database for pre-staging validation

### Risk Mitigation Strategy

| Risk | Probability | Mitigation |
|------|------------|-----------|
| Data loss during migration | Low | Automated backup before each stage, verify row counts |
| Query breaking on cutover | Medium | Extensive pre-migration testing, gradual rollout |
| Performance regression | Medium | Analyze query plans before/after, compare latency |
| Rollback complexity | Medium | Practice rollback in staging, time each step |
| Long downtime window | Low | Zero-downtime approach, monitor migration progress |

### Pre-Migration Checklist

- [ ] Production backup taken + verified
- [ ] Replica database synced
- [ ] Migration script tested in staging (2-3 times)
- [ ] Rollback procedure tested + timed
- [ ] Team trained on monitoring
- [ ] Stakeholders notified (run at low-traffic time)
- [ ] Client app code ready for UUID (not SERIAL)

### Post-Migration Validation

- [ ] Row counts match before/after (all tables)
- [ ] Query latency same or better
- [ ] Connection pool utilization stable
- [ ] Zero foreign key violations
- [ ] All indexes present + healthy
- [ ] Load test: 100 concurrent passing

### Timeline & Window

| Phase | Duration | Impact | Rollback Available? |
|-------|----------|--------|---------------------|
| Prepare (new columns) | 30 min | Zero (read-only ops) | N/A |
| Dual-write (both keys) | 2-4h | Slight DB load increase | Yes (disable triggers) |
| Cutover (swap PK) | 15-30 min | Brief lock on table | Yes (15 min) |
| Cleanup (drop old cols) | 10 min | Table rebuild | Yes (restore backup) |

**Recommended Window**: Saturday 2-6 AM (low traffic, 4-hour window)

### Acceptance Criteria Checklist

- [ ] All legacy tables migrated to UUID
- [ ] Zero data loss (verified by row counts)
- [ ] Query performance maintained or improved
- [ ] Load test passing (100 concurrent)
- [ ] Rollback procedure tested + documented
- [ ] Documentation: LEGACY-TABLE-UUID-MIGRATION.md

---

## STORY-606: Monitoring Dashboard (Operations)

**Priority**: MEDIUM (Operations - Visibility)
**Effort**: 5 story points
**Estimated Duration**: 3-4 hours
**Owner**: @devops + @data-engineer
**Status**: Ready to Start

### Business Context

Currently have /api/metrics endpoint but no visualization. DevOps manually checks metrics, no alerting, no trend analysis.

**Goals**:
- Real-time pool utilization + query latency
- Historical trends (identify scaling needs)
- Alert on yellow/red thresholds
- Accessible to team (read-only)

### Acceptance Criteria

- [ ] AC-1: Dashboard accessible at /dashboard/metrics
- [ ] AC-2: Real-time pool utilization graph (auto-refresh 10s)
- [ ] AC-3: Query latency p50/p95/p99 tracked
- [ ] AC-4: Request rate graph (req/sec)
- [ ] AC-5: Cache hit rate displayed (if Redis)
- [ ] AC-6: Alert status: green (OK), yellow (>75%), red (>90%)
- [ ] AC-7: 24-hour history retained
- [ ] AC-8: Mobile responsive (tablet view)

### Task Breakdown

```
TASK-606-1: Metrics Architecture (45 min)
├─ Decide: Grafana + Prometheus vs custom dashboard
├─ Data source: /api/metrics endpoint
├─ Storage: in-memory (simple) vs persistent (better)
├─ Real-time updates: polling vs WebSocket
└─ Design: wireframe dashboard layout

TASK-606-2: Backend (1h)
├─ Enhance /api/metrics endpoint
│  ├─ Add historical data (last 24h)
│  ├─ Calculate p50/p95/p99 latencies
│  ├─ Return alert status (green/yellow/red)
│  └─ JSON response format
├─ Storage: in-memory circular buffer or external DB
└─ Polling endpoint: GET /api/metrics/history?minutes=1440

TASK-606-3: Frontend Dashboard (1.5h)
├─ Create /dashboard/metrics page
├─ Chart library: Chart.js or Recharts
├─ Real-time updates: setInterval(fetch, 10s)
├─ Metrics displays:
│  ├─ Pool utilization (gauge + line chart)
│  ├─ Query latency (p50/p95/p99)
│  ├─ Request rate
│  └─ Alert status (large red/yellow/green indicator)
└─ Mobile responsive layout

TASK-606-4: Authentication (15 min)
├─ Dashboard requires login (use existing JWT)
├─ Read-only access (no data modification)
├─ Optional: team members only (role-based)

TASK-606-5: Testing (45 min)
├─ Unit tests: metrics calculation
├─ Integration tests: /api/metrics response
├─ Component tests: dashboard rendering
├─ Load test: dashboard responsiveness at 100 concurrent
```

### Dependencies

- STORY-502 (pool monitoring) must be working
- STORY-603 (Redis) optional (for cache hit rate)

### Technical Notes

**Dashboard Stack Options**:

| Option | Setup Time | Maintenance | Cost | Recommendation |
|--------|-----------|------------|------|---|
| Grafana + Prometheus | 2-3h | Moderate | $0 (self-hosted) | Production-grade but complex |
| Custom React + Chart.js | 1.5h | Low | $0 | Simpler, sufficient for MVP |
| Vercel Analytics | 30 min | Zero | Free | Limited customization |

**Recommendation**: Custom React dashboard (Chart.js) for Phase 6, upgrade to Grafana in Phase 7+ if needed.

### Acceptance Criteria Checklist

- [ ] /api/metrics/history endpoint working
- [ ] /dashboard/metrics page rendering
- [ ] Real-time updates (10s refresh)
- [ ] Alert status displayed correctly
- [ ] Mobile responsive (tested on tablet)
- [ ] Load test: dashboard responsive at 100 concurrent
- [ ] Documentation: docs/MONITORING-DASHBOARD.md

---

## STORY-607: Error Handling Framework

**Priority**: LOW (Refactoring - Code Quality)
**Effort**: 3 story points
**Estimated Duration**: 2 hours
**Owner**: @dev
**Status**: Ready to Start

### Business Context

Currently error handling is inconsistent:
- Some endpoints return `{ error: "message" }`
- Some return `{ message: "..." }`
- Stack traces sometimes exposed to client
- No error codes for programmatic handling

Implement standardized error handling framework for consistency + better client experience.

**From Phase 5 Audit**: Error handling is "safe" but could be more consistent

### Acceptance Criteria

- [ ] AC-1: Error response format standardized
- [ ] AC-2: Error codes assigned (AUTH_FAILED, DB_ERROR, VALIDATION_ERROR, etc.)
- [ ] AC-3: HTTP status codes correct (401, 500, 400, etc.)
- [ ] AC-4: Stack traces never exposed to client (logged server-side only)
- [ ] AC-5: User-friendly error messages (not technical)
- [ ] AC-6: All endpoints updated to use framework
- [ ] AC-7: Integration tests validate error responses
- [ ] AC-8: Documentation: API Error Codes guide

### Task Breakdown

```
TASK-607-1: Design Error Framework (30 min)
├─ Error code taxonomy
│  ├─ AUTH_* (AUTH_FAILED, TOKEN_EXPIRED, INVALID_JWT)
│  ├─ DB_* (DB_ERROR, NOT_FOUND, UNIQUE_VIOLATION)
│  ├─ VALIDATION_* (INVALID_INPUT, MISSING_FIELD)
│  └─ SERVER_* (INTERNAL_ERROR, SERVICE_UNAVAILABLE)
├─ Error response format
│  └─ { error_code, message, details? }
└─ HTTP status mapping

TASK-607-2: Implement Framework (45 min)
├─ Create lib/errors.js
│  ├─ CustomError class (extends Error)
│  ├─ Predefined error subclasses
│  └─ toJSON() for response serialization
├─ Error handler middleware
│  ├─ Catch all errors
│  ├─ Log to server console (stack trace)
│  ├─ Return safe JSON (no stack to client)
│  └─ Set appropriate HTTP status
└─ Integration with all routes

TASK-607-3: Update All Endpoints (30 min)
├─ Audit current error handling
├─ Update src/routes/* to use framework
├─ Ensure consistent try-catch + error throws
└─ Remove manual error responses

TASK-607-4: Testing (15 min)
├─ Unit tests: error class behavior
├─ Integration tests: error responses from endpoints
├─ Test: stack traces not exposed
```

### Dependencies

- None (can be done independently)

### Technical Notes

**Error Framework Pattern**:
```javascript
// lib/errors.js
class CustomError extends Error {
  constructor(code, message, statusCode = 500, details = null) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }

  toJSON() {
    return {
      error_code: this.code,
      message: this.message,
      ...(this.details && { details: this.details }),
    };
  }
}

class AuthError extends CustomError {
  constructor(message = 'Authentication failed') {
    super('AUTH_FAILED', message, 401);
  }
}

// Usage in routes
try {
  const user = await db.query(...);
  if (!user) throw new NotFoundError('User not found');
} catch (err) {
  if (err instanceof CustomError) {
    res.status(err.statusCode).json(err.toJSON());
  } else {
    // Unexpected error
    logger.error(err);
    res.status(500).json({
      error_code: 'INTERNAL_ERROR',
      message: 'Something went wrong',
    });
  }
}
```

### Acceptance Criteria Checklist

- [ ] Error framework implemented (lib/errors.js)
- [ ] All routes updated to use framework
- [ ] Integration tests validating error responses
- [ ] Stack traces never exposed to client
- [ ] Documentation: API-ERROR-CODES.md

---

## Phase 6 Recommended Scope

### Tier 1: Critical Path (Must Do)

**Stories**: STORY-601 + STORY-602 + STORY-603
**Total Effort**: 16 story points
**Estimated Duration**: 8-10 hours
**Team**: @dev + @data-engineer + @devops
**Timeline**: 1-2 weeks

| Story | Priority | Effort | Owner | Week 1 | Week 2 |
|-------|----------|--------|-------|--------|--------|
| STORY-601 | HIGH | 5pts | @dev | ✅ | - |
| STORY-602 | HIGH | 3pts | @data-engineer | ✅ | - |
| STORY-603 | MEDIUM | 8pts | @dev + @data-engineer | ✅ | ✅ |

**Success Criteria**:
- Zero security vulnerabilities (MED-001, LOW-001 fixed)
- Support 100+ concurrent users
- p95 latency <300ms

---

### Tier 2: Polish (If Time)

**Stories**: STORY-604 + STORY-606
**Total Effort**: 10 story points
**Estimated Duration**: 5-6 hours
**Team**: @dev + @devops

| Story | Priority | Effort | Owner |
|-------|----------|--------|-------|
| STORY-604 | MEDIUM | 5pts | @dev + @ux |
| STORY-606 | MEDIUM | 5pts | @devops + @data-engineer |

---

### Tier 3: Deferred (Phase 7+)

**Stories**: STORY-605 + STORY-607
**Total Effort**: 16 story points
**Estimated Duration**: 10-12 hours
**Timeline**: Phase 7 (after 100+ users validated)

| Story | Priority | Effort | Owner | Phase |
|-------|----------|--------|-------|-------|
| STORY-605 | LOW | 13pts | @data-engineer | Phase 7+ |
| STORY-607 | LOW | 3pts | @dev | Phase 7+ |

---

## Prioritization Rationale

### Risk Mitigation First

1. **STORY-601** (JWT Rotation): Security best practice, industry standard
2. **STORY-602** (Legacy RLS): Compliance + governance
3. **STORY-603** (Redis): Performance risk if not addressed (100+ users)

### Then Scalability

4. **STORY-604** (API Consolidation): Reduces maintenance burden for scaling
5. **STORY-606** (Monitoring): Visibility into system under load

### Then Refactoring

6. **STORY-605** (UUID Migration): Important but safe to defer (isolated from modern schema)
7. **STORY-607** (Error Handling): Code quality improvement, non-blocking

---

## Phase 6 Kickoff Checklist

Before starting Phase 6, ensure:

- [ ] Phase 5 production deployment stable (1+ week monitoring)
- [ ] All Phase 5 stories signed off by @qa
- [ ] Team capacity confirmed (@dev, @data-engineer, @devops)
- [ ] Redis provider account ready (if proceeding with STORY-603)
- [ ] Monitoring baseline established (connection pool, query latency)
- [ ] Stakeholders briefed on Phase 6 scope

---

## Success Metrics

### Phase 6 Exit Criteria

| Metric | Target | Measurement |
|--------|--------|-------------|
| Security Vulnerabilities | 0 | Security audit |
| Concurrent Users Supported | 100+ | Load test |
| API Latency (p95) | <300ms | /api/metrics |
| Cache Hit Rate | >80% | Metrics endpoint |
| Code Test Coverage | 80%+ | Jest report |
| Production Uptime | 99.5%+ | Uptime tracker |

### Historical Context

```
Phase 4 Deliverables: 23 story points (JWT, pool monitoring, API integration)
Phase 5 Deliverables: 0 (extension of Phase 4)
Phase 6 Deliverables: 25 story points (security + scaling + refactoring)

Total MVP to Phase 6: ~48 story points
Estimated Team Effort: 40-50 hours engineering
Timeline: 8-10 weeks (Phase 1-6)
```

---

## Appendix: Tech Debt Summary

### From Phase 5 Audit

| ID | Issue | Table(s) | Severity | Phase 6 Story |
|----|-------|----------|----------|--------------|
| MED-001 | JWT no secret rotation | All endpoints | MEDIUM | STORY-601 |
| LOW-001 | Missing RLS on legacy tables | 4 legacy tables | LOW | STORY-602 |
| LOW-002 | No rate limiting | All endpoints | LOW | Deferred to Phase 7 |
| LOW-003 | No CSP headers | Server response | LOW | Deferred to Phase 7 |
| LOW-004 | JWT no early revocation | Auth system | LOW | Deferred to Phase 7 |

### Performance Recommendations (Phase 5 Analysis)

| Recommendation | Priority | Effort | Phase |
|---|---|---|---|
| Redis caching layer | HIGH | 8pts | Phase 6 (STORY-603) |
| API client consolidation | MEDIUM | 5pts | Phase 6 (STORY-604) |
| Schema UUID migration | LOW | 13pts | Phase 7+ (STORY-605) |
| Monitoring dashboard | MEDIUM | 5pts | Phase 6 (STORY-606) |
| Error handling framework | LOW | 3pts | Phase 7+ (STORY-607) |

---

## Document Status

```
Created: 2026-03-28
Version: 1.0.0
Status: Ready for Backlog Refinement
Next Review: After Phase 6 Kickoff (TBD)
```

---

**Prepared by**: @sm (River - Scrum Master)
**For**: dealer-sourcing MVP team
**Purpose**: Phase 6 story planning and prioritization

---
