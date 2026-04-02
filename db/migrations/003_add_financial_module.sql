-- ============================================
-- dealer-sourcing: Financial Module Schema
-- Version: 003
-- Date: 2026-03-31
-- Description: Add financial tracking and IPVA management
--
-- Changes:
-- 1. Add cost columns to vehicles table
-- 2. Create ipva_tracking table
-- 3. Create financial_transactions table
-- 4. Add RLS policies
-- ============================================

-- ============================================
-- PHASE 1: ADD COST COLUMNS TO INVENTORY TABLE
-- ============================================

-- Adicionar colunas de custo (se não existirem)
-- NOTE: Using inventory table instead of vehicles (inventory is the runtime table)
ALTER TABLE inventory
ADD COLUMN IF NOT EXISTS transport_cost INTEGER DEFAULT 0, -- em centavos
ADD COLUMN IF NOT EXISTS reconditioning_cost INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS documentation_cost INTEGER DEFAULT 0;

-- Note: created_at already exists in inventory table

COMMENT ON COLUMN inventory.transport_cost IS 'Custo de transporte em centavos';
COMMENT ON COLUMN inventory.reconditioning_cost IS 'Custo de recondicionamento em centavos';
COMMENT ON COLUMN inventory.documentation_cost IS 'Custo de documentação (RENAVAM, CRV, etc) em centavos';

-- ============================================
-- PHASE 2: CREATE IPVA_TRACKING TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS ipva_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relações
  vehicle_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE RESTRICT,

  -- Identificação do veículo
  plate TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('SP', 'SC', 'RJ', 'MG', 'RS', 'PR', 'BA', 'PE')),

  -- Cálculo de IPVA
  vehicle_value INTEGER NOT NULL, -- Valor FIPE em centavos
  aliquota NUMERIC(5,2) NOT NULL, -- 4.0, 2.0, etc (percentual)
  ipva_due INTEGER NOT NULL, -- Valor devido em centavos

  -- Rastreamento
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'urgent', 'paid')),

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE ipva_tracking IS 'Rastreamento de IPVA por veículo e estado';
COMMENT ON COLUMN ipva_tracking.aliquota IS 'Percentual de IPVA (SP=4%, SC=2%, etc)';
COMMENT ON COLUMN ipva_tracking.status IS 'pending=vencer em >15d, urgent=vencer em <15d, paid=pago';

