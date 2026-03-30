# Changelog

All notable changes to Dealer Sourcing Bot will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2026-03-29

### Added - STORY-601: Redis Integration & Setup (Phase 6)

#### Features
- **Redis Caching Layer**: Singleton pattern with connection pooling (5-20 connections)
- **Graceful Degradation**: API continues working even if Redis is unavailable
- **Health Check Endpoints**:
  - `GET /api/cache/health` - Returns Redis status and latency
  - `DELETE /api/cache/flush` - Clear all cache (admin/testing)
- **TTL Support**: Automatic cache expiration (configurable, default 5 minutes)
- **JSON Serialization**: Automatic object/array handling
- **Exponential Backoff**: Automatic reconnection with intelligent retry strategy

#### Cache Operations
- `get(key)` - Retrieve cached value (returns null if unavailable)
- `set(key, value, ttl)` - Store value with TTL (returns boolean)
- `del(key)` - Remove cached entry (returns boolean)
- `flushDb()` - Clear all cache (returns boolean)
- `health()` - Check Redis connection status

#### Infrastructure
- **Local Development**: Docker support, WSL support
- **Production**: Railway Redis add-on compatible
- **Configuration**: Via `REDIS_URL` env var or individual host/port/password vars

#### Testing
- **Unit Tests**: 40+ test cases covering graceful degradation
- **Integration Tests**: Comprehensive testing with real Redis instance
- **Test Framework**: Vitest with 15-30 second timeouts

#### Files Changed
- `src/lib/redis.js` - Core Redis client module (singleton, connection pooling)
- `src/routes/cache.js` - Express router for cache endpoints
- `src/server.js` - Added cache routes mounting
- `test/redis.test.js` - Unit tests (40+ cases)
- `test/redis.integration.test.js` - Integration tests (9+ suites)
- `.env.local` - Added REDIS_URL configuration
- `.env.production` - Added REDIS_URL with Railway instructions
- `package.json` - Added redis@5.11.0 and vitest@1.6.1
- `vitest.config.js` - New Vitest configuration file
- `README.md` - Added Redis setup and usage documentation
- `CHANGELOG.md` - This file

#### Bug Fixes
- Graceful handling of Redis connection failures
- Timeout-based fast failure for unit tests
- Proper error catching in all cache operations

#### Dependencies Added
- `redis` ^5.11.0 - Redis client library
- `vitest` ^1.6.1 - Testing framework (devDependency)

#### Breaking Changes
None - Redis is optional and API remains unchanged.

#### Known Issues
- Local development requires Docker or WSL for Redis (not available natively on Windows)
- npm audit shows 9 vulnerabilities (4 moderate, 5 high) from indirect dependencies - to be addressed in post-release security audit

#### Migration Notes
For existing deployments:
1. Add `REDIS_URL` to production environment variables (Railway provides automatically)
2. Restart application - cache will start working automatically
3. No database migrations required
4. API behavior unchanged if Redis unavailable (graceful degradation)

---

## [1.0.0] - Previous Releases

See earlier commits for Phase 1-5 features (Inventory, Financial, CRM, Sourcing, Deploy).

---

## Standards

### Commit Message Format
```
type(scope): subject

- feat: Add new feature
- fix: Fix bug
- refactor: Code refactoring
- docs: Documentation updates
- test: Test additions/modifications
- chore: Dependency updates, build config
```

### Testing Requirements
- Unit tests required for new features
- Integration tests for critical paths
- Minimum 30% code coverage target

### Code Style
- ESLint configured (npm run lint)
- Prettier formatting (npm run format)
- ES modules (import/export)
