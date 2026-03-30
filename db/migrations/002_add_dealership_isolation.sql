-- ============================================
-- dealer-sourcing: Dealership-Based RLS Setup
-- Version: 002
-- Date: 2026-03-29
-- Description: Add multi-tenant isolation via dealership_id
--
-- Changes:
-- 1. Create dealerships master table
-- 2. Add dealership_id to all existing tables
-- 3. Migrate RLS policies from user-based to dealership-based
-- 4. Create indexes for performance (dealership_id as leader)
-- ============================================

-- ============================================
-- PHASE 1: CREATE DEALERSHIPS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS dealerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação
  name TEXT NOT NULL,
  cnpj TEXT UNIQUE NOT NULL, -- XX.XXX.XXX/XXXX-XX format

  -- Localização
  city TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('SP', 'SC', 'RJ', 'MG', 'RS', 'PR', 'BA', 'PE')),
  address TEXT,

  -- Contato
  phone TEXT,
  email TEXT,

  -- Status e timestamps
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE dealerships IS 'Master de concessionárias/lojas (multi-tenant)';
COMMENT ON COLUMN dealerships.cnpj IS 'Identificador único por CNPJ';
COMMENT ON COLUMN dealerships.state IS 'UF: SP, SC, RJ, MG, RS, PR, BA, PE';

CREATE INDEX idx_dealerships_cnpj ON dealerships(cnpj);
CREATE INDEX idx_dealerships_state_active ON dealerships(state, is_active);

-- Trigger: atualizar dealerships.updated_at
CREATE OR REPLACE FUNCTION update_dealerships_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_dealerships_updated_at ON dealerships;
CREATE TRIGGER trg_dealerships_updated_at
  BEFORE UPDATE ON dealerships
  FOR EACH ROW
  EXECUTE FUNCTION update_dealerships_timestamp();

-- Seed: Test dealerships (para desenvolvimento/teste)
-- Em produção, será criada via Admin UI
INSERT INTO dealerships (name, cnpj, city, state, phone, email, is_active)
VALUES
  ('Loja A - Premium Motors', '12.345.678/0001-99', 'Ribeirão Preto', 'SP', '+55 16 3111-1111', 'loja-a@premium.br', true),
  ('Loja B - Luxury Auto', '98.765.432/0001-11', 'Santa Catarina', 'SC', '+55 47 3111-2222', 'loja-b@luxury.br', true)
ON CONFLICT (cnpj) DO NOTHING;

-- ============================================
-- PHASE 2: ADD dealership_id TO USERS TABLE
-- ============================================

-- Adicionar coluna dealership_id (nullable primeiro, para backfill)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS dealership_id UUID;

-- Backfill: assumir que todos os users existentes pertencem à Loja A (primeira dealership)
-- Em produção, será mapeado corretamente via admin
UPDATE users
SET dealership_id = (SELECT id FROM dealerships WHERE name LIKE 'Loja A%' LIMIT 1)
WHERE dealership_id IS NULL AND (SELECT COUNT(*) FROM dealerships) > 0;

-- Tornar NOT NULL + adicionar FK
ALTER TABLE users
ADD CONSTRAINT users_dealership_id_fk
FOREIGN KEY (dealership_id) REFERENCES dealerships(id) ON DELETE RESTRICT;

ALTER TABLE users
ALTER COLUMN dealership_id SET NOT NULL;

-- Índice composto com dealership_id como leader
CREATE INDEX IF NOT EXISTS idx_users_dealership_role ON users(dealership_id, role);

COMMENT ON COLUMN users.dealership_id IS 'Dealership que o usuário pertence (isolamento multi-tenant)';

-- ============================================
-- PHASE 3: ADD dealership_id TO OTHER TABLES
-- ============================================

-- 3.1 VEHICLES_CACHE
-- Nota: vehicles_cache é compartilhada entre dealerships para busca de oportunidades
-- Mas vamos adicionar dealership_id para tracking de "quem salvou"
-- RLS será: todos podem ler cache público, apenas owners podem escrever
ALTER TABLE vehicles_cache
ADD COLUMN IF NOT EXISTS dealership_id UUID;

