# STORY-601: Redis Integration & Setup
**Phase 6 - Caching Layer Foundation**

**Status**: 📋 Ready for Development
**Effort**: 6-8 hours
**Owner**: @dev (Dex)
**Priority**: CRITICAL
**Created**: 2026-03-28

---

## Story Summary

Implement Redis as a distributed cache layer to eliminate database round-trips and reduce response latency. This foundation enables Phase 6's performance improvements.

**Goal**: Deploy Redis client, health checks, and fallback logic in production.

---

## Acceptance Criteria

### AC-1: Redis Client Integration
- [ ] Redis npm package installed and configured
- [ ] src/lib/redis.js module created with singleton pattern
- [ ] Connection pooling configured (min 5, max 20)
- [ ] Environment variables: REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
- [ ] Works in development (localhost:6379) and production (Upstash/Neon Redis)

### AC-2: Health Check Endpoint
- [ ] GET /api/cache/health responds with Redis status
- [ ] Response format: `{ status: 'healthy'|'degraded', latency_ms: 5 }`
- [ ] Endpoint accessible without authentication
- [ ] Used by deployment health checks

### AC-3: Graceful Degradation
- [ ] API continues working if Redis unavailable
- [ ] Cache.get() returns null (cache miss) if Redis fails
- [ ] Cache.set() silently fails (no error thrown)
- [ ] All errors caught in try-catch blocks
- [ ] Errors logged to application logger

### AC-4: Error Handling
- [ ] Connection timeouts handled (< 5 second timeout)
- [ ] Invalid commands handled gracefully
- [ ] Reconnection logic with exponential backoff
- [ ] All errors logged with context (operation, key, error)
- [ ] No unhandled promise rejections

### AC-5: Testing
- [ ] Unit tests for Redis module (4+ tests)
- [ ] Integration tests with real Redis (staging)
- [ ] All existing 27 tests still passing
- [ ] Tests cover: success, timeout, connection failure, invalid data
- [ ] 100% code coverage for src/lib/redis.js

### AC-6: Production Deployment
- [ ] Successfully deployed to Render staging
- [ ] Health check endpoint responsive
- [ ] No errors in Render logs
- [ ] Connects to Upstash Redis (free tier) or Neon Redis addon
- [ ] 24-hour stability period with zero crashes

---

## Technical Implementation

### 1. Redis Module (src/lib/redis.js)

```javascript
const redis = require('redis');

let client = null;

const createClient = async () => {
  const redisURL = process.env.REDIS_URL ||
    `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;

  const redisClient = redis.createClient({
    url: redisURL,
    password: process.env.REDIS_PASSWORD,
    socket: {
      reconnectStrategy: (retries) => {
        const delay = Math.min(retries * 50, 500);
        console.log(`[Redis] Reconnecting... (attempt ${retries})`);
        return delay;
      },
      keepAlive: 30000,
      connectTimeout: 10000,
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: false,
    enableOfflineQueue: true,
  });

  redisClient.on('connect', () => {
    console.log('[Redis] Connected');
  });

  redisClient.on('error', (err) => {
    console.error('[Redis] Error:', err.message);
  });

  redisClient.on('ready', () => {
    console.log('[Redis] Ready');
  });

  await redisClient.connect().catch((err) => {
    console.warn('[Redis] Connection failed (continuing without cache):', err.message);
  });

  return redisClient;
};

const getClient = async () => {
  if (!client) {
    client = await createClient();
  }
  if (!client.isOpen) {
    await client.connect().catch(() => {
      console.warn('[Redis] Connection failed, returning null');
      return null;
    });
  }
  return client;
};

const get = async (key) => {
  try {
    const c = await getClient();
    if (!c) return null;
    const value = await c.get(key);
    if (value) {
      console.log(`[Cache] HIT: ${key}`);
      return JSON.parse(value);
    }
    console.log(`[Cache] MISS: ${key}`);
    return null;
  } catch (err) {
    console.error(`[Cache] GET error for ${key}:`, err.message);
    return null; // Graceful fallback
  }
};

const set = async (key, value, ttl = 300) => {
  try {
    const c = await getClient();
    if (!c) return false;
    await c.setEx(key, ttl, JSON.stringify(value));
    console.log(`[Cache] SET: ${key} (TTL: ${ttl}s)`);
    return true;
  } catch (err) {
    console.error(`[Cache] SET error for ${key}:`, err.message);
    return false; // Graceful fallback
  }
};

const del = async (key) => {
  try {
    const c = await getClient();
    if (!c) return false;
    await c.del(key);
    console.log(`[Cache] DEL: ${key}`);
    return true;
  } catch (err) {
    console.error(`[Cache] DEL error for ${key}:`, err.message);
    return false;
  }
};

const flushDb = async () => {
  try {
    const c = await getClient();
    if (!c) return false;
    await c.flushDb();
    console.log('[Cache] FLUSH: All keys deleted');
    return true;
  } catch (err) {
    console.error('[Cache] FLUSH error:', err.message);
    return false;
  }
};

const health = async () => {
  try {
    const start = Date.now();
    const c = await getClient();
    if (!c) return { status: 'disconnected', latency_ms: -1 };

    await c.ping();
    const latency = Date.now() - start;
    return { status: 'healthy', latency_ms: latency };
  } catch (err) {
    console.error('[Redis] Health check failed:', err.message);
    return { status: 'unhealthy', latency_ms: -1, error: err.message };
  }
};

