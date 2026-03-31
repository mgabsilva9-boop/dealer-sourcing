/**
 * Métricas de Observabilidade - Connection Pool Monitoring
 * STORY-502: Pool Monitoring & Observability
 *
 * Endpoint: GET /metrics
 * Formato: JSON (Prometheus-compatible)
 */

import express from 'express';
import { poolMetrics } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /metrics
 * Retorna métricas de conexão do pool PostgreSQL
 * Requer autenticação JWT
 */
router.get('/', authMiddleware, (req, res) => {
  const now = Date.now();
  const uptime = now - poolMetrics.lastResetTime;
  const utilization = (poolMetrics.activeConnections / 20) * 100;

  // Calcular se há risco (>80% utilization)
  const healthStatus = poolMetrics.activeConnections > 16 ? 'warning' : 'healthy';

  const metrics = {
    timestamp: new Date().toISOString(),
    pool: {
      // Conexões atuais
      active_connections: poolMetrics.activeConnections,
      idle_connections: poolMetrics.idleConnections,
      waiting_requests: poolMetrics.waitingRequests,
      total_available: 20,

      // Estatísticas
      utilization_percent: parseFloat(utilization.toFixed(2)),
      peak_connections: poolMetrics.peakConnections,
      total_acquired: poolMetrics.totalAcquired,
      total_released: poolMetrics.totalReleased,

      // Saúde
      health_status: healthStatus,
      requires_scaling: poolMetrics.activeConnections > 16,
    },
    uptime_ms: uptime,
  };

  // Status HTTP baseado em saúde
  const statusCode = poolMetrics.activeConnections > 18 ? 503 : 200;

  res.status(statusCode).json(metrics);
});

/**
 * GET /metrics/detailed
 * Métricas detalhadas com recomendações
 * Requer autenticação JWT
 */
router.get('/detailed', authMiddleware, (req, res) => {
  const utilization = (poolMetrics.activeConnections / 20) * 100;

  let recommendation = 'Pool is healthy. No action needed.';
  if (poolMetrics.activeConnections > 18) {
    recommendation = 'CRITICAL: Increase pool size or reduce concurrent requests immediately.';
  } else if (poolMetrics.activeConnections > 15) {
    recommendation = 'WARNING: Monitor closely. Consider increasing pool size if this persists.';
  } else if (poolMetrics.activeConnections > 10) {
    recommendation = 'INFO: Moderate load. Continue monitoring.';
  }

  res.json({
    timestamp: new Date().toISOString(),
    pool_status: {
      active: poolMetrics.activeConnections,
      idle: poolMetrics.idleConnections,
      waiting: poolMetrics.waitingRequests,
      max_size: 20,
      utilization_percent: parseFloat(utilization.toFixed(2)),
    },
    thresholds: {
      warning_threshold: 15,
      critical_threshold: 18,
      scaling_recommended: poolMetrics.activeConnections > 15,
    },
    statistics: {
      peak_connections_seen: poolMetrics.peakConnections,
      total_connections_acquired: poolMetrics.totalAcquired,
      total_connections_released: poolMetrics.totalReleased,
    },
    recommendation,
    scaling_strategy: {
      current_capacity: '10-20 concurrent users',
      if_exceeded: 'Increase max pool size to 30-40 and monitor PgBouncer',
    },
  });
});

export default router;
