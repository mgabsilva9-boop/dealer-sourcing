# Phase 6 Product Requirements Document (PRD)
**Build Performance, Reliability & Scalability**

**Date**: 2026-03-28
**Status**: 🟢 READY FOR EXECUTION
**Prepared By**: @pm (Morgan - Product Manager)
**Phase Duration**: 2-3 weeks (90-120 hours)

---

## Executive Summary

Phase 6 transforms dealer-sourcing from a production-viable MVP into an **enterprise-grade platform** capable of supporting 100+ concurrent users with sub-200ms response times and <0.1% error rates.

### Phase 5 Success Baseline
- ✅ Multi-tenant JWT authentication working
- ✅ Connection pool monitoring (20 connections, 97%+ success at 50 concurrent users)
- ✅ All 27 tests passing (85%+ confidence)
- ✅ Response time: 150-200ms avg, 300-400ms p95

### Phase 6 Targets
- 🎯 **Response time**: <200ms p95 (from 300-400ms)
- 🎯 **Throughput**: 25+ req/sec sustained (from 12.5 req/sec)
- 🎯 **Scalability**: Support 100+ concurrent users (from 50)
- 🎯 **Error rate**: <0.1% (from ~3% under peak load)
- 🎯 **Availability**: 99.9% uptime with monitoring & alerting
- 🎯 **Test coverage**: 80%+ (critical path coverage)

---

## Part 1: Strategic Context & Phase 5 Learnings

### 1.1 What Phase 5 Taught Us

From Phase 5 Performance Analysis and QA Review:

| Dimension | Finding | Implication for Phase 6 |
|-----------|---------|------------------------|
| **Database** | Queries fast (<5ms), but network latency dominates (40-90ms) | Implement caching layer to eliminate round-trips |
| **Connection Pool** | 20 connections peak at 85% utilization under 50 concurrent users | PgBouncer pooling needed for 100+ users |
| **Cache Hit Rate** | In-memory cache 85%+ effective | Distributed Redis cache extends this across instances |
| **API Response** | 150-200ms avg, but inconsistent (300-400ms p95) | Eliminate tail latency with dedicated connection pooling |
| **Frontend** | App.jsx is 77KB monolith, hard to maintain | Refactor into composable component architecture |
| **Test Coverage** | 27/27 Phase 5 tests pass, but only critical paths covered | Expand to 80%+ coverage including edge cases |

### 1.2 User Feedback Implications

**From Phase 5 Production Monitoring**:
- Users report occasional 2-3 second "freeze" on search (p95+ under 50 concurrent)
- Dashboard loads take 1-2 seconds (network latency + multiple queries)
- No errors observed, but "feels slow" compared to competitor apps
- Would like "instant search" results (sub-200ms)

**Phase 6 Response**:
1. Redis caching eliminates repeated database queries
2. PgBouncer connection pooling prevents "pool exhaustion delays"
3. Monitoring dashboard shows real-time performance issues
4. Consolidated API client provides consistent, predictable performance

### 1.3 Architecture Debt to Address

1. **Two API clients** (api.js + sourcingAPI.js) → consolidate into single unified client
2. **Hardcoded connection logic** → externalize via dedicated pooler
3. **Blind spot monitoring** → implement comprehensive observability
4. **Brittle frontend** → refactor into maintainable component tree
5. **No distributed caching** → add Redis for multi-instance support

---

## Part 2: Phase 6 Scope & Workstreams

### 2.1 Four Parallel Workstreams (90-120 hours)

```
┌─ WORKSTREAM 1: Caching Layer (Redis) ─┐
│  Owner: @dev                           │ Duration: 12-16 hours
│  Stories: STORY-601, STORY-602         │ Priority: CRITICAL
└─────────────────────────────────────────┘
                     ↓
        ┌─ WORKSTREAM 2: Connection Pooling (PgBouncer) ─┐
        │  Owner: @data-engineer                         │ Duration: 10-14 hours
        │  Stories: STORY-603, STORY-604                 │ Priority: CRITICAL
        └─────────────────────────────────────────────────┘
                     ↓
             ┌─ WORKSTREAM 3: Monitoring & Alerting ─┐
             │  Owner: @devops                        │ Duration: 12-18 hours
             │  Stories: STORY-605, STORY-606         │ Priority: HIGH
             └────────────────────────────────────────┘
                     ↓
                  ┌─ WORKSTREAM 4: Frontend Refactoring ─┐
                  │  Owner: @ux-design-expert            │ Duration: 20-30 hours
                  │  Stories: STORY-607, STORY-608       │ Priority: MEDIUM
                  └─────────────────────────────────────┘
```

### 2.2 Story Breakdown by Workstream

#### WORKSTREAM 1: Redis Caching Layer

**STORY-601: Redis Integration & Setup**
*Effort: 6-8h | Owner: @dev | Priority: CRITICAL*

*Objective*: Implement Redis as distributed cache layer

**Acceptance Criteria**:
- [ ] Redis client (redis npm package) integrated into server.js
- [ ] Connection pooling for Redis (min 5, max 20 connections)
- [ ] Redis connection health check endpoint (/api/cache/health)
- [ ] Graceful degradation: API works if Redis unavailable
- [ ] Error handling for cache failures (fallback to database)
- [ ] All Redis operations wrapped in try-catch
- [ ] 100% successful deployment to production (Render + Upstash/Neon Redis)

**Technical Details**:
```javascript
// src/lib/redis.js - New module
const redis = require('redis');
const client = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
  enableOfflineQueue: true,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 500),
  },
});

// Singleton pattern for serverless
module.exports = {
  getClient: async () => {
    if (!client.isOpen) await client.connect();
    return client;
  },
  // Helper methods
  get: (key) => client.get(key),
  set: (key, value, ttl) => client.setEx(key, ttl, value),
  delete: (key) => client.del(key),
  flush: () => client.flushDb(),
};
```

**Resources**:
- [ ] Redis hosting: Upstash (free tier: 10MB, $0.2/GB) or Neon Redis addon
- [ ] Add REDIS_HOST, REDIS_PORT, REDIS_PASSWORD to .env
- [ ] Configure Render environment variables
- [ ] Configure Vercel secrets for production

---

**STORY-602: Cache Invalidation Strategy & API Integration**
*Effort: 6-8h | Owner: @dev | Priority: CRITICAL*

*Objective*: Cache frequently accessed queries with smart invalidation

**Acceptance Criteria**:
- [ ] Cache keys designed for all GET endpoints (sourcing, search, vehicles, history)
- [ ] TTL strategy implemented: 5min (vehicles), 2min (search), 1min (user-specific)
- [ ] Cache invalidation on CREATE/UPDATE/DELETE operations
- [ ] Bulk invalidation strategy for schema changes
- [ ] Cache statistics endpoint (/api/cache/stats - hit/miss ratio)
- [ ] All 27 existing tests still passing
- [ ] New cache integration tests (8+ tests)
- [ ] 10%+ response time improvement on repeated queries

