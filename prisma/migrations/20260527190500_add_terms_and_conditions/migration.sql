BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[terms_and_conditions] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [terms_and_conditions_uuid_df] DEFAULT NEWID(),
    [name] NVARCHAR(255) NOT NULL,
    [content] NVARCHAR(max) NOT NULL,
    [is_active] BIT NOT NULL CONSTRAINT [terms_and_conditions_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [terms_and_conditions_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [created_by] NVARCHAR(128),
    [updated_by] NVARCHAR(128),
    CONSTRAINT [terms_and_conditions_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [terms_and_conditions_uuid_key] UNIQUE NONCLUSTERED ([uuid]),
    CONSTRAINT [terms_and_conditions_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [terms_and_conditions_is_active_idx] ON [dbo].[terms_and_conditions]([is_active]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [terms_and_conditions_name_idx] ON [dbo].[terms_and_conditions]([name]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [terms_and_conditions_created_at_idx] ON [dbo].[terms_and_conditions]([created_at] DESC);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