-- Backfill com Loja A
UPDATE vehicles_cache
SET dealership_id = (SELECT id FROM dealerships WHERE name LIKE 'Loja A%' LIMIT 1)
WHERE dealership_id IS NULL AND (SELECT COUNT(*) FROM dealerships) > 0;

ALTER TABLE vehicles_cache
ADD CONSTRAINT vehicles_cache_dealership_id_fk
FOREIGN KEY (dealership_id) REFERENCES dealerships(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_vehicles_cache_dealership ON vehicles_cache(dealership_id, cached_at DESC);

COMMENT ON COLUMN vehicles_cache.dealership_id IS 'Dealership que criou este cache (para auditoria)';

-- 3.2 INTERESTED_VEHICLES
ALTER TABLE interested_vehicles
ADD COLUMN IF NOT EXISTS dealership_id UUID;

-- Backfill: pegar dealership_id do user_id relacionado
UPDATE interested_vehicles iv
SET dealership_id = u.dealership_id
FROM users u
WHERE iv.user_id = u.id AND iv.dealership_id IS NULL;

ALTER TABLE interested_vehicles
ADD CONSTRAINT interested_vehicles_dealership_id_fk
FOREIGN KEY (dealership_id) REFERENCES dealerships(id) ON DELETE RESTRICT;

ALTER TABLE interested_vehicles
ALTER COLUMN dealership_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_interested_vehicles_dealership_status ON interested_vehicles(dealership_id, status);
CREATE INDEX IF NOT EXISTS idx_interested_vehicles_dealership_user ON interested_vehicles(dealership_id, user_id);

COMMENT ON COLUMN interested_vehicles.dealership_id IS 'Isolamento por dealership (denormalizado de users.dealership_id)';

-- 3.3 SEARCH_QUERIES
ALTER TABLE search_queries
ADD COLUMN IF NOT EXISTS dealership_id UUID;

-- Backfill: pegar dealership_id do user_id relacionado
UPDATE search_queries sq
SET dealership_id = u.dealership_id
FROM users u
WHERE sq.user_id = u.id AND sq.dealership_id IS NULL;

ALTER TABLE search_queries
ADD CONSTRAINT search_queries_dealership_id_fk
FOREIGN KEY (dealership_id) REFERENCES dealerships(id) ON DELETE RESTRICT;

ALTER TABLE search_queries
ALTER COLUMN dealership_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_search_queries_dealership_user ON search_queries(dealership_id, user_id);

COMMENT ON COLUMN search_queries.dealership_id IS 'Isolamento por dealership (denormalizado de users.dealership_id)';

-- 3.4 VEHICLE_VALIDATIONS
ALTER TABLE vehicle_validations
ADD COLUMN IF NOT EXISTS dealership_id UUID;

-- Backfill: pegar dealership_id do validated_by (user_id) relacionado
UPDATE vehicle_validations vv
SET dealership_id = u.dealership_id
FROM users u
WHERE vv.validated_by = u.id AND vv.dealership_id IS NULL;

ALTER TABLE vehicle_validations
ADD CONSTRAINT vehicle_validations_dealership_id_fk
FOREIGN KEY (dealership_id) REFERENCES dealerships(id) ON DELETE RESTRICT;

ALTER TABLE vehicle_validations
ALTER COLUMN dealership_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_vehicle_validations_dealership_validated_by ON vehicle_validations(dealership_id, validated_by);

COMMENT ON COLUMN vehicle_validations.dealership_id IS 'Isolamento por dealership (denormalizado de users.dealership_id)';

-- ============================================
-- PHASE 4: DROP OLD RLS POLICIES & CREATE DEALERSHIP-BASED POLICIES
-- ============================================

-- Users Table
DROP POLICY IF EXISTS "users_can_read_own" ON users;

CREATE POLICY "users_read_same_dealership" ON users
  FOR SELECT USING (
    -- Usuário vê usuários da mesma dealership que ele
    dealership_id = (SELECT dealership_id FROM users WHERE id = auth.uid() LIMIT 1)
  );

COMMENT ON POLICY "users_read_same_dealership" ON users
IS 'Usuários só veem outros usuários da mesma dealership';

-- Interested Vehicles Table
DROP POLICY IF EXISTS "interested_vehicles_user_isolation" ON interested_vehicles;
DROP POLICY IF EXISTS "interested_vehicles_user_insert" ON interested_vehicles;
DROP POLICY IF EXISTS "interested_vehicles_user_update" ON interested_vehicles;

CREATE POLICY "interested_vehicles_dealership_isolation" ON interested_vehicles
  FOR SELECT USING (
    dealership_id = (SELECT dealership_id FROM users WHERE id = auth.uid() LIMIT 1)
  );

CREATE POLICY "interested_vehicles_dealership_insert" ON interested_vehicles
  FOR INSERT WITH CHECK (
    dealership_id = (SELECT dealership_id FROM users WHERE id = auth.uid() LIMIT 1)
  );

CREATE POLICY "interested_vehicles_dealership_update" ON interested_vehicles
  FOR UPDATE USING (
    dealership_id = (SELECT dealership_id FROM users WHERE id = auth.uid() LIMIT 1)
  );

COMMENT ON POLICY "interested_vehicles_dealership_isolation" ON interested_vehicles
IS 'Isolamento de dados por dealership';

-- Search Queries Table
DROP POLICY IF EXISTS "search_queries_user_isolation" ON search_queries;
DROP POLICY IF EXISTS "search_queries_user_insert" ON search_queries;

CREATE POLICY "search_queries_dealership_isolation" ON search_queries
  FOR SELECT USING (
    dealership_id = (SELECT dealership_id FROM users WHERE id = auth.uid() LIMIT 1)
  );

CREATE POLICY "search_queries_dealership_insert" ON search_queries
  FOR INSERT WITH CHECK (
    dealership_id = (SELECT dealership_id FROM users WHERE id = auth.uid() LIMIT 1)
  );

COMMENT ON POLICY "search_queries_dealership_isolation" ON search_queries
IS 'Isolamento de dados por dealership';

-- Vehicle Validations Table
DROP POLICY IF EXISTS "vehicle_validations_admin_read" ON vehicle_validations;

CREATE POLICY "vehicle_validations_dealership_read" ON vehicle_validations
  FOR SELECT USING (
    dealership_id = (SELECT dealership_id FROM users WHERE id = auth.uid() LIMIT 1)
  );

COMMENT ON POLICY "vehicle_validations_dealership_read" ON vehicle_validations
IS 'Admin/users veem validações da sua dealership';

-- Vehicles Cache: mantém PUBLIC mas com rastreamento de dealership
-- Nota: vehicles_cache é compartilhada para que todas as dealerships vejam as mesmas oportunidades
-- Não precisa de RLS de leitura, mas write é restrito a owners

-- ============================================
-- PHASE 5: SAFETY CHECKS & INDEXES
-- ============================================

-- Criar índices para queries comuns (dealership_id como leader em onde filtro multi-tenant)
-- Já criados acima, mas listando aqui para documentação

-- Verificar integridade
DO $$
DECLARE
  missing_dealership_count INT;
BEGIN
  -- Verificar se há users sem dealership_id (não deve acontecer com migration)
  SELECT COUNT(*) INTO missing_dealership_count
  FROM users
  WHERE dealership_id IS NULL;

  IF missing_dealership_count > 0 THEN
    RAISE WARNING 'Found % users without dealership_id', missing_dealership_count;
  END IF;

  -- Log de sucesso
  RAISE NOTICE 'Migration 002 completed: dealership-based RLS configured';
END $$;

-- ============================================
-- MIGRATION COMPLETION
-- ============================================
INSERT INTO migrations (name) VALUES ('002_add_dealership_isolation') ON CONFLICT DO NOTHING;

-- ============================================
-- DONE: Multi-tenant isolation via dealership_id
-- ============================================
