-- June 2026 port from construction-management (MSSQL)
-- Currency conversion, Nimble approval fields, GL account on invoice lines, unique active estimate

-- PO currency conversion
ALTER TABLE [dbo].[purchase_order_forms] ADD
  [currency_conversion_enabled] BIT NOT NULL CONSTRAINT [DF_pof_currency_conversion_enabled] DEFAULT 0,
  [currency_from] NVARCHAR(10) NULL,
  [currency_to] NVARCHAR(10) NULL,
  [conversion_rate] DECIMAL(18,6) NULL,
  [last_handled_approval_type] SMALLINT NULL;

-- CO currency conversion + approval
ALTER TABLE [dbo].[change_orders] ADD
  [currency_conversion_enabled] BIT NOT NULL CONSTRAINT [DF_co_currency_conversion_enabled] DEFAULT 0,
  [currency_from] NVARCHAR(10) NULL,
  [currency_to] NVARCHAR(10) NULL,
  [conversion_rate] DECIMAL(18,6) NULL,
  [last_handled_approval_type] SMALLINT NULL;

-- Estimate Nimble approval
ALTER TABLE [dbo].[estimates] ADD [last_handled_approval_type] SMALLINT NULL;

-- Vendor invoice Nimble approval
ALTER TABLE [dbo].[vendor_invoices] ADD [last_handled_approval_type] SMALLINT NULL;

-- GL account on vendor invoice line tables
ALTER TABLE [dbo].[direct_vendor_invoice_line_items] ADD [gl_account_uuid] NVARCHAR(36) NULL;
ALTER TABLE [dbo].[purchase_order_invoice_items_list] ADD [gl_account_uuid] NVARCHAR(36) NULL;
ALTER TABLE [dbo].[change_order_invoice_items_list] ADD [gl_account_uuid] NVARCHAR(36) NULL;
ALTER TABLE [dbo].[labor_invoice_items_list] ADD [gl_account_uuid] NVARCHAR(36) NULL;

CREATE NONCLUSTERED INDEX [idx_dvi_gl_account_uuid] ON [dbo].[direct_vendor_invoice_line_items]([gl_account_uuid]);
CREATE NONCLUSTERED INDEX [idx_poi_gl_account_uuid] ON [dbo].[purchase_order_invoice_items_list]([gl_account_uuid]);
CREATE NONCLUSTERED INDEX [idx_coi_gl_account_uuid] ON [dbo].[change_order_invoice_items_list]([gl_account_uuid]);
CREATE NONCLUSTERED INDEX [idx_lii_gl_account_uuid] ON [dbo].[labor_invoice_items_list]([gl_account_uuid]);

-- One active estimate per project (filtered unique index)
CREATE UNIQUE NONCLUSTERED INDEX [ux_estimates_one_active_per_project]
  ON [dbo].[estimates]([project_uuid])
  WHERE [is_active] = 1;
