import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres.bxnennpxirlwfukyjsqk:BarufiPenteado0987!@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'
});

async function createPolicies() {
  console.log('\n🔐 Criando RLS Policies para inventory...\n');
  
  try {
    // 1. DROP existentes (se houver duplicadas)
    const dropPolicies = `
      DROP POLICY IF EXISTS "inventory_select_own_dealership" ON inventory;
      DROP POLICY IF EXISTS "inventory_insert_own_dealership" ON inventory;
      DROP POLICY IF EXISTS "inventory_update_own_dealership" ON inventory;
      DROP POLICY IF EXISTS "inventory_delete_own_dealership" ON inventory;
    `;
    
    const statements = dropPolicies.split(';').filter(s => s.trim());
    for (const stmt of statements) {
      if (stmt.trim()) {
        await pool.query(stmt);
      }
    }
    console.log('✅ Policies antigas removidas (se existiam)');
    
    // 2. Criar policies - usando JWT claims in auth.jwt()
    // OBS: No Railway/backend temos control total, então usamos uma abordagem pragmática:
    // As policies verificam dealership_id da sessão (que vem do middleware)
    
    // Permitir SELECT se dealership_id corresponde
    await pool.query(`
      CREATE POLICY "inventory_select_own_dealership" ON inventory
        FOR SELECT
        USING (dealership_id = current_setting('jwt.claims.dealership_id', true)::uuid);
    `);
    console.log('✅ Policy SELECT criada');
    
    // Permitir INSERT se dealership_id corresponde
    await pool.query(`
      CREATE POLICY "inventory_insert_own_dealership" ON inventory
        FOR INSERT
        WITH CHECK (dealership_id = current_setting('jwt.claims.dealership_id', true)::uuid);
    `);
    console.log('✅ Policy INSERT criada');
    
    // Permitir UPDATE se dealership_id corresponde
    await pool.query(`
      CREATE POLICY "inventory_update_own_dealership" ON inventory
        FOR UPDATE
        USING (dealership_id = current_setting('jwt.claims.dealership_id', true)::uuid)
        WITH CHECK (dealership_id = current_setting('jwt.claims.dealership_id', true)::uuid);
    `);
    console.log('✅ Policy UPDATE criada');
    
    // Permitir DELETE se dealership_id corresponde
    await pool.query(`
      CREATE POLICY "inventory_delete_own_dealership" ON inventory
        FOR DELETE
        USING (dealership_id = current_setting('jwt.claims.dealership_id', true)::uuid);
    `);
    console.log('✅ Policy DELETE criada');
    
    // 3. Verificar policies criadas
    const policies = await pool.query(`
      SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'inventory'
    `);
    
    console.log('\n📋 Policies Criadas:');
    policies.rows.forEach(p => {
      console.log(`   - ${p.policyname} (${p.cmd})`);
    });
    
    console.log('\n✅ RLS POLICIES CRIADAS COM SUCESSO!\n');
    await pool.end();
    process.exit(0);
    
  } catch (err) {
    console.error('\n❌ ERRO ao criar policies:', err.message);
    console.error('Detalhes:', err);
    await pool.end();
    process.exit(1);
  }
}

createPolicies();
