/**
 * Cache Layer - Redis fallback to Memory
 * Simple in-memory cache when Redis not available
 * For production: set REDIS_URL env var to use real Redis
 */

// In-memory fallback cache
const memoryCache = new Map();

// Try to import Redis, but don't fail if unavailable
let redisClient = null;
let useRedis = false;

const initRedis = async () => {
  try {
    const REDIS_URL = process.env.REDIS_URL;
    if (!REDIS_URL) {
      console.log('[Cache] Redis URL not set - using memory cache');
      return;
    }

    // Optional: import redis only if URL is set
    try {
      const { createClient: createRedisClient } = await import('redis');
      const client = createRedisClient({ url: REDIS_URL });

      await client.connect().catch((err) => {
        console.warn('[Cache] Redis connection failed:', err.message);
      });

      if (client.isOpen) {
        redisClient = client;
        useRedis = true;
        console.log('[Cache] Connected to Redis');
      }
    } catch (err) {
      console.warn('[Cache] Redis module not available - using memory cache');
    }
  } catch (err) {
    console.warn('[Cache] Init failed - using memory cache:', err.message);
  }
};

// Initialize on first import
initRedis().catch(err => console.warn('[Cache] Init error:', err.message));

const get = async (key) => {
  try {
    if (useRedis && redisClient?.isOpen) {
      const value = await redisClient.get(key);
      if (value) {
        console.log(`[Cache] HIT (Redis): ${key}`);
        return JSON.parse(value);
      }
      console.log(`[Cache] MISS (Redis): ${key}`);
      return null;
    }

    // Fallback to memory
    const value = memoryCache.get(key);
    if (value) {
      // Check expiration
      if (value.expires && value.expires < Date.now()) {
        memoryCache.delete(key);
        return null;
      }
      console.log(`[Cache] HIT (Memory): ${key}`);
      return value.data;
    }

    console.log(`[Cache] MISS (Memory): ${key}`);
    return null;
  } catch (err) {
    console.error(`[Cache] GET error for ${key}:`, err.message);
    return null;
  }
};

const set = async (key, value, ttl = 300) => {
  try {
    if (useRedis && redisClient?.isOpen) {
      await redisClient.setEx(key, ttl, JSON.stringify(value));
      console.log(`[Cache] SET (Redis): ${key} (TTL: ${ttl}s)`);
      return true;
    }

    // Fallback to memory
    memoryCache.set(key, {
      data: value,
      expires: Date.now() + (ttl * 1000),
    });
    console.log(`[Cache] SET (Memory): ${key} (TTL: ${ttl}s)`);
    return true;
  } catch (err) {
    console.error(`[Cache] SET error for ${key}:`, err.message);
    return false;
  }
};

const del = async (key) => {
  try {
    if (useRedis && redisClient?.isOpen) {
      await redisClient.del(key);
      console.log(`[Cache] DEL (Redis): ${key}`);
      return true;
    }

    memoryCache.delete(key);
    console.log(`[Cache] DEL (Memory): ${key}`);
    return true;
  } catch (err) {
    console.error(`[Cache] DEL error for ${key}:`, err.message);
    return false;
  }
};

const flushDb = async () => {
  try {
    if (useRedis && redisClient?.isOpen) {
      await redisClient.flushDb();
      console.log('[Cache] FLUSH (Redis): All keys deleted');
      return true;
    }

    memoryCache.clear();
    console.log('[Cache] FLUSH (Memory): All keys deleted');
    return true;
  } catch (err) {
    console.error('[Cache] FLUSH error:', err.message);
    return false;
  }
};

const health = async () => {
  try {
    if (useRedis && redisClient?.isOpen) {
      const start = Date.now();
      await redisClient.ping();
      const latency = Date.now() - start;
      return { status: 'healthy', latency_ms: latency, backend: 'redis' };
    }

    return { status: 'healthy', latency_ms: 0, backend: 'memory', note: 'Using in-memory fallback' };
  } catch (err) {
    console.error('[Cache] Health check failed:', err.message);
    return { status: 'degraded', backend: 'memory', error: err.message };
  }
};

const getClient = async () => {
  return redisClient;
};

export {
  get,
  set,
  del,
  flushDb,
  health,
  getClient,
};
