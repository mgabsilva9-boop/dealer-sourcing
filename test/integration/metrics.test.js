/**
 * Metrics Endpoint Tests
 * STORY-502: Connection Pool Monitoring
 */

import request from 'supertest';
import { app } from '../../src/server.js';
import { poolMetrics } from '../../src/config/database.js';

describe('Metrics Endpoints', () => {
  describe('GET /metrics', () => {
    it('should return pool metrics in JSON format', async () => {
      const res = await request(app).get('/metrics');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('pool');
      expect(res.body.pool).toHaveProperty('active_connections');
      expect(res.body.pool).toHaveProperty('idle_connections');
      expect(res.body.pool).toHaveProperty('waiting_requests');
      expect(res.body.pool).toHaveProperty('utilization_percent');
      expect(res.body.pool).toHaveProperty('health_status');
    });

    it('should report healthy status when utilization < 80%', async () => {
      const res = await request(app).get('/metrics');

      if (res.body.pool.utilization_percent < 80) {
        expect(res.body.pool.health_status).toBe('healthy');
      }
    });

    it('should return 200 status when active < 18 connections', async () => {
      const res = await request(app).get('/metrics');

      if (res.body.pool.active_connections < 18) {
        expect(res.status).toBe(200);
      }
    });

    it('should report correct pool size (max 20)', async () => {
      const res = await request(app).get('/metrics');

      expect(res.body.pool.total_available).toBe(20);
    });

    it('should include timestamp', async () => {
      const res = await request(app).get('/metrics');

      expect(res.body).toHaveProperty('timestamp');
      expect(typeof res.body.timestamp).toBe('string');
    });
  });

  describe('GET /metrics/detailed', () => {
    it('should return detailed metrics with recommendations', async () => {
      const res = await request(app).get('/metrics/detailed');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('pool_status');
      expect(res.body).toHaveProperty('thresholds');
      expect(res.body).toHaveProperty('statistics');
      expect(res.body).toHaveProperty('recommendation');
      expect(res.body).toHaveProperty('scaling_strategy');
    });

    it('should recommend action when utilization > 75%', async () => {
      const res = await request(app).get('/metrics/detailed');

      if (res.body.pool_status.utilization_percent > 75) {
        expect(res.body.recommendation).toContain('WARNING');
      }
    });

    it('should track peak connections', async () => {
      const res = await request(app).get('/metrics/detailed');

      expect(res.body.statistics).toHaveProperty('peak_connections_seen');
      expect(typeof res.body.statistics.peak_connections_seen).toBe('number');
    });
  });

  describe('Pool Metrics Collection', () => {
    it('should have poolMetrics object defined', () => {
      expect(poolMetrics).toBeDefined();
      expect(poolMetrics).toHaveProperty('activeConnections');
      expect(poolMetrics).toHaveProperty('idleConnections');
      expect(poolMetrics).toHaveProperty('waitingRequests');
      expect(poolMetrics).toHaveProperty('totalAcquired');
      expect(poolMetrics).toHaveProperty('totalReleased');
    });

    it('should track total connections acquired and released', () => {
      expect(typeof poolMetrics.totalAcquired).toBe('number');
      expect(typeof poolMetrics.totalReleased).toBe('number');
      expect(poolMetrics.totalAcquired >= poolMetrics.totalReleased).toBe(true);
    });
  });
});
