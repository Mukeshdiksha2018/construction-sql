-- Migration: Add cost_code_divisions and cost_code_configurations tables
-- Idempotent: safe to run multiple times

-- ============================================================
-- Table: cost_code_divisions
-- ============================================================
IF OBJECT_ID(N'dbo.cost_code_divisions', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.cost_code_divisions (
    id                               BIGINT          NOT NULL IDENTITY(1,1),
    uuid                             NVARCHAR(36)    NOT NULL DEFAULT LOWER(CONVERT(NVARCHAR(36), NEWID())),
    corporation_uuid                 NVARCHAR(36)    NOT NULL,
    division_number                  NVARCHAR(50)    NOT NULL,
    division_name                    NVARCHAR(255)   NOT NULL,
    division_order                   INT             NOT NULL DEFAULT 1,
    description                      NVARCHAR(MAX)   NULL,
    is_active                        BIT             NOT NULL DEFAULT 1,
    exclude_in_estimates_and_reports BIT             NOT NULL DEFAULT 0,
    created_at                       DATETIME2       NOT NULL DEFAULT SYSDATETIME(),
    updated_at                       DATETIME2       NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT PK_cost_code_divisions          PRIMARY KEY (id),
    CONSTRAINT UQ_cost_code_divisions_uuid     UNIQUE      (uuid),
    CONSTRAINT UQ_cost_code_divisions_corp_num UNIQUE      (corporation_uuid, division_number)
  );

  CREATE INDEX IX_cost_code_divisions_corporation ON dbo.cost_code_divisions (corporation_uuid);
  CREATE INDEX IX_cost_code_divisions_is_active   ON dbo.cost_code_divisions (is_active);
END;

-- ============================================================
-- Table: cost_code_configurations
-- ============================================================
IF OBJECT_ID(N'dbo.cost_code_configurations', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.cost_code_configurations (
    id                           BIGINT        NOT NULL IDENTITY(1,1),
    uuid                         NVARCHAR(36)  NOT NULL DEFAULT LOWER(CONVERT(NVARCHAR(36), NEWID())),
    corporation_uuid             NVARCHAR(36)  NOT NULL,
    division_uuid                NVARCHAR(36)  NULL,
    cost_code_number             NVARCHAR(50)  NOT NULL,
    cost_code_name               NVARCHAR(255) NOT NULL,
    parent_cost_code_uuid        NVARCHAR(36)  NULL,
    order_number                 INT           NULL,
    gl_account_uuid              NVARCHAR(36)  NULL,
    effective_from               DATETIME2     NULL,
    description                  NVARCHAR(MAX) NULL,
    update_previous_transactions BIT           NOT NULL DEFAULT 0,
    is_active                    BIT           NOT NULL DEFAULT 1,
    created_at                   DATETIME2     NOT NULL DEFAULT SYSDATETIME(),
    updated_at                   DATETIME2     NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT PK_cost_code_configurations          PRIMARY KEY (id),
    CONSTRAINT UQ_cost_code_configurations_uuid     UNIQUE      (uuid),
    CONSTRAINT UQ_cost_code_configurations_corp_num UNIQUE      (corporation_uuid, cost_code_number),
    CONSTRAINT FK_cost_code_configurations_division
      FOREIGN KEY (division_uuid) REFERENCES dbo.cost_code_divisions (uuid)
      ON DELETE SET NULL
  );

  CREATE INDEX IX_cost_code_configurations_corporation ON dbo.cost_code_configurations (corporation_uuid);
  CREATE INDEX IX_cost_code_configurations_division    ON dbo.cost_code_configurations (division_uuid);
  CREATE INDEX IX_cost_code_configurations_is_active   ON dbo.cost_code_configurations (is_active);
END;
