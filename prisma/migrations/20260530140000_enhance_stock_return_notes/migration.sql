-- Stock return notes: change order header link, returned-by fields

IF COL_LENGTH('dbo.stock_return_notes', 'change_order_uuid') IS NULL
BEGIN
  ALTER TABLE [dbo].[stock_return_notes]
    ADD [change_order_uuid] NVARCHAR(36) NULL;
END;

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE name = 'str_change_order_uuid_idx' AND object_id = OBJECT_ID('dbo.stock_return_notes')
)
BEGIN
  CREATE INDEX [str_change_order_uuid_idx] ON [dbo].[stock_return_notes]([change_order_uuid]);
END;

IF NOT EXISTS (
  SELECT 1 FROM sys.foreign_keys WHERE name = 'str_change_order_fk'
)
BEGIN
  ALTER TABLE [dbo].[stock_return_notes]
    ADD CONSTRAINT [str_change_order_fk]
    FOREIGN KEY ([change_order_uuid]) REFERENCES [dbo].[change_orders]([uuid]);
END;

IF COL_LENGTH('dbo.stock_return_notes', 'returned_by') IS NULL
BEGIN
  ALTER TABLE [dbo].[stock_return_notes]
    ADD [returned_by] NVARCHAR(36) NULL;
END;

IF COL_LENGTH('dbo.stock_return_notes', 'nimble_returned_by_user_id') IS NULL
BEGIN
  ALTER TABLE [dbo].[stock_return_notes]
    ADD [nimble_returned_by_user_id] NVARCHAR(255) NULL;
END;
