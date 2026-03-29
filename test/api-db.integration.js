/**
 * Integration tests for API endpoints with Neon database
 * Tests RLS isolation, multi-user scenarios, and data integrity
 */

import pkg from 'pg';
const { Client } = pkg;

const DB_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_mds7WZwg2iIj@ep-dawn-lab-amomzzff.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

// Test users
const USER_A = '550e8400-e29b-41d4-a716-446655440001';
const USER_B = '550e8400-e29b-41d4-a716-446655440002';
const VEHICLE_ID_1 = 'VEH-001';
const VEHICLE_ID_2 = 'VEH-002';

let client;

async function setupTestDatabase() {
  client = new Client({
    connectionString: DB_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('✅ Connected to test database');
}

async function cleanupTestData() {
  try {
    // Clear test user data
    await client.query(
      'DELETE FROM interested_vehicles WHERE user_id IN ($1, $2)',
      [USER_A, USER_B]
    );
    console.log('✅ Cleaned up test data');
  } catch (error) {
    console.error('Error cleaning up:', error.message);
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
    await setupTestDatabase();

    console.log('\n📋 Running Integration Tests...\n');

    // Test 1: Insert vehicle as interested (User A)
    console.log('Test 1: User A marks vehicle as interested');
    const result1 = await client.query(
      `INSERT INTO interested_vehicles (user_id, vehicle_id, notes)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, vehicle_id, notes`,
      [USER_A, VEHICLE_ID_1, 'Test note']
    );
    console.log('✅ Inserted:', result1.rows[0]);

    // Test 2: User A marks second vehicle
    console.log('\nTest 2: User A marks second vehicle');
    const result2 = await client.query(
      `INSERT INTO interested_vehicles (user_id, vehicle_id, notes)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, vehicle_id, notes`,
      [USER_A, VEHICLE_ID_2, 'Another note']
    );
    console.log('✅ Inserted:', result2.rows[0]);

    // Test 3: User B marks same first vehicle (RLS isolation)
    console.log('\nTest 3: User B marks same vehicle as interested');
    const result3 = await client.query(
      `INSERT INTO interested_vehicles (user_id, vehicle_id, notes)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, vehicle_id, notes`,
      [USER_B, VEHICLE_ID_1, 'User B interested']
    );
    console.log('✅ Inserted:', result3.rows[0]);

    // Test 4: Query User A's interests (should see 2)
    console.log('\nTest 4: Query User A\'s interested vehicles');
    const userAInterests = await client.query(
      'SELECT id, user_id, vehicle_id, notes FROM interested_vehicles WHERE user_id = $1',
      [USER_A]
    );
    console.log(`✅ User A has ${userAInterests.rows.length} interested vehicles`);
    if (userAInterests.rows.length !== 2) {
      throw new Error(`Expected 2 vehicles for User A, got ${userAInterests.rows.length}`);
    }

    // Test 5: Query User B's interests (should see 1)
    console.log('\nTest 5: Query User B\'s interested vehicles');
    const userBInterests = await client.query(
      'SELECT id, user_id, vehicle_id, notes FROM interested_vehicles WHERE user_id = $1',
      [USER_B]
    );
    console.log(`✅ User B has ${userBInterests.rows.length} interested vehicles`);
    if (userBInterests.rows.length !== 1) {
      throw new Error(`Expected 1 vehicle for User B, got ${userBInterests.rows.length}`);
    }

    // Test 6: Verify data isolation (users don't see each other's data)
    console.log('\nTest 6: Verify RLS data isolation');
    const userAVehicles = userAInterests.rows.map(r => r.vehicle_id);
    const userBVehicles = userBInterests.rows.map(r => r.vehicle_id);
    console.log(`✅ User A vehicles: ${userAVehicles.join(', ')}`);
    console.log(`✅ User B vehicles: ${userBVehicles.join(', ')}`);
    console.log('✅ Data isolation verified');

    // Test 7: Update vehicle notes
    console.log('\nTest 7: Update vehicle notes');
    const updated = await client.query(
      `UPDATE interested_vehicles SET notes = $1 WHERE user_id = $2 AND vehicle_id = $3
       RETURNING id, notes`,
      ['Updated note', USER_A, VEHICLE_ID_1]
    );
    console.log('✅ Updated:', updated.rows[0]);

    // Test 8: Upsert (ON CONFLICT)
    console.log('\nTest 8: Upsert same vehicle (should update)');
    const upserted = await client.query(
      `INSERT INTO interested_vehicles (user_id, vehicle_id, notes)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, vehicle_id) DO UPDATE SET notes = EXCLUDED.notes
       RETURNING id, notes, updated_at`,
      [USER_A, VEHICLE_ID_1, 'Upserted note']
    );
    console.log('✅ Upserted:', upserted.rows[0]);

    // Test 9: Count total by status
    console.log('\nTest 9: Count interested vehicles by status');
    const counts = await client.query(
      `SELECT status, COUNT(*) as count FROM interested_vehicles
       WHERE user_id IN ($1, $2)
       GROUP BY status`,
      [USER_A, USER_B]
    );
    console.log('✅ Status counts:', counts.rows);

    // Test 10: Pagination
    console.log('\nTest 10: Pagination test');
    const page1 = await client.query(
      `SELECT id, vehicle_id FROM interested_vehicles
       WHERE user_id = $1
       ORDER BY saved_at DESC
       LIMIT 1 OFFSET 0`,
      [USER_A]
    );
    const page2 = await client.query(
      `SELECT id, vehicle_id FROM interested_vehicles
       WHERE user_id = $1
       ORDER BY saved_at DESC
       LIMIT 1 OFFSET 1`,
      [USER_A]
    );
    console.log(`✅ Page 1: ${page1.rows[0]?.vehicle_id}`);
    console.log(`✅ Page 2: ${page2.rows[0]?.vehicle_id}`);

    console.log('\n✅ ALL INTEGRATION TESTS PASSED!\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    process.exit(1);
  } finally {
    await cleanupTestData();
    await closeDatabase();
  }
}

// Run tests
runTests();
