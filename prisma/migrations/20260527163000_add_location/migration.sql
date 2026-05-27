BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[location] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [location_uuid_df] DEFAULT NEWID(),
    [location_name] NVARCHAR(255) NOT NULL,
    [location_code] NVARCHAR(64),
    [description] NVARCHAR(max),
    [active] BIT NOT NULL CONSTRAINT [location_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [location_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [created_by] NVARCHAR(128),
    [updated_by] NVARCHAR(128),
    CONSTRAINT [location_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [location_uuid_key] UNIQUE NONCLUSTERED ([uuid]),
    CONSTRAINT [location_location_name_key] UNIQUE NONCLUSTERED ([location_name])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [location_active_idx] ON [dbo].[location]([active]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [location_created_at_idx] ON [dbo].[location]([created_at] DESC);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