**Cache Strategy**:

| Endpoint | Data | TTL | Key Pattern | Invalidate On |
|----------|------|-----|-------------|---------------|
| GET /api/sourcing/interested | User favorites | 2min | `user:{userId}:favorites` | POST/DELETE interested |
| GET /api/search | Search results | 1min | `search:{userId}:{query}:{filters}` | Any vehicle update |
| GET /api/vehicles | Vehicle list | 5min | `vehicles:{make}:{model}:{year}` | Periodic refresh |
| GET /api/history/searches | Search history | 3min | `user:{userId}:search_history` | New search executed |
| GET /api/metrics | Pool metrics | 10sec | `metrics:pool` | Every query cycle |

**Implementation Pattern**:
```javascript
// In each GET route handler
const cacheKey = `search:${userId}:${query}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached); // Return immediately

// Query database
const results = await db.query(...);

// Cache result
await redis.set(cacheKey, JSON.stringify(results), 60); // 1min TTL
return results;
```

**Invalidation Pattern**:
```javascript
// In POST/PUT/DELETE handlers
const invalidatePattern = async (patterns) => {
  const keys = await redis.keys('search:*'); // Gets all search cache keys
  for (const key of keys) {
    await redis.delete(key);
  }
};
```

**Success Metrics**:
- Cache hit ratio: 70%+ on repeated queries
- Response time reduction: 40%+ on cache hits
- Zero cache-related errors in production

---

#### WORKSTREAM 2: Connection Pooling (PgBouncer)

**STORY-603: PgBouncer Setup & Configuration**
*Effort: 6-8h | Owner: @data-engineer | Priority: CRITICAL*

*Objective*: Deploy PgBouncer connection pooler for 100+ concurrent users

**Acceptance Criteria**:
- [ ] PgBouncer installed on Render (as service or Docker sidecar)
- [ ] PgBouncer configured with transaction-mode pooling
- [ ] Connection pool tuned: min_pool_size=20, max_pool_size=50
- [ ] Application updated to connect to PgBouncer (localhost:6432) not directly to PostgreSQL
- [ ] Health check endpoint verifies PgBouncer connectivity (/api/pool/health)
- [ ] Metrics endpoint (existing /api/metrics) updated to include PgBouncer stats
- [ ] Load test validates 100+ concurrent users with <200ms p95
- [ ] Zero connection leaks under sustained load
- [ ] Graceful failover if PgBouncer unavailable (reconnect logic)

**PgBouncer Configuration**:
```ini
; /etc/pgbouncer/pgbouncer.ini
[databases]
dealer_sourcing = host=neon-postgres.onrender.com port=5432 dbname=dealer_sourcing

[pgbouncer]
pool_mode = transaction
max_client_conn = 500
default_pool_size = 20
min_pool_size = 5
reserve_pool_size = 3
reserve_pool_timeout = 3
max_db_connections = 50
max_user_connections = 100
application_name = dealer-sourcing-api

; Timeout settings
server_lifetime = 3600
server_idle_timeout = 600
server_connect_timeout = 15
query_timeout = 30000

; Monitoring
stats_users = postgres
monitor_users = postgres
```

**Database Connection Update**:
```javascript
// src/lib/db.js - Update connection string
const connectionString = process.env.PGBOUNCER_URL
  || `postgres://${user}:${password}@localhost:6432/dealer_sourcing`
  // Falls back to direct PostgreSQL if PgBouncer unavailable
```

**Load Testing Plan**:
```bash
# Test with 100 concurrent users, 10 requests each
npm run load-test -- --users 100 --duration 5m

# Expected results:
# - Success rate: >99%
# - Response time p95: <200ms
# - No connection timeouts
# - PgBouncer pool utilization: 70-85%
```

---

**STORY-604: Connection Pool Monitoring & Auto-Scaling**
*Effort: 4-6h | Owner: @data-engineer | Priority: CRITICAL*

*Objective*: Real-time monitoring with auto-scaling recommendations

**Acceptance Criteria**:
- [ ] /api/metrics endpoint updated to return PgBouncer pool stats
- [ ] Metrics tracked: active_connections, idle_connections, waiting_clients, queue_length
- [ ] Alert threshold configured: Yellow at 75%, Red at 90%
- [ ] Alerts send to monitoring system (Sentry, CloudWatch, or Slack webhook)
- [ ] Scaling recommendation logic: "Scale if utilization >85% for >5 minutes"
- [ ] Dashboard displays current pool utilization (see STORY-605)
- [ ] Load test results documented in SCALING-STRATEGY-PHASE-6.md
- [ ] Runbook created for manual scaling (increase max_pool_size)

**Metrics Collection**:
```javascript
// src/lib/db-metrics.js
module.exports = {
  getPoolStats: async () => {
    const res = await pool.query(
      "SELECT * FROM pg_stat_database WHERE datname = 'dealer_sourcing';"
    );
    return {
      active: pool.numConnections(),
      idle: pool.idleCount(),
      waiting: pool.waitingCount(),
      queue_length: pool.query_queue.length,
      timestamp: new Date(),
      utilization: (pool.numConnections() / pool._max) * 100,
    };
  },

  getAlert: (stats) => {
    if (stats.utilization > 90) return { level: 'RED', action: 'SCALE_NOW' };
    if (stats.utilization > 75) return { level: 'YELLOW', action: 'MONITOR' };
    return { level: 'GREEN', action: 'NORMAL' };
  },
};
```

---

#### WORKSTREAM 3: Monitoring & Alerting Dashboard

**STORY-605: Prometheus Metrics Export & Collection**
*Effort: 6-8h | Owner: @devops | Priority: HIGH*

*Objective*: Expose detailed metrics in Prometheus format for observability

**Acceptance Criteria**:
- [ ] /api/metrics endpoint returns Prometheus-compatible format
- [ ] Metrics collected for all critical paths:
  - [ ] HTTP request rate (req/sec by endpoint)
  - [ ] HTTP response time (p50, p95, p99 latency)
  - [ ] HTTP error rate (5xx, 4xx counts)
  - [ ] Database query count and latency
  - [ ] Connection pool utilization
  - [ ] Cache hit/miss ratio
  - [ ] JWT token validation rate
- [ ] Metrics persisted for historical analysis (30-day retention)
- [ ] All metrics include labels: endpoint, method, status_code, service
- [ ] Zero performance overhead (<1ms per request)
- [ ] Metrics accessible to monitoring tools (Grafana, DataDog, etc.)

**Metrics Format**:
```prometheus
# Endpoint: GET /api/metrics
# Type: text/plain

# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{endpoint="/api/sourcing/interested",method="GET",status="200"} 1250

# HELP http_request_duration_seconds HTTP request latency
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{endpoint="/api/sourcing/interested",le="0.1"} 950
http_request_duration_seconds_bucket{endpoint="/api/sourcing/interested",le="0.2"} 1200
http_request_duration_seconds_bucket{endpoint="/api/sourcing/interested",le="0.5"} 1240

