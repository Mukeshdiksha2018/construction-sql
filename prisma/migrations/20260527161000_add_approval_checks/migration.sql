BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[approval_checks] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [approval_checks_uuid_df] DEFAULT NEWID(),
    [approval_check] NVARCHAR(255) NOT NULL,
    [description] NVARCHAR(max),
    [active] BIT NOT NULL CONSTRAINT [approval_checks_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [approval_checks_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [created_by] NVARCHAR(128),
    [updated_by] NVARCHAR(128),
    CONSTRAINT [approval_checks_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [approval_checks_uuid_key] UNIQUE NONCLUSTERED ([uuid]),
    CONSTRAINT [approval_checks_approval_check_key] UNIQUE NONCLUSTERED ([approval_check])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [approval_checks_active_idx] ON [dbo].[approval_checks]([active]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [approval_checks_created_at_idx] ON [dbo].[approval_checks]([created_at] DESC);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
