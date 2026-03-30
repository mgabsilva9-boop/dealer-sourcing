/**
 * Redis Cache Client - Singleton Pattern
 * Handles connection pooling, reconnection, graceful degradation
 */

import { createClient } from 'redis';

let client = null;
let isConnecting = false;

const createRedisClient = async () => {
  const redisUrl = process.env.REDIS_URL ||
    `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`;

  // Shorter timeout for unit tests, longer for production
  const connectTimeout = process.env.NODE_ENV === 'test' ? 2000 : 10000;
  const maxRetries = process.env.NODE_ENV === 'test' ? 1 : 3;

  const redisClient = createClient({
    url: redisUrl,
    password: process.env.REDIS_PASSWORD || undefined,
    socket: {
      reconnectStrategy: (retries) => {
        // In test mode, give up faster
        if (process.env.NODE_ENV === 'test' && retries > 1) {
          return -1; // Stop retrying
        }
        const delay = Math.min(retries * 50, 500);
        console.log(`[Redis] Reconnecting... (attempt ${retries})`);
        return delay;
      },
      keepAlive: 30000,
      connectTimeout,
    },
    maxRetriesPerRequest: maxRetries,
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

  redisClient.on('reconnecting', () => {
    console.warn('[Redis] Reconnecting...');
  });

  await redisClient.connect().catch((err) => {
    console.warn('[Redis] Connection failed (continuing without cache):', err.message);
  });

  return redisClient;
};

const getClient = async () => {
  try {
    if (!client) {
      if (isConnecting) {
        // Wait for existing connection attempt
        let attempts = 0;
        while (isConnecting && attempts < 50) {
          await new Promise(r => setTimeout(r, 100));
          attempts++;
        }
        return client;
      }

      isConnecting = true;
      try {
        // Create client with timeout
        const connectPromise = createRedisClient();
        const timeoutMs = process.env.NODE_ENV === 'test' ? 3000 : 10000;

        client = await Promise.race([
          connectPromise,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Redis connection timeout')), timeoutMs)
          ),
        ]);
      } catch (err) {
        console.warn(`[Redis] Failed to create client: ${err.message}`);
        client = null;
      }
      isConnecting = false;
    }

    if (client && !client.isOpen) {
      try {
        const timeoutMs = process.env.NODE_ENV === 'test' ? 2000 : 10000;
        await Promise.race([
          client.connect(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Redis connect timeout')), timeoutMs)
          ),
        ]).catch(() => {
          console.warn('[Redis] Connection failed, returning null');
          client = null;
        });
      } catch (err) {
        console.warn(`[Redis] Connect error: ${err.message}`);
        client = null;
      }
    }

    return client;
  } catch (err) {
    console.error('[Redis] getClient error:', err.message);
    isConnecting = false;
    return null;
  }
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

export {
  get,
  set,
  del,
  flushDb,
  health,
  getClient,
};
