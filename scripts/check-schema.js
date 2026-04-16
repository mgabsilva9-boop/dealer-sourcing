#!/usr/bin/env node

import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

async function checkSchema() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔍 Verificando schema das tabelas...\n');

    const tables = ['inventory', 'expenses', 'ipva', 'dealerships', 'saved_searches'];

    for (const table of tables) {
      try {
        const result = await pool.query(`
          SELECT column_name, data_type
          FROM information_schema.columns
          WHERE table_name = $1
          ORDER BY ordinal_position
        `, [table]);

        if (result.rows.length > 0) {
          console.log(`📋 Tabela: ${table}`);
          result.rows.forEach(row => {
            console.log(`   - ${row.column_name}: ${row.data_type}`);
          });
          console.log();
        } else {
          console.log(`❌ Tabela ${table} não existe\n`);
        }
      } catch (err) {
        console.log(`⚠️  Erro ao verificar ${table}: ${err.message}\n`);
      }
    }
  } finally {
    await pool.end();
  }
}

checkSchema();
