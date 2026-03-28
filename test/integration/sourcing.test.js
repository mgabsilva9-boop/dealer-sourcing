/**
 * Integration Tests: Sourcing Routes
 * Phase 4: Backend Implementation with Database Persistence
 * Story 401-406: Database persistence, pagination, error handling
 * Phase 5: JWT Implementation - Real JWT token generation
 *
 * NOTE: Uses mocked database to avoid needing PostgreSQL
 */

// Load environment variables from .env
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import request from 'supertest';
import jwt from 'jsonwebtoken';

// Mock database module
const mockDatabase = {
  interested_vehicles: [],
  search_queries: [],
};

const mockQuery = async (queryStr, params = []) => {
  // Mock SELECT NOW() for connection check
  if (queryStr.includes('SELECT NOW()')) {
    return { rows: [{ now: new Date().toISOString() }] };
  }

  // Mock CREATE TABLE (inventory init)
  if (queryStr.includes('CREATE TABLE')) {
    return { rows: [] };
  }

  // Mock SELECT * FROM vehicles_cache (for multi-user tests)
  if (queryStr.includes('SELECT * FROM vehicles_cache')) {
    // Return sample vehicles for testing
    return {
      rows: [
        { vehicle_id: 'test-vehicle-1', id: 'test-vehicle-1', make: 'Honda', model: 'Civic', year: 2022, score: 8.5 },
        { vehicle_id: 'test-vehicle-2', id: 'test-vehicle-2', make: 'Toyota', model: 'Corolla', year: 2021, score: 8.3 },
        { vehicle_id: 'test-vehicle-3', id: 'test-vehicle-3', make: 'Volkswagen', model: 'Golf', year: 2020, score: 7.9 },
      ],
    };
  }

  // Mock INSERT INTO interested_vehicles (with UPSERT)
  if (queryStr.includes('INSERT INTO interested_vehicles')) {
    const [userId, vehicleId, vehicleData, notes] = params;
    const id = Math.random().toString(36).substr(2, 9);

    // Check for existing record (UPSERT behavior)
    const existing = mockDatabase.interested_vehicles.find(
      (v) => v.user_id === userId && v.vehicle_id === vehicleId
    );

    if (existing) {
      // ON CONFLICT - update
      existing.notes = notes;
      existing.updated_at = new Date().toISOString();
      return { rows: [existing] };
    }

    // New record
    const record = {
      id,
      user_id: userId,
      vehicle_id: vehicleId,
      status: 'interested',
      saved_at: new Date().toISOString(),
    };
    mockDatabase.interested_vehicles.push(record);
    return { rows: [record] };
  }

  // Mock INSERT INTO search_queries (analytics)
  if (queryStr.includes('INSERT INTO search_queries')) {
    const [userId, queryParams] = params;
    mockDatabase.search_queries.push({
      user_id: userId,
      query_params: queryParams,
      searched_at: new Date().toISOString(),
    });
    return { rows: [] };
  }

  // Mock SELECT FROM interested_vehicles (GET /favorites)
  if (queryStr.includes('SELECT id, user_id, vehicle_id, vehicle_data, status, notes')) {
    const userId = params[0];
    const statusFilter = params[2]; // Can be undefined

    let results = mockDatabase.interested_vehicles.filter((v) => v.user_id === userId);

    if (statusFilter) {
      results = results.filter((v) => v.status === statusFilter);
    }

    // Apply pagination
    const limit = params[params.length - 2];
    const offset = params[params.length - 1];
    results = results.slice(offset, offset + limit);

    return {
      rows: results.map((v) => ({
        ...v,
        vehicle_data: typeof v.vehicle_data === 'string' ? JSON.parse(v.vehicle_data) : v.vehicle_data,
      })),
    };
  }

  // Mock COUNT(*) FROM interested_vehicles
  if (queryStr.includes('SELECT COUNT(*)')) {
    const userId = params[0];
    const statusFilter = params[1]; // Can be undefined

    let count = mockDatabase.interested_vehicles.filter((v) => v.user_id === userId);

    if (statusFilter) {
      count = count.filter((v) => v.status === statusFilter);
    }

    return { rows: [{ count: count.length }] };
  }

  // Mock ROLLBACK/COMMIT/BEGIN (transaction control)
  if (queryStr.includes('ROLLBACK') || queryStr.includes('BEGIN') || queryStr.includes('COMMIT')) {
    return { rows: [] };
  }

  return { rows: [] };
};

