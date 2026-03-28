# Technology Stack - dealer-sourcing

## Frontend

| Component | Technology | Version | Rationale |
|-----------|-----------|---------|-----------|
| **UI Library** | React | 18.2.0 | Modern, component-based, SSR-optional |
| **Build Tool** | Vite | 5.0.8 | Fast HMR, optimized production builds |
| **HTTP Client** | Fetch API | native | Modern, Promise-based, no extra deps |
| **State Management** | useState/useEffect | native | MVP - simple, Redux not needed yet |
| **Styling** | Inline styles | native | Works for MVP, CSS modules in Phase 5 |

### Why These Choices

- **React**: Easy to scale, vast ecosystem, familiar to most developers
- **Vite**: 10x faster than Webpack, excellent DX for MVP
- **Fetch**: No need for axios/superagent, native Promise support
- **No Redux/Zustand**: Premature for single-tenant MVP
- **Inline styles**: Quick iteration, no CSS pipeline needed yet

### Phase 5 Upgrades (Optional)

- CSS modules or Tailwind for styling
- React Query for data fetching
- Redux Toolkit if state complexity grows
- Next.js if SSR needed

---

## Backend

| Component | Technology | Version | Rationale |
|-----------|-----------|---------|-----------|
| **Framework** | Express.js | 4.18.2 | Lightweight, standard Node.js framework |
| **Runtime** | Node.js | 18+ | LTS, good performance, minimal ops |
| **Authentication** | JWT | jsonwebtoken 9.0.0 | Stateless, scalable, industry standard |
| **Database Driver** | node-pg | 8.11.3 | Native PostgreSQL driver, connection pooling |
| **Password Hashing** | bcryptjs | 2.4.3 | Slow, resistant to brute force |
| **CORS** | cors | 2.8.5 | Security, cross-origin requests |
| **Environment** | dotenv | 16.3.1 | Config management, secrets |
| **HTTP Requests** | axios | 1.6.2 | For scrapers, Puppeteer integration |
| **Headless Browser** | Puppeteer | 21.6.1 | Web scraping, vehicle data collection |

### Why These Choices

- **Express.js**: Minimal overhead, excellent for REST APIs
- **JWT**: No session storage needed, scales horizontally
- **node-pg**: Direct control, connection pooling support
- **bcryptjs**: Synchronous hashing (adequate for MVP)
- **Puppeteer**: Reliable scraping from OLX, WebMotors (headless Chrome)

### Phase 5 Optimizations

- Connection pooling monitoring (PgBouncer optional)
- Query caching layer (Redis or in-memory)
- Background job processing (Bull, RabbitMQ)
- API rate limiting
- Request/response compression

---

## Database

| Component | Technology | Version | Rationale |
|-----------|-----------|---------|-----------|
| **RDBMS** | PostgreSQL | 15 | Mature, reliable, rich features (RLS) |
| **Connection Pooling** | node-pg Pool | 20 max | Lightweight, adequate for MVP |
| **Schema Management** | Raw SQL | manual | Version-controlled migrations |
| **Security** | RLS (Row Level Security) | native | User isolation at DB level |

### Why PostgreSQL

- Row-Level Security (RLS) for multi-tenant isolation
- Mature transactions (ACID compliance)
- Excellent full-text search (future)
- JSON support (flexible schema)
- Triggers for audit trails

### Connection Pool Settings

```javascript
{
  max: 20,                    // MVP sufficient
  idleTimeoutMillis: 30000,   // Clean up idle connections
  connectionTimeoutMillis: 2000 // Fast fail on DB down
}
```

### Phase 5 Improvements

- Connection pool monitoring → detect exhaustion
- Query slow logs → identify optimization opportunities
- Read replicas for reporting (if needed)
- Backup automation → disaster recovery

---

## Testing

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Test Framework** | Jest | 29.7.0 | Comprehensive, fast, snapshot testing |
| **HTTP Testing** | supertest | 6.3.3 | HTTP assertion library |
| **Coverage** | Jest coverage | built-in | 30% threshold for MVP |

### Test Types

1. **Integration Tests** (40 tests, sourcing.test.js)
   - Full API endpoint testing
   - Database interaction verification
   - RLS isolation testing
   - ACID transaction validation

2. **Smoke Tests** (production.test.js)
   - Production endpoint health checks
   - Real API calls (no mocking)
   - Regression detection

3. **Unit Tests** (inline validators)
   - Input validation functions
   - Business logic helpers
   - Utility functions

---

## Deployment Infrastructure