module.exports = {
  get,
  set,
  del,
  flushDb,
  health,
  getClient,
};
```

### 2. Health Check Endpoint (src/routes/cache.js)

```javascript
const express = require('express');
const redis = require('../lib/redis');

const router = express.Router();

// GET /api/cache/health
router.get('/health', async (req, res) => {
  try {
    const health = await redis.health();
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (err) {
    console.error('[Cache Health] Error:', err.message);
    res.status(503).json({ status: 'error', error: err.message });
  }
});

module.exports = router;
```

### 3. Integration with Server (src/server.js)

```javascript
const cacheRouter = require('./routes/cache');

// Add cache routes
app.use('/api/cache', cacheRouter);

// Example: GET routes with caching in place (STORY-602)
// To be implemented with cache invalidation strategy
```

### 4. Environment Variables (.env)

```env
# Redis Configuration
REDIS_URL=redis://default:password@host:6379
# OR
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password

# Development (no password)
REDIS_URL=redis://localhost:6379

# Production (Upstash)
REDIS_URL=redis://:your-upstash-token@your-upstash-host:your-upstash-port
```

---

## Testing Strategy

### Unit Tests (test/redis.unit.js)

```javascript
const redis = require('../src/lib/redis');

describe('Redis Module', () => {
  // Test 1: Set and get value
  it('should set and retrieve a value', async () => {
    const key = 'test:key';
    const value = { data: 'test' };
    await redis.set(key, value);
    const retrieved = await redis.get(key);
    expect(retrieved).toEqual(value);
  });

  // Test 2: Expire on TTL
  it('should expire key after TTL', async () => {
    const key = 'test:expire';
    await redis.set(key, 'value', 1); // 1 second TTL
    await new Promise(r => setTimeout(r, 1100));
    const value = await redis.get(key);
    expect(value).toBeNull();
  });

  // Test 3: Delete key
  it('should delete a key', async () => {
    const key = 'test:delete';
    await redis.set(key, 'value');
    await redis.del(key);
    const value = await redis.get(key);
    expect(value).toBeNull();
  });

  // Test 4: Graceful degradation
  it('should gracefully handle missing Redis', async () => {
    // Mock Redis as unavailable
    const result = await redis.get('any:key');
    expect(result).toBeNull(); // Doesn't crash
  });
});
```

### Integration Tests (test/redis.integration.js)

```javascript
// Test against real Redis instance
// Requires Redis running locally (docker run -d -p 6379:6379 redis)

const redis = require('../src/lib/redis');

describe('Redis Integration', () => {
  it('should connect to Redis and ping', async () => {
    const health = await redis.health();
    expect(health.status).toBe('healthy');
    expect(health.latency_ms).toBeGreaterThan(-1);
  });

  it('should handle concurrent operations', async () => {
    const promises = [];
    for (let i = 0; i < 100; i++) {
      promises.push(redis.set(`key:${i}`, { value: i }, 300));
    }
    const results = await Promise.all(promises);
    expect(results.every(r => r === true)).toBe(true);
  });
});
```

---

## Deployment Checklist

### Development (Local)

- [ ] npm install redis
- [ ] Start Redis: `docker run -d -p 6379:6379 redis:latest`
- [ ] Set REDIS_URL in .env.local
- [ ] Test endpoint: `curl http://localhost:3000/api/cache/health`
- [ ] Response should be: `{ "status": "healthy", "latency_ms": 5 }`

### Staging (Render)

- [ ] Create Render Redis instance (free tier: 30MB)
  - Option 1: Upstash (free: 10MB, $0.2/GB)
  - Option 2: Neon Redis addon
- [ ] Add REDIS_URL to Render environment
- [ ] Deploy via: `git push origin main`
- [ ] Verify health check: `curl https://dealer-sourcing-api.onrender.com/api/cache/health`

### Production

- [ ] Use same Upstash/Neon instance (no separate prod instance needed for MVP)
- [ ] Monitor Redis memory usage weekly
- [ ] Scale if >80% usage

---

## Success Metrics

| Metric | Target | Validation |
|--------|--------|-----------|
| Health check latency | <50ms | curl /api/cache/health |
| Connection success rate | 100% | 1000 connections, 0 failures |
| Graceful degradation | Works without Redis | Test with Redis offline |
| Memory overhead | <100MB | Monitor Render metrics |
| Error logging | All errors captured | Check logs for errors |

---

## Dependencies & Resources

**npm Packages**:
- redis@4.x - Node.js Redis client

**Services**:
- Upstash (free tier) or Neon Redis addon

**Documentation**:
- https://redis.io/docs/
- https://www.npmjs.com/package/redis

---

## Effort Breakdown

| Task | Hours | Notes |
|------|-------|-------|
| Module implementation | 2 | redis.js, health check |
| Testing (unit + integration) | 2 | 8+ tests |
| Deployment & validation | 1 | Local → Staging → Prod |
| Documentation | 1 | This story + README |
| **Total** | **6-8h** | ~1 day |

---

## Sign-Off Template

```
[ ] Implementation complete
[ ] All 4 acceptance criteria met
[ ] 8+ tests passing
[ ] Health check endpoint working
[ ] Production deployment successful
[ ] Zero errors in logs

SIGNED BY: @dev (Dex)
DATE: TBD
```

---

**Next Story**: STORY-602 (Cache Invalidation Strategy)
**Depends On**: STORY-601 (this story)