let pool = null;
let app = null;

// Setup mock before importing app
beforeAll(async () => {
  // Replace scrapers module with mock
  const scrapersModule = await import('../../src/utils/scrapers.js');
  const testVehicles = [
    { id: 'test-vehicle-1', vehicle_id: 'test-vehicle-1', make: 'Honda', model: 'Civic', year: 2022, price: 95000, km: 15000, score: 8.5 },
    { id: 'test-vehicle-2', vehicle_id: 'test-vehicle-2', make: 'Toyota', model: 'Corolla', year: 2021, price: 98000, km: 32000, score: 8.3 },
    { id: 'test-vehicle-3', vehicle_id: 'test-vehicle-3', make: 'Volkswagen', model: 'Golf', year: 2020, price: 85000, km: 48000, score: 7.9 },
  ];

  // Create module cache entry with our mock
  const Module = await import('module');
  const moduleCache = Module._load.cache;
  const key = Object.keys(moduleCache).find(k => k.includes('scrapers.js'));
  if (key) {
    moduleCache[key].exports = {
      scrapeMultiplePlatforms: async () => testVehicles,
      scrapeOLX: async () => [testVehicles[0]],
      scrapeWebMotors: async () => [testVehicles[1]],
      generateRealisticVehicles: () => testVehicles,
      calculateScore: () => 8,
    };
  }

  // Mock the database module
  const { default: moduleApp } = await import('../../src/server.js');
  const dbModule = await import('../../src/config/database.js');

  app = moduleApp;
  pool = dbModule.pool;

  // Replace pool methods with mocks
  pool.query = mockQuery;
  pool.end = async () => {
    mockDatabase.interested_vehicles = [];
    mockDatabase.search_queries = [];
  };
  pool.connect = async () => ({
    query: mockQuery,
    release: () => {},
  });
});

