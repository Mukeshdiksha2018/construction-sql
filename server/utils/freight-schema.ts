import { mssqlQuery } from './mssql'

let ensured = false

const CREATE_FREIGHT_TABLE_SQL = `
IF NOT EXISTS (
  SELECT 1 FROM sys.tables t
  INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
  WHERE t.name = N'freight' AND s.name = N'dbo'
)
BEGIN
  CREATE TABLE dbo.freight (
    id BIGINT IDENTITY(1, 1) NOT NULL PRIMARY KEY,
    uuid UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_freight_uuid DEFAULT NEWID(),
    freight_name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX) NULL,
    active BIT NOT NULL CONSTRAINT DF_freight_active DEFAULT 1,
    created_at DATETIME2(7) NOT NULL CONSTRAINT DF_freight_created_at DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(7) NOT NULL CONSTRAINT DF_freight_updated_at DEFAULT SYSUTCDATETIME(),
    created_by NVARCHAR(128) NULL,
    updated_by NVARCHAR(128) NULL,
    CONSTRAINT UQ_freight_uuid UNIQUE (uuid)
  );

  CREATE UNIQUE INDEX idx_freight_name_unique ON dbo.freight (freight_name);
  CREATE INDEX idx_freight_active ON dbo.freight (active);
  CREATE INDEX idx_freight_created_at ON dbo.freight (created_at DESC);
END
`

/** Create dbo.freight if missing (idempotent). */
export async function ensureFreightTable(): Promise<void> {
  if (ensured) return
  await mssqlQuery(CREATE_FREIGHT_TABLE_SQL)
  ensured = true
}
