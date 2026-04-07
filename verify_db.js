const pg = require('pg');

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres.bxnennpxirlwfukyjsqk:BarufiPenteado0987!@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'
});

async function verify() {
  console.log('\n🔍 FASE 1: VERIFICAÇÃO DO BANCO DE DADOS\n');
  
  try {
    // 1. Verificar tabela dealerships
    console.log('1️⃣  Verificando tabela dealerships...');
    const dealerships = await pool.query('SELECT COUNT(*) FROM dealerships');
    console.log(`   ✅ Tabela existe. Registros: ${dealerships.rows[0].count}`);
    
    // 2. Verificar users com dealership_id NULL
    console.log('\n2️⃣  Verificando users com dealership_id NULL...');
    const usersNull = await pool.query('SELECT COUNT(*) FROM users WHERE dealership_id IS NULL');
    console.log(`   ⚠️  Users com dealership_id NULL: ${usersNull.rows[0].count}`);
    
    // 3. Verificar users com dealership_id
    console.log('\n3️⃣  Verificando users com dealership_id preenchido...');
    const usersValid = await pool.query('SELECT id, email, dealership_id FROM users WHERE dealership_id IS NOT NULL LIMIT 3');
    console.log(`   ✅ Users com dealership_id válido: ${usersValid.rows.length}`);
    usersValid.rows.forEach(u => {
      console.log(`      - ${u.email}: ${u.dealership_id}`);
    });
    
    // 4. Verificar RLS em inventory
    console.log('\n4️⃣  Verificando RLS em inventory...');
    const rls = await pool.query("SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'inventory'");
    if (rls.rows.length > 0) {
      console.log(`   ${rls.rows[0].rowsecurity ? '✅' : '❌'} RLS: ${rls.rows[0].rowsecurity ? 'ATIVADO' : 'DESATIVADO'}`);
    } else {
      console.log('   ❌ Tabela inventory não existe');
    }
    
    // 5. Verificar policies
    console.log('\n5️⃣  Verificando RLS policies em inventory...');
    const policies = await pool.query("SELECT policyname FROM pg_policies WHERE tablename = 'inventory'");
    console.log(`   Policies encontradas: ${policies.rows.length}`);
    policies.rows.forEach(p => {
      console.log(`      - ${p.policyname}`);
    });
    
    // 6. Verificar inventory
    console.log('\n6️⃣  Verificando tabela inventory...');
    const vehicles = await pool.query('SELECT COUNT(*) FROM inventory');
    console.log(`   ✅ Veículos no banco: ${vehicles.rows[0].count}`);
    
    console.log('\n✅ VERIFICAÇÃO CONCLUÍDA\n');
    process.exit(0);
    
  } catch (err) {
    console.error('\n❌ ERRO:', err.message);
    process.exit(1);
  }
}

verify();
