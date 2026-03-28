-- ============================================
-- dealer-sourcing: Initial Schema Migration
-- Version: 001
-- Date: 2026-03-28
-- Description: Create core tables for MVP Phase 3
-- ============================================

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jwt_sub TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'shop', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE users IS 'Users com roles: owner (admin), shop (lojaB), user (pessoa)';
COMMENT ON COLUMN users.jwt_sub IS 'Subject do JWT para auth';
COMMENT ON COLUMN users.role IS 'owner=admin, shop=lojaB, user=regular';

-- RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_read_own" ON users
  FOR SELECT USING (
    auth.uid()::text = jwt_sub OR
    (SELECT role FROM users WHERE id = auth.uid()) = 'owner'
  );

-- ============================================
-- 2. VEHICLES_CACHE TABLE (compartilhada)
-- ============================================
CREATE TABLE IF NOT EXISTS vehicles_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id TEXT UNIQUE NOT NULL,
  source TEXT NOT NULL,

  -- Colunas desnormalizadas (queryable)
  make TEXT,
  model TEXT,
  year INTEGER,
  price NUMERIC(12,2),
  km INTEGER,
  discount NUMERIC(5,2),
  location TEXT,
  score INTEGER CHECK (score >= 1 AND score <= 100),

  -- Dados completos em JSONB
  vehicle_data JSONB NOT NULL,

  -- Validação automática
  validation_score INTEGER CHECK (validation_score IS NULL OR (validation_score >= 1 AND validation_score <= 100)),
  is_good_car BOOLEAN,
  validation_comment TEXT,
  validated_at TIMESTAMPTZ,

  -- Cache TTL
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vehicles_cache_vehicle_id ON vehicles_cache(vehicle_id);
CREATE INDEX idx_vehicles_cache_source_cached ON vehicles_cache(source, cached_at DESC);
CREATE INDEX idx_vehicles_cache_price_km ON vehicles_cache(price, km);
CREATE INDEX idx_vehicles_cache_is_good_car ON vehicles_cache(is_good_car);

COMMENT ON TABLE vehicles_cache IS 'Cache compartilhada de veículos scraped com TTL';
COMMENT ON COLUMN vehicles_cache.vehicle_data IS 'JSONB com todos os dados: platform, phone, url, etc';

-- RLS: todos podem ler (cache pública)
ALTER TABLE vehicles_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vehicles_cache_public_read" ON vehicles_cache
  FOR SELECT USING (true);

CREATE POLICY "vehicles_cache_admin_write" ON vehicles_cache
  FOR INSERT, UPDATE, DELETE USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'owner'
  );

-- ============================================
-- 3. INTERESTED_VEHICLES TABLE (por usuário)
-- ============================================
CREATE TABLE IF NOT EXISTS interested_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id TEXT NOT NULL,

  -- Snapshot do veículo no momento da marcação
  vehicle_data JSONB NOT NULL,

  -- Status com histórico
  status TEXT NOT NULL DEFAULT 'interested'
    CHECK (status IN ('interested', 'contacted', 'purchased', 'rejected')),
  status_updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Notas do usuário
  notes TEXT,

  -- Validação: usuário confirma que é um bom carro?
  user_validation_score INTEGER CHECK (user_validation_score IS NULL OR (user_validation_score >= 1 AND user_validation_score <= 100)),
  user_validation_comment TEXT,
  user_validated_at TIMESTAMPTZ,

  -- Dados de acompanhamento
  contacted_at TIMESTAMPTZ,
  purchased_at TIMESTAMPTZ,

  saved_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: um usuário não pode marcar o mesmo veículo 2x
  UNIQUE (user_id, vehicle_id)
);

CREATE INDEX idx_interested_vehicles_user_id ON interested_vehicles(user_id);
CREATE INDEX idx_interested_vehicles_user_status ON interested_vehicles(user_id, status);
CREATE INDEX idx_interested_vehicles_vehicle_id ON interested_vehicles(vehicle_id);
CREATE INDEX idx_interested_vehicles_status ON interested_vehicles(status);
CREATE INDEX idx_interested_vehicles_saved_at ON interested_vehicles(user_id, saved_at DESC);

COMMENT ON TABLE interested_vehicles IS 'Veículos marcados como interessantes por usuário, com rastreamento de status';
COMMENT ON COLUMN interested_vehicles.status IS 'interested=inicial, contacted=contatou, purchased=comprou, rejected=rejeitou';

