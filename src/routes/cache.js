/**
 * Cache Routes
 * Health check and cache management endpoints
 */

import express from 'express';
import * as redis from '../lib/redis.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/cache/health
 * Returns Redis health status and latency
 * Used by deployment health checks and monitoring
 */
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

/**
 * DELETE /api/cache/flush
 * Clears all cache (for testing/admin)
 * Requer autenticação JWT
 */
router.delete('/flush', authMiddleware, async (req, res) => {
  try {
    const success = await redis.flushDb();
    if (success) {
      res.json({ status: 'flushed', message: 'All cache cleared' });
    } else {
      res.status(503).json({ status: 'error', message: 'Cache flush failed' });
    }
  } catch (err) {
    console.error('[Cache Flush] Error:', err.message);
    res.status(503).json({ status: 'error', error: err.message });
  }
});

export default router;
