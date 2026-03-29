import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: "postgresql://neondb_owner:npg_mds7WZwg2iIj@ep-dawn-lab-amomzzff.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  ssl: { rejectUnauthorized: false },
});

(async () => {
  try {
    await client.connect();
    console.log('✅ Connected to Neon!');
    
    const result = await client.query('SELECT NOW() as timestamp');
    console.log('✅ Query executed:', result.rows[0]);
    
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);
    console.log('✅ Database tables:', tables.rows.map(r => r.table_name));
    
    await client.end();
    console.log('✅ Connection test PASSED!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
})();
