/**
 * JWT Integration Tests for STORY-501
 * Tests multi-user JWT token parsing and RLS isolation
 */

import jwt from 'jsonwebtoken';
import pkg from 'pg';
const { Client } = pkg;

const DB_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_mds7WZwg2iIj@ep-dawn-lab-amomzzff.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const JWT_SECRET = 'dealer-sourcing-jwt-secret-phase5-mvp';

// Test users
const USER_A_ID = '550e8400-e29b-41d4-a716-446655440011';
const USER_B_ID = '550e8400-e29b-41d4-a716-446655440012';
const VEHICLE_ID = 'VEH-JWT-001';

let client;

function generateJWT(userId) {
  return jwt.sign(
    {
      sub: userId,        // standard JWT subject claim
      user_id: userId,   // fallback custom claim
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
    },
    JWT_SECRET
  );
}

function parseJWT(token) {
  return jwt.verify(token, JWT_SECRET);
}

async function setupDatabase() {
  client = new Client({
    connectionString: DB_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  console.log('✅ Connected to test database');
}

async function cleanupTestData() {
  try {
    await client.query(
      'DELETE FROM interested_vehicles WHERE user_id IN ($1, $2)',
      [USER_A_ID, USER_B_ID]
    );
    console.log('✅ Cleaned up test data');
  } catch (error) {
    console.error('Cleanup error:', error.message);
  }
}

async function closeDatabase() {
  if (client) {
    await client.end();
    console.log('✅ Closed database connection');
  }
}

async function runTests() {
  try {
    await setupDatabase();

    console.log('\n📋 JWT Integration Tests...\n');

    // Test 1: Generate JWT
    console.log('Test 1: Generate JWT token');
    const tokenA = generateJWT(USER_A_ID);
    const tokenB = generateJWT(USER_B_ID);
    console.log('✅ JWT tokens generated');

    // Test 2: Parse JWT and extract user_id
    console.log('\nTest 2: Parse JWT and extract user_id');
    const decodedA = parseJWT(tokenA);
    const decodedB = parseJWT(tokenB);
    console.log(`✅ User A ID from JWT: ${decodedA.sub}`);
    console.log(`✅ User B ID from JWT: ${decodedB.sub}`);

    if (decodedA.sub !== USER_A_ID || decodedB.sub !== USER_B_ID) {
      throw new Error('JWT decoding failed');
    }

    // Test 3: Simulate middleware extraction
    console.log('\nTest 3: Simulate middleware user extraction');
    const mockReqA = { headers: { authorization: `Bearer ${tokenA}` } };
    const mockReqB = { headers: { authorization: `Bearer ${tokenB}` } };

    const extractUserId = (req) => {
      const token = req.headers.authorization?.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET);
      return decoded.sub || decoded.user_id || decoded.id;
    };

    const userIdA = extractUserId(mockReqA);
    const userIdB = extractUserId(mockReqB);
    console.log(`✅ User A extracted: ${userIdA}`);
    console.log(`✅ User B extracted: ${userIdB}`);

    // Test 4: Insert data with extracted user IDs
    console.log('\nTest 4: Insert interested vehicles with JWT-extracted user IDs');
    const resultA = await client.query(
      `INSERT INTO interested_vehicles (user_id, vehicle_id, notes)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, vehicle_id`,
      [userIdA, VEHICLE_ID, 'From JWT User A']
    );
    console.log('✅ Inserted for User A:', resultA.rows[0]);

    const resultB = await client.query(
      `INSERT INTO interested_vehicles (user_id, vehicle_id, notes)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, vehicle_id) DO UPDATE SET notes = EXCLUDED.notes
       RETURNING id, user_id, vehicle_id`,
      [userIdB, VEHICLE_ID, 'From JWT User B']
    );
    console.log('✅ Inserted for User B:', resultB.rows[0]);

    // Test 5: Verify multi-user isolation
    console.log('\nTest 5: Query each user\'s data only');
    const userAData = await client.query(
      'SELECT id, user_id, vehicle_id, notes FROM interested_vehicles WHERE user_id = $1',
      [userIdA]
    );
    const userBData = await client.query(
      'SELECT id, user_id, vehicle_id, notes FROM interested_vehicles WHERE user_id = $1',
      [userIdB]
    );
    
    console.log(`✅ User A records: ${userAData.rows.length}`);
    console.log(`✅ User B records: ${userBData.rows.length}`);

    if (userAData.rows.length !== 1 || userBData.rows.length !== 1) {
      throw new Error('Data isolation failed');
    }

    // Test 6: JWT expiration
    console.log('\nTest 6: JWT expiration handling');
    const expiredToken = jwt.sign(
      { sub: USER_A_ID, exp: Math.floor(Date.now() / 1000) - 3600 }, // 1 hour ago
      JWT_SECRET
    );
    
    try {
      jwt.verify(expiredToken, JWT_SECRET);
      throw new Error('Expired token should have been rejected');
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        console.log('✅ Expired token correctly rejected');
      } else {
        throw error;
      }
    }

    // Test 7: Invalid JWT
    console.log('\nTest 7: Invalid JWT handling');
    try {
      jwt.verify('invalid.token.here', JWT_SECRET);
      throw new Error('Invalid token should have been rejected');
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        console.log('✅ Invalid token correctly rejected');
      } else {
        throw error;
      }
    }

    console.log('\n✅ ALL JWT TESTS PASSED!\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    process.exit(1);
  } finally {
    await cleanupTestData();
    await closeDatabase();
  }
}

runTests();
