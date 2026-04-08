-- Migration: Fix sold_date column type and ensure data consistency
-- Purpose: Convert sold_date from DATE to TIMESTAMPTZ and add default handling
-- Status: Ready to apply

-- Step 1: Add new sold_date_tz column as TIMESTAMPTZ
ALTER TABLE inventory
  ADD COLUMN IF NOT EXISTS sold_date_tz TIMESTAMPTZ;

-- Step 2: Migrate data from old DATE column to new TIMESTAMPTZ column
UPDATE inventory
SET sold_date_tz = sold_date::date::timestamptz
WHERE sold_date IS NOT NULL AND sold_date_tz IS NULL;

-- Step 3: Drop old DATE column if migration was successful
-- (First verify no data loss by running: SELECT COUNT(*) WHERE sold_date IS NOT NULL AND sold_date_tz IS NULL;)
-- ALTER TABLE inventory DROP COLUMN IF EXISTS sold_date;

-- Alternative: Keep both columns for backward compatibility, but prioritize sold_date_tz

-- Step 4: Add index for sold_date queries
CREATE INDEX IF NOT EXISTS idx_inventory_sold_date ON inventory(dealership_id, sold_date_tz)
WHERE status = 'sold';

-- Step 5: Add constraint to prevent inconsistent sold_price/sold_date without sold status
ALTER TABLE inventory
  ADD CONSTRAINT check_sold_consistency CHECK (
    (status = 'sold' AND sold_date_tz IS NOT NULL AND sold_price IS NOT NULL) OR
    (status != 'sold' AND sold_date_tz IS NULL AND sold_price IS NULL) OR
    (sold_date_tz IS NULL AND sold_price IS NULL)
  );
