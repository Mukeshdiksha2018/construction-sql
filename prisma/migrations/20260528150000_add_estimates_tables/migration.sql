-- Migration: Add estimates, estimate_line_items, estimate_material_items,
--            estimate_location_wise_labor, estimate_location_wise_material tables

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. estimates
-- ─────────────────────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'estimates')
BEGIN
  CREATE TABLE [dbo].[estimates] (
    [id]                      BIGINT          NOT NULL IDENTITY(1,1),
    [uuid]                    NVARCHAR(36)    NOT NULL DEFAULT LOWER(CONVERT(NVARCHAR(36), NEWID())),
    [corporation_uuid]        NVARCHAR(36)    NOT NULL,
    [project_uuid]            NVARCHAR(36)    NOT NULL,
    [estimate_number]         NVARCHAR(100)   NOT NULL,
    [estimate_date]           DATETIME2       NULL,
    [valid_until]             DATETIME2       NULL,
    [status]                  NVARCHAR(50)    NOT NULL DEFAULT 'Draft',
    [total_amount]            DECIMAL(18,2)   NOT NULL DEFAULT 0,
    [tax_amount]              DECIMAL(18,2)   NOT NULL DEFAULT 0,
    [discount_amount]         DECIMAL(18,2)   NOT NULL DEFAULT 0,
    [final_amount]            DECIMAL(18,2)   NOT NULL DEFAULT 0,
    [notes]                   NVARCHAR(MAX)   NULL,
    [attachments]             NVARCHAR(MAX)   NULL,
    [removed_cost_code_uuids] NVARCHAR(MAX)   NULL,
    [audit_log]               NVARCHAR(MAX)   NULL,
    [created_by]              NVARCHAR(128)   NULL,
    [approved_by]             NVARCHAR(128)   NULL,
    [approved_at]             DATETIME2       NULL,
    [is_active]               BIT             NOT NULL DEFAULT 1,
    [created_at]              DATETIME2       NOT NULL DEFAULT GETUTCDATE(),
    [updated_at]              DATETIME2       NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT [PK_estimates] PRIMARY KEY ([id]),
    CONSTRAINT [UQ_estimates_uuid] UNIQUE ([uuid])
  );

  CREATE INDEX [IX_estimates_corporation_uuid] ON [dbo].[estimates] ([corporation_uuid]);
  CREATE INDEX [IX_estimates_project_uuid]     ON [dbo].[estimates] ([project_uuid]);
  CREATE INDEX [IX_estimates_status]           ON [dbo].[estimates] ([status]);
  CREATE INDEX [IX_estimates_is_active]        ON [dbo].[estimates] ([is_active]);
  CREATE INDEX [IX_estimates_created_at]       ON [dbo].[estimates] ([created_at] DESC);
END;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. estimate_line_items
-- ─────────────────────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'estimate_line_items')
BEGIN
  CREATE TABLE [dbo].[estimate_line_items] (
    [id]                     BIGINT          NOT NULL IDENTITY(1,1),
    [uuid]                   NVARCHAR(36)    NOT NULL DEFAULT LOWER(CONVERT(NVARCHAR(36), NEWID())),
    [corporation_uuid]       NVARCHAR(36)    NOT NULL,
    [project_uuid]           NVARCHAR(36)    NOT NULL,
    [estimate_uuid]          NVARCHAR(36)    NOT NULL,
    [cost_code_uuid]         NVARCHAR(36)    NOT NULL,
    [cost_code_number]       NVARCHAR(100)   NULL,
    [cost_code_name]         NVARCHAR(255)   NULL,
    [division_name]          NVARCHAR(255)   NULL,
    [description]            NVARCHAR(MAX)   NULL,
    [is_sub_cost_code]       BIT             NOT NULL DEFAULT 0,
    [labor_estimation_type]  NVARCHAR(50)    NULL,
    [labor_amount]           DECIMAL(18,2)   NOT NULL DEFAULT 0,
    [labor_amount_per_room]  DECIMAL(18,2)   NOT NULL DEFAULT 0,
    [labor_rooms_count]      INT             NOT NULL DEFAULT 0,
    [labor_amount_per_sqft]  DECIMAL(18,2)   NOT NULL DEFAULT 0,
    [labor_sq_ft_count]      INT             NOT NULL DEFAULT 0,
    [labor_number_of_hours]  DECIMAL(18,2)   NOT NULL DEFAULT 0,
    [labor_hourly_wage]      DECIMAL(18,2)   NOT NULL DEFAULT 0,
    [material_amount]        DECIMAL(18,2)   NOT NULL DEFAULT 0,
    [contingency_amount]     DECIMAL(18,2)   NOT NULL DEFAULT 0,
    [total_amount]           DECIMAL(18,2)   NOT NULL DEFAULT 0,
    [metadata]               NVARCHAR(MAX)   NULL,
    [created_at]             DATETIME2       NOT NULL DEFAULT GETUTCDATE(),
    [updated_at]             DATETIME2       NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT [PK_estimate_line_items] PRIMARY KEY ([id]),
    CONSTRAINT [UQ_estimate_line_items_uuid] UNIQUE ([uuid]),
    CONSTRAINT [FK_estimate_line_items_estimate]
      FOREIGN KEY ([estimate_uuid]) REFERENCES [dbo].[estimates] ([uuid]) ON DELETE CASCADE
  );

  CREATE INDEX [IX_estimate_line_items_estimate_uuid]    ON [dbo].[estimate_line_items] ([estimate_uuid]);
  CREATE INDEX [IX_estimate_line_items_corporation_uuid] ON [dbo].[estimate_line_items] ([corporation_uuid]);
  CREATE INDEX [IX_estimate_line_items_cost_code_uuid]   ON [dbo].[estimate_line_items] ([cost_code_uuid]);
