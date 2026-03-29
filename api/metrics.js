/**
 * GET /api/metrics
 * Connection pool monitoring
 * STORY-502: Pool Monitoring & Observability
 */

import { dbMetrics } from './lib/db.js';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const now = Date.now();
  const uptime = now - dbMetrics.startTime;

  // Calculate health status based on query performance and errors
  const errorRate = dbMetrics.totalQueries > 0 ? (dbMetrics.totalErrors / dbMetrics.totalQueries) * 100 : 0;
  const slowQueryRate = dbMetrics.totalQueries > 0 ? (dbMetrics.slowQueries / dbMetrics.totalQueries) * 100 : 0;

  let healthStatus = 'healthy';
  if (errorRate > 5 || slowQueryRate > 10) {
    healthStatus = 'warning';
  }
  if (errorRate > 15 || slowQueryRate > 25) {
    healthStatus = 'critical';
  }

  const metrics = {
    timestamp: new Date().toISOString(),
    connection: {
      active_connections: dbMetrics.activeConnections,
      peak_connections: dbMetrics.peakConnections,
      connection_attempts: dbMetrics.connectionAttempts,
      failed_connections: dbMetrics.failedConnections,
      health_status: healthStatus,
    },
    queries: {
      total_queries: dbMetrics.totalQueries,
      total_errors: dbMetrics.totalErrors,
      error_rate_percent: parseFloat(errorRate.toFixed(2)),
      slow_queries: dbMetrics.slowQueries,
      slow_query_rate_percent: parseFloat(slowQueryRate.toFixed(2)),
      average_query_time_ms: parseFloat(dbMetrics.averageQueryTime.toFixed(2)),
      last_query_time_ms: dbMetrics.lastQueryTime,
    },
    uptime_ms: uptime,
    alerts: {
      high_error_rate: errorRate > 5,
      slow_queries_detected: slowQueryRate > 10,
      requires_investigation: healthStatus === 'critical',
    },
  };

  // Return 503 if critical health status
  const statusCode = healthStatus === 'critical' ? 503 : 200;
  res.status(statusCode).json(metrics);
}
