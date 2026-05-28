-- Migration: Add item_types table
-- Idempotent: safe to run multiple times

IF OBJECT_ID(N'dbo.item_types', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.item_types (
    id                 BIGINT        NOT NULL IDENTITY(1,1),
    uuid               NVARCHAR(36)  NOT NULL DEFAULT LOWER(CONVERT(NVARCHAR(36), NEWID())),
    corporation_uuid   NVARCHAR(36)  NULL,
    category           NVARCHAR(50)  NOT NULL,
    spec_type          NVARCHAR(255) NOT NULL,
    item_division_uuid NVARCHAR(36)  NULL,
    item_type          NVARCHAR(255) NOT NULL,
    description        NVARCHAR(MAX) NULL,
    is_active          BIT           NOT NULL DEFAULT 1,
    created_at         DATETIME2     NOT NULL DEFAULT SYSDATETIME(),
    updated_at         DATETIME2     NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT PK_item_types      PRIMARY KEY (id),
    CONSTRAINT UQ_item_types_uuid UNIQUE      (uuid)
  );

  CREATE INDEX IX_item_types_corporation ON dbo.item_types (corporation_uuid);
  CREATE INDEX IX_item_types_category    ON dbo.item_types (category);
  CREATE INDEX IX_item_types_is_active   ON dbo.item_types (is_active);
END;
