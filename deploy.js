const { Pool } = require('pg');
const fs = require('fs');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres.bxnennpxirlwfukyjsqk:BarufiPenteado0987!@aws-1-sa-east-1.pooler.supabase.com:6543/postgres';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function deploy() {
  const client = await pool.connect();
  try {
    console.log('📍 Conectando ao Supabase...');
    const sql = fs.readFileSync('db/migrations/DEPLOY_CLEAN.sql', 'utf8');
    
    console.log('📍 Executando migrations...');
    await client.query(sql);
    
    console.log('✅ DEPLOYMENT COMPLETO!');
    
    console.log('\n📊 Verificando tabelas...');
    const tables = await client.query(`
      SELECT tablename FROM pg_tables WHERE schemaname='public'
    `);
    console.log('✅ Tabelas criadas:', tables.rows.map(r => r.tablename).join(', '));
    
    console.log('\n👥 Verificando usuários...');
    const users = await client.query('SELECT email, role, dealership_id FROM users');
    console.log('✅ Usuários:', users.rows);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

deploy();
