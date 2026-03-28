# Dealer Sourcing Squad v2.0

![Status](https://img.shields.io/badge/Phase-5%20Ready-brightgreen)
![Tests](https://img.shields.io/badge/Tests-40%2F40%20Passing-green)
![Coverage](https://img.shields.io/badge/Coverage-30%25-yellow)
![QA Gate](https://img.shields.io/badge/QA%20Gate-PASS-brightgreen)

Full-stack MVP platform for premium vehicle sourcing and dealer CRM operations.

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Setup database
node db/migrate.js apply
node db/migrate.js seed

# Start backend (Render locally)
npm run dev:server

# Start frontend (Vite dev server)
npm run dev

# Run tests
npm test
```

**Backend**: http://localhost:3000
**Frontend**: http://localhost:5173

### Production Deployment

```bash
# Backend → Render
git push render main

# Frontend → Vercel
vercel deploy --prod
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│ Frontend Layer (React 18 + Vite)                        │
│ - App.jsx (monolithic, 77KB)                            │
│ - SourcingList component                                │
│ - 7 API modules (Dashboard, Inventory, CRM, etc.)       │
└─────────────────────────┬───────────────────────────────┘
                          │ HTTP/REST
┌─────────────────────────▼───────────────────────────────┐
│ Backend Layer (Express.js + Node.js)                    │
│ - 8 route modules (sourcing, health, etc.)              │
│ - JWT auth middleware                                   │
│ - In-memory cache (5-min TTL)                           │
│ - Connection pooling (max 20)                           │
└─────────────────────────┬───────────────────────────────┘
                          │ PostgreSQL
┌─────────────────────────▼───────────────────────────────┐
│ Database Layer (PostgreSQL 15)                          │
│ - 6 migration tables (UUID PKs)                         │
│ - 4 runtime tables (INTEGER FKs - dual schema)          │
│ - RLS policies (user isolation)                         │
│ - 12 performance indexes                                │
│ - 3 triggers (audit, sync, validation)                  │
└─────────────────────────────────────────────────────────┘
```

## API Contract (5 Endpoints)

### Sourcing APIs

```
GET /sourcing/list
  Pagination: limit (1-100), offset (≥0)
  Response: { results: Vehicle[], total: number, cache_hit: boolean }
  Cache: 5 minutes in-memory

GET /sourcing/search
  Filters: make, model, priceMin, priceMax, kmMax, discountMin
  Scoring: deterministic (discount + km + age)
  Pagination: limit, offset

GET /sourcing/:id
  Returns: Single vehicle detail

POST /sourcing/:id/interested
  Body: { note: string }
  Transaction: ACID INSERT interested_vehicles + search_queries
  Error: 409 if already marked

GET /sourcing/favorites
  Auth Required: JWT
  Isolation: WHERE user_id = authenticated_user
  Filter: optional status parameter
```

## Phase 4 QA Sign-Off

✅ **Overall Status**: PASS (94% confidence, A grade)
✅ **Endpoints**: 5/5 implemented (100% coverage)
✅ **Tests**: 40/40 passing
✅ **Security**: No critical/high issues
✅ **Performance**: All endpoints <1s
✅ **Documentation**: Complete (PHASE-4-DELIVERY.md)

### Known Tech Debt (Phase 5+)

| ID | Title | Severity | Effort | Phase |
|----|-------|----------|--------|-------|
| MED-001 | JWT hardcoded UUID | MEDIUM | 1h | 5 |
| MED-002 | Pool monitoring | MEDIUM | 3h | 5+ |
| LOW-001 | Redis caching | LOW | 4h | 5+ |
| LOW-002 | Schema UUID unification | LOW | 8h | 5+ |
| LOW-003 | API client consolidation | LOW | 3h | 5+ |
| LOW-004 | Monolithic App.jsx refactor | LOW | 6h | 5+ |
| LOW-005 | Error middleware enhancement | LOW | 2h | 5+ |
| LOW-006 | Real Puppeteer scrapers | LOW | 8h | 5+ |

## Development Phases

| Phase | Status | Deliverable | Owner |
|-------|--------|-------------|-------|
| 1 | ✅ Complete | Project brief, market research | @analyst |
| 2 | ✅ Complete | PRD, frontend spec | @pm, @ux |
| 3 | ✅ Complete | Database schema + migrations | @data-engineer |
| 4 | ✅ Complete | 5 APIs + 40 tests | @dev |
| 4 QA | ✅ PASS | Quality gate review | @qa |
| 5 | 🔄 Planning | JWT, monitoring, caching | @dev, @data-engineer |
| 6 | ✅ Complete | Render + Vercel deployment | @devops |
| 7 | ✅ Complete | Frontend implementation | @dev, @ux |

## Getting Involved

### Starting Phase 5 Work

1. **For @dev (Dex)**: Start with STORY-501 (JWT implementation) - 1h effort
2. **For @data-engineer (Dara)**: Start with STORY-502 (pool monitoring) - 3h
3. **For @ux-design-expert**: App.jsx refactor planning (STORY-506)

### Creating New Features

1. Create story in `docs/stories/`
2. Add tasks with AC and checklist
3. Link to Phase 5+ initiatives or new phases
4. Estimate effort and points
5. Assign to appropriate agent

## Monitoring & Observability

### Current Metrics

- Health check: `GET /health` (30s interval, Render)
- Test coverage: 30% threshold
- Response times: All endpoints <1s
- Cache hit rate: Not yet monitored (Phase 5 item)

### Phase 5 Additions

- Connection pool metrics (active/idle/waiting)
- Query slow logs (>1000ms)
- Cache hit/miss ratio
- JWT token expiration alerts
- Database lock monitoring

## Deployment Topology

### Production

- **Backend**: Render Web Service + Managed PostgreSQL
- **Frontend**: Vercel (static + SPA routing)
- **CI/CD**: GitHub Actions → Render webhook
- **DNS**: Route53 (assumed, not configured yet)

### Render Configuration

```yaml
services:
  - type: web
    name: dealer-sourcing-api
    buildCommand: npm install
    startCommand: node src/server.js
    envVars:
      - DATABASE_URL (auto-managed PostgreSQL)
      - JWT_SECRET
      - NODE_ENV=production
      - ALLOWED_ORIGINS=vercel-domain.vercel.app
```

### Vercel Configuration

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "VITE_API_URL": "https://render-app.onrender.com",
    "VITE_API_TIMEOUT": "5000"
  }
}
```

## Testing Strategy

### Test Pyramid

```
        ▲
       ╱ ╲
      ╱ E2E ╲        (smoke tests, production.test.js)
     ╱       ╲
    ╱────────────╲
   ╱ Integration  ╲   (40 tests, sourcing.test.js)
  ╱──────────────────╲
 ╱   Unit Tests       ╲  (inline validators, utilities)
╱──────────────────────╲
```

### Running Tests

```bash
# All tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage

# Production smoke test
npm run test:production
```

## Database Migrations

Located in `db/migrations/`:

1. `001_initial_schema.sql` - Tables, RLS, indexes, triggers
2. `002_seed_data.sql` - Test data for development
3. `003_unify-schema-uuid.sql` - Phase 5 (planned, UUID unification)

**Important**: Migrations are cumulative and idempotent.

```bash
# Apply all pending migrations
node db/migrate.js apply

# Rollback last migration
node db/migrate.js rollback

# Seed data
npm run seed
```

## Common Development Tasks

### Add a new endpoint

1. Create route in `src/routes/{module}.js`
2. Add validation in `src/utils/validators.js`
3. Write tests in `test/integration/{module}.test.js`
4. Update `docs/ARCHITECTURE.md` API Contract section
5. Run `npm test` to verify

### Debug slow query

1. Check `src/config/database.js` slow-query warning (>1000ms)
2. Run `EXPLAIN ANALYZE` on PostgreSQL
3. Add index if needed: `CREATE INDEX ... ON ... (...)`
4. Test with `npm run test:production`

### Deploy to production

```bash
# Verify tests pass locally
npm test

# Push to main branch
git push origin main

# Render auto-deploys via webhook
# Monitor: https://dashboard.render.com/
```

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React | 18.2.0 |
| Frontend Build | Vite | 5.0.8 |
| Backend | Express.js | 4.18.2 |
| Auth | JWT | 9.0.0 |
| Database | PostgreSQL | 15 |
| ORM | node-pg | 8.11.3 |
| Testing | Jest | 29.7.0 |
| Testing | supertest | 6.3.3 |

## Troubleshooting

### Issue: Tests fail with "ECONNREFUSED"

**Solution**: Ensure PostgreSQL is running and DATABASE_URL is correct.

```bash
echo $DATABASE_URL
# Should output: postgresql://user:pass@host:port/dbname
```

### Issue: Frontend can't reach backend

**Solution**: Check VITE_API_URL environment variable and CORS configuration.

```bash
# Frontend .env
VITE_API_URL=http://localhost:3000

# Backend src/server.js
const whitelist = process.env.ALLOWED_ORIGINS.split(',');
```

### Issue: JWT token expired in testing

**Solution**: Tests auto-generate valid JWT tokens with 7-day expiry.

```javascript
const token = jwt.sign({ sub: userId }, process.env.JWT_SECRET);
// Tokens valid for 7 days from generation
```

## Resources

- **Architecture**: [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md)
- **Phase 4 QA Review**: [docs/qa/PHASE-4-QA-REVIEW.md](../../docs/qa/PHASE-4-QA-REVIEW.md)
- **QA Follow-ups**: [docs/qa/QA-FOLLOWUPS.md](../../docs/qa/QA-FOLLOWUPS.md)
- **Phase 4 Delivery**: [PHASE-4-DELIVERY.md](../../PHASE-4-DELIVERY.md)
- **Implementation Status**: [IMPLEMENTATION_STATUS.md](../../IMPLEMENTATION_STATUS.md)

## Contact & Support

- **Questions**: Reach out to @architect (Aria) or @dev (Dex)
- **Issues**: Create story in `docs/stories/` or discuss in standup
- **Phase 5 Planning**: Contact @pm (Morgan) for prioritization

---

**Squad Status**: ✅ MVP Phase 4 Complete, 🔄 Phase 5 Planned, 🚀 Production Ready

*Last Updated*: 2026-03-28 by @aios-master (Orion)
