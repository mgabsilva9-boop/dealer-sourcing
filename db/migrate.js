#!/usr/bin/env node

/**
 * Migration Runner para dealer-sourcing
 * Executa migrations em ordem
 * Uso: node db/migrate.js [apply|dry-run|rollback]
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL não configurada em .env');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function runMigration(command = 'apply') {
  const migrationsDir = path.join(__dirname, 'migrations');
  const migrationFile = path.join(migrationsDir, '001_initial_schema.sql');

  if (!fs.existsSync(migrationFile)) {
    console.error('❌ Arquivo de migração não encontrado:', migrationFile);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationFile, 'utf8');

  try {
    if (command === 'dry-run') {
      console.log('🔍 DRY-RUN: Testando migração...');
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Executar em modo transação
        await client.query(sql);

        // Rollback para simular dry-run
        await client.query('ROLLBACK');
        console.log('✅ DRY-RUN passou! Schema seria aplicado com sucesso.');
      } finally {
        client.release();
      }
    } else if (command === 'apply') {
      console.log('💾 APPLY: Aplicando migração ao banco...');

      // Criar banco se não existir
      const dbName = 'dealer_sourcing';
      const adminPool = new Pool({
        connectionString: DATABASE_URL.replace(dbName, 'postgres')
      });

      try {
        await adminPool.query(`CREATE DATABASE IF NOT EXISTS ${dbName};`);
      } catch (err) {
        // Ignorar erro se DB já existe
        if (!err.message.includes('already exists')) {
          console.warn('⚠️ Aviso ao criar DB:', err.message);
        }
      } finally {
        await adminPool.end();
      }

      const client = await pool.connect();
      try {
        await client.query(sql);
        console.log('✅ Migração aplicada com sucesso!');
      } finally {
        client.release();
      }
    } else if (command === 'rollback') {
      console.log('⚠️ ROLLBACK: Revertendo tabelas...');

      const rollbackSql = `
        DROP TABLE IF EXISTS migrations CASCADE;
        DROP TABLE IF EXISTS vehicle_validations CASCADE;
        DROP TABLE IF EXISTS search_queries CASCADE;
        DROP TABLE IF EXISTS interested_vehicles CASCADE;
        DROP TABLE IF EXISTS vehicles_cache CASCADE;
        DROP TABLE IF EXISTS users CASCADE;
        DROP FUNCTION IF EXISTS sync_vehicle_validation CASCADE;
        DROP FUNCTION IF EXISTS update_vehicles_cache_timestamp CASCADE;
        DROP FUNCTION IF EXISTS update_interested_vehicles_timestamp CASCADE;
      `;

      const client = await pool.connect();
      try {
        await client.query(rollbackSql);
        console.log('✅ Rollback completado!');
      } finally {
        client.release();
      }
    } else {
      console.error('❌ Comando inválido:', command);
      console.log('Opções: apply | dry-run | rollback');
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Erro durante migração:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Executar
const command = process.argv[2] || 'apply';
runMigration(command).then(() => {
  console.log('\n✅ Migração concluída!');
  process.exit(0);
}).catch(err => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});
