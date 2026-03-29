/**
 * Database connection module for Vercel Serverless
 * Uses a singleton pattern to maintain connection across invocations
 */

import pkg from 'pg';
const { Client } = pkg;

let client = null;

// Metrics tracking for STORY-502
export const dbMetrics = {
  activeConnections: 0,
  totalQueries: 0,
  totalErrors: 0,
  slowQueries: 0,
  averageQueryTime: 0,
  lastQueryTime: 0,
  peakConnections: 0,
  connectionAttempts: 0,
  failedConnections: 0,
  startTime: Date.now(),
};

/**
 * Get or create database client
 * Vercel serverless: each function invocation reuses client if available
 */
export async function getClient() {
  if (!client) {
    try {
      dbMetrics.connectionAttempts++;
      client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      });
      await client.connect();
      dbMetrics.activeConnections++;
      if (dbMetrics.activeConnections > dbMetrics.peakConnections) {
        dbMetrics.peakConnections = dbMetrics.activeConnections;
      }
      console.log('[db] Connected to Neon PostgreSQL');
    } catch (error) {
      dbMetrics.failedConnections++;
      console.error('[db] Connection failed:', error.message);
      client = null;
      throw error;
    }
  }
  return client;
}

/**
 * Execute a SQL query
 * @param {string} sql - SQL query string
 * @param {array} params - Query parameters
 * @returns {array} Query results
 */
export async function query(sql, params = []) {
  const startTime = Date.now();
  try {
    const client = await getClient();
    const result = await client.query(sql, params);

    const duration = Date.now() - startTime;
    dbMetrics.totalQueries++;
    dbMetrics.lastQueryTime = duration;

    // Track average query time
    dbMetrics.averageQueryTime =
      (dbMetrics.averageQueryTime * (dbMetrics.totalQueries - 1) + duration) / dbMetrics.totalQueries;

    // Track slow queries (>1000ms)
    if (duration > 1000) {
      dbMetrics.slowQueries++;
      console.warn(`[db] Slow query (${duration}ms): ${sql.substring(0, 50)}...`);
    }

    return result.rows;
  } catch (error) {
    dbMetrics.totalErrors++;
    console.error('[db] Query error:', error.message);
    throw error;
  }
}

/**
 * Test database connectivity
 * @returns {object} { connected: boolean, timestamp: date, error: string }
 */
export async function testConnection() {
  try {
    const result = await query('SELECT NOW() as timestamp');
    return {
      connected: true,
      timestamp: result[0]?.timestamp || new Date(),
      error: null,
    };
  } catch (error) {
    return {
      connected: false,
      timestamp: null,
      error: error.message || 'Connection test failed',
    };
  }
}

/**
 * Close database connection (for cleanup)
 */
export async function closeConnection() {
  if (client) {
    try {
      await client.end();
      client = null;
      console.log('[db] Connection closed');
    } catch (error) {
      console.error('[db] Error closing connection:', error.message);
    }
  }
}
