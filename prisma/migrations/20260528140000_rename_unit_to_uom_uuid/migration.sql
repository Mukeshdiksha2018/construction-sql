-- Migration: Rename `unit` to `uom_uuid` and widen to NVARCHAR(100)
-- The column stores a Nimble UOM UUID, not a plain-text label.
-- Idempotent: safe to run multiple times.
-- Dynamic SQL is used for the UPDATE so MSSQL does not try to resolve
-- the new column name at parse-time before the ADD COLUMN executes.

-- 1. Add the new column if it does not exist yet
IF NOT EXISTS (
  SELECT 1 FROM sys.columns
  WHERE object_id = OBJECT_ID(N'dbo.cost_code_preferred_items')
    AND name = N'uom_uuid'
)
BEGIN
  ALTER TABLE dbo.cost_code_preferred_items
    ADD uom_uuid NVARCHAR(100) NULL;
END;

-- 2. Copy data from the old column (deferred via dynamic SQL)
IF EXISTS (
  SELECT 1 FROM sys.columns
  WHERE object_id = OBJECT_ID(N'dbo.cost_code_preferred_items')
    AND name = N'unit'
)
BEGIN
  EXEC(N'UPDATE dbo.cost_code_preferred_items SET uom_uuid = unit WHERE uom_uuid IS NULL AND unit IS NOT NULL');

  -- 3. Drop the old column
  ALTER TABLE dbo.cost_code_preferred_items
    DROP COLUMN unit;
END;
