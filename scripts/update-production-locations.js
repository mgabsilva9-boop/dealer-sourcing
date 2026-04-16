#!/usr/bin/env node

/**
 * Script para atualizar nomes de lojas em producao
 * Corrige "Loja A" → "BrossMotors" e "Loja B" → "BMCars"
 * Executa em: inventory, expenses, dealerships
 */

import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

async function updateProductionLocations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔄 Iniciando atualização de nomes de lojas em produção...\n');

    let totalUpdated = 0;

    // ============================================
    // UPDATE inventory TABLE
    // ============================================
    console.log('📦 Atualizando tabela inventory...');
    try {
      const inv1 = await pool.query(
        'UPDATE inventory SET location = $1 WHERE location = $2',
        ['BrossMotors', 'Loja A']
      );
      const inv2 = await pool.query(
        'UPDATE inventory SET location = $1 WHERE location = $2',
        ['BMCars', 'Loja B']
      );
      const invTotal = inv1.rowCount + inv2.rowCount;
      console.log(`   ✅ ${invTotal} registros atualizados`);
      totalUpdated += invTotal;
    } catch (err) {
      console.log(`   ⚠️ Erro ao atualizar inventory: ${err.message}`);
    }

    // ============================================
    // UPDATE expenses TABLE
    // ============================================
    console.log('💰 Atualizando tabela expenses...');
    try {
      const exp1 = await pool.query(
        'UPDATE expenses SET location = $1 WHERE location = $2',
        ['BrossMotors', 'Loja A']
      );
      const exp2 = await pool.query(
        'UPDATE expenses SET location = $1 WHERE location = $2',
        ['BMCars', 'Loja B']
      );
      const expTotal = exp1.rowCount + exp2.rowCount;
      console.log(`   ✅ ${expTotal} registros atualizados`);
      totalUpdated += expTotal;
    } catch (err) {
      console.log(`   ⚠️ Erro ao atualizar expenses: ${err.message}`);
    }

    // ============================================
    // UPDATE dealerships TABLE
    // ============================================
    console.log('🏢 Atualizando tabela dealerships...');
    try {
      const deal1 = await pool.query(
        'UPDATE dealerships SET name = $1 WHERE name = $2',
        ['BrossMotors', 'Loja A']
      );
      const deal2 = await pool.query(
        'UPDATE dealerships SET name = $1 WHERE name = $2',
        ['BMCars', 'Loja B']
      );
      const dealTotal = deal1.rowCount + deal2.rowCount;
      console.log(`   ✅ ${dealTotal} registros atualizados`);
      totalUpdated += dealTotal;
    } catch (err) {
      console.log(`   ⚠️ Erro ao atualizar dealerships: ${err.message}`);
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✅ TOTAL DE REGISTROS ATUALIZADOS: ${totalUpdated}`);
    console.log('='.repeat(50));
    console.log('\n✅ Atualização concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante atualização:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

updateProductionLocations();
