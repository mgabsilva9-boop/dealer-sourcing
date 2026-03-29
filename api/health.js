/**
 * GET /api/health
 * Health check endpoint with database connectivity test
 */

import { testConnection } from './lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const dbStatus = await testConnection();

  const response = {
    status: dbStatus.connected ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      connected: dbStatus.connected,
      timestamp: dbStatus.timestamp || null,
      error: dbStatus.error || null,
    },
  };

  const statusCode = dbStatus.connected ? 200 : 503;
  res.status(statusCode).json(response);
}
