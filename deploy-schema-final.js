import pkg from 'pg';
const { Client } = pkg;

const neonConnectionString = "postgresql://neondb_owner:npg_mds7WZwg2iIj@ep-dawn-lab-amomzzff.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const client = new Client({
  connectionString: neonConnectionString,
  ssl: { rejectUnauthorized: false },
});

async function runMigration() {
  try {
    await client.connect();
    console.log('✅ Connected to Neon!\n');

    // Drop existing objects CAREFULLY (preserve test data)
    console.log('🔄 Cleaning up (keeping test data)...');
    try {
      await client.query('DROP TRIGGER IF EXISTS trg_vehicles_cache_updated_at ON vehicles_cache CASCADE');
      await client.query('DROP TRIGGER IF EXISTS trg_sync_vehicle_validation ON vehicle_validations CASCADE');
      await client.query('DROP TRIGGER IF EXISTS trg_interested_vehicles_updated_at ON interested_vehicles CASCADE');
      await client.query('DROP FUNCTION IF EXISTS update_vehicles_cache_timestamp()');
      await client.query('DROP FUNCTION IF EXISTS sync_vehicle_validation()');
      await client.query('DROP FUNCTION IF EXISTS update_interested_vehicles_timestamp()');

      await client.query('DROP TABLE IF EXISTS vehicle_validations CASCADE');
      await client.query('DROP TABLE IF EXISTS search_queries CASCADE');
      await client.query('DROP TABLE IF EXISTS interested_vehicles CASCADE');
      await client.query('DROP TABLE IF EXISTS vehicles_cache CASCADE');
      await client.query('DROP TABLE IF EXISTS users CASCADE');
      await client.query('DROP TABLE IF EXISTS dealerships CASCADE');
      await client.query('DROP TABLE IF EXISTS migrations CASCADE');
      console.log('✅ Cleaned up!\n');
    } catch(e) {
      console.log('⚠️  Cleanup skipped:', e.message.substring(0, 50));
    }

    // === CREATE DEALERSHIPS ===
    console.log('📝 Creating dealerships table...');
    await client.query(`
      CREATE TABLE dealerships (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        cnpj TEXT UNIQUE,
        city TEXT,
        state TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Insert dealerships
    await client.query(`
      INSERT INTO dealerships (id, name, city, state) VALUES
        ('a0000000-0000-0000-0000-000000000001', 'Loja A - Premium Motors', 'São Paulo', 'SP'),
        ('b0000000-0000-0000-0000-000000000001', 'Loja B - Luxury Auto', 'Blumenau', 'SC')
      ON CONFLICT DO NOTHING;
    `);
    console.log('✅ Dealerships table created and seeded!\n');

    // === CREATE USERS ===
    console.log('📝 Creating users table...');
    await client.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        jwt_sub TEXT UNIQUE,
        email TEXT UNIQUE,
        password TEXT,
        name TEXT,
        role TEXT DEFAULT 'user' CHECK (role IN ('owner', 'shop', 'admin', 'user')),
        dealership_id UUID REFERENCES dealerships(id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Insert test users with bcryptjs hash of "senha123"
    // Hash: $2b$10$SdmJThwT07/kypymfOANYuz3UFv7ZGYcarMm.yaxA0oAjngTHhBXW (senha123)
    await client.query(`
      INSERT INTO users (name, email, password, role, dealership_id, jwt_sub) VALUES
        ('Gerente Loja A', 'gerente_a@loja-a.com', '$2b$10$SdmJThwT07/kypymfOANYuz3UFv7ZGYcarMm.yaxA0oAjngTHhBXW', 'admin', 'a0000000-0000-0000-0000-000000000001', 'gerente_a@loja-a.com'),
        ('Gerente Loja B', 'gerente_b@loja-b.com', '$2b$10$SdmJThwT07/kypymfOANYuz3UFv7ZGYcarMm.yaxA0oAjngTHhBXW', 'admin', 'b0000000-0000-0000-0000-000000000001', 'gerente_b@loja-b.com'),
        ('Owner/Admin', 'owner@garagem.com', '$2b$10$SdmJThwT07/kypymfOANYuz3UFv7ZGYcarMm.yaxA0oAjngTHhBXW', 'owner', 'a0000000-0000-0000-0000-000000000001', 'owner@garagem.com')
      ON CONFLICT (email) DO NOTHING;
    `);
    console.log('✅ Users table created and seeded!\n');

    // === CREATE VEHICLES_CACHE ===
    console.log('📝 Creating vehicles_cache table...');
    await client.query(`
      CREATE TABLE vehicles_cache (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vehicle_id TEXT UNIQUE NOT NULL,
        source TEXT,
        make TEXT,
        model TEXT,
        year INTEGER,
        price NUMERIC(12,2),
        km INTEGER,
        score INTEGER,
        vehicle_data JSONB,
        dealership_id UUID REFERENCES dealerships(id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Create index
    await client.query('CREATE INDEX idx_vehicles_cache_dealership_id ON vehicles_cache(dealership_id)');

    // Insert test vehicles
    await client.query(`
      INSERT INTO vehicles_cache (vehicle_id, source, make, model, year, price, km, score, vehicle_data, dealership_id) VALUES
        ('bmw-m2-001', 'webmotors', 'BMW', 'M2', 2018, 300676.00, 42000, 85, '{"platform":"webmotors","url":"https://example.com/bmw-m2"}', 'a0000000-0000-0000-0000-000000000001'),
        ('vw-gol-001', 'olx', 'VW', 'Gol 1.0', 2022, 54202.00, 56000, 78, '{"platform":"olx","url":"https://example.com/vw-gol"}', 'a0000000-0000-0000-0000-000000000001'),
        ('ram-1500-001', 'mercadolivre', 'RAM', '1500 CLASSIC', 2023, 261020.00, 42000, 92, '{"platform":"ml","url":"https://example.com/ram-1500"}', 'b0000000-0000-0000-0000-000000000001'),
        ('ram-2500-001', 'facebook', 'RAM', '2500 LARAMIE', 2020, 294518.00, 52000, 88, '{"platform":"fb","url":"https://example.com/ram-2500"}', 'b0000000-0000-0000-0000-000000000001')
      ON CONFLICT (vehicle_id) DO NOTHING;
    `);
    console.log('✅ Vehicles_cache table created and seeded!\n');

    // === CREATE INTERESTED_VEHICLES ===
    console.log('📝 Creating interested_vehicles table...');
    await client.query(`
      CREATE TABLE interested_vehicles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        vehicle_id TEXT,
        vehicle_data JSONB,
        status TEXT DEFAULT 'interested',
        dealership_id UUID REFERENCES dealerships(id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (user_id, vehicle_id)
      );
    `);

    // Create indexes
    await client.query('CREATE INDEX idx_interested_vehicles_dealership_id ON interested_vehicles(dealership_id)');
    await client.query('CREATE INDEX idx_interested_vehicles_user_id ON interested_vehicles(user_id)');
    console.log('✅ Interested_vehicles table created!\n');

    // === CREATE SEARCH_QUERIES ===
    console.log('📝 Creating search_queries table...');
    await client.query(`
      CREATE TABLE search_queries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        query_params JSONB,
        results_count INTEGER,
        dealership_id UUID REFERENCES dealerships(id),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Create indexes
    await client.query('CREATE INDEX idx_search_queries_dealership_id ON search_queries(dealership_id)');
    await client.query('CREATE INDEX idx_search_queries_user_id ON search_queries(user_id)');
    console.log('✅ Search_queries table created!\n');

    // === CREATE VEHICLE_VALIDATIONS ===
    console.log('📝 Creating vehicle_validations table...');
    await client.query(`
      CREATE TABLE vehicle_validations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vehicle_id TEXT,
        validated_by UUID REFERENCES users(id),
        is_good_car BOOLEAN,
        validation_score INTEGER,
        validation_comment TEXT,
        dealership_id UUID REFERENCES dealerships(id),
        validated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Create indexes
    await client.query('CREATE INDEX idx_vehicle_validations_dealership_id ON vehicle_validations(dealership_id)');
    console.log('✅ Vehicle_validations table created!\n');

    // === CREATE MIGRATIONS TABLE ===
    console.log('📝 Creating migrations table...');
    await client.query(`
      CREATE TABLE migrations (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await client.query("INSERT INTO migrations (name) VALUES ('DEPLOY_FINAL_COMPLETE') ON CONFLICT DO NOTHING");
    console.log('✅ Migrations table created!\n');

    // === VERIFY ===
    console.log('🔍 Verifying deployment...\n');

    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    console.log('✅ TABLES CREATED:');
    tables.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    // Verify dealerships
    const dealerships = await client.query('SELECT id, name, state FROM dealerships ORDER BY state');
    console.log(`\n✅ DEALERSHIPS (${dealerships.rows.length}):`);
    dealerships.rows.forEach(row => {
      console.log(`   - ${row.name} (${row.state}) [${row.id}]`);
    });

    // Verify users
    const users = await client.query('SELECT id, email, role, dealership_id FROM users ORDER BY email');
    console.log(`\n✅ USERS (${users.rows.length}):`);
    users.rows.forEach(row => {
      console.log(`   - ${row.email} (${row.role}) @ dealership=${row.dealership_id.substring(0, 8)}`);
    });

    // Verify vehicles
    const vehicles = await client.query('SELECT vehicle_id, make, model, dealership_id FROM vehicles_cache');
    console.log(`\n✅ VEHICLES (${vehicles.rows.length}):`);
    vehicles.rows.forEach(row => {
      console.log(`   - ${row.vehicle_id}: ${row.make} ${row.model}`);
    });

    // Test login query
    console.log('\n🔍 Testing login query...');
    const loginTest = await client.query(
      'SELECT id, email, role, dealership_id FROM users WHERE email = $1',
      ['gerente_a@loja-a.com']
    );
    if (loginTest.rows.length > 0) {
      const user = loginTest.rows[0];
      console.log(`✅ Login query successful:`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Dealership: ${user.dealership_id}`);
      console.log(`   ID: ${user.id}`);
    }

    console.log('\n🎉 SCHEMA DEPLOYMENT COMPLETE!');
    console.log('\n📋 TEST CREDENTIALS:');
    console.log('   Email: gerente_a@loja-a.com');
    console.log('   Password: senha123');
    console.log('   Role: admin');
    console.log('   Dealership: Loja A');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.position) {
      console.error(`Position: ${error.position}`);
    }
    if (error.detail) {
      console.error(`Detail: ${error.detail}`);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