# HELP pg_pool_connections Current pool connections
# TYPE pg_pool_connections gauge
pg_pool_connections{state="active"} 12
pg_pool_connections{state="idle"} 8

# HELP cache_hit_ratio Cache hit ratio (0-1)
# TYPE cache_hit_ratio gauge
cache_hit_ratio{endpoint="/api/search"} 0.75
```

**Implementation**:
```javascript
// src/lib/prometheus-metrics.js
const prometheus = require('prom-client');

const requestCounter = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['endpoint', 'method', 'status'],
});

const requestHistogram = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request latency',
  labelNames: ['endpoint', 'method'],
  buckets: [0.05, 0.1, 0.2, 0.5, 1.0, 2.0],
});

module.exports = { requestCounter, requestHistogram };
```

---

**STORY-606: Monitoring Dashboard & Alerting Rules**
*Effort: 6-10h | Owner: @devops | Priority: HIGH*

*Objective*: Real-time visibility into system health and performance

**Acceptance Criteria**:
- [ ] Web dashboard built (simple Node.js app or Grafana instance)
- [ ] Dashboard displays in real-time:
  - [ ] System health status (green/yellow/red)
  - [ ] Request rate (req/sec, 5-min average)
  - [ ] Error rate (% errors, 5-min average)
  - [ ] Response time (p50, p95, p99, max)
  - [ ] Database connection pool (active, idle, utilization %)
  - [ ] Cache performance (hit ratio, miss ratio)
  - [ ] Uptime (days since restart)
- [ ] Alert rules configured:
  - [ ] Alert if error rate >1% (HIGH)
  - [ ] Alert if p95 latency >300ms (MEDIUM)
  - [ ] Alert if pool utilization >85% (MEDIUM)
  - [ ] Alert if cache hit ratio <50% (LOW)
- [ ] Alerts sent to: Slack webhook + email
- [ ] Dashboard accessible at /dashboard (simple auth with JWT)
- [ ] Mobile-responsive design

**Dashboard Tech Stack**:
- Option A: Grafana (preferred, professional, open-source)
  - Setup: Docker container on Render
  - Data source: Prometheus scraper
  - Time: 4-6 hours

- Option B: Custom Node.js dashboard (simpler)
  - Setup: Express app with real-time updates via WebSocket
  - Data source: /api/metrics endpoint
  - Time: 6-10 hours

**Recommended**: Grafana (Option A) for production maturity

**Sample Alert Rule**:
```yaml
# Alert if p95 latency >300ms for >5 minutes
alert: HighLatency
expr: histogram_quantile(0.95, http_request_duration_seconds) > 0.3
for: 5m
annotations:
  summary: "High API latency detected ({{ $value }}ms)"
  action: "Check database/cache performance"
```

---

#### WORKSTREAM 4: Frontend Refactoring

**STORY-607: API Client Consolidation**
*Effort: 4-6h | Owner: @dev (or @ux-design-expert) | Priority: MEDIUM*

*Objective*: Single unified API client to replace api.js + sourcingAPI.js

**Current State**:
- `src/frontend/api.js` - Generic HTTP client
- `src/frontend/sourcingAPI.js` - Sourcing-specific methods

**Problems**:
- Duplicate code (token management, headers, error handling)
- Different error handling patterns
- Inconsistent naming conventions
- Makes testing harder

**Acceptance Criteria**:
- [ ] New `src/frontend/apiClient.js` created as single source of truth
- [ ] All methods from both files consolidated:
  - [ ] Auth methods: login, logout, refreshToken
  - [ ] Sourcing methods: getInterested, addInterested, removeInterested, search
  - [ ] Vehicle methods: getVehicleDetails, searchVehicles
  - [ ] History methods: getSearchHistory
- [ ] Unified error handling (consistent error object format)
- [ ] Unified request/response logging
- [ ] localStorage key unified: `auth_token` (not duplicated)
- [ ] All 27 tests still passing
- [ ] New client tests (5+ tests)
- [ ] App.jsx updated to use new client
- [ ] Zero functional changes (100% backward compatible)
- [ ] Old api.js and sourcingAPI.js deleted

**API Client Structure**:
```javascript
// src/frontend/apiClient.js
class APIClient {
  constructor(baseURL, options = {}) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('auth_token') || null;
  }

  // Auth
  async login(email, password) { /* ... */ }
  async logout() { /* ... */ }
  async refreshToken() { /* ... */ }

  // Sourcing
  async getInterested(params) { /* ... */ }
  async addInterested(vehicleId) { /* ... */ }
  async removeInterested(vehicleId) { /* ... */ }

  // Search
  async search(query, filters) { /* ... */ }
  async searchHistory() { /* ... */ }

  // Vehicles
  async getVehicleDetails(id) { /* ... */ }
  async searchVehicles(criteria) { /* ... */ }

  // Helpers
  async _request(method, path, data = null) {
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
    };
    if (data) options.body = JSON.stringify(data);
    return fetch(`${this.baseURL}${path}`, options);
  }
}

export default new APIClient(process.env.VITE_API_URL);
```

---

**STORY-608: Frontend Component Architecture Refactoring**
*Effort: 16-24h | Owner: @ux-design-expert | Priority: MEDIUM*

*Objective*: Break 77KB App.jsx monolith into maintainable component tree

**Current State**:
- `src/frontend/App.jsx` - 77KB single file
- Contains: auth flow, routing, filtering, list rendering, state management
- Hard to test, hard to maintain, hard to reuse

**Target State**:
```
src/frontend/
├── App.jsx                          (20KB, minimal orchestration)
├── components/
│   ├── Layout/
│   │   ├── Header.jsx              (auth status, navigation)
│   │   ├── Sidebar.jsx             (filters, search)
│   │   └── Footer.jsx              (metadata)
│   ├── Auth/
│   │   ├── LoginForm.jsx           (login UI)
│   │   ├── ProtectedRoute.jsx      (route guard)
│   │   └── LogoutButton.jsx        (logout)
│   ├── Sourcing/
│   │   ├── SourceList.jsx          (vehicle list, pagination)
│   │   ├── SourceCard.jsx          (single vehicle card)
│   │   ├── SourceFilters.jsx       (filter controls)
│   │   └── SourceSearch.jsx        (search input)
│   ├── Dashboard/
│   │   ├── Dashboard.jsx           (page container)
│   │   ├── Stats.jsx               (summary stats)
│   │   └── RecentActivity.jsx      (recent searches)
│   └── Common/
│       ├── Loading.jsx             (spinner)
│       ├── Error.jsx               (error UI)
│       └── Pagination.jsx          (page controls)
├── hooks/
│   ├── useAuth.js                  (auth context)
│   ├── useSourcing.js              (sourcing data)
│   ├── useSearch.js                (search state)
│   └── useFilters.js               (filter state)
├── context/
│   └── AppContext.jsx              (global state)
├── pages/
│   ├── LoginPage.jsx               (login route)
│   ├── DashboardPage.jsx           (main route)
│   └── NotFoundPage.jsx            (404)
└── styles/
    ├── App.css                     (global styles)
    └── components.css              (component styles)
