/**
 * Migration 001 - Initial Schema
 * Creates all tables, indexes, and seed data for the dealer-sourcing database.
 */

const SQL = `
-- ============================================
-- DEALER SOURCING DATABASE SCHEMA
-- ============================================

-- 1. DEALERSHIPS
CREATE TABLE IF NOT EXISTS dealerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  city TEXT,
  state TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO dealerships (id, name, city, state) VALUES
('a0000000-0000-0000-0000-000000000001', 'Loja A - Premium Motors', 'São Paulo', 'SP'),
('b0000000-0000-0000-0000-000000000001', 'Loja B - Luxury Auto', 'Blumenau', 'SC')
ON CONFLICT DO NOTHING;

-- 2. USERS
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jwt_sub TEXT UNIQUE,
  email TEXT,
  password TEXT,
  name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('owner', 'shop', 'admin', 'user')),
  dealership_id UUID REFERENCES dealerships(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. VEHICLES_CACHE
CREATE TABLE IF NOT EXISTS vehicles_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id TEXT UNIQUE NOT NULL,
  source TEXT,
  make TEXT,
  model TEXT,
  year INTEGER,
  price NUMERIC(12,2),
  km INTEGER,
  score INTEGER,
  vehicle_data JSONB,
  dealership_id UUID REFERENCES dealerships(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_cache_dealership_id ON vehicles_cache(dealership_id);

-- 4. INTERESTED_VEHICLES
CREATE TABLE IF NOT EXISTS interested_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id TEXT,
  vehicle_data JSONB,
  status TEXT DEFAULT 'interested',
  dealership_id UUID REFERENCES dealerships(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, vehicle_id)
);

CREATE INDEX IF NOT EXISTS idx_interested_vehicles_dealership_id ON interested_vehicles(dealership_id);
CREATE INDEX IF NOT EXISTS idx_interested_vehicles_user_id ON interested_vehicles(user_id);

-- 5. SEARCH_QUERIES
CREATE TABLE IF NOT EXISTS search_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  query_params JSONB,
  results_count INTEGER,
  dealership_id UUID REFERENCES dealerships(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_queries_dealership_id ON search_queries(dealership_id);
CREATE INDEX IF NOT EXISTS idx_search_queries_user_id ON search_queries(user_id);

-- 6. VEHICLE_VALIDATIONS
CREATE TABLE IF NOT EXISTS vehicle_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id TEXT,
  validated_by UUID REFERENCES users(id),
  is_good_car BOOLEAN,
  validation_score INTEGER,
  validation_comment TEXT,
  dealership_id UUID REFERENCES dealerships(id),
  validated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_validations_dealership_id ON vehicle_validations(dealership_id);

-- Insert test users
INSERT INTO users (id, name, email, password, role, dealership_id, jwt_sub) VALUES
('user-a-000000-0000-0000-0000-000000000001', 'Gerente Loja A', 'gerente_a@loja-a.com', '$2b$10$test', 'admin', 'a0000000-0000-0000-0000-000000000001', 'gerente_a@loja-a.com'),
('user-b-000000-0000-0000-0000-000000000002', 'Gerente Loja B', 'gerente_b@loja-b.com', '$2b$10$test', 'admin', 'b0000000-0000-0000-0000-000000000001', 'gerente_b@loja-b.com')
ON CONFLICT DO NOTHING;

-- Insert sample vehicles
INSERT INTO vehicles_cache (vehicle_id, source, make, model, year, price, km, score, vehicle_data, dealership_id) VALUES
('bmw-m2-001', 'webmotors', 'BMW', 'M2', 2018, 300676.00, 42000, 85, '{"platform":"webmotors"}', 'a0000000-0000-0000-0000-000000000001'),
('vw-gol-001', 'olx', 'VW', 'Gol 1.0', 2022, 54202.00, 56000, 78, '{"platform":"olx"}', 'a0000000-0000-0000-0000-000000000001'),
('ram-1500-001', 'mercadolivre', 'RAM', '1500 CLASSIC', 2023, 261020.00, 42000, 92, '{"platform":"ml"}', 'b0000000-0000-0000-0000-000000000001'),
('ram-2500-001', 'facebook', 'RAM', '2500 LARAMIE', 2020, 294518.00, 52000, 88, '{"platform":"fb"}', 'b0000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;
`;

export async function up(client) {
  console.log('  → Running 001-initial-schema...');
  await client.query(SQL);
  console.log('  ✅ 001-initial-schema complete');
}
