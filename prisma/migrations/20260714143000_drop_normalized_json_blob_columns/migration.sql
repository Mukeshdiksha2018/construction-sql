-- Drop legacy NVARCHAR(MAX) JSON blob columns now that child tables are the source of truth.
-- Data was backfilled in 20260714130000_normalize_json_blob_columns; app CRUD uses child tables only.

-- purchase_order_forms
IF COL_LENGTH(N'dbo.purchase_order_forms', N'financial_breakdown') IS NOT NULL
  ALTER TABLE [dbo].[purchase_order_forms] DROP COLUMN [financial_breakdown];
IF COL_LENGTH(N'dbo.purchase_order_forms', N'attachments') IS NOT NULL
  ALTER TABLE [dbo].[purchase_order_forms] DROP COLUMN [attachments];
IF COL_LENGTH(N'dbo.purchase_order_forms', N'removed_po_items') IS NOT NULL
  ALTER TABLE [dbo].[purchase_order_forms] DROP COLUMN [removed_po_items];
IF COL_LENGTH(N'dbo.purchase_order_forms', N'audit_log') IS NOT NULL
  ALTER TABLE [dbo].[purchase_order_forms] DROP COLUMN [audit_log];

-- change_orders
IF COL_LENGTH(N'dbo.change_orders', N'financial_breakdown') IS NOT NULL
  ALTER TABLE [dbo].[change_orders] DROP COLUMN [financial_breakdown];
IF COL_LENGTH(N'dbo.change_orders', N'attachments') IS NOT NULL
  ALTER TABLE [dbo].[change_orders] DROP COLUMN [attachments];
IF COL_LENGTH(N'dbo.change_orders', N'removed_co_items') IS NOT NULL
  ALTER TABLE [dbo].[change_orders] DROP COLUMN [removed_co_items];
IF COL_LENGTH(N'dbo.change_orders', N'audit_log') IS NOT NULL
  ALTER TABLE [dbo].[change_orders] DROP COLUMN [audit_log];

-- vendor_invoices
IF COL_LENGTH(N'dbo.vendor_invoices', N'financial_breakdown') IS NOT NULL
  ALTER TABLE [dbo].[vendor_invoices] DROP COLUMN [financial_breakdown];
IF COL_LENGTH(N'dbo.vendor_invoices', N'attachments') IS NOT NULL
  ALTER TABLE [dbo].[vendor_invoices] DROP COLUMN [attachments];
IF COL_LENGTH(N'dbo.vendor_invoices', N'removed_advance_payment_cost_codes') IS NOT NULL
  ALTER TABLE [dbo].[vendor_invoices] DROP COLUMN [removed_advance_payment_cost_codes];

-- stock_receipt_notes
IF COL_LENGTH(N'dbo.stock_receipt_notes', N'attachments') IS NOT NULL
  ALTER TABLE [dbo].[stock_receipt_notes] DROP COLUMN [attachments];
IF COL_LENGTH(N'dbo.stock_receipt_notes', N'audit_log') IS NOT NULL
  ALTER TABLE [dbo].[stock_receipt_notes] DROP COLUMN [audit_log];

-- stock_return_notes
IF COL_LENGTH(N'dbo.stock_return_notes', N'attachments') IS NOT NULL
  ALTER TABLE [dbo].[stock_return_notes] DROP COLUMN [attachments];
IF COL_LENGTH(N'dbo.stock_return_notes', N'audit_log') IS NOT NULL
  ALTER TABLE [dbo].[stock_return_notes] DROP COLUMN [audit_log];

-- estimates
IF COL_LENGTH(N'dbo.estimates', N'attachments') IS NOT NULL
  ALTER TABLE [dbo].[estimates] DROP COLUMN [attachments];
IF COL_LENGTH(N'dbo.estimates', N'removed_cost_code_uuids') IS NOT NULL
  ALTER TABLE [dbo].[estimates] DROP COLUMN [removed_cost_code_uuids];
IF COL_LENGTH(N'dbo.estimates', N'audit_log') IS NOT NULL
  ALTER TABLE [dbo].[estimates] DROP COLUMN [audit_log];