END;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. estimate_material_items
-- ─────────────────────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'estimate_material_items')
BEGIN
  CREATE TABLE [dbo].[estimate_material_items] (
    [id]                      BIGINT          NOT NULL IDENTITY(1,1),
    [uuid]                    NVARCHAR(36)    NOT NULL DEFAULT LOWER(CONVERT(NVARCHAR(36), NEWID())),
    [corporation_uuid]        NVARCHAR(36)    NOT NULL,
    [project_uuid]            NVARCHAR(36)    NOT NULL,
    [estimate_uuid]           NVARCHAR(36)    NOT NULL,
    [cost_code_uuid]          NVARCHAR(36)    NOT NULL,
    [estimate_line_item_uuid] NVARCHAR(36)    NOT NULL,
    [item_type_uuid]          NVARCHAR(36)    NULL,
    [item_uuid]               NVARCHAR(36)    NULL,
    [preferred_vendor_uuid]   NVARCHAR(36)    NULL,
    [item_division_uuid]      NVARCHAR(36)    NULL,
    [location_uuid]           NVARCHAR(36)    NULL,
    [category]                NVARCHAR(100)   NULL,
    [name]                    NVARCHAR(500)   NOT NULL,
    [description]             NVARCHAR(MAX)   NULL,
    [model_number]            NVARCHAR(200)   NULL,
    [unit_price]              DECIMAL(18,2)   NOT NULL DEFAULT 0,
    [quantity]                DECIMAL(18,4)   NOT NULL DEFAULT 0,
    [uom_uuid]                NVARCHAR(100)   NULL,
    [total_amount]            DECIMAL(18,2)   NOT NULL DEFAULT 0,
    [sequence]                INT             NOT NULL DEFAULT 1,
    [metadata]                NVARCHAR(MAX)   NULL,
    [is_active]               BIT             NOT NULL DEFAULT 1,
    [created_at]              DATETIME2       NOT NULL DEFAULT GETUTCDATE(),
    [updated_at]              DATETIME2       NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT [PK_estimate_material_items] PRIMARY KEY ([id]),
    CONSTRAINT [UQ_estimate_material_items_uuid] UNIQUE ([uuid]),
    CONSTRAINT [FK_estimate_material_items_line_item]
      FOREIGN KEY ([estimate_line_item_uuid]) REFERENCES [dbo].[estimate_line_items] ([uuid]) ON DELETE CASCADE
  );

  CREATE INDEX [IX_estimate_material_items_estimate_uuid]           ON [dbo].[estimate_material_items] ([estimate_uuid]);
  CREATE INDEX [IX_estimate_material_items_estimate_line_item_uuid] ON [dbo].[estimate_material_items] ([estimate_line_item_uuid]);
  CREATE INDEX [IX_estimate_material_items_corporation_uuid]        ON [dbo].[estimate_material_items] ([corporation_uuid]);
  CREATE INDEX [IX_estimate_material_items_is_active]               ON [dbo].[estimate_material_items] ([is_active]);
