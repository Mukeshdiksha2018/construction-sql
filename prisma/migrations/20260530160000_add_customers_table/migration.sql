-- ============================================================
-- Migration: add_customers_table
-- Customer master data (ported from Supabase 088 + 102 + country ISO)
-- ============================================================

IF OBJECT_ID(N'dbo.customers', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.customers (
    id                  BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_customers PRIMARY KEY,
    uuid                NVARCHAR(36)  NOT NULL CONSTRAINT DF_customers_uuid DEFAULT LOWER(CONVERT(NVARCHAR(36), NEWID())),
    created_at          DATETIME2     NOT NULL CONSTRAINT DF_customers_created_at DEFAULT GETUTCDATE(),
    updated_at          DATETIME2     NOT NULL CONSTRAINT DF_customers_updated_at DEFAULT GETUTCDATE(),
    corporation_uuid    NVARCHAR(36)  NOT NULL,
    project_uuid        NVARCHAR(36)  NULL,
    customer_address    NVARCHAR(MAX) NOT NULL CONSTRAINT DF_customers_address DEFAULT '',
    customer_city       NVARCHAR(100) NOT NULL CONSTRAINT DF_customers_city DEFAULT '',
    customer_state      NVARCHAR(50)  NOT NULL CONSTRAINT DF_customers_state DEFAULT '',
    customer_country    NVARCHAR(2)   NOT NULL CONSTRAINT DF_customers_country DEFAULT '',
    customer_zip        NVARCHAR(20)  NOT NULL CONSTRAINT DF_customers_zip DEFAULT '',
    customer_phone      NVARCHAR(50)  NOT NULL CONSTRAINT DF_customers_phone DEFAULT '',
    customer_email      NVARCHAR(255) NOT NULL CONSTRAINT DF_customers_email DEFAULT '',
    company_name        NVARCHAR(255) NOT NULL CONSTRAINT DF_customers_company DEFAULT '',
    salutation          NVARCHAR(20)  NOT NULL CONSTRAINT DF_customers_salutation DEFAULT 'Mr.',
    first_name          NVARCHAR(100) NOT NULL,
    middle_name         NVARCHAR(100) NOT NULL CONSTRAINT DF_customers_middle DEFAULT '',
    last_name           NVARCHAR(100) NOT NULL,
    profile_image_url   NVARCHAR(MAX) NOT NULL CONSTRAINT DF_customers_profile DEFAULT '',
    is_active           BIT           NOT NULL CONSTRAINT DF_customers_is_active DEFAULT 1,
    nimble_customer_id  NVARCHAR(255) NULL,
    created_by          NVARCHAR(128) NULL,
    updated_by          NVARCHAR(128) NULL,
    CONSTRAINT UQ_customers_uuid UNIQUE (uuid)
  );

  CREATE INDEX IX_customers_corporation_uuid ON dbo.customers (corporation_uuid);
  CREATE INDEX IX_customers_project_uuid ON dbo.customers (project_uuid);
  CREATE INDEX IX_customers_is_active ON dbo.customers (is_active);
  CREATE INDEX IX_customers_created_at ON dbo.customers (created_at DESC);

  CREATE UNIQUE INDEX UQ_customers_nimble_customer_id
    ON dbo.customers (nimble_customer_id)
    WHERE nimble_customer_id IS NOT NULL;
END;
