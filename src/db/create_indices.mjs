import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres.bxnennpxirlwfukyjsqk:BarufiPenteado0987!@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'
});

async function createIndices() {
  console.log('\n📊 Criando índices para otimizar queries...\n');
  
  try {
    // Índice composto para inventory (dealership_id, status)
    console.log('1️⃣  Criando índice (dealership_id, status) em inventory...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_inventory_dealership_status 
      ON inventory(dealership_id, status);
    `);
    console.log('   ✅ Índice criado\n');

    // Índice para expenses
    console.log('2️⃣  Criando índice (dealership_id, date) em expenses...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_expenses_dealership_date 
      ON expenses(dealership_id, date);
    `);
    console.log('   ✅ Índice criado\n');

    // Índice para ipva_tracking
    console.log('3️⃣  Criando índice (dealership_id, status) em ipva_tracking...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_ipva_dealership_status 
      ON ipva_tracking(dealership_id, status);
    `);
    console.log('   ✅ Índice criado\n');

    console.log('✅ TODOS OS ÍNDICES CRIADOS COM SUCESSO!\n');
    await pool.end();
    process.exit(0);
    
  } catch (err) {
    console.error('\n❌ ERRO ao criar índices:', err.message);
    await pool.end();
    process.exit(1);
  }
}

createIndices();
