/**
 * Database migration runner
 * Loads and executes all migration files in order.
 *
 * Usage: node src/db/migrate.js
 *        npm run migrate
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { up as migration001 } from './migrations/001-initial-schema.js';

dotenv.config();

const { Client } = pg;

const migrations = [
  { name: '001-initial-schema', fn: migration001 },
];

async function runMigrations() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set.');
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');
    console.log(`🚀 Running ${migrations.length} migration(s)...\n`);

    for (const migration of migrations) {
      console.log(`📄 ${migration.name}`);
      await migration.fn(client);
    }

    console.log('\n✅ All migrations completed successfully.');
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed.');
  }
}

runMigrations();
