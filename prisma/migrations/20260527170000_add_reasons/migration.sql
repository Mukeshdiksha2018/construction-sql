BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[reasons] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [reasons_uuid_df] DEFAULT NEWID(),
    [reason] NVARCHAR(max) NOT NULL,
    [active] BIT NOT NULL CONSTRAINT [reasons_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [reasons_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [created_by] NVARCHAR(128),
    [updated_by] NVARCHAR(128),
    CONSTRAINT [reasons_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [reasons_uuid_key] UNIQUE NONCLUSTERED ([uuid])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [reasons_active_idx] ON [dbo].[reasons]([active]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [reasons_created_at_idx] ON [dbo].[reasons]([created_at] DESC);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
