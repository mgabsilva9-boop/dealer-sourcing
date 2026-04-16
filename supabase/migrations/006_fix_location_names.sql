-- Migration: Fix location names from "Loja A"/"Loja B" to "BrossMotors"/"BMCars"
-- This migration updates all existing data in the database to use the new location names

-- Add location column to expenses table if it doesn't exist
ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS location TEXT DEFAULT 'BrossMotors';

-- Update inventory table
UPDATE inventory
SET location = 'BrossMotors'
WHERE location = 'Loja A';

UPDATE inventory
SET location = 'BMCars'
WHERE location = 'Loja B';

-- Update expenses table (set location for existing records)
UPDATE expenses
SET location = 'BrossMotors'
WHERE location IS NULL OR location = '' OR location = 'Loja A';

UPDATE expenses
SET location = 'BMCars'
WHERE location = 'Loja B';

-- Update dealerships table
UPDATE dealerships
SET name = 'BrossMotors'
WHERE name = 'BrossMotors - Loja A' OR name = 'Loja A';

UPDATE dealerships
SET name = 'BMCars'
WHERE name = 'BrossMotors - Loja B' OR name = 'Loja B';