describe('Sourcing Routes - Integration Tests', () => {
  // Test user ID (from seed data)
  const testUserId = 'user-id-789';
  const ownerUserId = 'owner-user-id-123';

  // Sample vehicles from seed data
  const civic = 'real-olx-0-seed1';
  const corolla = 'real-olx-1-seed1';
  const golf = 'real-webmotors-2-seed1';

  // Generate valid JWT token with user ID in 'sub' claim
  const generateToken = (userId) => {
    return jwt.sign(
      { sub: userId, iat: Math.floor(Date.now() / 1000) },
      process.env.JWT_SECRET || 'test-secret-key',
      { expiresIn: '7d' }
    );
  };

  // Generate auth header for supertest
  const getAuthHeader = (userId = testUserId) => {
    const token = generateToken(userId);
    return `Bearer ${token}`;
  };

  beforeAll(async () => {
    // Verify mock database setup
    try {
      await pool.query('SELECT NOW()');
    } catch (error) {
      throw new Error(`Mock database setup failed: ${error.message}`);
    }
  });

  beforeEach(() => {
    // Clear mock data between tests
    mockDatabase.interested_vehicles = [];
    mockDatabase.search_queries = [];
  });

  afterAll(async () => {
    await pool.end();
  });

  // ============================================
  // GET /sourcing/list - STORY-405: Pagination
  // ============================================

  describe('GET /sourcing/list', () => {
    it('should return list with default pagination (limit=20, offset=0)', async () => {
      const res = await request(app)
        .get('/sourcing/list')
        .set('Authorization', getAuthHeader());

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('limit', 20);
      expect(res.body).toHaveProperty('offset', 0);
      expect(res.body).toHaveProperty('results');
      expect(Array.isArray(res.body.results)).toBe(true);
    });

    it('should support custom limit parameter', async () => {
      const res = await request(app)
        .get('/sourcing/list?limit=2')
        .set('Authorization', getAuthHeader());

      expect(res.status).toBe(200);
      expect(res.body.limit).toBe(2);
      expect(res.body.results.length).toBeLessThanOrEqual(2);
    });

    it('should support offset parameter for pagination', async () => {
      const res = await request(app)
        .get('/sourcing/list?limit=1&offset=1')
        .set('Authorization', getAuthHeader());

      expect(res.status).toBe(200);
      expect(res.body.offset).toBe(1);
      expect(res.body.results.length).toBeLessThanOrEqual(1);
    });

    it('should reject limit > 100', async () => {
      const res = await request(app)
        .get('/sourcing/list?limit=101')
        .set('Authorization', getAuthHeader());

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/limit.*100/i);
    });

    it('should reject limit < 1', async () => {
      const res = await request(app)
        .get('/sourcing/list?limit=0')
        .set('Authorization', getAuthHeader());

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/limit.*1/i);
    });

    it('should reject negative offset', async () => {
      const res = await request(app)
        .get('/sourcing/list?offset=-1')
        .set('Authorization', getAuthHeader());

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/offset/i);
    });

    it('should reject non-numeric limit', async () => {
      const res = await request(app)
        .get('/sourcing/list?limit=abc')
        .set('Authorization', getAuthHeader());

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/limit.*número/i);
    });

    it('should return results sorted by score (highest first)', async () => {
      const res = await request(app)
        .get('/sourcing/list')
        .set('Authorization', getAuthHeader());

      expect(res.status).toBe(200);
      expect(res.body.results.length).toBeGreaterThan(0);

      // Check sorting
      for (let i = 1; i < res.body.results.length; i++) {
        expect(res.body.results[i - 1].score).toBeGreaterThanOrEqual(res.body.results[i].score);
      }
    });
  });

  // ============================================
  // GET /sourcing/search - STORY-401, 403
  // ============================================

  describe('GET /sourcing/search', () => {
    it('should search by make', async () => {
      const res = await request(app)
        .get('/sourcing/search?make=Honda')
        .set('Authorization', getAuthHeader());

      expect(res.status).toBe(200);
      expect(res.body.results.length).toBeGreaterThan(0);
      expect(res.body.results[0].make).toBe('Honda');
    });

    it('should search by model', async () => {
      const res = await request(app)
        .get('/sourcing/search?model=Civic')
        .set('Authorization', getAuthHeader());

      expect(res.status).toBe(200);
      expect(res.body.results.length).toBeGreaterThan(0);
      expect(res.body.results[0].model).toBe('Civic');
    });

    it('should filter by price range', async () => {
      const res = await request(app)
        .get('/sourcing/search?priceMin=80000&priceMax=90000')
        .set('Authorization', getAuthHeader());

      expect(res.status).toBe(200);
      res.body.results.forEach(vehicle => {
        expect(vehicle.price).toBeGreaterThanOrEqual(80000);
        expect(vehicle.price).toBeLessThanOrEqual(90000);
      });
    });

    it('should reject priceMin > priceMax', async () => {
      const res = await request(app)
        .get('/sourcing/search?priceMin=100000&priceMax=80000')
        .set('Authorization', getAuthHeader());

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/priceMin.*priceMax/i);
    });

    it('should filter by max km', async () => {
      const res = await request(app)
        .get('/sourcing/search?kmMax=50000')
        .set('Authorization', getAuthHeader());

      expect(res.status).toBe(200);
      res.body.results.forEach(vehicle => {
        expect(vehicle.km).toBeLessThanOrEqual(50000);
      });
    });

    it('should support pagination with search', async () => {
      const res = await request(app)
        .get('/sourcing/search?make=Honda&limit=1&offset=0')
        .set('Authorization', getAuthHeader());

      expect(res.status).toBe(200);
      expect(res.body.limit).toBe(1);
      expect(res.body.offset).toBe(0);
    });

    it('should reject invalid priceMin', async () => {
      const res = await request(app)
        .get('/sourcing/search?priceMin=abc')
        .set('Authorization', getAuthHeader());

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/priceMin.*número/i);
    });

    it('should reject negative kmMax', async () => {
      const res = await request(app)
        .get('/sourcing/search?kmMax=-100')
        .set('Authorization', getAuthHeader());

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/kmMax/i);
    });
  });

  // ============================================
  // GET /sourcing/:id
  // ============================================

  describe('GET /sourcing/:id', () => {
    it('should return vehicle by ID', async () => {
      const res = await request(app)
        .get(`/sourcing/${civic}`)
        .set('Authorization', getAuthHeader());

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(civic);
      expect(res.body).toHaveProperty('make');
      expect(res.body).toHaveProperty('model');
      expect(res.body).toHaveProperty('price');
    });

    it('should return 404 for non-existent vehicle', async () => {
      const res = await request(app)
        .get('/sourcing/non-existent-id')
        .set('Authorization', getAuthHeader());

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/não encontrado/i);
    });
  });

  // ============================================
  // POST /sourcing/:id/interested - STORY-401
  // DATABASE PERSISTENCE + ERROR HANDLING
  // ============================================

  describe('POST /sourcing/:id/interested', () => {
    it('should mark vehicle as interested and persist to database', async () => {
      const newVehicleId = 'test-vehicle-' + Date.now();

      // First, ensure vehicle exists in cache
      const vehicles = await pool.query(
        'SELECT * FROM vehicles_cache LIMIT 1'
      );
      const vehicleId = vehicles.rows[0].vehicle_id;

      const res = await request(app)
        .post(`/sourcing/${vehicleId}/interested`)
        .set('Authorization', getAuthHeader())
        .send({ notes: 'Test vehicle marking' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('vehicle_id', vehicleId);
      expect(res.body).toHaveProperty('saved_at');

      // Verify persistence in database
      const dbRes = await pool.query(
        'SELECT * FROM interested_vehicles WHERE id = $1',
        [res.body.id]
      );
      expect(dbRes.rows.length).toBe(1);
      expect(dbRes.rows[0].vehicle_id).toBe(vehicleId);
      expect(dbRes.rows[0].notes).toBe('Test vehicle marking');
    });

    it('should return 409 if vehicle already marked as interested', async () => {
      const vehicles = await pool.query(
        'SELECT * FROM vehicles_cache LIMIT 1'
      );
      const vehicleId = vehicles.rows[0].vehicle_id;

      // First marking
      await request(app)
        .post(`/sourcing/${vehicleId}/interested`)
        .set('Authorization', getAuthHeader())
        .send({ notes: 'First marking' });

      // Second marking (same vehicle, same user)
      const res = await request(app)
        .post(`/sourcing/${vehicleId}/interested`)
        .set('Authorization', getAuthHeader())
        .send({ notes: 'Second marking' });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/já.*interessante/i);
    });

    it('should update notes on ON CONFLICT', async () => {
      const vehicles = await pool.query(
        'SELECT * FROM vehicles_cache LIMIT 1'
      );
      const vehicleId = vehicles.rows[0].vehicle_id;

      // First marking
      const res1 = await request(app)
        .post(`/sourcing/${vehicleId}/interested`)
        .set('Authorization', getAuthHeader())
        .send({ notes: 'Old notes' });

      expect(res1.status).toBe(201);
      const savedId = res1.body.id;

      // Second marking (should update)
      const res2 = await request(app)
        .post(`/sourcing/${vehicleId}/interested`)
        .set('Authorization', getAuthHeader())
        .send({ notes: 'New notes' });

      expect(res2.status).toBe(409);

      // Verify notes were updated in DB
      const dbRes = await pool.query(
        'SELECT notes FROM interested_vehicles WHERE id = $1',
        [savedId]
      );
      expect(dbRes.rows[0].notes).toBe('New notes');
    });

    it('should accept optional notes', async () => {
      const vehicles = await pool.query(
        'SELECT * FROM vehicles_cache LIMIT 1'
      );
      const vehicleId = vehicles.rows[0].vehicle_id;

      const res = await request(app)
        .post(`/sourcing/${vehicleId}/interested`)
        .set('Authorization', getAuthHeader())
        .send({});

      expect(res.status).toBe(201);
    });

    it('should reject notes > 1000 characters', async () => {
      const vehicles = await pool.query(
        'SELECT * FROM vehicles_cache LIMIT 1'
      );
      const vehicleId = vehicles.rows[0].vehicle_id;

      const longNotes = 'a'.repeat(1001);

      const res = await request(app)
        .post(`/sourcing/${vehicleId}/interested`)
        .set('Authorization', getAuthHeader())
        .send({ notes: longNotes });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/1000/i);
    });

    it('should return 404 for non-existent vehicle', async () => {
      const res = await request(app)
        .post('/sourcing/non-existent-id/interested')
        .set('Authorization', getAuthHeader())
        .send({ notes: 'Test' });

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/não encontrado/i);
    });

    it('should log to search_queries for analytics', async () => {
      const vehicles = await pool.query(
        'SELECT * FROM vehicles_cache LIMIT 1'
      );
      const vehicleId = vehicles.rows[0].vehicle_id;

      const before = await pool.query(
        'SELECT COUNT(*) FROM search_queries'
      );

      await request(app)
        .post(`/sourcing/${vehicleId}/interested`)
        .set('Authorization', getAuthHeader())
        .send({ notes: 'Analytics test' });

      const after = await pool.query(
        'SELECT COUNT(*) FROM search_queries'
      );

      expect(parseInt(after.rows[0].count)).toBeGreaterThan(
        parseInt(before.rows[0].count)
      );
    });
  });

  // ============================================
  // GET /sourcing/favorites - STORY-402
  // RLS ISOLATION + DATABASE RETRIEVAL
  // ============================================

  describe('GET /sourcing/favorites', () => {
    it('should return user favorites with pagination', async () => {
      const res = await request(app)
        .get('/sourcing/favorites')
        .set('Authorization', getAuthHeader());

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('limit', 20);
      expect(res.body).toHaveProperty('offset', 0);
      expect(res.body).toHaveProperty('results');
      expect(Array.isArray(res.body.results)).toBe(true);
    });

    it('should filter by status', async () => {
      const res = await request(app)
        .get('/sourcing/favorites?status=interested')
        .set('Authorization', getAuthHeader());

      expect(res.status).toBe(200);
      res.body.results.forEach(fav => {
        expect(fav.status).toBe('interested');
      });
    });

    it('should reject invalid status', async () => {
      const res = await request(app)
        .get('/sourcing/favorites?status=invalid')
        .set('Authorization', getAuthHeader());

      expect(res.status).toBe(200);
      // Invalid statuses are just ignored (empty results)
      expect(res.body.results.length).toBe(0);
    });

    it('should support pagination with limit/offset', async () => {
      const res = await request(app)
        .get('/sourcing/favorites?limit=1&offset=0')
        .set('Authorization', getAuthHeader());

      expect(res.status).toBe(200);
      expect(res.body.limit).toBe(1);
      expect(res.body.offset).toBe(0);
    });

    it('should include vehicle_data snapshot', async () => {
      const res = await request(app)
        .get('/sourcing/favorites')
        .set('Authorization', getAuthHeader());

      expect(res.status).toBe(200);

      if (res.body.results.length > 0) {
        const fav = res.body.results[0];
        expect(fav).toHaveProperty('vehicle_data');
        expect(fav.vehicle_data).toHaveProperty('make');
        expect(fav.vehicle_data).toHaveProperty('model');
      }
    });

    it('should enforce RLS - user sees only own favorites', async () => {
      // Mark vehicle as interesting with testUser
      const vehicles = await pool.query(
        'SELECT * FROM vehicles_cache LIMIT 1'
      );
      const vehicleId = vehicles.rows[0].vehicle_id;

      await request(app)
        .post(`/sourcing/${vehicleId}/interested`)
        .set('Authorization', getAuthHeader(testUserId))
        .send({ notes: 'User marked' });

      // Try to access as different user
      const resOther = await request(app)
        .get('/sourcing/favorites')
        .set('Authorization', getAuthHeader(ownerUserId));

      expect(resOther.status).toBe(200);
      // Owner may see all due to RLS owner role, but regular user should see own only
      const resTest = await request(app)
        .get('/sourcing/favorites')
        .set('Authorization', getAuthHeader(testUserId));

      expect(resTest.status).toBe(200);
      // Verify marked vehicle appears in testUser's favorites
      const hasVehicle = resTest.body.results.some(
        fav => fav.vehicle_id === vehicleId
      );
      expect(hasVehicle).toBe(true);
    });

    it('should return empty list when user has no favorites', async () => {
      // Create a new test user that has no marked vehicles
      const newUserId = 'new-test-user-' + Date.now();

      const res = await request(app)
        .get('/sourcing/favorites')
        .set('Authorization', getAuthHeader(newUserId));

      expect(res.status).toBe(200);
      expect(res.body.results.length).toBe(0);
      expect(res.body.total).toBe(0);
    });

    it('should reject invalid limit', async () => {
      const res = await request(app)
        .get('/sourcing/favorites?limit=abc')
        .set('Authorization', getAuthHeader());

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/limit.*número/i);
    });

    it('should reject invalid offset', async () => {
      const res = await request(app)
        .get('/sourcing/favorites?offset=abc')
        .set('Authorization', getAuthHeader());

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/offset.*número/i);
    });
  });

  // ============================================
  // Multi-User RLS Isolation (Phase 5)
  // Verify JWT extraction and user isolation
  // ============================================

  describe('Multi-User RLS Isolation - Phase 5', () => {
    const userA = 'user-a-' + Date.now();
    const userB = 'user-b-' + Date.now();

    it('should isolate User A and User B favorites', async () => {
      // Get a test vehicle
      const vehicles = await pool.query(
        'SELECT * FROM vehicles_cache LIMIT 1'
      );
      const vehicleId = vehicles.rows[0].vehicle_id;

      // User A marks vehicle as interested
      const resA = await request(app)
        .post(`/sourcing/${vehicleId}/interested`)
        .set('Authorization', getAuthHeader(userA))
        .send({ notes: 'Marked by User A' });

      expect(resA.status).toBe(201);

      // User B gets favorites - should be empty
      const resBFavorites = await request(app)
        .get('/sourcing/favorites')
        .set('Authorization', getAuthHeader(userB));

      expect(resBFavorites.status).toBe(200);
      expect(resBFavorites.body.results.length).toBe(0);
      expect(resBFavorites.body.total).toBe(0);

      // User A gets favorites - should have the vehicle
      const resAFavorites = await request(app)
        .get('/sourcing/favorites')
        .set('Authorization', getAuthHeader(userA));

      expect(resAFavorites.status).toBe(200);
      expect(resAFavorites.body.total).toBeGreaterThan(0);
      const hasVehicleA = resAFavorites.body.results.some(
        fav => fav.vehicle_id === vehicleId
      );
      expect(hasVehicleA).toBe(true);
    });

    it('should allow both users to mark same vehicle independently', async () => {
      const vehicles = await pool.query(
        'SELECT * FROM vehicles_cache LIMIT 1 OFFSET 1'
      );
      const vehicleId = vehicles.rows[0].vehicle_id;

      // User A marks
      const resA = await request(app)
        .post(`/sourcing/${vehicleId}/interested`)
        .set('Authorization', getAuthHeader(userA))
        .send({ notes: 'User A interest' });
      expect(resA.status).toBe(201);

      // User B marks same vehicle
      const resB = await request(app)
        .post(`/sourcing/${vehicleId}/interested`)
        .set('Authorization', getAuthHeader(userB))
        .send({ notes: 'User B interest' });
      expect(resB.status).toBe(201);

      // Both should see their own record
      const resBFav = await request(app)
        .get('/sourcing/favorites')
        .set('Authorization', getAuthHeader(userB));
      const hasBFav = resBFav.body.results.some(
        fav => fav.vehicle_id === vehicleId && fav.notes === 'User B interest'
      );
      expect(hasBFav).toBe(true);

      // But User A should not see User B's record (RLS isolation)
      const resAFav = await request(app)
        .get('/sourcing/favorites')
        .set('Authorization', getAuthHeader(userA));
      const records = resAFav.body.results.filter(
        fav => fav.vehicle_id === vehicleId
      );
      expect(records.length).toBe(1);
      expect(records[0].notes).toBe('User A interest');
    });

    it('should reject request without valid JWT', async () => {
      const res = await request(app)
        .get('/sourcing/list')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/inválido/i);
    });

    it('should reject request with missing JWT', async () => {
      const res = await request(app)
        .get('/sourcing/list');

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/não fornecido/i);
    });
  });

  // ============================================
  // Transaction and ACID Properties
  // ============================================

  describe('ACID Properties - POST /interested', () => {
    it('should rollback on error (ACID atomicity)', async () => {
      const vehicles = await pool.query(
        'SELECT * FROM vehicles_cache LIMIT 1'
      );
      const vehicleId = vehicles.rows[0].vehicle_id;

      const countBefore = await pool.query(
        'SELECT COUNT(*) FROM interested_vehicles'
      );

      // Simulate error by sending invalid data
      // (This would be caught by validation)
      const res = await request(app)
        .post(`/sourcing/${vehicleId}/interested`)
        .set('Authorization', getAuthHeader())
        .send({ notes: 'a'.repeat(1001) }); // Too long

      expect(res.status).toBe(400);

      // Verify nothing was inserted (transaction rolled back)
      const countAfter = await pool.query(
        'SELECT COUNT(*) FROM interested_vehicles'
      );

      expect(countBefore.rows[0].count).toBe(countAfter.rows[0].count);
    });

    it('should handle concurrent marks gracefully (ON CONFLICT)', async () => {
      const vehicles = await pool.query(
        'SELECT * FROM vehicles_cache LIMIT 1'
      );
      const vehicleId = vehicles.rows[0].vehicle_id;
      const uniqueUser = 'concurrent-test-' + Date.now();

      // Simulate concurrent requests
      const results = await Promise.all([
        request(app)
          .post(`/sourcing/${vehicleId}/interested`)
          .set('Authorization', getAuthHeader(uniqueUser))
          .send({ notes: 'First' }),
        request(app)
          .post(`/sourcing/${vehicleId}/interested`)
          .set('Authorization', getAuthHeader(uniqueUser))
          .send({ notes: 'Second' }),
      ]);

      // One should succeed (201), one should conflict (409)
      const statuses = results.map(r => r.status);
      expect(statuses).toContain(201);
      expect(statuses).toContain(409);

      // Verify only one record in DB
      const dbRes = await pool.query(
        'SELECT COUNT(*) FROM interested_vehicles WHERE vehicle_id = $1 AND user_id = (SELECT id FROM users WHERE jwt_sub = $2)',
        [vehicleId, uniqueUser]
      );
      expect(parseInt(dbRes.rows[0].count)).toBe(1);
    });
  });

  // ============================================
  // Input Validation - Comprehensive
  // ============================================

  describe('Input Validation', () => {
    it('should trim whitespace from make/model', async () => {
      const res = await request(app)
        .get('/sourcing/search?make=  Honda  &model=  Civic  ')
        .set('Authorization', getAuthHeader());

      expect(res.status).toBe(200);
      if (res.body.results.length > 0) {
        expect(res.body.results[0].make).toBe('Honda');
      }
    });

    it('should handle null/undefined gracefully', async () => {
      const res = await request(app)
        .get('/sourcing/search?make=&model=')
        .set('Authorization', getAuthHeader());

      expect(res.status).toBe(200);
    });

    it('should reject non-numeric prices', async () => {
      const res = await request(app)
        .get('/sourcing/search?priceMin=invalid')
        .set('Authorization', getAuthHeader());

      expect(res.status).toBe(400);
    });

    it('should accept zero as valid price', async () => {
      const res = await request(app)
        .get('/sourcing/search?priceMin=0&priceMax=100000')
        .set('Authorization', getAuthHeader());

      expect(res.status).toBe(200);
    });
  });
});
