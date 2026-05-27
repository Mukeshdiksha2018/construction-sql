BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[po_instructions] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [po_instructions_uuid_df] DEFAULT NEWID(),
    [corporation_uuid] NVARCHAR(64) NOT NULL,
    [po_instruction_name] NVARCHAR(255) NOT NULL,
    [instruction] NVARCHAR(max) NOT NULL,
    [status] NVARCHAR(20) NOT NULL CONSTRAINT [po_instructions_status_df] DEFAULT N'ACTIVE',
    [created_at] DATETIME2 NOT NULL CONSTRAINT [po_instructions_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [created_by] NVARCHAR(128),
    [updated_by] NVARCHAR(128),
    CONSTRAINT [po_instructions_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [po_instructions_uuid_key] UNIQUE NONCLUSTERED ([uuid])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [po_instructions_corporation_uuid_idx] ON [dbo].[po_instructions]([corporation_uuid]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [po_instructions_status_idx] ON [dbo].[po_instructions]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [po_instructions_created_at_idx] ON [dbo].[po_instructions]([created_at] DESC);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
