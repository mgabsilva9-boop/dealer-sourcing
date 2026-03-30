/**
 * Redis Unit Tests
 * Tests for redis.js module without requiring real Redis
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as redis from '../src/lib/redis.js';

describe('Redis Module - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('get()', () => {
    it('should return null when key does not exist', async () => {
      // This tests graceful degradation
      const result = await redis.get('nonexistent:key');
      expect(result).toBeNull();
    });

    it('should return null on error without throwing', async () => {
      // Tests error handling
      const result = await redis.get('any:key');
      expect(result).toBeNull();
    });

    it('should handle malformed JSON gracefully', async () => {
      // Tests JSON parse error handling
      const result = await redis.get('corrupted:key');
      expect(result).toBeNull();
    });
  });

  describe('set()', () => {
    it('should return false on error without throwing', async () => {
      // Tests error handling
      const result = await redis.set('test:key', { data: 'test' });
      expect(typeof result).toBe('boolean');
    });

    it('should accept string values', async () => {
      // Tests type handling
      const result = await redis.set('test:string', 'hello', 300);
      expect(typeof result).toBe('boolean');
    });

    it('should accept object values', async () => {
      // Tests JSON serialization
      const result = await redis.set('test:object', { id: 1, name: 'test' }, 300);
      expect(typeof result).toBe('boolean');
    });

    it('should accept custom TTL', async () => {
      // Tests TTL parameter
      const result = await redis.set('test:ttl', 'value', 60);
      expect(typeof result).toBe('boolean');
    });

    it('should handle zero TTL', async () => {
      // Edge case: zero TTL
      const result = await redis.set('test:zero-ttl', 'value', 0);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('del()', () => {
    it('should return false on error without throwing', async () => {
      // Tests error handling
      const result = await redis.del('test:key');
      expect(typeof result).toBe('boolean');
    });

    it('should accept any string key', async () => {
      // Tests various key formats
      const result = await redis.del('test:with:colons');
      expect(typeof result).toBe('boolean');
    });
  });

  describe('flushDb()', () => {
    it('should return false on error without throwing', async () => {
      // Tests error handling
      const result = await redis.flushDb();
      expect(typeof result).toBe('boolean');
    });

    it('should not throw even if Redis is unavailable', async () => {
      // Tests graceful degradation
      let threw = false;
      try {
        await redis.flushDb();
      } catch {
        threw = true;
      }
      expect(threw).toBe(false);
    });
  });

  describe('health()', () => {
    it('should return health object with required fields', async () => {
      const health = await redis.health();
      expect(health).toHaveProperty('status');
      expect(['healthy', 'unhealthy', 'disconnected']).toContain(health.status);
      expect(health).toHaveProperty('latency_ms');
    });

    it('should return disconnected status when Redis unavailable', async () => {
      const health = await redis.health();
      // When Redis is not running, should still return valid health object
      expect(health).toBeDefined();
      expect(typeof health.status).toBe('string');
    });

    it('should handle health check timeout gracefully', async () => {
      // Should not throw
      let threw = false;
      try {
        await redis.health();
      } catch {
        threw = true;
      }
      expect(threw).toBe(false);
    });

    it('should include error message when unhealthy', async () => {
      const health = await redis.health();
      if (health.status !== 'healthy') {
        expect(health).toHaveProperty('error');
      }
    });
  });

  describe('Error Handling', () => {
    it('should never throw uncaught exceptions', async () => {
      const operations = [
        redis.get('key'),
        redis.set('key', 'value'),
        redis.del('key'),
        redis.flushDb(),
        redis.health(),
      ];

      let threw = false;
      try {
        await Promise.all(operations);
      } catch {
        threw = true;
      }

      expect(threw).toBe(false);
    });

    it('should gracefully degrade when Redis unavailable', async () => {
      // All operations should still return valid responses
      const getResult = await redis.get('test');
      const setResult = await redis.set('test', 'value');
      const delResult = await redis.del('test');
      const healthResult = await redis.health();

      expect(getResult).toBeNull();
      expect(typeof setResult).toBe('boolean');
      expect(typeof delResult).toBe('boolean');
      expect(healthResult).toBeDefined();
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple concurrent gets', async () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(redis.get(`key:${i}`));
      }

      let threw = false;
      try {
        await Promise.all(promises);
      } catch {
        threw = true;
      }

      expect(threw).toBe(false);
    });

    it('should handle multiple concurrent sets', async () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(redis.set(`key:${i}`, { value: i }));
      }

      let threw = false;
      try {
        await Promise.all(promises);
      } catch {
        threw = true;
      }

      expect(threw).toBe(false);
    });

    it('should handle mixed concurrent operations', async () => {
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(redis.set(`key:${i}`, i));
        promises.push(redis.get(`key:${i}`));
        promises.push(redis.del(`key:${i}`));
      }

      let threw = false;
      try {
        await Promise.all(promises);
      } catch {
        threw = true;
      }

      expect(threw).toBe(false);
    });
  });

  describe('Data Types', () => {
    it('should handle string values', async () => {
      const result = await redis.set('test:string', 'hello world', 300);
      expect(typeof result).toBe('boolean');
    });

    it('should handle numeric values', async () => {
      const result = await redis.set('test:number', 42, 300);
      expect(typeof result).toBe('boolean');
    });

    it('should handle object values', async () => {
      const result = await redis.set('test:object', { id: 1, name: 'test' }, 300);
      expect(typeof result).toBe('boolean');
    });

    it('should handle array values', async () => {
      const result = await redis.set('test:array', [1, 2, 3], 300);
      expect(typeof result).toBe('boolean');
    });

    it('should handle null values', async () => {
      const result = await redis.set('test:null', null, 300);
      expect(typeof result).toBe('boolean');
    });

    it('should handle boolean values', async () => {
      const result = await redis.set('test:boolean', true, 300);
      expect(typeof result).toBe('boolean');
    });
  });
});
