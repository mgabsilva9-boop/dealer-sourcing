import './src/config/env.js' with { type: 'json' };
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

(async () => {
  try {
    console.log('🔍 Verificando tabela users...\n');
    
    // Ver estrutura
    const structure = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Colunas em users:');
    structure.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type}`);
    });
    
    // Contar users com id
    const idCheck = await pool.query('SELECT COUNT(*) as total, COUNT(id) as with_id FROM users');
    console.log(`\n📊 Users: ${idCheck.rows[0].total} total, ${idCheck.rows[0].with_id} com ID`);
    
    // Se não tem id, precisa criar
    const hasId = structure.rows.some(col => col.column_name === 'id');
    if (!hasId) {
      console.log('\n❌ PROBLEMA CRÍTICO: Tabela users não tem coluna "id"');
      console.log('➡️ Corrigindo...\n');
      
      // Criar coluna id
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT gen_random_uuid()`);
      console.log('✅ Coluna id criada');
      
    } else {
      console.log('\n✅ Coluna id existe');
    }
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await pool.end();
  }
})();
