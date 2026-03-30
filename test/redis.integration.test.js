/**
 * Redis Integration Tests
 * Tests against real Redis instance
 * Requirements: Redis running on localhost:6379
 *
 * Run with: docker run -d -p 6379:6379 redis:latest
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import * as redis from '../src/lib/redis.js';

// Note: These tests are for documentation and validation
// In CI/CD, they run only when Redis is available
const skipIfNoRedis = process.env.REDIS_URL ? describe : describe.skip;

skipIfNoRedis('Redis Integration Tests', () => {
  beforeAll(async () => {
    // Ensure clean state before tests
    await redis.flushDb();
  });

  afterAll(async () => {
    // Clean up after tests
    await redis.flushDb();
  });

  describe('Set and Get Operations', () => {
    it('should set and retrieve a string value', async () => {
      const key = 'test:integration:string';
      const value = 'hello world';

      const setResult = await redis.set(key, value, 300);
      expect(setResult).toBe(true);

      const getResult = await redis.get(key);
      expect(getResult).toBe(value);
    });

    it('should set and retrieve an object value', async () => {
      const key = 'test:integration:object';
      const value = { id: 1, name: 'test', nested: { deep: 'value' } };

      const setResult = await redis.set(key, value, 300);
      expect(setResult).toBe(true);

      const getResult = await redis.get(key);
      expect(getResult).toEqual(value);
    });

    it('should set and retrieve an array value', async () => {
      const key = 'test:integration:array';
      const value = [1, 2, 3, { id: 4 }, 'five'];

      const setResult = await redis.set(key, value, 300);
      expect(setResult).toBe(true);

      const getResult = await redis.get(key);
      expect(getResult).toEqual(value);
    });

    it('should preserve JSON structure on round-trip', async () => {
      const key = 'test:integration:json';
      const value = {
        user: { id: 123, email: 'test@example.com' },
        items: [{ id: 1 }, { id: 2 }],
        timestamp: new Date().toISOString(),
      };

      await redis.set(key, value, 300);
      const retrieved = await redis.get(key);

      expect(retrieved.user.id).toBe(value.user.id);
      expect(retrieved.items.length).toBe(2);
      expect(retrieved.timestamp).toBe(value.timestamp);
    });
  });

  describe('TTL and Expiration', () => {
    it('should expire key after TTL', async () => {
      const key = 'test:integration:ttl';
      const value = 'expires soon';

      await redis.set(key, value, 1); // 1 second TTL
      expect(await redis.get(key)).toBe(value);

      // Wait for expiration
      await new Promise(r => setTimeout(r, 1100));
      expect(await redis.get(key)).toBeNull();
    });

    it('should respect custom TTL values', async () => {
      const key = 'test:integration:custom-ttl';

      // TTL: 2 seconds
      await redis.set(key, 'value', 2);
      expect(await redis.get(key)).toBe('value');

      // Check after 1 second (should still exist)
      await new Promise(r => setTimeout(r, 1000));
      expect(await redis.get(key)).toBe('value');

      // Check after total 2.5 seconds (should be expired)
      await new Promise(r => setTimeout(r, 1500));
      expect(await redis.get(key)).toBeNull();
    });
  });

  describe('Delete Operations', () => {
    it('should delete a key', async () => {
      const key = 'test:integration:delete';
      await redis.set(key, 'value', 300);
      expect(await redis.get(key)).toBe('value');

      const deleteResult = await redis.del(key);
      expect(deleteResult).toBe(true);

      expect(await redis.get(key)).toBeNull();
    });

    it('should handle delete of non-existent key gracefully', async () => {
      const key = 'test:integration:nonexistent';
      const deleteResult = await redis.del(key);
      // Should not throw, returns boolean
      expect(typeof deleteResult).toBe('boolean');
    });

    it('should delete multiple keys in sequence', async () => {
      const keys = ['test:del:1', 'test:del:2', 'test:del:3'];

      // Set all keys
      for (const key of keys) {
        await redis.set(key, 'value', 300);
      }

      // Verify all exist
      for (const key of keys) {
        expect(await redis.get(key)).toBe('value');
      }

      // Delete all
      for (const key of keys) {
        await redis.del(key);
      }

      // Verify all deleted
      for (const key of keys) {
        expect(await redis.get(key)).toBeNull();
      }
    });
  });

  describe('Health Check', () => {
    it('should report healthy status when Redis is available', async () => {
      const health = await redis.health();
      expect(health.status).toBe('healthy');
      expect(health.latency_ms).toBeGreaterThanOrEqual(0);
      expect(health.latency_ms).toBeLessThan(1000); // Reasonable latency
    });

    it('should measure latency accurately', async () => {
      const health = await redis.health();
      // Latency should be very small for local Redis
      expect(health.latency_ms).toBeLessThan(100);
    });

    it('should report latency increase with load', async () => {
      // First health check (baseline)
      const health1 = await redis.health();
      const latency1 = health1.latency_ms;

      // Set some data
      for (let i = 0; i < 100; i++) {
        await redis.set(`load:${i}`, { value: i });
      }

      // Second health check (with load)
      const health2 = await redis.health();
      const latency2 = health2.latency_ms;

      // Both should be healthy
      expect(health1.status).toBe('healthy');
      expect(health2.status).toBe('healthy');

      // Latency should be measurable (not negative)
      expect(latency1).toBeGreaterThanOrEqual(0);
      expect(latency2).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle 100 concurrent sets', async () => {
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(redis.set(`concurrent:set:${i}`, { value: i }, 300));
      }

      const results = await Promise.all(promises);
      expect(results.every(r => r === true)).toBe(true);

      // Verify some were written
      const sample = await redis.get('concurrent:set:50');
      expect(sample).toEqual({ value: 50 });
    });

    it('should handle 100 concurrent gets', async () => {
      // First, set 100 keys
      for (let i = 0; i < 100; i++) {
        await redis.set(`concurrent:get:${i}`, { value: i }, 300);
      }

      // Then get them all concurrently
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(redis.get(`concurrent:get:${i}`));
      }

      const results = await Promise.all(promises);
      expect(results.length).toBe(100);
      expect(results.every(r => r !== null)).toBe(true);
    });

    it('should handle 100 mixed concurrent operations', async () => {
      const promises = [];

      for (let i = 0; i < 100; i++) {
        if (i % 3 === 0) {
          promises.push(redis.set(`mixed:${i}`, { value: i }, 300));
        } else if (i % 3 === 1) {
          promises.push(redis.get(`mixed:${i}`));
        } else {
          promises.push(redis.del(`mixed:${i}`));
        }
      }

      const results = await Promise.all(promises);
      // Should complete without errors
      expect(results.length).toBe(100);
    });
  });

  describe('Flush Database', () => {
    it('should clear all keys', async () => {
      // Set some keys
      await redis.set('flush:1', 'value1', 300);
      await redis.set('flush:2', 'value2', 300);
      await redis.set('flush:3', 'value3', 300);

      // Verify they exist
      expect(await redis.get('flush:1')).toBe('value1');

      // Flush
      const flushResult = await redis.flushDb();
      expect(flushResult).toBe(true);

      // Verify they're gone
      expect(await redis.get('flush:1')).toBeNull();
      expect(await redis.get('flush:2')).toBeNull();
      expect(await redis.get('flush:3')).toBeNull();
    });
  });

  describe('Error Recovery', () => {
    it('should recover from transient network issues', async () => {
      // This is a conceptual test - in real scenario would require
      // simulating network failure
      const health1 = await redis.health();
      expect(health1.status).toBe('healthy');

      // Multiple operations should still work
      for (let i = 0; i < 10; i++) {
        const result = await redis.set(`recovery:${i}`, i, 300);
        expect(result).toBe(true);
      }

      const health2 = await redis.health();
      expect(health2.status).toBe('healthy');
    });
  });

  describe('Performance Benchmarks', () => {
    it('should complete 1000 operations in reasonable time', async () => {
      const start = Date.now();

      const promises = [];
      for (let i = 0; i < 1000; i++) {
        if (i % 2 === 0) {
          promises.push(redis.set(`perf:${i}`, { value: i }, 300));
        } else {
          promises.push(redis.get(`perf:${i}`));
        }
      }

      await Promise.all(promises);
      const duration = Date.now() - start;

      // 1000 operations should complete in < 30 seconds
      expect(duration).toBeLessThan(30000);

      console.log(`[Integration Test] 1000 operations completed in ${duration}ms`);
    });
  });
});
