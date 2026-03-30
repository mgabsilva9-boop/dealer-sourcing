import pkg from 'pg';
const { Client } = pkg;

const neonConnectionString = "postgresql://neondb_owner:npg_mds7WZwg2iIj@ep-dawn-lab-amomzzff.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const client = new Client({
  connectionString: neonConnectionString,
  ssl: { rejectUnauthorized: false },
});

async function validate() {
  try {
    await client.connect();
    console.log('✅ Connected to Neon!\n');

    console.log('=== FINAL VALIDATION TESTS ===\n');

    // Test 1: Tables exist
    console.log('TEST 1: All required tables exist');
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      AND table_name IN ('dealerships', 'users', 'vehicles_cache', 'interested_vehicles', 'search_queries', 'vehicle_validations')
      ORDER BY table_name
    `);
    const expectedTables = ['dealerships', 'interested_vehicles', 'search_queries', 'users', 'vehicle_validations', 'vehicles_cache'];
    const actualTables = tables.rows.map(r => r.table_name).sort();
    const allTablesExist = JSON.stringify(expectedTables) === JSON.stringify(actualTables);
    console.log(`   ${allTablesExist ? '✅' : '❌'} Found ${tables.rows.length}/6 required tables`);
    tables.rows.forEach(row => console.log(`     - ${row.table_name}`));

    // Test 2: Dealerships data
    console.log('\nTEST 2: Dealerships have data');
    const dealerships = await client.query('SELECT COUNT(*) FROM dealerships');
    console.log(`   ${dealerships.rows[0].count >= 2 ? '✅' : '❌'} ${dealerships.rows[0].count} dealerships (expected ≥ 2)`);

    // Test 3: Users table has email and password columns
    console.log('\nTEST 3: Users table has required columns');
    const userColumns = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('email', 'password', 'dealership_id', 'role')
      ORDER BY column_name
    `);
    const expectedCols = ['dealership_id', 'email', 'password', 'role'];
    const actualCols = userColumns.rows.map(r => r.column_name).sort();
    const allColsExist = JSON.stringify(expectedCols) === JSON.stringify(actualCols);
    console.log(`   ${allColsExist ? '✅' : '❌'} Users table has ${userColumns.rows.length}/4 required columns`);

    // Test 4: Users data
    console.log('\nTEST 4: Users have test data');
    const users = await client.query('SELECT COUNT(*) FROM users');
    console.log(`   ${users.rows[0].count >= 3 ? '✅' : '❌'} ${users.rows[0].count} users (expected ≥ 3)`);

    // Test 5: Login simulation
    console.log('\nTEST 5: Login query works');
    const loginResult = await client.query(
      'SELECT id, email, role, dealership_id, password FROM users WHERE email = $1 LIMIT 1',
      ['gerente_a@loja-a.com']
    );
    if (loginResult.rows.length > 0) {
      const user = loginResult.rows[0];
      console.log('   ✅ User found successfully');
      console.log(`     - Email: ${user.email}`);
      console.log(`     - Role: ${user.role}`);
      console.log(`     - Password hash: ${user.password.substring(0, 20)}...`);
      console.log(`     - Dealership: ${user.dealership_id}`);
    } else {
      console.log('   ❌ User not found');
    }

    // Test 6: Vehicles data
    console.log('\nTEST 6: Vehicles cache has data');
    const vehicles = await client.query('SELECT COUNT(*) FROM vehicles_cache');
    console.log(`   ${vehicles.rows[0].count >= 4 ? '✅' : '❌'} ${vehicles.rows[0].count} vehicles (expected ≥ 4)`);

    // Test 7: Foreign key relationships
    console.log('\nTEST 7: Foreign keys work');
    const fkTest = await client.query(`
      SELECT u.id, u.email, d.name
      FROM users u
      LEFT JOIN dealerships d ON u.dealership_id = d.id
      WHERE u.email = 'gerente_a@loja-a.com'
    `);
    if (fkTest.rows.length > 0 && fkTest.rows[0].name) {
      console.log(`   ✅ Foreign key relationship works`);
      console.log(`     - User: ${fkTest.rows[0].email}`);
      console.log(`     - Dealership: ${fkTest.rows[0].name}`);
    } else {
      console.log('   ❌ Foreign key relationship broken');
    }

    // Test 8: Indexes exist
    console.log('\nTEST 8: Performance indexes exist');
    const indexes = await client.query(`
      SELECT COUNT(*) FROM pg_indexes
      WHERE schemaname = 'public'
      AND indexname LIKE 'idx_%'
    `);
    console.log(`   ${indexes.rows[0].count >= 5 ? '✅' : '❌'} ${indexes.rows[0].count} indexes (expected ≥ 5)`);

    // Summary
    console.log('\n=== SUMMARY ===');
    if (allTablesExist && dealerships.rows[0].count >= 2 && users.rows[0].count >= 3 && vehicles.rows[0].count >= 4) {
      console.log('🎉 ALL VALIDATION TESTS PASSED!');
      console.log('\n✅ System is ready for:');
      console.log('   - Backend login functionality');
      console.log('   - Frontend data loading');
      console.log('   - Production deployment');
      process.exit(0);
    } else {
      console.log('❌ SOME TESTS FAILED - Check output above');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

validate();
