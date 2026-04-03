import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

(async () => {
  try {
    console.log('🔍 Verificando tabela users...\n');
    
    // 1. Ver estrutura atual
    const structure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Colunas atuais em users:');
    structure.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // 2. Contar quantas linhas têm id
    const idCheck = await pool.query('SELECT COUNT(*) as total, COUNT(id) as with_id FROM users');
    console.log(`\n📊 Users no banco:`);
    console.log(`   Total: ${idCheck.rows[0].total}`);
    console.log(`   Com ID: ${idCheck.rows[0].with_id}`);
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await pool.end();
  }
})();