```

**Acceptance Criteria**:
- [ ] App.jsx reduced to <15KB (from 77KB)
- [ ] Components broken into logical units (max 300 lines each)
- [ ] Custom hooks: useAuth, useSourcing, useSearch, useFilters
- [ ] Context API used for global state (auth, filters)
- [ ] All 27 existing tests still passing
- [ ] New component tests (15+ tests)
- [ ] Storybook stories created for 5+ components
- [ ] Props validation via PropTypes
- [ ] Error boundary component implemented
- [ ] Lazy loading for routes (React.lazy, Suspense)
- [ ] Code splitting reduces initial bundle <50KB
- [ ] Zero functional changes (UI looks identical)
- [ ] Performance: Lighthouse score >90 (from current ~75)

**Component Breakdown**:

| Component | Size | Props | State | Dependencies |
|-----------|------|-------|-------|--------------|
| LoginForm | 1.5KB | onSubmit, loading | email, password | apiClient |
| SourceList | 2.5KB | vehicles, onFilter | page, sorting | useSourcing |
| SourceCard | 1.2KB | vehicle, onSelect | - | - |
| SourceFilters | 2KB | onFilter | make, model, year | useFilters |
| Dashboard | 1KB | - | - | child components |
| Header | 1KB | user, onLogout | - | useAuth |

**State Management Pattern**:
```javascript
// src/context/AppContext.jsx
const AppContext = React.createContext();

