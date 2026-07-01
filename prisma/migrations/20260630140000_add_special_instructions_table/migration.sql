-- Special instructions: per corporation + project rich-text templates
IF OBJECT_ID(N'dbo.special_instructions', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[special_instructions] (
    [id] BIGINT IDENTITY(1,1) NOT NULL,
    [uuid] NVARCHAR(36) NOT NULL CONSTRAINT [DF_special_instructions_uuid] DEFAULT LOWER(CONVERT(NVARCHAR(36), NEWID())),
    [corporation_uuid] NVARCHAR(36) NOT NULL,
    [project_uuid] NVARCHAR(36) NOT NULL,
    [name] NVARCHAR(255) NOT NULL,
    [content] NVARCHAR(MAX) NOT NULL,
    [is_active] BIT NOT NULL CONSTRAINT [DF_special_instructions_is_active] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [DF_special_instructions_created_at] DEFAULT SYSUTCDATETIME(),
    [updated_at] DATETIME2 NOT NULL CONSTRAINT [DF_special_instructions_updated_at] DEFAULT SYSUTCDATETIME(),
    [created_by] NVARCHAR(128) NULL,
    [updated_by] NVARCHAR(128) NULL,
    CONSTRAINT [PK_special_instructions] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UQ_special_instructions_uuid] UNIQUE ([uuid]),
    CONSTRAINT [UQ_special_instructions_project_name] UNIQUE ([project_uuid], [name])
  );

  CREATE INDEX [IX_special_instructions_corporation_uuid] ON [dbo].[special_instructions]([corporation_uuid]);
  CREATE INDEX [IX_special_instructions_project_uuid] ON [dbo].[special_instructions]([project_uuid]);
  CREATE INDEX [IX_special_instructions_is_active] ON [dbo].[special_instructions]([is_active]);
END
