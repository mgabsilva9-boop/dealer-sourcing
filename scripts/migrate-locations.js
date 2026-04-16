#!/usr/bin/env node

/**
 * Script para migrar nomes de lojas no banco de dados
 * De: "Loja A" / "Loja B"
 * Para: "BrossMotors" / "BMCars"
 */

import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔄 Iniciando migração de nomes de lojas...\n');

    // Add location column to expenses if it doesn't exist
    console.log('💰 Adicionando coluna location à tabela expenses...');
    try {
      await pool.query('ALTER TABLE expenses ADD COLUMN IF NOT EXISTS location TEXT DEFAULT \'BrossMotors\'');
      console.log('   ✅ Coluna adicionada\n');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('   ℹ️ Coluna já existe\n');
      } else {
        throw err;
      }
    }

    // Update inventory table
    console.log('📦 Atualizando tabela inventory...');
    const inv1 = await pool.query('UPDATE inventory SET location = $1 WHERE location = $2', ['BrossMotors', 'Loja A']);
    const inv2 = await pool.query('UPDATE inventory SET location = $1 WHERE location = $2', ['BMCars', 'Loja B']);
    console.log(`   ✅ ${inv1.rowCount + inv2.rowCount} registros atualizados\n`);

    // Update expenses table
    console.log('💸 Atualizando tabela expenses...');
    const exp1 = await pool.query('UPDATE expenses SET location = $1 WHERE location IS NULL OR location = \'\' OR location = $2', ['BrossMotors', 'Loja A']);
    const exp2 = await pool.query('UPDATE expenses SET location = $1 WHERE location = $2', ['BMCars', 'Loja B']);
    console.log(`   ✅ ${exp1.rowCount + exp2.rowCount} registros atualizados\n`);

    // Update dealerships table
    console.log('🏢 Atualizando tabela dealerships...');
    const deal1 = await pool.query('UPDATE dealerships SET name = $1 WHERE name = $2 OR name = $3', ['BrossMotors', 'BrossMotors - Loja A', 'Loja A']);
    const deal2 = await pool.query('UPDATE dealerships SET name = $1 WHERE name = $2 OR name = $3', ['BMCars', 'BrossMotors - Loja B', 'Loja B']);
    console.log(`   ✅ ${deal1.rowCount + deal2.rowCount} registros atualizados\n`);

    console.log('✅ Migração concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante migração:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
