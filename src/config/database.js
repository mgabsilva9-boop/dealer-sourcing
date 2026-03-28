/**
 * Configuração de conexão com PostgreSQL
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Criar pool de conexões
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Configurações para Railway via proxy público
  ssl: {
    rejectUnauthorized: false, // Railway via proxy público requer SSL
  },
  max: 20,                    // Máximo de conexões simultâneas
  idleTimeoutMillis: 30000,   // Timeout de inatividade
  connectionTimeoutMillis: 2000,
});

// Event listeners para debugging
pool.on('connect', () => {
  console.log('✅ Nova conexão com banco estabelecida');
});

pool.on('error', (err) => {
  console.error('❌ Erro inesperado na pool:', err);
});

// Função auxiliar para queries
export const query = async (text, params = []) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`✅ Query executed in ${duration}ms`);
    return result;
  } catch (error) {
    console.error('❌ Database error:', error);
    throw error;
  }
};

// Função para inicializar schema (usar uma vez)
export const initializeSchema = async () => {
  const schema = `
    -- Tabela de usuários
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabela de buscas
    CREATE TABLE IF NOT EXISTS searches (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      query TEXT NOT NULL,
      results_count INTEGER DEFAULT 0,
      platforms TEXT[] DEFAULT ARRAY['WebMotors', 'OLX'],
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabela de veículos encontrados
    CREATE TABLE IF NOT EXISTS found_vehicles (
      id SERIAL PRIMARY KEY,
      search_id INTEGER NOT NULL REFERENCES searches(id) ON DELETE CASCADE,
      platform VARCHAR(50),           -- WebMotors, OLX, Google, etc
      make VARCHAR(100),
      model VARCHAR(100),
      year INTEGER,
      price DECIMAL(10, 2),
      km INTEGER,
      color VARCHAR(50),
      photo_url TEXT,
      link TEXT UNIQUE,
      score DECIMAL(5, 2),            -- Score de oportunidade (0-100)
      found_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabela de veículos de interesse
    CREATE TABLE IF NOT EXISTS interested_vehicles (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      vehicle_id INTEGER NOT NULL REFERENCES found_vehicles(id) ON DELETE CASCADE,
      customer_name VARCHAR(255),
      customer_phone VARCHAR(20),
      customer_email VARCHAR(255),
      notes TEXT,
      status VARCHAR(50) DEFAULT 'interested',  -- interested, contacted, negotiating, purchased
      saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Criar índices para performance
    CREATE INDEX IF NOT EXISTS idx_searches_user_id ON searches(user_id);
    CREATE INDEX IF NOT EXISTS idx_searches_created_at ON searches(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_found_vehicles_search_id ON found_vehicles(search_id);
    CREATE INDEX IF NOT EXISTS idx_found_vehicles_platform ON found_vehicles(platform);
    CREATE INDEX IF NOT EXISTS idx_interested_vehicles_user_id ON interested_vehicles(user_id);
    CREATE INDEX IF NOT EXISTS idx_interested_vehicles_status ON interested_vehicles(status);
  `;

  try {
    await pool.query(schema);
    console.log('✅ Schema inicializado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao inicializar schema:', error);
    throw error;
  }
};

export default pool;