END;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. estimate_location_wise_labor
-- ─────────────────────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'estimate_location_wise_labor')
BEGIN
  CREATE TABLE [dbo].[estimate_location_wise_labor] (
    [id]                      BIGINT          NOT NULL IDENTITY(1,1),
    [uuid]                    NVARCHAR(36)    NOT NULL DEFAULT LOWER(CONVERT(NVARCHAR(36), NEWID())),
    [corporation_uuid]        NVARCHAR(36)    NOT NULL,
    [project_uuid]            NVARCHAR(36)    NOT NULL,
    [estimate_uuid]           NVARCHAR(36)    NOT NULL,
    [cost_code_uuid]          NVARCHAR(36)    NOT NULL,
    [estimate_line_item_uuid] NVARCHAR(36)    NOT NULL,
    [location_uuid]           NVARCHAR(36)    NOT NULL,
    [area_sq_ft]              DECIMAL(18,2)   NOT NULL DEFAULT 0,
    [no_of_rooms]             DECIMAL(18,2)   NOT NULL DEFAULT 0,
    [num_hours]               DECIMAL(18,2)   NOT NULL DEFAULT 0,
    [amount_per_sqft]         DECIMAL(18,2)   NOT NULL DEFAULT 0,
    [amount_per_room]         DECIMAL(18,2)   NOT NULL DEFAULT 0,
    [hourly_wage]             DECIMAL(18,2)   NOT NULL DEFAULT 0,
    [amount]                  DECIMAL(18,2)   NOT NULL DEFAULT 0,
    [sequence]                INT             NOT NULL DEFAULT 1,
    [created_at]              DATETIME2       NOT NULL DEFAULT GETUTCDATE(),
    [updated_at]              DATETIME2       NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT [PK_estimate_location_wise_labor] PRIMARY KEY ([id]),
    CONSTRAINT [UQ_estimate_location_wise_labor_uuid] UNIQUE ([uuid]),
    CONSTRAINT [FK_estimate_location_wise_labor_line_item]
      FOREIGN KEY ([estimate_line_item_uuid]) REFERENCES [dbo].[estimate_line_items] ([uuid]) ON DELETE CASCADE
  );

  CREATE INDEX [IX_estimate_location_wise_labor_estimate_uuid]      ON [dbo].[estimate_location_wise_labor] ([estimate_uuid]);
  CREATE INDEX [IX_estimate_location_wise_labor_line_item_uuid]     ON [dbo].[estimate_location_wise_labor] ([estimate_line_item_uuid]);
END;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. estimate_location_wise_material
-- ─────────────────────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'estimate_location_wise_material')
BEGIN
  CREATE TABLE [dbo].[estimate_location_wise_material] (
    [id]                      BIGINT          NOT NULL IDENTITY(1,1),
    [uuid]                    NVARCHAR(36)    NOT NULL DEFAULT LOWER(CONVERT(NVARCHAR(36), NEWID())),
    [corporation_uuid]        NVARCHAR(36)    NOT NULL,
    [project_uuid]            NVARCHAR(36)    NOT NULL,
    [estimate_uuid]           NVARCHAR(36)    NOT NULL,
    [cost_code_uuid]          NVARCHAR(36)    NOT NULL,
    [estimate_line_item_uuid] NVARCHAR(36)    NOT NULL,
    [location_uuid]           NVARCHAR(36)    NOT NULL,
    [amount]                  DECIMAL(18,2)   NOT NULL DEFAULT 0,
    [sequence]                INT             NOT NULL DEFAULT 1,
    [created_at]              DATETIME2       NOT NULL DEFAULT GETUTCDATE(),
    [updated_at]              DATETIME2       NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT [PK_estimate_location_wise_material] PRIMARY KEY ([id]),
    CONSTRAINT [UQ_estimate_location_wise_material_uuid] UNIQUE ([uuid]),
    CONSTRAINT [FK_estimate_location_wise_material_line_item]
      FOREIGN KEY ([estimate_line_item_uuid]) REFERENCES [dbo].[estimate_line_items] ([uuid]) ON DELETE CASCADE
  );

  CREATE INDEX [IX_estimate_location_wise_material_estimate_uuid]  ON [dbo].[estimate_location_wise_material] ([estimate_uuid]);
  CREATE INDEX [IX_estimate_location_wise_material_line_item_uuid] ON [dbo].[estimate_location_wise_material] ([estimate_line_item_uuid]);
END;
