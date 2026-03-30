import pkg from 'pg';
const { Client } = pkg;

const neonConnectionString = "postgresql://neondb_owner:npg_mds7WZwg2iIj@ep-dawn-lab-amomzzff.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const client = new Client({
  connectionString: neonConnectionString,
  ssl: { rejectUnauthorized: false },
});

async function testSchema() {
  try {
    await client.connect();
    console.log('✅ Connected to Neon!\n');

    // Test 1: Check users table
    console.log('TEST 1: SELECT FROM users');
    const usersResult = await client.query('SELECT * FROM users ORDER BY jwt_sub');
    console.log(`Result: ${usersResult.rows.length} rows`);
    usersResult.rows.forEach(row => {
      console.log(`  - ${row.jwt_sub}: ${row.role}`);
    });

    // Test 2: Check vehicles_cache table
    console.log('\nTEST 2: SELECT FROM vehicles_cache');
    const vehiclesResult = await client.query('SELECT vehicle_id, make, model, source FROM vehicles_cache');
    console.log(`Result: ${vehiclesResult.rows.length} rows`);
    vehiclesResult.rows.forEach(row => {
      console.log(`  - ${row.vehicle_id}: ${row.make} ${row.model} (${row.source})`);
    });

    // Test 3: Simulate login query
    console.log('\nTEST 3: Simulating login query');
    const loginResult = await client.query('SELECT id, role FROM users WHERE jwt_sub = $1', ['owner-user-id-123']);
    if (loginResult.rows.length > 0) {
      console.log(`✅ Login successful for owner-user-id-123`);
      console.log(`  Role: ${loginResult.rows[0].role}`);
      console.log(`  ID: ${loginResult.rows[0].id}`);
    } else {
      console.log('❌ User not found');
    }

    // Test 4: Check table exists
    console.log('\nTEST 4: Checking table existence');
    const tablesResult = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    console.log(`Found ${tablesResult.rows.length} tables:`);
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    // Test 5: Check indexes
    console.log('\nTEST 5: Checking indexes on vehicles_cache');
    const indexResult = await client.query(`
      SELECT indexname FROM pg_indexes
      WHERE tablename = 'vehicles_cache'
    `);
    console.log(`Found ${indexResult.rows.length} indexes:`);
    indexResult.rows.forEach(row => {
      console.log(`  - ${row.indexname}`);
    });

    console.log('\n🎉 ALL TESTS PASSED!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

testSchema();