| Component | Technology | Service | Rationale |
|-----------|-----------|---------|-----------|
| **Backend Server** | Render | Managed PaaS | Auto-scaling, built-in PostgreSQL, GitHub integration |
| **Frontend Hosting** | Vercel | CDN + Edge | Next.js-like SPA support, automatic deployments |
| **PostgreSQL** | Render Managed | PostgreSQL 15 | Automated backups, high availability option |
| **DNS** | (Not configured) | AWS Route53 assumed | Domain management |
| **CI/CD** | GitHub Actions | Automation | Webhook to Render on push |

### Why These Platforms

- **Render**: Excellent for Node.js, free tier for MVP, GitHub integration
- **Vercel**: Optimized for frontend, instant deployments, SPA routing built-in
- **Managed PostgreSQL**: No ops overhead, automated backups

### Phase 5+ Infrastructure

- CDN for static assets (CloudFlare, AWS CloudFront)
- Database read replicas for scaling
- Redis for distributed caching
- Message queue (Redis, RabbitMQ) for async jobs
- Application monitoring (Sentry, DataDog)

---

## Development Tools

| Tool | Purpose | Version |
|------|---------|---------|
| **npm** | Package manager | 9.0+ |
| **git** | Version control | 2.0+ |
| **ESLint** | Code linting | 8.55.0 |
| **Prettier** | Code formatting | 3.1.1 |
| **Node.js** | Runtime | 18+ |

### Commands

```bash
npm install          # Install deps
npm run dev:server   # Dev backend (watch mode)
npm run dev          # Dev frontend (Vite)
npm test             # Run all tests
npm run lint         # ESLint check
npm run format       # Prettier format
npm run build        # Production build
```

---

## Architectural Decisions

### 1. Monolithic Backend (Express.js)
**Decision**: Single Node.js process, 8 route modules
**Alternative**: Microservices
**Trade-off**: Simplicity vs. scalability (Phase 5: plan refactoring)

### 2. In-Memory Cache
**Decision**: vehicleCache[] with 5-min TTL, no external storage
**Alternative**: Redis from day 1
**Trade-off**: MVP speed vs. single-process deployment risk (Phase 5: add Redis)

### 3. JWT Without Refresh Tokens
**Decision**: 7-day expiry, no refresh rotation
**Alternative**: OAuth 2.0 with refresh token rotation
**Trade-off**: Simpler implementation vs. security best practices

### 4. Monolithic React Component (App.jsx)
**Decision**: Single 77KB component with 7 view modules
**Alternative**: Feature-based folder structure
**Trade-off**: Quick development vs. maintainability (Phase 5: refactor)

### 5. Hardcoded Test UUID
**Decision**: userId hardcoded to test UUID in MVP
**Alternative**: Extract from JWT in Phase 4
**Trade-off**: MVP speed vs. true multi-tenant isolation (STORY-501)

---

## Comparison to Alternatives

### Frontend

| Framework | Pros | Cons |
|-----------|------|------|
| **React (chosen)** | Large ecosystem, component reuse | Learning curve, SPA limitations |
| Vue 3 | Simpler syntax, less boilerplate | Smaller ecosystem, fewer packages |
| Svelte | Smallest bundle, reactive | Newer, less StackOverflow answers |

### Backend

| Framework | Pros | Cons |
|-----------|------|------|
| **Express.js (chosen)** | Lightweight, minimal deps | Less opinionated, more boilerplate |
| Next.js | Full-stack, automatic API routes | Opinionated, not pure backend |
| Fastify | Faster than Express | Smaller ecosystem |
| Nest.js | Modular, decorator-based | Heavyweight, enterprise-focused |

### Database

| DBMS | Pros | Cons |
|------|------|------|
| **PostgreSQL (chosen)** | RLS, JSON, reliability | Operational complexity |
| MongoDB | Flexible schema, scaling | Transactions less mature, no RLS |
| MySQL | Simpler than PostgreSQL | No RLS, fewer features |
| Supabase | Managed PostgreSQL + APIs | More expensive, vendor lock-in |

---

## Future Tech Debt & Improvements

1. **Phase 5**: JWT real implementation, Redis caching, pool monitoring
2. **Phase 6**: React refactoring (modular components), CSS framework
3. **Phase 7**: Microservices architecture (if scaling required)
4. **Phase 8**: GraphQL (if API complexity grows)
5. **Phase 9**: Real-time updates (WebSockets, live vehicle feeds)

---

*Last Updated*: 2026-03-28 | *Reviewed By*: @architect, @dev
