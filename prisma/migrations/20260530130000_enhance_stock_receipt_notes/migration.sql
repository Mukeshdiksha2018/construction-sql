-- Stock receipt notes: align with reference (change order header link, line amounts, PO/CO receipt_note_uuids)

-- Header: separate change order reference (migration 064 in reference)
IF COL_LENGTH('dbo.stock_receipt_notes', 'change_order_uuid') IS NULL
BEGIN
  ALTER TABLE [dbo].[stock_receipt_notes]
    ADD [change_order_uuid] NVARCHAR(36) NULL;
END;

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE name = 'srn_change_order_uuid_idx' AND object_id = OBJECT_ID('dbo.stock_receipt_notes')
)
BEGIN
  CREATE INDEX [srn_change_order_uuid_idx] ON [dbo].[stock_receipt_notes]([change_order_uuid]);
END;

IF NOT EXISTS (
  SELECT 1 FROM sys.foreign_keys WHERE name = 'srn_change_order_fk'
)
BEGIN
  ALTER TABLE [dbo].[stock_receipt_notes]
    ADD CONSTRAINT [srn_change_order_fk]
    FOREIGN KEY ([change_order_uuid]) REFERENCES [dbo].[change_orders]([uuid]);
END;

-- PO/CO line items: array of GRN UUIDs (JSON string in MSSQL)
IF COL_LENGTH('dbo.purchase_order_items_list', 'receipt_note_uuids') IS NULL
BEGIN
  ALTER TABLE [dbo].[purchase_order_items_list]
    ADD [receipt_note_uuids] NVARCHAR(MAX) NULL;
END;

IF COL_LENGTH('dbo.change_order_items_list', 'receipt_note_uuids') IS NULL
BEGIN
  ALTER TABLE [dbo].[change_order_items_list]
    ADD [receipt_note_uuids] NVARCHAR(MAX) NULL;
END;

-- Receipt note line item amount columns (reference receipt_note_items table)
IF COL_LENGTH('dbo.receipt_note_items', 'received_total') IS NULL
BEGIN
  ALTER TABLE [dbo].[receipt_note_items]
    ADD [received_total] DECIMAL(18, 2) NULL;
END;

IF COL_LENGTH('dbo.receipt_note_items', 'grn_total') IS NULL
BEGIN
  ALTER TABLE [dbo].[receipt_note_items]
    ADD [grn_total] DECIMAL(18, 2) NULL;
END;

IF COL_LENGTH('dbo.receipt_note_items', 'grn_total_with_charges_taxes') IS NULL
BEGIN
  ALTER TABLE [dbo].[receipt_note_items]
    ADD [grn_total_with_charges_taxes] DECIMAL(18, 2) NULL;
END;
