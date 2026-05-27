BEGIN TRY

BEGIN TRAN;

-- CreateSchema
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'dbo') EXEC sp_executesql N'CREATE SCHEMA [dbo];';

-- CreateTable
CREATE TABLE [dbo].[freight] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [freight_uuid_df] DEFAULT NEWID(),
    [ship_via] NVARCHAR(255) NOT NULL,
    [description] NVARCHAR(max),
    [active] BIT NOT NULL CONSTRAINT [freight_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [freight_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [created_by] NVARCHAR(128),
    [updated_by] NVARCHAR(128),
    CONSTRAINT [freight_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [freight_uuid_key] UNIQUE NONCLUSTERED ([uuid]),
    CONSTRAINT [freight_ship_via_key] UNIQUE NONCLUSTERED ([ship_via])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [freight_active_idx] ON [dbo].[freight]([active]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [freight_created_at_idx] ON [dbo].[freight]([created_at] DESC);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
