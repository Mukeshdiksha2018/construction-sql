-- ============================================================
-- Migration: add_projects_tables
-- Creates (or extends) the following MSSQL tables:
--   dbo.projects
--   dbo.project_addresses
--   dbo.project_location_breakdowns
--   dbo.project_documents
-- All statements are idempotent (IF NOT EXISTS / IF COL_LENGTH).
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- 1. dbo.projects
-- ──────────────────────────────────────────────────────────
IF OBJECT_ID(N'dbo.projects', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.projects (
    id                                BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_projects PRIMARY KEY,
    uuid                              NVARCHAR(36)  NOT NULL CONSTRAINT DF_projects_uuid DEFAULT LOWER(CONVERT(NVARCHAR(36), NEWID())),
    created_at                        DATETIME2     NOT NULL CONSTRAINT DF_projects_created_at DEFAULT GETUTCDATE(),
    updated_at                        DATETIME2     NOT NULL CONSTRAINT DF_projects_updated_at DEFAULT GETUTCDATE(),
    corporation_uuid                  NVARCHAR(36)  NOT NULL,
    project_name                      NVARCHAR(255) NOT NULL,
    project_id                        NVARCHAR(100) NOT NULL,
    project_type_uuid                 NVARCHAR(36)  NULL,
    service_type_uuid                 NVARCHAR(36)  NULL,
    project_description               NVARCHAR(MAX) NULL,
    estimated_amount                  DECIMAL(18,2) NULL,
    area_sq_ft                        DECIMAL(18,2) NULL,
    no_of_rooms                       INT           NULL,
    contingency_percentage            DECIMAL(5,2)  NULL,
    customer_name                     NVARCHAR(255) NULL,
    customer_uuid                     NVARCHAR(36)  NULL,
    project_status                    NVARCHAR(50)  NOT NULL CONSTRAINT DF_projects_status DEFAULT 'Pending',
    project_start_date                DATETIME2     NULL,
    project_estimated_completion_date DATETIME2     NULL,
    only_total                        BIT           NOT NULL CONSTRAINT DF_projects_only_total DEFAULT 0,
    enable_labor                      BIT           NOT NULL CONSTRAINT DF_projects_enable_labor DEFAULT 0,
    enable_material                   BIT           NOT NULL CONSTRAINT DF_projects_enable_material DEFAULT 0,
    attachments                       NVARCHAR(MAX) NOT NULL CONSTRAINT DF_projects_attachments DEFAULT '[]',
    enable_location_wise              BIT           NOT NULL CONSTRAINT DF_projects_enable_location_wise DEFAULT 0,
    location_basis_area               BIT           NOT NULL CONSTRAINT DF_projects_location_basis_area DEFAULT 0,
    location_basis_no_of_rooms        BIT           NOT NULL CONSTRAINT DF_projects_location_basis_no_of_rooms DEFAULT 0,
    is_active                         BIT           NOT NULL CONSTRAINT DF_projects_is_active DEFAULT 1,
    created_by                        NVARCHAR(128) NULL,
    updated_by                        NVARCHAR(128) NULL,
    CONSTRAINT UQ_projects_uuid UNIQUE (uuid)
  );
  CREATE INDEX IX_projects_corporation_uuid ON dbo.projects (corporation_uuid);
  CREATE INDEX IX_projects_is_active ON dbo.projects (is_active);
  CREATE INDEX IX_projects_created_at ON dbo.projects (created_at DESC);
  PRINT 'Created table dbo.projects';
END
ELSE
BEGIN
  -- Extend an existing projects table with the new columns (each added only if absent)
  IF COL_LENGTH('dbo.projects', 'project_description') IS NULL
    ALTER TABLE dbo.projects ADD project_description NVARCHAR(MAX) NULL;
  IF COL_LENGTH('dbo.projects', 'contingency_percentage') IS NULL
    ALTER TABLE dbo.projects ADD contingency_percentage DECIMAL(5,2) NULL;
  IF COL_LENGTH('dbo.projects', 'customer_name') IS NULL
    ALTER TABLE dbo.projects ADD customer_name NVARCHAR(255) NULL;
  IF COL_LENGTH('dbo.projects', 'customer_uuid') IS NULL
    ALTER TABLE dbo.projects ADD customer_uuid NVARCHAR(36) NULL;
  IF COL_LENGTH('dbo.projects', 'only_total') IS NULL
    ALTER TABLE dbo.projects ADD only_total BIT NOT NULL CONSTRAINT DF_projects_only_total DEFAULT 0;
  IF COL_LENGTH('dbo.projects', 'enable_labor') IS NULL
    ALTER TABLE dbo.projects ADD enable_labor BIT NOT NULL CONSTRAINT DF_projects_enable_labor DEFAULT 0;
  IF COL_LENGTH('dbo.projects', 'enable_material') IS NULL
    ALTER TABLE dbo.projects ADD enable_material BIT NOT NULL CONSTRAINT DF_projects_enable_material DEFAULT 0;
  IF COL_LENGTH('dbo.projects', 'attachments') IS NULL
    ALTER TABLE dbo.projects ADD attachments NVARCHAR(MAX) NOT NULL CONSTRAINT DF_projects_attachments DEFAULT '[]';
  IF COL_LENGTH('dbo.projects', 'enable_location_wise') IS NULL
    ALTER TABLE dbo.projects ADD enable_location_wise BIT NOT NULL CONSTRAINT DF_projects_enable_location_wise DEFAULT 0;
  IF COL_LENGTH('dbo.projects', 'location_basis_area') IS NULL
    ALTER TABLE dbo.projects ADD location_basis_area BIT NOT NULL CONSTRAINT DF_projects_location_basis_area DEFAULT 0;
  IF COL_LENGTH('dbo.projects', 'location_basis_no_of_rooms') IS NULL
    ALTER TABLE dbo.projects ADD location_basis_no_of_rooms BIT NOT NULL CONSTRAINT DF_projects_location_basis_no_of_rooms DEFAULT 0;
  IF COL_LENGTH('dbo.projects', 'project_type_uuid') IS NULL
    ALTER TABLE dbo.projects ADD project_type_uuid NVARCHAR(36) NULL;
  IF COL_LENGTH('dbo.projects', 'service_type_uuid') IS NULL
    ALTER TABLE dbo.projects ADD service_type_uuid NVARCHAR(36) NULL;
  PRINT 'Extended table dbo.projects with new columns';
END;

-- ──────────────────────────────────────────────────────────
-- 2. dbo.project_addresses
-- ──────────────────────────────────────────────────────────
IF OBJECT_ID(N'dbo.project_addresses', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.project_addresses (
    id                               BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_project_addresses PRIMARY KEY,
    uuid                             NVARCHAR(36)  NOT NULL CONSTRAINT DF_proj_addr_uuid DEFAULT LOWER(CONVERT(NVARCHAR(36), NEWID())),
    created_at                       DATETIME2     NOT NULL CONSTRAINT DF_proj_addr_created_at DEFAULT GETUTCDATE(),
    updated_at                       DATETIME2     NOT NULL CONSTRAINT DF_proj_addr_updated_at DEFAULT GETUTCDATE(),
    project_uuid                     NVARCHAR(36)  NOT NULL,
    address_type                     NVARCHAR(50)  NOT NULL,
    contact_person                   NVARCHAR(255) NULL,
    email                            NVARCHAR(255) NULL,
    phone                            NVARCHAR(50)  NULL,
    address_line_1                   NVARCHAR(500) NOT NULL,
    address_line_2                   NVARCHAR(500) NULL,
    city                             NVARCHAR(100) NULL,
    state                            NVARCHAR(100) NULL,
    zip_code                         NVARCHAR(20)  NULL,
    country                          NVARCHAR(10)  NULL,
    is_primary                       BIT           NOT NULL CONSTRAINT DF_proj_addr_is_primary DEFAULT 0,
    is_active                        BIT           NOT NULL CONSTRAINT DF_proj_addr_is_active DEFAULT 1,
    copied_from_billing_address_uuid NVARCHAR(36)  NULL,
    CONSTRAINT UQ_project_addresses_uuid UNIQUE (uuid),
    CONSTRAINT FK_project_addresses_project
      FOREIGN KEY (project_uuid) REFERENCES dbo.projects (uuid) ON DELETE CASCADE
  );
  CREATE INDEX IX_project_addresses_project_uuid ON dbo.project_addresses (project_uuid);
  CREATE INDEX IX_project_addresses_address_type ON dbo.project_addresses (address_type);
  CREATE INDEX IX_project_addresses_is_primary ON dbo.project_addresses (is_primary);
  PRINT 'Created table dbo.project_addresses';
END;

-- ──────────────────────────────────────────────────────────
-- 3. dbo.project_location_breakdowns
-- ──────────────────────────────────────────────────────────
IF OBJECT_ID(N'dbo.project_location_breakdowns', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.project_location_breakdowns (
    id            BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_project_location_breakdowns PRIMARY KEY,
    uuid          NVARCHAR(36)  NOT NULL CONSTRAINT DF_proj_loc_uuid DEFAULT LOWER(CONVERT(NVARCHAR(36), NEWID())),
    created_at    DATETIME2     NOT NULL CONSTRAINT DF_proj_loc_created_at DEFAULT GETUTCDATE(),
    updated_at    DATETIME2     NOT NULL CONSTRAINT DF_proj_loc_updated_at DEFAULT GETUTCDATE(),
    project_uuid  NVARCHAR(36)  NOT NULL,
    location_uuid NVARCHAR(36)  NOT NULL,
    area_sq_ft    DECIMAL(18,2) NULL,
    no_of_rooms   INT           NULL,
    is_active     BIT           NOT NULL CONSTRAINT DF_proj_loc_is_active DEFAULT 1,
    CONSTRAINT UQ_project_location_breakdowns_uuid UNIQUE (uuid),
    CONSTRAINT FK_project_location_breakdowns_project
      FOREIGN KEY (project_uuid) REFERENCES dbo.projects (uuid) ON DELETE CASCADE
  );
  CREATE INDEX IX_project_location_breakdowns_project ON dbo.project_location_breakdowns (project_uuid);
  CREATE INDEX IX_project_location_breakdowns_location ON dbo.project_location_breakdowns (location_uuid);
  PRINT 'Created table dbo.project_location_breakdowns';
END;

-- ──────────────────────────────────────────────────────────
-- 4. dbo.project_documents
-- ──────────────────────────────────────────────────────────
IF OBJECT_ID(N'dbo.project_documents', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.project_documents (
    id            BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_project_documents PRIMARY KEY,
    uuid          NVARCHAR(36)  NOT NULL CONSTRAINT DF_proj_doc_uuid DEFAULT LOWER(CONVERT(NVARCHAR(36), NEWID())),
    created_at    DATETIME2     NOT NULL CONSTRAINT DF_proj_doc_created_at DEFAULT GETUTCDATE(),
    updated_at    DATETIME2     NOT NULL CONSTRAINT DF_proj_doc_updated_at DEFAULT GETUTCDATE(),
    project_uuid  NVARCHAR(36)  NOT NULL,
    document_name NVARCHAR(255) NOT NULL,
    document_type NVARCHAR(50)  NOT NULL,
    file_size     BIGINT        NOT NULL,
    mime_type     NVARCHAR(100) NOT NULL,
    file_url      NVARCHAR(MAX) NOT NULL,
    file_path     NVARCHAR(MAX) NOT NULL,
    description   NVARCHAR(MAX) NULL,
    tags          NVARCHAR(MAX) NOT NULL CONSTRAINT DF_proj_doc_tags DEFAULT '[]',
    is_primary    BIT           NOT NULL CONSTRAINT DF_proj_doc_is_primary DEFAULT 0,
    is_active     BIT           NOT NULL CONSTRAINT DF_proj_doc_is_active DEFAULT 1,
    uploaded_by   NVARCHAR(128) NULL,
    CONSTRAINT UQ_project_documents_uuid UNIQUE (uuid),
    CONSTRAINT FK_project_documents_project
      FOREIGN KEY (project_uuid) REFERENCES dbo.projects (uuid) ON DELETE CASCADE
  );
  CREATE INDEX IX_project_documents_project_uuid ON dbo.project_documents (project_uuid);
  CREATE INDEX IX_project_documents_is_active ON dbo.project_documents (is_active);
  PRINT 'Created table dbo.project_documents';
END;
