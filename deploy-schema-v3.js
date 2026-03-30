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
    console.log('✅ Connected to Neon!');

    // Drop existing objects to ensure clean state
    console.log('\n🔄 Cleaning up existing objects...');
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
      await client.query('DROP TABLE IF EXISTS migrations CASCADE');
      console.log('✅ Cleaned up!');
    } catch(e) {
      console.log('⚠️  Cleanup skipped:', e.message.substring(0, 50));
    }

    // Create users table
    console.log('\n📝 Creating users table...');
    await client.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        jwt_sub TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('owner', 'shop', 'user')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ Users table created!');

    // Create vehicles_cache table
    console.log('\n📝 Creating vehicles_cache table...');
    await client.query(`
      CREATE TABLE vehicles_cache (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vehicle_id TEXT UNIQUE NOT NULL,
        source TEXT NOT NULL,
        make TEXT,
        model TEXT,
        year INTEGER,
        price NUMERIC(12,2),
        km INTEGER,
        discount NUMERIC(5,2),
        location TEXT,
        score INTEGER CHECK (score >= 1 AND score <= 100),
        vehicle_data JSONB NOT NULL,
        validation_score INTEGER CHECK (validation_score IS NULL OR (validation_score >= 1 AND validation_score <= 100)),
        is_good_car BOOLEAN,
        validation_comment TEXT,
        validated_at TIMESTAMPTZ,
        cached_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ Vehicles_cache table created!');

    // Create indexes
    console.log('\n📝 Creating indexes...');
    await client.query('CREATE INDEX idx_vehicles_cache_vehicle_id ON vehicles_cache(vehicle_id)');
    await client.query('CREATE INDEX idx_vehicles_cache_source_cached ON vehicles_cache(source, cached_at DESC)');
    await client.query('CREATE INDEX idx_vehicles_cache_price_km ON vehicles_cache(price, km)');
    await client.query('CREATE INDEX idx_vehicles_cache_is_good_car ON vehicles_cache(is_good_car)');
    console.log('✅ Indexes created!');

    // Create interested_vehicles table
    console.log('\n📝 Creating interested_vehicles table...');
    await client.query(`
      CREATE TABLE interested_vehicles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        vehicle_id TEXT NOT NULL,
        vehicle_data JSONB NOT NULL,
        status TEXT NOT NULL DEFAULT 'interested'
          CHECK (status IN ('interested', 'contacted', 'purchased', 'rejected')),
        status_updated_at TIMESTAMPTZ DEFAULT NOW(),
        notes TEXT,
        user_validation_score INTEGER CHECK (user_validation_score IS NULL OR (user_validation_score >= 1 AND user_validation_score <= 100)),
        user_validation_comment TEXT,
        user_validated_at TIMESTAMPTZ,
        contacted_at TIMESTAMPTZ,
        purchased_at TIMESTAMPTZ,
        saved_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (user_id, vehicle_id)
      );
    `);
    console.log('✅ Interested_vehicles table created!');

    // Create interested_vehicles indexes
    console.log('\n📝 Creating interested_vehicles indexes...');
    await client.query('CREATE INDEX idx_interested_vehicles_user_id ON interested_vehicles(user_id)');
    await client.query('CREATE INDEX idx_interested_vehicles_user_status ON interested_vehicles(user_id, status)');
    await client.query('CREATE INDEX idx_interested_vehicles_vehicle_id ON interested_vehicles(vehicle_id)');
    await client.query('CREATE INDEX idx_interested_vehicles_status ON interested_vehicles(status)');
    await client.query('CREATE INDEX idx_interested_vehicles_saved_at ON interested_vehicles(user_id, saved_at DESC)');
    console.log('✅ Interested_vehicles indexes created!');

    // Create search_queries table
    console.log('\n📝 Creating search_queries table...');
    await client.query(`
      CREATE TABLE search_queries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        query_params JSONB NOT NULL,
        results_count INTEGER,
        validation_enabled BOOLEAN DEFAULT false,
        validation_score INTEGER CHECK (validation_score IS NULL OR (validation_score >= 1 AND validation_score <= 100)),
        validation_result TEXT,
        searched_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ Search_queries table created!');

    // Create search_queries indexes
    console.log('\n📝 Creating search_queries indexes...');
    await client.query('CREATE INDEX idx_search_queries_user_id ON search_queries(user_id)');
    await client.query('CREATE INDEX idx_search_queries_user_searched ON search_queries(user_id, searched_at DESC)');
    await client.query('CREATE INDEX idx_search_queries_validation ON search_queries(validation_enabled, validation_result)');
    console.log('✅ Search_queries indexes created!');

    // Create vehicle_validations table
    console.log('\n📝 Creating vehicle_validations table...');
    await client.query(`
      CREATE TABLE vehicle_validations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vehicle_id TEXT NOT NULL,
        validated_by UUID NOT NULL REFERENCES users(id),
        is_good_car BOOLEAN NOT NULL,
        validation_score INTEGER NOT NULL CHECK (validation_score >= 1 AND validation_score <= 100),
        validation_comment TEXT,
        validated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ Vehicle_validations table created!');

    // Create vehicle_validations indexes
    console.log('\n📝 Creating vehicle_validations indexes...');
    await client.query('CREATE INDEX idx_vehicle_validations_vehicle_id ON vehicle_validations(vehicle_id)');
    await client.query('CREATE INDEX idx_vehicle_validations_validated_by ON vehicle_validations(validated_by, validated_at DESC)');
    console.log('✅ Vehicle_validations indexes created!');

    // Create triggers
    console.log('\n📝 Creating triggers...');

    await client.query(`
      CREATE OR REPLACE FUNCTION update_vehicles_cache_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await client.query(`
      CREATE TRIGGER trg_vehicles_cache_updated_at
        BEFORE UPDATE ON vehicles_cache
        FOR EACH ROW
        EXECUTE FUNCTION update_vehicles_cache_timestamp();
    `);

    await client.query(`
      CREATE OR REPLACE FUNCTION sync_vehicle_validation()
      RETURNS TRIGGER AS $$
      BEGIN
        UPDATE vehicles_cache
        SET validation_score = NEW.validation_score,
            is_good_car = NEW.is_good_car,
            validation_comment = NEW.validation_comment,
            validated_at = NEW.validated_at
        WHERE vehicle_id = NEW.vehicle_id;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await client.query(`
      CREATE TRIGGER trg_sync_vehicle_validation
        AFTER INSERT OR UPDATE ON vehicle_validations
        FOR EACH ROW
        EXECUTE FUNCTION sync_vehicle_validation();
    `);

    await client.query(`
      CREATE OR REPLACE FUNCTION update_interested_vehicles_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        IF NEW.status IS DISTINCT FROM OLD.status THEN
          NEW.status_updated_at = NOW();
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await client.query(`
      CREATE TRIGGER trg_interested_vehicles_updated_at
        BEFORE UPDATE ON interested_vehicles
        FOR EACH ROW
        EXECUTE FUNCTION update_interested_vehicles_timestamp();
    `);

    console.log('✅ Triggers created!');

    // Create migrations tracking table
    console.log('\n📝 Creating migrations table...');
    await client.query(`
      CREATE TABLE migrations (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await client.query("INSERT INTO migrations (name) VALUES ('001_initial_schema')");
    console.log('✅ Migrations table created!');

    // Insert test data
    console.log('\n📝 Inserting test data...');

    // Insert users
    await client.query(`
      INSERT INTO users (jwt_sub, role) VALUES
        ('owner-user-id-123', 'owner'),
        ('shop-user-id-456', 'shop'),
        ('user-id-789', 'user')
      ON CONFLICT (jwt_sub) DO NOTHING;
    `);
    console.log('✅ Test users inserted!');

    // Insert vehicles
    await client.query(`
      INSERT INTO vehicles_cache (
        vehicle_id, source, make, model, year, price, km, discount,
        location, score, vehicle_data, validation_score, is_good_car, validated_at
      ) VALUES
        (
          'real-olx-0-seed1',
          'olx',
          'Honda',
          'Civic',
          2022,
          86587.00,
          23654,
          -8.9,
          'São Paulo, SP',
          99,
          jsonb_build_object(
            'id', 'real-olx-0-seed1',
            'platform', 'olx',
            'make', 'Honda',
            'model', 'Civic',
            'year', 2022,
            'price', 86587,
            'fipe', 95000,
            'discount', -8.9,
            'km', 23654,
            'location', 'São Paulo, SP',
            'score', 99,
            'time', '30h atrás',
            'phone', '(67) 22379-4475',
            'url', 'https://example.com/veiculo/0',
            'kmRating', 'Baixa',
            'owners', 2,
            'accidents', 0,
            'serviceHistory', 'Completo',
            'bodyCondition', 'Bom'
          ),
          90,
          true,
          NOW()
        ),
        (
          'real-olx-1-seed1',
          'olx',
          'Toyota',
          'Corolla',
          2021,
          97803.00,
          54487,
          -0.2,
          'Rio de Janeiro, RJ',
          90,
          jsonb_build_object(
            'id', 'real-olx-1-seed1',
            'platform', 'olx',
            'make', 'Toyota',
            'model', 'Corolla',
            'year', 2021,
            'price', 97803,
            'fipe', 98000,
            'discount', -0.2,
            'km', 54487,
            'location', 'Rio de Janeiro, RJ',
            'score', 90,
            'time', '15h atrás',
            'phone', '(93) 94443-8073',
            'url', 'https://example.com/veiculo/1',
            'kmRating', 'Média',
            'owners', 3,
            'accidents', 2,
            'serviceHistory', 'Sem registros',
            'bodyCondition', 'Excelente'
          ),
          85,
          true,
          NOW()
        ),
        (
          'real-webmotors-2-seed1',
          'webmotors',
          'Volkswagen',
          'Golf',
          2020,
          81287.00,
          95790,
          -4.4,
          'Belo Horizonte, MG',
          82,
          jsonb_build_object(
            'id', 'real-webmotors-2-seed1',
            'platform', 'webmotors',
            'make', 'Volkswagen',
            'model', 'Golf',
            'year', 2020,
            'price', 81287,
            'fipe', 85000,
            'discount', -4.4,
            'km', 95790,
            'location', 'Belo Horizonte, MG',
            'score', 82,
            'time', '11h atrás',
            'phone', '(47) 30311-6975',
            'url', 'https://example.com/veiculo/2',
            'kmRating', 'Média',
            'owners', 1,
            'accidents', 0,
            'serviceHistory', 'Completo',
            'bodyCondition', 'Bom'
          ),
          75,
          true,
          NOW()
        )
      ON CONFLICT (vehicle_id) DO NOTHING;
    `);
    console.log('✅ Test vehicles inserted!');

    // Verify tables
    console.log('\n🔍 Verifying final state...');
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    console.log('\n✅ TABLES CREATED:');
    tables.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    // Verify users
    const users = await client.query('SELECT id, jwt_sub, role FROM users ORDER BY created_at');
    console.log(`\n✅ USERS (${users.rows.length}):`);
    users.rows.forEach(row => {
      console.log(`   - ${row.jwt_sub} (${row.role}) [id: ${row.id}]`);
    });

    // Verify vehicles
    const vehicles = await client.query('SELECT COUNT(*) FROM vehicles_cache');
    console.log(`\n✅ VEHICLES CACHED: ${vehicles.rows[0].count}`);

    // Test query
    console.log('\n🔍 Testing SELECT query...');
    const testQuery = await client.query('SELECT COUNT(*) as total FROM users');
    console.log(`✅ Query result: ${testQuery.rows[0].total} users`);

    console.log('\n🎉 SCHEMA DEPLOYMENT COMPLETE!');
    console.log('\nTo migrate RLS policies to Supabase later, use:');
    console.log('  - ENABLE ROW LEVEL SECURITY on tables');
    console.log('  - Create POLICIES with Supabase auth.uid() functions');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.position) {
      console.error(`Position: ${error.position}`);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