-- Índices
CREATE INDEX IF NOT EXISTS idx_ipva_tracking_dealership_status ON ipva_tracking(dealership_id, status);
CREATE INDEX IF NOT EXISTS idx_ipva_tracking_vehicle_id ON ipva_tracking(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_ipva_tracking_due_date ON ipva_tracking(due_date);

-- RLS: cada dealership vê apenas seu próprio IPVA
ALTER TABLE ipva_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ipva_tracking_dealership_isolation" ON ipva_tracking
  FOR SELECT USING (
    dealership_id = (SELECT dealership_id FROM users WHERE id = auth.uid() LIMIT 1)
  );

CREATE POLICY "ipva_tracking_dealership_insert" ON ipva_tracking
  FOR INSERT WITH CHECK (
    dealership_id = (SELECT dealership_id FROM users WHERE id = auth.uid() LIMIT 1)
  );

CREATE POLICY "ipva_tracking_dealership_update" ON ipva_tracking
  FOR UPDATE USING (
    dealership_id = (SELECT dealership_id FROM users WHERE id = auth.uid() LIMIT 1)
  );

-- Trigger: atualizar ipva_tracking.updated_at
CREATE OR REPLACE FUNCTION update_ipva_tracking_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ipva_tracking_updated_at ON ipva_tracking;
CREATE TRIGGER trg_ipva_tracking_updated_at
  BEFORE UPDATE ON ipva_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_ipva_tracking_timestamp();

-- ============================================
-- PHASE 3: CREATE FINANCIAL_TRANSACTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relações
  vehicle_id UUID REFERENCES inventory(id) ON DELETE SET NULL,
  dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE RESTRICT,

  -- Tipo de transação
  type TEXT NOT NULL
    CHECK (type IN ('purchase', 'transport', 'reconditioning', 'documentation', 'ipva', 'sale', 'other')),

  -- Valores
  amount INTEGER NOT NULL, -- em centavos (pode ser negativo para receitas)
  description TEXT,

  -- Rastreamento
  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE financial_transactions IS 'Registro de todas as transações financeiras por veículo e loja';
COMMENT ON COLUMN financial_transactions.type IS 'Tipo: compra, transporte, recondicionamento, documentação, IPVA, venda, outro';
COMMENT ON COLUMN financial_transactions.amount IS 'Valor em centavos (negativo=receita, positivo=custo)';

CREATE INDEX IF NOT EXISTS idx_financial_transactions_dealership_date ON financial_transactions(dealership_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_vehicle_id ON financial_transactions(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON financial_transactions(type);

-- RLS: cada dealership vê apenas suas transações
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "financial_transactions_dealership_isolation" ON financial_transactions
  FOR SELECT USING (
    dealership_id = (SELECT dealership_id FROM users WHERE id = auth.uid() LIMIT 1)
  );

CREATE POLICY "financial_transactions_dealership_insert" ON financial_transactions
  FOR INSERT WITH CHECK (
    dealership_id = (SELECT dealership_id FROM users WHERE id = auth.uid() LIMIT 1)
  );

-- Trigger: atualizar financial_transactions.updated_at
CREATE OR REPLACE FUNCTION update_financial_transactions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_financial_transactions_updated_at ON financial_transactions;
CREATE TRIGGER trg_financial_transactions_updated_at
  BEFORE UPDATE ON financial_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_financial_transactions_timestamp();

-- ============================================
-- PHASE 4: ADD dealership_id TO INVENTORY (IF NOT EXISTS)
-- ============================================

-- Note: dealership_id already exists in inventory table from creation
-- Verify it exists
ALTER TABLE inventory
ADD COLUMN IF NOT EXISTS dealership_id UUID;

-- Backfill with first dealership if needed
UPDATE inventory
SET dealership_id = (SELECT id FROM dealerships LIMIT 1)
WHERE dealership_id IS NULL AND (SELECT COUNT(*) FROM dealerships) > 0;

-- Add FK constraint if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'inventory' AND constraint_name = 'inventory_dealership_id_fk'
  ) THEN
    ALTER TABLE inventory
    ADD CONSTRAINT inventory_dealership_id_fk
    FOREIGN KEY (dealership_id) REFERENCES dealerships(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- Índice: dealership_id como leader
CREATE INDEX IF NOT EXISTS idx_inventory_dealership_status ON inventory(dealership_id, status);

COMMENT ON COLUMN inventory.dealership_id IS 'Dealership que possui este veículo';

-- ============================================
-- PHASE 5: UPDATE RLS POLICIES FOR INVENTORY
-- ============================================

-- Verificar se tabela inventory tem RLS ativada
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Drop old policies (if using old naming)
DROP POLICY IF EXISTS "vehicles_select_same_shop" ON inventory;
DROP POLICY IF EXISTS "vehicles_insert_same_shop" ON inventory;
DROP POLICY IF EXISTS "vehicles_update_same_shop" ON inventory;
DROP POLICY IF EXISTS "inventory_select_same_shop" ON inventory;
DROP POLICY IF EXISTS "inventory_insert_same_shop" ON inventory;
DROP POLICY IF EXISTS "inventory_update_same_shop" ON inventory;

-- Criar novas policies baseadas em dealership_id
CREATE POLICY "inventory_dealership_isolation" ON inventory
  FOR SELECT USING (
    dealership_id = (SELECT dealership_id FROM users WHERE id = auth.uid() LIMIT 1)
  );

CREATE POLICY "inventory_dealership_insert" ON inventory
  FOR INSERT WITH CHECK (
    dealership_id = (SELECT dealership_id FROM users WHERE id = auth.uid() LIMIT 1)
  );

CREATE POLICY "inventory_dealership_update" ON inventory
  FOR UPDATE USING (
    dealership_id = (SELECT dealership_id FROM users WHERE id = auth.uid() LIMIT 1)
  );

-- ============================================
-- PHASE 6: SAFETY CHECKS
-- ============================================

DO $$
DECLARE
  missing_dealership_count INT;
BEGIN
  -- Verificar se há inventory items sem dealership_id
  SELECT COUNT(*) INTO missing_dealership_count
  FROM inventory
  WHERE dealership_id IS NULL;

  IF missing_dealership_count > 0 THEN
    RAISE WARNING 'Found % inventory items without dealership_id', missing_dealership_count;
  END IF;

  -- Log de sucesso
  RAISE NOTICE 'Migration 003 completed: Financial module configured';
END $$;

-- ============================================
-- MIGRATION COMPLETION
-- ============================================

INSERT INTO migrations (name) VALUES ('003_add_financial_module') ON CONFLICT DO NOTHING;

-- ============================================
-- DONE: Financial module ready
-- ============================================