-- RLS: cada usuário vê apenas os seus
ALTER TABLE interested_vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "interested_vehicles_user_isolation" ON interested_vehicles
  FOR SELECT USING (
    auth.uid() = user_id OR
    (SELECT role FROM users WHERE id = auth.uid()) = 'owner'
  );

CREATE POLICY "interested_vehicles_user_insert" ON interested_vehicles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "interested_vehicles_user_update" ON interested_vehicles
  FOR UPDATE USING (
    auth.uid() = user_id OR
    (SELECT role FROM users WHERE id = auth.uid()) = 'owner'
  );

-- ============================================
-- 4. SEARCH_QUERIES TABLE (analytics)
-- ============================================
CREATE TABLE IF NOT EXISTS search_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Query original
  query_params JSONB NOT NULL,
  results_count INTEGER,

  -- Validação: sistema sugeriu que busca é boa?
  validation_enabled BOOLEAN DEFAULT false,
  validation_score INTEGER CHECK (validation_score IS NULL OR (validation_score >= 1 AND validation_score <= 100)),
  validation_result TEXT,

  searched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_search_queries_user_id ON search_queries(user_id);
CREATE INDEX idx_search_queries_user_searched ON search_queries(user_id, searched_at DESC);
CREATE INDEX idx_search_queries_validation ON search_queries(validation_enabled, validation_result);

COMMENT ON TABLE search_queries IS 'Log de buscas para analytics e validação automática';
COMMENT ON COLUMN search_queries.query_params IS 'JSONB: {make, model, priceMin, priceMax, kmMax, discountMin}';

-- RLS: cada usuário vê apenas seus
ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "search_queries_user_isolation" ON search_queries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "search_queries_user_insert" ON search_queries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 5. VEHICLE_VALIDATIONS TABLE (histórico)
-- ============================================
CREATE TABLE IF NOT EXISTS vehicle_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id TEXT NOT NULL,
  validated_by UUID NOT NULL REFERENCES users(id),

  -- Decisão
  is_good_car BOOLEAN NOT NULL,
  validation_score INTEGER NOT NULL CHECK (validation_score >= 1 AND validation_score <= 100),
  validation_comment TEXT,

  -- Meta
  validated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vehicle_validations_vehicle_id ON vehicle_validations(vehicle_id);
CREATE INDEX idx_vehicle_validations_validated_by ON vehicle_validations(validated_by, validated_at DESC);

COMMENT ON TABLE vehicle_validations IS 'Histórico de validações de veículos por admin/users';

-- RLS: admin pode ler
ALTER TABLE vehicle_validations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vehicle_validations_admin_read" ON vehicle_validations
  FOR SELECT USING ((SELECT role FROM users WHERE id = auth.uid()) = 'owner');

-- ============================================
-- 6. TRIGGERS & AUTO-UPDATE
-- ============================================

-- Trigger: atualizar vehicles_cache.updated_at
CREATE OR REPLACE FUNCTION update_vehicles_cache_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_vehicles_cache_updated_at ON vehicles_cache;
CREATE TRIGGER trg_vehicles_cache_updated_at
  BEFORE UPDATE ON vehicles_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_vehicles_cache_timestamp();

-- Trigger: sync vehicle validation
CREATE OR REPLACE FUNCTION sync_vehicle_validation()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE vehicles_cache
  SET validation_score = NEW.validation_score,
      is_good_car = NEW.is_good_car,
      validation_comment = NEW.validation_comment,
      validated_at = NEW.validated_at
  WHERE vehicle_id = NEW.vehicle_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_vehicle_validation ON vehicle_validations;
CREATE TRIGGER trg_sync_vehicle_validation
  AFTER INSERT OR UPDATE ON vehicle_validations
  FOR EACH ROW
  EXECUTE FUNCTION sync_vehicle_validation();

-- Trigger: atualizar interested_vehicles.updated_at
CREATE OR REPLACE FUNCTION update_interested_vehicles_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.status_updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_interested_vehicles_updated_at ON interested_vehicles;
CREATE TRIGGER trg_interested_vehicles_updated_at
  BEFORE UPDATE ON interested_vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_interested_vehicles_timestamp();

-- ============================================
-- 7. MIGRATION COMPLETION
-- ============================================
-- Marca migração como aplicada (opcional, para tracking)
CREATE TABLE IF NOT EXISTS migrations (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO migrations (name) VALUES ('001_initial_schema') ON CONFLICT DO NOTHING;

-- ============================================
-- DONE
-- ============================================
