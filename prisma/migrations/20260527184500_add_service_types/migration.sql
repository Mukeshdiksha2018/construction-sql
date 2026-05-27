BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[service_types] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [service_types_uuid_df] DEFAULT NEWID(),
    [name] NVARCHAR(255) NOT NULL,
    [description] NVARCHAR(max),
    [color] NVARCHAR(7) NOT NULL CONSTRAINT [service_types_color_df] DEFAULT '#3D5C7C',
    [is_active] BIT NOT NULL CONSTRAINT [service_types_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [service_types_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [created_by] NVARCHAR(128),
    [updated_by] NVARCHAR(128),
    CONSTRAINT [service_types_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [service_types_uuid_key] UNIQUE NONCLUSTERED ([uuid]),
    CONSTRAINT [service_types_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [service_types_is_active_idx] ON [dbo].[service_types]([is_active]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [service_types_created_at_idx] ON [dbo].[service_types]([created_at] DESC);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
