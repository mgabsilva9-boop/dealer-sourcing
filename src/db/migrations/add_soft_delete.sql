-- CRÍTICO #8: Soft-delete migration
-- Adiciona coluna deleted_at a todas as tabelas de negócio
-- Permite recovery de dados sem perder histórico

-- Tabela inventory
ALTER TABLE IF EXISTS inventory
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Tabela contacts/customers
ALTER TABLE IF EXISTS customers
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Tabela sales (se existir)
ALTER TABLE IF EXISTS sales
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Tabela vehicle_costs
ALTER TABLE IF EXISTS vehicle_costs
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Tabela expenses
ALTER TABLE IF EXISTS expenses
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Criar índices para soft-delete (otimizar SELECT WHERE deleted_at IS NULL)
CREATE INDEX IF NOT EXISTS idx_inventory_deleted_at
  ON inventory (deleted_at)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_customers_deleted_at
  ON customers (deleted_at)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_vehicle_costs_deleted_at
  ON vehicle_costs (deleted_at)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_expenses_deleted_at
  ON expenses (deleted_at)
  WHERE deleted_at IS NULL;

-- Criar função helper para soft-delete (reutilizável)
CREATE OR REPLACE FUNCTION soft_delete(table_name text, record_id uuid)
  RETURNS void AS $$
  BEGIN
    EXECUTE format('UPDATE %I SET deleted_at = CURRENT_TIMESTAMP WHERE id = %L', table_name, record_id);
  END;
$$ LANGUAGE plpgsql;

-- Log de migração
-- Migração #9: Soft-delete infrastructure (2026-04-07)
-- Status: ✅ APLICADA
-- Permite recovery de dados ao invés de DELETE permanente
