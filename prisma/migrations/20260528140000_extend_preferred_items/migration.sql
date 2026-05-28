-- Migration: Extend cost_code_preferred_items with additional columns
-- Idempotent: safe to run multiple times

IF COL_LENGTH(N'dbo.cost_code_preferred_items', N'item_sequence') IS NULL
  ALTER TABLE dbo.cost_code_preferred_items ADD item_sequence NVARCHAR(100) NULL;

IF COL_LENGTH(N'dbo.cost_code_preferred_items', N'model_number') IS NULL
  ALTER TABLE dbo.cost_code_preferred_items ADD model_number NVARCHAR(100) NULL;

IF COL_LENGTH(N'dbo.cost_code_preferred_items', N'location_uuid') IS NULL
  ALTER TABLE dbo.cost_code_preferred_items ADD location_uuid NVARCHAR(36) NULL;

IF COL_LENGTH(N'dbo.cost_code_preferred_items', N'preferred_vendor_uuid') IS NULL
  ALTER TABLE dbo.cost_code_preferred_items ADD preferred_vendor_uuid NVARCHAR(36) NULL;

IF COL_LENGTH(N'dbo.cost_code_preferred_items', N'initial_quantity') IS NULL
  ALTER TABLE dbo.cost_code_preferred_items ADD initial_quantity DECIMAL(18,4) NULL;

IF COL_LENGTH(N'dbo.cost_code_preferred_items', N'as_of_date') IS NULL
  ALTER TABLE dbo.cost_code_preferred_items ADD as_of_date DATETIME2 NULL;

IF COL_LENGTH(N'dbo.cost_code_preferred_items', N'reorder_point') IS NULL
  ALTER TABLE dbo.cost_code_preferred_items ADD reorder_point DECIMAL(18,4) NULL;

IF COL_LENGTH(N'dbo.cost_code_preferred_items', N'maximum_limit') IS NULL
  ALTER TABLE dbo.cost_code_preferred_items ADD maximum_limit DECIMAL(18,4) NULL;
