-- ============================================
-- dealer-sourcing: Add IPVA Unique Constraint
-- Version: 004
-- Date: 2026-03-31
-- Description: Fix SEC-001 - Prevent duplicate IPVA creation
--
-- Changes:
-- 1. Add UNIQUE constraint to prevent duplicate IPVA per vehicle per year
-- ============================================

-- ============================================
-- PHASE 1: ADD UNIQUE CONSTRAINT
-- ============================================

ALTER TABLE ipva_tracking
ADD CONSTRAINT ipva_tracking_unique_vehicle_year
UNIQUE (vehicle_id, EXTRACT(YEAR FROM due_date));

COMMENT ON CONSTRAINT ipva_tracking_unique_vehicle_year ON ipva_tracking
IS 'Garante que há apenas um IPVA por veículo por ano';

-- ============================================
-- MIGRATION COMPLETION
-- ============================================

INSERT INTO migrations (name) VALUES ('004_add_ipva_unique_constraint') ON CONFLICT DO NOTHING;

-- ============================================
-- DONE: SEC-001 Fixed
-- ============================================
