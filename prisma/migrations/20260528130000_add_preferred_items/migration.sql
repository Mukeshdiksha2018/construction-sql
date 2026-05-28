-- Migration: Add cost_code_preferred_items table
-- Idempotent: safe to run multiple times

IF OBJECT_ID(N'dbo.cost_code_preferred_items', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.cost_code_preferred_items (
    id                           BIGINT         NOT NULL IDENTITY(1,1),
    uuid                         NVARCHAR(36)   NOT NULL DEFAULT LOWER(CONVERT(NVARCHAR(36), NEWID())),
    corporation_uuid             NVARCHAR(36)   NOT NULL,
    project_uuid                 NVARCHAR(36)   NULL,
    cost_code_configuration_uuid NVARCHAR(36)   NULL,
    item_type_uuid               NVARCHAR(36)   NULL,
    category                     NVARCHAR(50)   NULL,
    item_name                    NVARCHAR(255)  NOT NULL,
    unit_price                   DECIMAL(18, 2) NULL,
    unit                         NVARCHAR(50)   NULL,
    description                  NVARCHAR(MAX)  NULL,
    status                       NVARCHAR(50)   NOT NULL DEFAULT 'Active',
    is_active                    BIT            NOT NULL DEFAULT 1,
    created_at                   DATETIME2      NOT NULL DEFAULT SYSDATETIME(),
    updated_at                   DATETIME2      NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT PK_cost_code_preferred_items      PRIMARY KEY (id),
    CONSTRAINT UQ_cost_code_preferred_items_uuid UNIQUE      (uuid)
  );

  CREATE INDEX IX_ccpi_corporation ON dbo.cost_code_preferred_items (corporation_uuid);
  CREATE INDEX IX_ccpi_project     ON dbo.cost_code_preferred_items (project_uuid);
  CREATE INDEX IX_ccpi_config      ON dbo.cost_code_preferred_items (cost_code_configuration_uuid);
  CREATE INDEX IX_ccpi_item_type   ON dbo.cost_code_preferred_items (item_type_uuid);
  CREATE INDEX IX_ccpi_is_active   ON dbo.cost_code_preferred_items (is_active);
END;
