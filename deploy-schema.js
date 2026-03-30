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

    // Read migration files
    const fs = await import('fs').then(m => m.promises);
    const path = await import('path').then(m => m.default);

    const migrationDir = path.join(process.cwd(), 'db', 'migrations');
    
    // Read schema migration
    const schema001 = await fs.readFile(path.join(migrationDir, '001_initial_schema.sql'), 'utf8');
    const seedData = await fs.readFile(path.join(migrationDir, '002_seed_data.sql'), 'utf8');

    // Execute schema migration
    console.log('\n📝 Applying 001_initial_schema.sql...');
    await client.query(schema001);
    console.log('✅ Schema migration applied!');

    // Execute seed data
    console.log('\n📝 Applying 002_seed_data.sql...');
    await client.query(seedData);
    console.log('✅ Seed data applied!');

    // Verify tables
    console.log('\n🔍 Verifying tables...');
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log('\n✅ Tables created:');
    tables.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    // Verify users
    console.log('\n🔍 Verifying users...');
    const users = await client.query('SELECT id, jwt_sub, role FROM users LIMIT 5');
    console.log(`✅ Found ${users.rows.length} users:`);
    users.rows.forEach(user => {
      console.log(`   - ${user.jwt_sub} (${user.role})`);
    });

    // Verify vehicles
    console.log('\n🔍 Verifying vehicles...');
    const vehicles = await client.query('SELECT COUNT(*) FROM vehicles_cache');
    console.log(`✅ Found ${vehicles.rows[0].count} vehicles in cache`);

    console.log('\n🎉 DEPLOYMENT COMPLETE!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