export const AppProvider = ({ children }) => {
  const [auth, setAuth] = useState(null);
  const [filters, setFilters] = useState({});

  return (
    <AppContext.Provider value={{ auth, filters, setAuth, setFilters }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
```

**Testing Pattern**:
```javascript
// src/components/SourceCard.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import SourceCard from './SourceCard';

describe('SourceCard', () => {
  it('renders vehicle details', () => {
    const vehicle = { id: 1, make: 'Toyota', model: 'Camry', price: 25000 };
    render(<SourceCard vehicle={vehicle} />);
    expect(screen.getByText('Toyota Camry')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', () => {
    const onSelect = jest.fn();
    render(<SourceCard vehicle={{}} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalled();
  });
});
```

---

### 2.3 Effort Estimation & Timeline

| Workstream | Story | Hours | Owner | Weeks |
|-----------|-------|-------|-------|-------|
| **Caching** | STORY-601 | 6-8 | @dev | 1 |
| | STORY-602 | 6-8 | @dev | 1 |
| **Pooling** | STORY-603 | 6-8 | @data-engineer | 1 |
| | STORY-604 | 4-6 | @data-engineer | 0.5 |
| **Monitoring** | STORY-605 | 6-8 | @devops | 1 |
| | STORY-606 | 6-10 | @devops | 1 |
| **Frontend** | STORY-607 | 4-6 | @dev | 0.5 |
| | STORY-608 | 16-24 | @ux-design-expert | 2-3 |
| **Buffer & Integration** | Testing, fixes, coordination | 10-20 | All | - |
| **TOTAL** | **Phase 6** | **90-120 hours** | **All** | **2-3 weeks** |

**Parallel Execution (assumes 2-person teams)**:
```
Week 1:
  @dev: STORY-601, STORY-602 (12-16h)
  @data-engineer: STORY-603, STORY-604 (10-14h)
  @devops: STORY-605 (6-8h)
  @ux-design-expert: STORY-608 prep (4-6h)

Week 2:
  @dev: STORY-607 (4-6h)
  @devops: STORY-606 (6-10h)
  @ux-design-expert: STORY-608 continuation (12-16h)

Week 3:
  @ux-design-expert: STORY-608 final (4-8h)
  All: Integration testing, fix issues, load testing

Wall-clock time: 2-3 weeks (parallel vs 8-10 weeks sequential)
```

---

## Part 3: Detailed Requirements by Feature

### 3.1 Redis Caching Layer

**What to Cache**:
1. **Search results** (frequently repeated searches)
   - Key: `search:{userId}:{query}:{filters}`
   - TTL: 1 minute
   - Hit rate expectation: 60%+

2. **Vehicle lists** (filtered by make/model)
   - Key: `vehicles:{make}:{model}:{year}`
   - TTL: 5 minutes
   - Hit rate expectation: 70%+

3. **User's interested vehicles** (dashboard load)
   - Key: `user:{userId}:interested`
   - TTL: 2 minutes
   - Hit rate expectation: 80%+

4. **Metrics snapshots** (to reduce DB hits)
   - Key: `metrics:snapshot`
   - TTL: 10 seconds
   - Hit rate expectation: 90%+

**TTL Strategy**:
- High-frequency user data: 1-2 min
- Vehicle data: 5 min
- Aggregated data: 10-30 sec
- Search history: 3 min

**Invalidation Strategy**:
```
When user favorite vehicle:
  - Invalidate: user:{userId}:interested
  - Invalidate: search:* (all searches may be affected)

When vehicle price updates:
  - Invalidate: vehicles:* (all vehicle caches)
  - Invalidate: search:* (all searches may be affected)

When user performs new search:
  - Invalidate: user:{userId}:search_history (add new entry)
```

**Configuration**:
- **Hosting**: Upstash (free tier) or Neon Redis addon
- **Max memory**: Start with 10GB, monitor usage
- **Eviction policy**: `allkeys-lru` (least recently used)
- **Replication**: Enable for production redundancy
- **TLS**: Enabled (default for managed Redis)

**Success Metrics**:
- Cache hit ratio: 60%+ on production traffic
- Response time reduction: 40%+ on cache hits
- Zero cache-related errors per 1M requests
- Memory usage: <5GB with 1M keys

---

### 3.2 PgBouncer Connection Pooling

**Why PgBouncer**:
- Neon PostgreSQL supports 20 connections on free tier
- Phase 5 achieved 97%+ success with 50 concurrent users
- Phase 6 targets 100+ concurrent users
- PgBouncer multiplexes 500+ client connections to 20-50 server connections

**Configuration Targets**:
```
Client-facing pool:
  max_client_conn = 500  (allows 500 simultaneous connections)

Server-side pool:
  default_pool_size = 20  (one per available Neon connection)
  reserve_pool_size = 3   (emergency connections)
  max_pool_size = 50      (scale up if needed)

Timeouts:
  server_lifetime = 3600s (1 hour)
  server_idle_timeout = 600s (10 min, return to pool)
  query_timeout = 30s (kill query if running >30s)
```

**Deployment Options**:
1. **Docker sidecar on Render** (recommended)
   - Run PgBouncer alongside Node.js
   - Cost: No additional cost
   - Setup time: 3-4 hours

2. **Managed PgBouncer** (if available)
   - Some hosting providers offer managed pooling
   - Cost: ~$5-10/month
   - Setup time: 1-2 hours

3. **Neon's built-in pooler** (if upgraded)
   - Neon Pro plan includes connection pooling
   - Cost: $14/month
   - Setup time: 15 minutes

**Recommended**: Docker sidecar on Render (no additional cost)

**Load Test Validation**:
```bash
# Test plan: 100 concurrent users, 10 requests each
# Expected: <200ms p95, >99% success rate

npm run load-test -- \
  --concurrency 100 \
  --requests-per-user 10 \
  --duration 5m \
  --target-p95 200 \
  --target-success 99.5
```

**Monitoring**:
```sql
-- Check current connections
SELECT * FROM pg_stat_activity;

-- Check pool status (if PgBouncer admin port available)
SHOW CLIENTS;
SHOW SERVERS;
SHOW POOLS;
```

**Success Metrics**:
- Support 100+ concurrent users
- p95 latency <200ms
- Success rate >99%
- Pool utilization: 60-80%

---

### 3.3 Monitoring Dashboard & Alerting

**Metrics to Display** (Real-Time):

1. **System Health**
   - Overall status: Green/Yellow/Red
   - Uptime: Days since restart
   - Last error: Timestamp + message

2. **Performance**
   - Request rate: req/sec (5-min average)
   - Response time: p50, p95, p99, max
   - Error rate: % errors (5-min average)
   - Throughput: Total requests served

3. **Database**
   - Pool utilization: % (active/max)
   - Active connections: Count
   - Queue length: Waiting requests
   - Query latency: p95, max
   - Lock waits: Count

4. **Cache** (if Redis enabled)
   - Hit ratio: % cache hits
   - Miss ratio: % cache misses
   - Eviction count: Keys evicted
   - Memory usage: MB

5. **Application**
   - JWT failures: Count (auth errors)
   - RLS violations: Count (security events)
   - Timeout errors: Count
   - Database errors: Count

**Alert Rules**:

| Alert | Threshold | Severity | Action |
|-------|-----------|----------|--------|
| Error rate high | >1% for 5 min | HIGH | Page on-call |
| Latency high | p95 >300ms for 5 min | MEDIUM | Investigate cache/DB |
| Pool exhausted | Utilization >90% for 2 min | MEDIUM | Scale pool |
| Cache hit low | <50% for 10 min | LOW | Monitor, may be normal |
| Downtime | Service unavailable for 1 min | CRITICAL | Emergency page |

**Alert Channels**:
- Slack webhook: #alerts channel
- Email: on-call@team
- PagerDuty: Critical alerts (optional)

**Dashboard Design**:
```
┌─ HEADER ──────────────────────────────────┐
│ Status: GREEN | Uptime: 12d 4h | CPU: 65% │
└───────────────────────────────────────────┘

┌─ METRICS (5 tiles) ──────────────────────────┐
│ Requests:  1,250 req/sec                     │
│ P95:       185ms  (↓10% from 205ms)          │
│ Errors:    0.2%   (↑ alert threshold!)       │
│ Cache Hit: 68%    (↑5% improvement)          │
│ Pool:      42/50  (84% utilization)          │
└───────────────────────────────────────────────┘

┌─ CHARTS (Time-series graphs) ────────────────┐
│ [Request Rate 24h] [Latency 24h]             │
│ [Error Rate 24h]   [Pool Utilization 24h]    │
└───────────────────────────────────────────────┘

┌─ ALERTS (Recent) ────────────────────────────┐
│ 🔴 Error rate 1.5% (5 min ago) - RESOLVED    │
│ 🟡 Cache hit <50% (1h ago) - MONITORING      │
│ 🟢 All systems normal                         │
└───────────────────────────────────────────────┘
```

**Technology Choice**: Grafana (preferred)
- Open-source, battle-tested
- Supports Prometheus data source
- Beautiful dashboards
- Free tier sufficient for MVP

**Deployment**:
- Docker container on Render
- Persistent volume for configuration
- Pre-built dashboard JSON (provided)
- Auto-refresh every 5 seconds

**Success Metrics**:
- Dashboard loads <1 second
- Alert notifications within 30 seconds of threshold breach
- 30-day data retention
- Zero false positives

---

### 3.4 Frontend Component Architecture

**Component Tree** (visual hierarchy):

```
<App />
  ├── <Layout>
  │   ├── <Header>
  │   │   ├── <Logo />
  │   │   ├── <Navigation />
  │   │   └── <UserMenu>
  │   │       ├── <Avatar />
  │   │       └── <LogoutButton />
  │   ├── <Sidebar>
  │   │   ├── <SearchInput />
  │   │   └── <FilterControls>
  │   │       ├── <FilterMake />
  │   │       ├── <FilterModel />
  │   │       ├── <FilterYear />
  │   │       └── <ApplyButton />
  │   └── <MainContent>
  │       ├── <SourceList>
  │       │   ├── <SourceCard /> (x N)
  │       │   │   ├── <VehicleImage />
  │       │   │   ├── <VehicleDetails />
  │       │   │   └── <ActionButtons>
  │       │   │       ├── <FavoriteButton />
  │       │   │       └── <DetailsButton />
  │       │   └── <Pagination />
  │       ├── <Dashboard> (if logged in)
  │       │   ├── <StatsPanel />
  │       │   ├── <RecentSearches />
  │       │   └── <QuickFilters />
  │       └── <Loading /> (on data fetch)
  │   └── <Footer />
  └── <ErrorBoundary />
      └── <ErrorPage />
```

**Key Optimizations**:
1. **Code splitting** by route (lazy load heavy components)
2. **Memoization** for expensive computations (useMemo)
3. **Callback memoization** for event handlers (useCallback)
4. **Image optimization** (lazy load, WebP format)
5. **Bundle analysis** (identify and remove unused deps)

**State Management**:
```javascript
// Context for global state (auth, filters)
<AppProvider>
  <AuthProvider>
    <FilterProvider>
      <AppRoutes />
    </FilterProvider>
  </AuthProvider>
</AppProvider>

// Local component state via hooks
const [vehicles, setVehicles] = useState([]);
const [loading, setLoading] = useState(false);
```

**Testing Coverage**:
- Unit tests: Individual components (30+ tests)
- Integration tests: Feature workflows (10+ tests)
- E2E tests: User journeys (5+ tests)
- Coverage target: 80%+ of critical paths

**Success Metrics**:
- Bundle size: <50KB (gzipped)
- Lighthouse score: >90
- Initial load: <2 seconds
- Interactive: <3 seconds

---

### 3.5 API Client Consolidation

**Current Issue**:
```javascript
// src/frontend/api.js
const makeRequest = async (url, options) => { /* ... */ };

// src/frontend/sourcingAPI.js
const getSourcing = async () => { /* ... */ };
const addVehicle = async (id) => { /* ... */ };
```

**Unified Client**:
```javascript
// src/frontend/apiClient.js
class APIClient {
  // Auth
  login(email, password) {}
  logout() {}
  refreshToken() {}

  // Sourcing
  getInterested(params) {}
  addInterested(vehicleId) {}
  removeInterested(vehicleId) {}
  search(query, filters) {}

  // Vehicles
  getVehicles(filter) {}
  getVehicleDetails(id) {}

  // History
  getSearchHistory() {}
}
```

**Benefits**:
- Single source of truth for API logic
- Consistent error handling
- Easier to test
- Simpler dependency injection
- Better TypeScript support (future)

**Implementation Steps**:
1. Analyze both files to identify all methods
2. Create new `apiClient.js` with consolidated interface
3. Implement error handling strategy
4. Test against all endpoints
5. Update App.jsx to use new client
6. Delete old api.js and sourcingAPI.js

**Success Metrics**:
- All 27 existing tests passing
- Zero functional changes
- 30%+ reduction in code duplication
- <5 minutes to add new endpoint

---

## Part 4: Success Metrics & Acceptance Criteria

### 4.1 Performance Success Criteria

**Response Time**:
- [ ] P95 latency <200ms (from 300-400ms)
- [ ] P99 latency <300ms
- [ ] Average latency <150ms
- [ ] Max latency <1 second (under normal load)

**Throughput**:
- [ ] Sustained 25+ req/sec (from 12.5 req/sec)
- [ ] Peak burst capacity: 100+ req/sec
- [ ] No degradation under 100 concurrent users

**Specific Endpoint Targets**:

| Endpoint | Phase 5 | Phase 6 Target | Metric |
|----------|---------|---|--------|
| GET /api/sourcing/interested | 180ms | 100ms | P95 latency |
| GET /api/search | 200ms | 120ms | P95 latency |
| GET /api/vehicles | 150ms | 80ms | P95 latency |
| GET /api/metrics | 50ms | 30ms | P95 latency |
| GET /api/history/searches | 160ms | 90ms | P95 latency |

---

### 4.2 Scalability Success Criteria

**Concurrent Users**:
- [ ] Support 100+ concurrent users
- [ ] Success rate >99% under 100 concurrent
- [ ] Connection pool utilization 70-85%
- [ ] No queue buildup or timeouts

**Load Test Results** (must-have):
```
Test: 100 concurrent users, 10 requests each, 5 minute duration

Expected Results:
  ✅ Success rate: >99% (max 1 error per 100 requests)
  ✅ Response time p95: <200ms
  ✅ Response time p99: <300ms
  ✅ Pool utilization: 70-85%
  ✅ No connection timeouts
  ✅ Cache hit ratio: 60%+
  ✅ Error rate: <0.1%
```

---

### 4.3 Reliability Success Criteria

**Error Handling**:
- [ ] Error rate <0.1% on production traffic
- [ ] Graceful degradation if cache unavailable
- [ ] Graceful degradation if pooler unavailable
- [ ] Zero data corruption
- [ ] All errors logged and monitored

**Monitoring**:
- [ ] Real-time dashboard showing system health
- [ ] Alerts trigger within 1 minute of threshold breach
- [ ] 30-day metrics retention
- [ ] Root cause available in logs
- [ ] SLA: 99.9% uptime

---

### 4.4 Code Quality Success Criteria

**Test Coverage**:
- [ ] 80%+ coverage of critical paths
- [ ] All new features have tests
- [ ] All bug fixes have regression tests
- [ ] Zero flaky tests
- [ ] Integration tests for all 6+ endpoints

**Test Breakdown**:
- Unit tests: 40+ tests
- Integration tests: 20+ tests
- E2E tests: 5+ tests
- Load tests: 3 scenarios
- **Total**: 70+ tests, 80%+ coverage

**Code Quality**:
- [ ] No critical issues (SonarQube/CodeRabbit)
- [ ] TypeScript types for 80%+ of code (Phase 7)
- [ ] Zero high-severity security issues
- [ ] All secrets in environment variables
- [ ] OWASP compliance check passed

---

### 4.5 Frontend Success Criteria

**User Experience**:
- [ ] App.jsx refactored from 77KB to <15KB
- [ ] Bundle size: <50KB (gzipped)
- [ ] Lighthouse score: >90 (from 75)
- [ ] Initial load: <2 seconds
- [ ] Time to interactive: <3 seconds

**Maintainability**:
- [ ] Components max 300 lines each
- [ ] Custom hooks for reusable logic
- [ ] Clear separation of concerns
- [ ] Comprehensive component documentation
- [ ] 15+ new component tests

---

## Part 5: Architecture Decisions & Trade-offs

### 5.1 Redis vs In-Memory Cache

| Aspect | In-Memory (Current) | Redis (Proposed) |
|--------|---|---|
| Performance | Fastest (microseconds) | Fast (milliseconds) |
| Distributed | No (lost on restart) | Yes (survives restarts) |
| Cost | Free | $0.2/GB (Upstash free tier) |
| Scalability | Single instance only | Multi-instance ready |
| Effort | 0h (already done) | 12-16h setup |
| Recommendation | Phase 5, MVP | **Phase 6, scale-ready** |

**Decision**: Implement Redis
- Required for multi-instance horizontal scaling
- Supports 100+ concurrent user target
- Minimal cost (free tier available)

---

### 5.2 PgBouncer vs Neon's Built-In Pooler

| Aspect | PgBouncer | Neon Pooler |
|--------|---|---|
| Setup | 3-4 hours (Docker) | 15 minutes (toggle) |
| Cost | Free | $14/month (Pro plan) |
| Reliability | Well-tested (10+ years) | New (2023+) |
| Configuration | Full control | Limited options |
| Recommendation | **Phase 6, DIY** | Phase 7+, simplicity |

**Decision**: PgBouncer via Docker sidecar
- Zero additional cost
- Full control over tuning
- Proven at scale (used by Netflix, Uber)
- Docker-first deployment

---

### 5.3 Grafana vs Custom Dashboard

| Aspect | Grafana | Custom Node.js |
|--------|---|---|
| Setup | 2-3 hours (Docker) | 6-10 hours (code) |
| Features | 95% built-in | 50% must build |
| Alerting | Native | Must implement |
| Cost | Free (open-source) | Free (server cost) |
| Learning | Learning curve | Straightforward |
| Recommendation | **Phase 6, professional** | Phase 7+, customization |

**Decision**: Grafana
- Professional, battle-tested
- Native alert support
- Faster time-to-value
- Free open-source option

---

### 5.4 React Context vs Redux

| Aspect | Context | Redux |
|--------|---|---|
| Learning curve | Shallow | Steep |
| Boilerplate | Minimal | High |
| DevTools | Basic | Advanced (Redux DevTools) |
| Scalability | <5 stores | 20+ stores easily |
| Recommendation | **Phase 6, simplicity** | Phase 7+, complexity |

**Decision**: React Context + custom hooks
- Sufficient for current complexity
- Lower learning curve
- Easier to maintain
- Redux available if needed later

---

## Part 6: Execution Plan & Rollout

### 6.1 Phase 6 Timeline

```
WEEK 1: Infrastructure Setup
  Day 1-2: STORY-601 (Redis integration) - @dev
  Day 2-3: STORY-603 (PgBouncer setup) - @data-engineer
  Day 3-4: STORY-605 (Prometheus metrics) - @devops
  Day 4-5: Integration testing + fixes

WEEK 2: Feature Implementation
  Day 1-2: STORY-602 (Cache strategy) - @dev
  Day 2-3: STORY-604 (Pool monitoring) - @data-engineer
  Day 3-4: STORY-606 (Dashboard) - @devops
  Day 4-5: STORY-607 (API client consolidation) - @dev
  Day 5: Integration testing + fixes

WEEK 3: Frontend Refactoring & Validation
  Day 1-3: STORY-608 (Component refactoring) - @ux-design-expert
  Day 3-4: Load testing, performance validation
  Day 4-5: QA review, documentation, sign-off

TARGET END DATE: 2026-04-18 (3 weeks from start)
```

### 6.2 Deployment Strategy

**Phase 6 Deployment (Per Story)**:

1. **STORY-601 (Redis Integration)**
   - [ ] Test on development environment first
   - [ ] Deploy to Render staging
   - [ ] Run smoke tests
   - [ ] Gradual rollout: 10% → 50% → 100%
   - [ ] Monitor for 24 hours
   - [ ] Rollback plan: Disable Redis feature flag

2. **STORY-603 (PgBouncer)**
   - [ ] Test locally with Docker
   - [ ] Deploy PgBouncer container to Render
   - [ ] Verify connection routing works
   - [ ] Load test before full rollout
   - [ ] Monitor pool metrics for 48 hours

3. **STORY-605 (Prometheus Metrics)**
   - [ ] Deploy metrics endpoint to staging
   - [ ] Verify /api/metrics endpoint works
   - [ ] Test alert rules
   - [ ] Deploy to production

4. **STORY-606 (Dashboard)**
   - [ ] Deploy Grafana container
   - [ ] Import dashboard JSON
   - [ ] Configure alert channels (Slack)
   - [ ] Verify alerts working

5. **STORY-607 & 608 (Frontend)**
   - [ ] Deploy to Vercel staging
   - [ ] Run full test suite
   - [ ] Manual testing (auth, filtering, search)
   - [ ] Lighthouse audit (target >90)
   - [ ] Deploy to production

**Rollout Strategy**:
- All infrastructure changes first (Weeks 1-2)
- Frontend changes last (Week 3)
- Each story has its own rollback plan
- Monitoring enabled before each deployment

---

### 6.3 Success Criteria & Sign-Off

**Phase 6 Gate Decision** (Before production deploy):

```
STORY-601: Redis Integration
  [ ] Redis client integrated (src/lib/redis.js)
  [ ] Health check endpoint working
  [ ] All 27 existing tests passing
  [ ] New cache tests passing (4+ tests)
  [ ] Zero cache-related errors in staging
  → SIGN-OFF: @dev (Dex)

STORY-602: Cache Strategy
  [ ] All GET endpoints cached
  [ ] Cache hit ratio 60%+
  [ ] Invalidation logic working
  [ ] Response time 40%+ faster on cache hits
  [ ] New cache integration tests passing
  → SIGN-OFF: @dev (Dex)

STORY-603: PgBouncer Setup
  [ ] PgBouncer running on Render
  [ ] Application connects via pooler
  [ ] Health check shows connected status
  [ ] Load test passes (100 concurrent, >99% success)
  [ ] Zero connection errors
  → SIGN-OFF: @data-engineer (Dara)

STORY-604: Pool Monitoring
  [ ] /api/metrics includes pool stats
  [ ] Alert thresholds configured
  [ ] Dashboard displays pool utilization
  [ ] Alerts trigger correctly
  → SIGN-OFF: @data-engineer (Dara)

STORY-605: Prometheus Metrics
  [ ] /api/metrics returns valid Prometheus format
  [ ] All critical metrics exported
  [ ] <1ms overhead per request
  [ ] Metrics persisted for 30 days
  → SIGN-OFF: @devops (Gage)

STORY-606: Monitoring Dashboard
  [ ] Grafana dashboard deployed
  [ ] Real-time metrics displayed
  [ ] Alerts configured and working
  [ ] Mobile-responsive design
  → SIGN-OFF: @devops (Gage)

STORY-607: API Client Consolidation
  [ ] New apiClient.js works for all endpoints
  [ ] All 27 existing tests passing
  [ ] New client tests passing (5+ tests)
  [ ] Zero functional changes
  [ ] Old files deleted
  → SIGN-OFF: @dev (Dex)

STORY-608: Frontend Refactoring
  [ ] App.jsx reduced to <15KB
  [ ] All components <300 lines
  [ ] New component tests passing (15+ tests)
  [ ] Lighthouse score >90
  [ ] All 27 existing tests passing
  [ ] Zero functional changes
  → SIGN-OFF: @ux-design-expert

PHASE 6 GATE: ✅ PASS/FAIL
  All stories signed off by owners
  Load test: 100 concurrent, p95 <200ms, >99% success
  Error rate: <0.1%
  Dashboard: Operational and monitoring
  → FINAL SIGN-OFF: @pm (Morgan)
```

---

## Part 7: Risk Management & Contingencies

### 7.1 Top Risks

| Risk | Probability | Impact | Mitigation |
|------|-----------|--------|-----------|
| Redis service outage | Medium | Medium | Graceful degradation, fallback to DB |
| PgBouncer exhaustion | Low | High | Load test before deploy, scale plan |
| Cache invalidation bugs | Low | High | Comprehensive cache tests, monitor |
| Frontend regression | Medium | Medium | Full test suite, manual QA, staging |
| Monitoring alert noise | Medium | Low | Tune thresholds, validate rules |

### 7.2 Contingency Plans

**If Redis fails to deploy**:
1. Keep in-memory cache (Phase 5 approach)
2. Scale horizontally without Redis
3. Implement Redis in Phase 7
4. Continue Phase 6 with other stories
*Recovery time: 2-4 hours*

**If PgBouncer causes connection issues**:
1. Switch back to direct PostgreSQL connection
2. Investigate pooler configuration
3. Test connection limits locally
4. Deploy with reduced pool size
5. Scale up gradually
*Recovery time: 1-2 hours*

**If frontend refactoring breaks functionality**:
1. Revert to previous version from git
2. Identify broken component
3. Fix and test in isolation
4. Re-deploy
5. Continue Phase 6
*Recovery time: 30 minutes*

**If load test fails to meet targets**:
1. Identify bottleneck (DB, cache, network, pooler)
2. Profile with DevTools/APM
3. Optimize most impactful area
4. Re-test
5. If still failing, extend Phase 6 timeline
*Recovery time: 4-8 hours*

---

## Part 8: Documentation & Handoff

### 8.1 Deliverables

**Code**:
- ✅ Redis integration (src/lib/redis.js)
- ✅ Cache invalidation logic (in route handlers)
- ✅ PgBouncer Docker config
- ✅ Prometheus metrics endpoint
- ✅ Grafana dashboard JSON
- ✅ Refactored frontend components
- ✅ Unified API client

**Documentation**:
- ✅ PHASE-6-DELIVERY.md (results, metrics)
- ✅ SCALING-STRATEGY-PHASE-6.md (how to scale further)
- ✅ MONITORING-GUIDE.md (dashboard tutorial)
- ✅ FRONTEND-ARCHITECTURE.md (component guide)
- ✅ API-CLIENT-GUIDE.md (how to use new client)
- ✅ LOAD-TEST-RESULTS.md (performance data)

**Tests**:
- ✅ Cache integration tests (8+ tests)
- ✅ API client tests (5+ tests)
- ✅ Component tests (15+ tests)
- ✅ Load test scenarios (3+ scenarios)
- ✅ All existing 27 tests still passing

**Monitoring**:
- ✅ Grafana dashboard operational
- ✅ Alert rules configured
- ✅ Slack webhook working
- ✅ 30-day metrics retention

### 8.2 Knowledge Transfer

**For Future Developers**:
1. Read ARCHITECTURE.md (updated with Phase 6 changes)
2. Review MONITORING-GUIDE.md for dashboard usage
3. Review SCALING-STRATEGY-PHASE-6.md before scaling
4. Run `npm run load-test` to understand performance
5. Check git commit messages for implementation details

**Training Sessions** (Post-Phase 6):
- [ ] Redis & cache strategy (30 min)
- [ ] PgBouncer troubleshooting (30 min)
- [ ] Dashboard & alerts (15 min)
- [ ] Component architecture (45 min)

---

## Part 9: Success Metrics Dashboard

### Phase 6 Scorecard

| Metric | Phase 5 | Phase 6 Target | Result | Status |
|--------|---------|---|--------|--------|
| **Response Time P95** | 300-400ms | <200ms | TBD | ⏳ |
| **Throughput** | 12.5 req/sec | 25+ req/sec | TBD | ⏳ |
| **Concurrent Users** | 50 | 100+ | TBD | ⏳ |
| **Error Rate** | ~3% | <0.1% | TBD | ⏳ |
| **Cache Hit Ratio** | N/A | 60%+ | TBD | ⏳ |
| **Test Coverage** | 27 tests (40%) | 70+ tests (80%+) | TBD | ⏳ |
| **Bundle Size** | ~77KB | <50KB | TBD | ⏳ |
| **Lighthouse Score** | ~75 | >90 | TBD | ⏳ |
| **Uptime** | 99.5% | 99.9% | TBD | ⏳ |

---

## Part 10: Appendix & References

### 10.1 Technology Stack (Phase 6 Additions)

| Layer | Component | Version | Purpose | Cost |
|-------|-----------|---------|---------|------|
| **Cache** | Redis | 7.x | Distributed caching | Free (Upstash) |
| | redis npm | 4.x | Node.js client | Free |
| **Pooling** | PgBouncer | 1.18+ | Connection pooling | Free |
| | Docker | 20.x | Containerization | Free |
| **Monitoring** | Prometheus | 2.4x | Metrics storage | Free |
| | Grafana | 9.x | Visualization | Free |
| | prom-client | 14.x | Metrics export | Free |
| **Frontend** | React | 18.x | UI framework | Free |
| | React Testing Library | 13.x | Component testing | Free |
| | Storybook | 7.x | Component docs | Free |

**Total New Cost**: $0-14/month (Neon + Upstash free tiers)

### 10.2 Resource Links

- Redis Documentation: https://redis.io/docs/
- PgBouncer Documentation: https://www.pgbouncer.org/
- Prometheus Documentation: https://prometheus.io/docs/
- Grafana Documentation: https://grafana.com/docs/
- React Hooks: https://react.dev/reference/react/hooks
- React Testing Library: https://testing-library.com/

### 10.3 File Structure (After Phase 6)

```
dealer-sourcing/
├── src/
│   ├── lib/
│   │   ├── db.js                    (PostgreSQL + pooling)
│   │   ├── redis.js                 (Redis client, NEW)
│   │   ├── prometheus-metrics.js    (Metrics export, NEW)
│   │   └── alerts.js                (Alert logic, NEW)
│   ├── routes/
│   │   ├── sourcing.js              (with cache)
│   │   ├── search.js                (with cache)
│   │   ├── metrics.js               (Prometheus format, NEW)
│   │   └── dashboard.js             (Grafana auth, NEW)
│   └── frontend/
│       ├── apiClient.js             (unified, REFACTORED)
│       ├── components/              (refactored, NEW structure)
│       │   ├── Layout/
│       │   ├── Auth/
│       │   ├── Sourcing/
│       │   └── Dashboard/
│       ├── hooks/                   (custom hooks, NEW)
│       ├── context/                 (Context API, NEW)
│       └── App.jsx                  (refactored, <15KB)
├── docker-compose.yml               (PgBouncer + Grafana, NEW)
├── grafana/
│   └── dashboards/
│       └── dealer-sourcing.json     (dashboard config, NEW)
├── test/
│   ├── cache.integration.js         (Redis tests, NEW)
│   ├── api-client.test.js           (API client tests, NEW)
│   ├── components/                  (component tests, NEW)
│   └── load/                        (load tests)
└── docs/
    ├── PHASE-6-PRD.md              (this file)
    ├── PHASE-6-DELIVERY.md         (results, NEW)
    ├── SCALING-STRATEGY-PHASE-6.md (scaling guide, NEW)
    ├── MONITORING-GUIDE.md         (dashboard guide, NEW)
    ├── FRONTEND-ARCHITECTURE.md    (component guide, NEW)
    └── API-CLIENT-GUIDE.md         (client usage, NEW)
```

---

## Summary

**Phase 6 is a critical phase that transforms dealer-sourcing from a viable MVP into a scalable, observable platform.**

### Key Achievements:
1. **Performance**: Sub-200ms p95 latency via Redis caching & PgBouncer pooling
2. **Scalability**: Support 100+ concurrent users with PgBouncer
3. **Reliability**: Real-time monitoring with Grafana + alerting
4. **Maintainability**: Refactored frontend + consolidated API client
5. **Quality**: 80%+ test coverage + comprehensive observability

### Investment Required:
- **Time**: 90-120 hours (2-3 weeks)
- **Cost**: $0-14/month (free tier leveraging)
- **Team**: 5 agents (@dev, @data-engineer, @devops, @ux-design-expert, @pm)

### Next Steps (After Phase 6):
- Phase 6 deployment & production validation (1 week)
- Phase 7: Advanced features (GraphQL, real-time sync, mobile app)
- Phase 8: AI/ML features (recommendation engine, predictive sourcing)

---

**Prepared by**: @pm (Morgan - Product Manager)
**Reviewed by**: @architect (Aria), @data-engineer (Dara)
**Status**: 🟢 READY FOR EXECUTION
**Created**: 2026-03-28
**Version**: 1.0.0

---

**Questions?** Refer to the detailed section for each story, or ask in team channel.

