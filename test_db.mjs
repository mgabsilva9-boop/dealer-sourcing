import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

(async () => {
  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM inventory');
    console.log('\n✅ Total de veículos:', result.rows[0].count);
    
    const vehicles = await pool.query('SELECT make, model, year, status FROM inventory LIMIT 10');
    console.log('\n📦 Veículos encontrados:');
    vehicles.rows.forEach(v => console.log(`   - ${v.make} ${v.model} (${v.year}) - Status: ${v.status}`));
    
    const users = await pool.query("SELECT email FROM users WHERE email IN ('dono@brossmotors.com', 'admin@threeon.com')");
    console.log('\n👤 Usuários encontrados:');
    users.rows.forEach(u => console.log(`   - ${u.email}`));
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await pool.end();
  }
})();
