/**
 * Configuração de conexão com PostgreSQL
 * Schema: dealer-sourcing Phase 3 (Dara - The Sage)
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Criar pool de conexões
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// ===== CONNECTION POOL METRICS (STORY-502) =====
export const poolMetrics = {
  activeConnections: 0,
  idleConnections: 0,
  waitingRequests: 0,
  totalAcquired: 0,
  totalReleased: 0,
  peakConnections: 0,
  lastResetTime: Date.now(),
};

const updatePeakConnections = () => {
  const current = poolMetrics.activeConnections + poolMetrics.idleConnections;
  if (current > poolMetrics.peakConnections) {
    poolMetrics.peakConnections = current;
  }
};

const checkPoolHealth = () => {
  const utilization = (poolMetrics.activeConnections / 20) * 100;

  if (poolMetrics.activeConnections > 18) {
    console.error(`🚨 CRITICAL: Pool exhaustion! Active: ${poolMetrics.activeConnections}/20 (${utilization.toFixed(1)}%)`);
  } else if (poolMetrics.activeConnections > 15) {
    console.warn(`⚠️ WARNING: Pool utilization high! Active: ${poolMetrics.activeConnections}/20 (${utilization.toFixed(1)}%)`);
  }
};

// Event listeners para debugging + metrics
pool.on('connect', () => {
  poolMetrics.activeConnections++;
  poolMetrics.totalAcquired++;
  updatePeakConnections();
  checkPoolHealth();
  console.log(`✅ Nova conexão com banco (active: ${poolMetrics.activeConnections})`);
});

pool.on('remove', () => {
  poolMetrics.activeConnections = Math.max(0, poolMetrics.activeConnections - 1);
  poolMetrics.totalReleased++;
  console.log(`📤 Conexão liberada (active: ${poolMetrics.activeConnections})`);
});

pool.on('error', (err) => {
  console.error('❌ Erro inesperado na pool:', err);
});

// Função auxiliar para queries
export const query = async (text, params = []) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (duration > 1000) console.warn(`⚠️ Slow query (${duration}ms): ${text.substring(0, 50)}`);
    return result;
  } catch (error) {
    console.error('❌ Database error:', error.message);
    throw error;
  }
};


/**
 * Database initialization (run once during migrations)
 * Schema is now managed by db/migrations/*.sql
 */
export const checkConnection = async () => {
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection verified');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

export default pool;
