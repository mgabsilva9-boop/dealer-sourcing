# STORY-503: Redis Cache Integration for Horizontal Scaling

**Phase**: Phase 5+
**Assignee**: @dev + @devops
**Story Points**: 8
**Priority**: LOW
**Status**: Ready for Development
**Gate**: Tracked as LOW-001 in Phase 4 QA Review

---

## Summary

Current in-memory cache is lost on deployment or process restart. For horizontal scaling (multiple instances), need distributed Redis cache. MVP works fine with single process, but Phase 5+ requires this for reliability.

## Acceptance Criteria

- [ ] **AC-1**: Redis client initialized on startup
- [ ] **AC-2**: Vehicle cache stored in Redis with 5-min TTL
- [ ] **AC-3**: Cache layer abstraction (works with/without Redis)
- [ ] **AC-4**: Fallback to in-memory if Redis unavailable
- [ ] **AC-5**: Tests pass with Redis mocked

## Tasks

### Task 1: Add Redis client to config
```javascript
// src/config/redis.js
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

redis.on('connect', () => console.log('Redis connected'));
redis.on('error', (err) => console.error('Redis error:', err));

module.exports = redis;
```

**Location**: `src/config/redis.js` (new)
**Effort**: 20 min

### Task 2: Create cache layer abstraction
```javascript
// src/services/cache.js
async function getVehicles(query = '') {
  const cacheKey = `vehicles:${query}`;
  const cached = await cache.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const vehicles = await scrapeMultiplePlatforms(query);
  await cache.setex(cacheKey, 300, JSON.stringify(vehicles));
  return vehicles;
}
```

**Location**: `src/services/cache.js` (new)
**Effort**: 40 min

### Task 3: Update sourcing.js to use cache layer
- Replace in-memory cache with cache service
- Maintain fallback behavior
- Add cache metrics

**Location**: `src/routes/sourcing.js`
**Effort**: 30 min

### Task 4: Add Redis to Docker Compose & environment config
- Redis service configuration
- Environment variable `REDIS_URL`
- Connection pooling settings

**Location**: `docker-compose.yml`, `.env.example`
**Effort**: 20 min

### Task 5: Tests with Redis mock
- Mock redis client in tests
- Verify cache hit/miss behavior
- Test TTL expiration

**Location**: `test/integration/cache.test.js` (new)
**Effort**: 40 min

## Dependencies

- Cache abstraction can be implemented independently
- Requires Redis infrastructure (local or cloud)
- No breaking changes to current API

## Definition of Done

✅ Redis client functional
✅ Cache layer abstraction working
✅ Tests pass with mock Redis
✅ Fallback behavior tested
✅ Documentation updated

## Notes

- Redis overhead: ~$10-20/month for small deployment
- Alternative: use Memcached (simpler, good for this use case)
- Monitor cache hit rate in production
- Consider cache warming strategy

---

**Created By**: @aios-master (Orion)
**Date**: 2026-03-28
**Target Phase**: Phase 5+
