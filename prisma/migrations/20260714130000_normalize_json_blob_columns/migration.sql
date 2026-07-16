-- Normalize JSON blob columns into relational child tables (MSSQL).
-- Dual-write period: do NOT drop legacy NVARCHAR(MAX) columns
-- (financial_breakdown, attachments, audit_log, removed_* blobs, etc.).

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. ALTER existing tables (soft-delete + labor prior committed amount)
-- ═══════════════════════════════════════════════════════════════════════════

IF COL_LENGTH(N'dbo.purchase_order_items_list', N'is_removed') IS NULL
  ALTER TABLE [dbo].[purchase_order_items_list]
    ADD [is_removed] BIT NOT NULL CONSTRAINT [DF_po_items_is_removed] DEFAULT 0;

IF COL_LENGTH(N'dbo.purchase_order_items_list', N'removed_at') IS NULL
  ALTER TABLE [dbo].[purchase_order_items_list]
    ADD [removed_at] DATETIME2 NULL;

IF COL_LENGTH(N'dbo.labor_purchase_order_items_list', N'prior_committed_po_amount') IS NULL
  ALTER TABLE [dbo].[labor_purchase_order_items_list]
    ADD [prior_committed_po_amount] DECIMAL(18,2) NULL;

IF COL_LENGTH(N'dbo.labor_purchase_order_items_list', N'is_removed') IS NULL
  ALTER TABLE [dbo].[labor_purchase_order_items_list]
    ADD [is_removed] BIT NOT NULL CONSTRAINT [DF_labor_po_items_is_removed] DEFAULT 0;

IF COL_LENGTH(N'dbo.labor_purchase_order_items_list', N'removed_at') IS NULL
  ALTER TABLE [dbo].[labor_purchase_order_items_list]
    ADD [removed_at] DATETIME2 NULL;

IF COL_LENGTH(N'dbo.po_location_wise_material', N'is_removed') IS NULL
  ALTER TABLE [dbo].[po_location_wise_material]
    ADD [is_removed] BIT NOT NULL CONSTRAINT [DF_po_lw_mat_is_removed] DEFAULT 0;

IF COL_LENGTH(N'dbo.po_location_wise_material', N'removed_at') IS NULL
  ALTER TABLE [dbo].[po_location_wise_material]
    ADD [removed_at] DATETIME2 NULL;

IF COL_LENGTH(N'dbo.change_order_items_list', N'is_removed') IS NULL
  ALTER TABLE [dbo].[change_order_items_list]
    ADD [is_removed] BIT NOT NULL CONSTRAINT [DF_co_items_is_removed] DEFAULT 0;

IF COL_LENGTH(N'dbo.change_order_items_list', N'removed_at') IS NULL
  ALTER TABLE [dbo].[change_order_items_list]
    ADD [removed_at] DATETIME2 NULL;

IF COL_LENGTH(N'dbo.advance_payment_cost_codes', N'is_removed') IS NULL
  ALTER TABLE [dbo].[advance_payment_cost_codes]
    ADD [is_removed] BIT NOT NULL CONSTRAINT [DF_advance_cc_is_removed] DEFAULT 0;

IF COL_LENGTH(N'dbo.advance_payment_cost_codes', N'removed_at') IS NULL
  ALTER TABLE [dbo].[advance_payment_cost_codes]
    ADD [removed_at] DATETIME2 NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. CREATE normalized child tables
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Purchase order children ────────────────────────────────────────────────

IF OBJECT_ID(N'dbo.po_financial_charges', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[po_financial_charges] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] NVARCHAR(36) NOT NULL CONSTRAINT [DF_po_financial_charges_uuid] DEFAULT LOWER(CONVERT(NVARCHAR(36),NEWID())),
    [corporation_uuid] NVARCHAR(36) NOT NULL,
    [purchase_order_uuid] NVARCHAR(36) NOT NULL,
    [charge_key] NVARCHAR(50) NOT NULL,
    [percentage] DECIMAL(18,6) NULL,
    [amount] DECIMAL(18,2) NULL,
    [taxable] BIT NOT NULL CONSTRAINT [DF_po_financial_charges_taxable] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [DF_po_financial_charges_created_at] DEFAULT SYSUTCDATETIME(),
    [updated_at] DATETIME2 NOT NULL CONSTRAINT [DF_po_financial_charges_updated_at] DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_po_financial_charges] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UQ_po_financial_charges_uuid] UNIQUE NONCLUSTERED ([uuid]),
    CONSTRAINT [UQ_po_financial_charges_po_key] UNIQUE NONCLUSTERED ([purchase_order_uuid], [charge_key]),
    CONSTRAINT [FK_po_financial_charges_po] FOREIGN KEY ([purchase_order_uuid])
      REFERENCES [dbo].[purchase_order_forms]([uuid]) ON DELETE CASCADE ON UPDATE NO ACTION
  );
  CREATE INDEX [IX_po_financial_charges_corporation_uuid] ON [dbo].[po_financial_charges]([corporation_uuid]);
  CREATE INDEX [IX_po_financial_charges_purchase_order_uuid] ON [dbo].[po_financial_charges]([purchase_order_uuid]);
END;

IF OBJECT_ID(N'dbo.po_financial_taxes', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[po_financial_taxes] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] NVARCHAR(36) NOT NULL CONSTRAINT [DF_po_financial_taxes_uuid] DEFAULT LOWER(CONVERT(NVARCHAR(36),NEWID())),
    [corporation_uuid] NVARCHAR(36) NOT NULL,
    [purchase_order_uuid] NVARCHAR(36) NOT NULL,
    [tax_key] NVARCHAR(50) NOT NULL,
    [percentage] DECIMAL(18,6) NULL,
    [amount] DECIMAL(18,2) NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [DF_po_financial_taxes_created_at] DEFAULT SYSUTCDATETIME(),
    [updated_at] DATETIME2 NOT NULL CONSTRAINT [DF_po_financial_taxes_updated_at] DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_po_financial_taxes] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UQ_po_financial_taxes_uuid] UNIQUE NONCLUSTERED ([uuid]),
    CONSTRAINT [UQ_po_financial_taxes_po_key] UNIQUE NONCLUSTERED ([purchase_order_uuid], [tax_key]),
    CONSTRAINT [FK_po_financial_taxes_po] FOREIGN KEY ([purchase_order_uuid])
      REFERENCES [dbo].[purchase_order_forms]([uuid]) ON DELETE CASCADE ON UPDATE NO ACTION
  );
  CREATE INDEX [IX_po_financial_taxes_corporation_uuid] ON [dbo].[po_financial_taxes]([corporation_uuid]);
  CREATE INDEX [IX_po_financial_taxes_purchase_order_uuid] ON [dbo].[po_financial_taxes]([purchase_order_uuid]);
END;

IF OBJECT_ID(N'dbo.po_removed_items', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[po_removed_items] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] NVARCHAR(36) NOT NULL CONSTRAINT [DF_po_removed_items_uuid] DEFAULT LOWER(CONVERT(NVARCHAR(36),NEWID())),
    [corporation_uuid] NVARCHAR(36) NOT NULL,
    [purchase_order_uuid] NVARCHAR(36) NOT NULL,
    [item_uuid] NVARCHAR(36) NULL,
    [cost_code_uuid] NVARCHAR(36) NULL,
    [location_uuid] NVARCHAR(36) NULL,
    [source_item_uuid] NVARCHAR(36) NULL,
    [item_snapshot] NVARCHAR(MAX) NOT NULL,
    [removed_at] DATETIME2 NOT NULL CONSTRAINT [DF_po_removed_items_removed_at] DEFAULT SYSUTCDATETIME(),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [DF_po_removed_items_created_at] DEFAULT SYSUTCDATETIME(),
    [updated_at] DATETIME2 NOT NULL CONSTRAINT [DF_po_removed_items_updated_at] DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_po_removed_items] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UQ_po_removed_items_uuid] UNIQUE NONCLUSTERED ([uuid]),
    CONSTRAINT [FK_po_removed_items_po] FOREIGN KEY ([purchase_order_uuid])
      REFERENCES [dbo].[purchase_order_forms]([uuid]) ON DELETE CASCADE ON UPDATE NO ACTION
  );
  CREATE INDEX [IX_po_removed_items_po_removed_at] ON [dbo].[po_removed_items]([purchase_order_uuid], [removed_at]);
  CREATE INDEX [IX_po_removed_items_corporation_uuid] ON [dbo].[po_removed_items]([corporation_uuid]);
  CREATE INDEX [IX_po_removed_items_item_uuid] ON [dbo].[po_removed_items]([item_uuid]);
END;

IF OBJECT_ID(N'dbo.po_attachments', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[po_attachments] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] NVARCHAR(36) NOT NULL CONSTRAINT [DF_po_attachments_uuid] DEFAULT LOWER(CONVERT(NVARCHAR(36),NEWID())),
    [corporation_uuid] NVARCHAR(36) NOT NULL,
    [purchase_order_uuid] NVARCHAR(36) NOT NULL,
    [source_uuid] NVARCHAR(36) NULL,
    [document_name] NVARCHAR(255) NOT NULL,
    [mime_type] NVARCHAR(100) NULL,
    [file_size] BIGINT NULL,
    [file_url] NVARCHAR(MAX) NULL,
    [uploaded_at] DATETIME2 NULL,
    [uploaded_by] NVARCHAR(128) NULL,
    [sort_order] INT NOT NULL CONSTRAINT [DF_po_attachments_sort_order] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [DF_po_attachments_created_at] DEFAULT SYSUTCDATETIME(),
    [updated_at] DATETIME2 NOT NULL CONSTRAINT [DF_po_attachments_updated_at] DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_po_attachments] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UQ_po_attachments_uuid] UNIQUE NONCLUSTERED ([uuid]),
    CONSTRAINT [FK_po_attachments_po] FOREIGN KEY ([purchase_order_uuid])
      REFERENCES [dbo].[purchase_order_forms]([uuid]) ON DELETE CASCADE ON UPDATE NO ACTION
  );
  CREATE INDEX [IX_po_attachments_po_sort] ON [dbo].[po_attachments]([purchase_order_uuid], [sort_order]);
  CREATE INDEX [IX_po_attachments_corporation_uuid] ON [dbo].[po_attachments]([corporation_uuid]);
END;

IF OBJECT_ID(N'dbo.po_audit_events', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[po_audit_events] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] NVARCHAR(36) NOT NULL CONSTRAINT [DF_po_audit_events_uuid] DEFAULT LOWER(CONVERT(NVARCHAR(36),NEWID())),
    [corporation_uuid] NVARCHAR(36) NOT NULL,
    [purchase_order_uuid] NVARCHAR(36) NOT NULL,
    [event_type] NVARCHAR(100) NOT NULL,
    [payload] NVARCHAR(MAX) NULL,
    [created_by] NVARCHAR(128) NULL,
    [event_at] DATETIME2 NOT NULL CONSTRAINT [DF_po_audit_events_event_at] DEFAULT SYSUTCDATETIME(),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [DF_po_audit_events_created_at] DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_po_audit_events] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UQ_po_audit_events_uuid] UNIQUE NONCLUSTERED ([uuid]),
    CONSTRAINT [FK_po_audit_events_po] FOREIGN KEY ([purchase_order_uuid])
      REFERENCES [dbo].[purchase_order_forms]([uuid]) ON DELETE CASCADE ON UPDATE NO ACTION
  );
  CREATE INDEX [IX_po_audit_events_po_event_at] ON [dbo].[po_audit_events]([purchase_order_uuid], [event_at]);
  CREATE INDEX [IX_po_audit_events_corporation_uuid] ON [dbo].[po_audit_events]([corporation_uuid]);
END;

IF OBJECT_ID(N'dbo.po_item_approval_checks', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[po_item_approval_checks] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] NVARCHAR(36) NOT NULL CONSTRAINT [DF_po_item_approval_checks_uuid] DEFAULT LOWER(CONVERT(NVARCHAR(36),NEWID())),
    [purchase_order_item_uuid] NVARCHAR(36) NOT NULL,
    [approval_check_uuid] NVARCHAR(36) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [DF_po_item_approval_checks_created_at] DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_po_item_approval_checks] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UQ_po_item_approval_checks_uuid] UNIQUE NONCLUSTERED ([uuid]),
    CONSTRAINT [UQ_po_item_approval_checks_item_check] UNIQUE NONCLUSTERED ([purchase_order_item_uuid], [approval_check_uuid]),
    CONSTRAINT [FK_po_item_approval_checks_item] FOREIGN KEY ([purchase_order_item_uuid])
      REFERENCES [dbo].[purchase_order_items_list]([uuid]) ON DELETE CASCADE ON UPDATE NO ACTION
  );
  CREATE INDEX [IX_po_item_approval_checks_item] ON [dbo].[po_item_approval_checks]([purchase_order_item_uuid]);
  CREATE INDEX [IX_po_item_approval_checks_check] ON [dbo].[po_item_approval_checks]([approval_check_uuid]);
END;

IF OBJECT_ID(N'dbo.po_item_receipt_notes', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[po_item_receipt_notes] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] NVARCHAR(36) NOT NULL CONSTRAINT [DF_po_item_receipt_notes_uuid] DEFAULT LOWER(CONVERT(NVARCHAR(36),NEWID())),
    [purchase_order_item_uuid] NVARCHAR(36) NOT NULL,
    [receipt_note_uuid] NVARCHAR(36) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [DF_po_item_receipt_notes_created_at] DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_po_item_receipt_notes] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UQ_po_item_receipt_notes_uuid] UNIQUE NONCLUSTERED ([uuid]),
    CONSTRAINT [UQ_po_item_receipt_notes_item_rn] UNIQUE NONCLUSTERED ([purchase_order_item_uuid], [receipt_note_uuid]),
    CONSTRAINT [FK_po_item_receipt_notes_item] FOREIGN KEY ([purchase_order_item_uuid])
      REFERENCES [dbo].[purchase_order_items_list]([uuid]) ON DELETE CASCADE ON UPDATE NO ACTION
  );
  CREATE INDEX [IX_po_item_receipt_notes_item] ON [dbo].[po_item_receipt_notes]([purchase_order_item_uuid]);
  CREATE INDEX [IX_po_item_receipt_notes_rn] ON [dbo].[po_item_receipt_notes]([receipt_note_uuid]);
END;

-- ── Change order children ──────────────────────────────────────────────────

IF OBJECT_ID(N'dbo.co_financial_charges', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[co_financial_charges] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] NVARCHAR(36) NOT NULL CONSTRAINT [DF_co_financial_charges_uuid] DEFAULT LOWER(CONVERT(NVARCHAR(36),NEWID())),
    [corporation_uuid] NVARCHAR(36) NOT NULL,
    [change_order_uuid] NVARCHAR(36) NOT NULL,
    [charge_key] NVARCHAR(50) NOT NULL,
    [percentage] DECIMAL(18,6) NULL,
    [amount] DECIMAL(18,2) NULL,
    [taxable] BIT NOT NULL CONSTRAINT [DF_co_financial_charges_taxable] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [DF_co_financial_charges_created_at] DEFAULT SYSUTCDATETIME(),
    [updated_at] DATETIME2 NOT NULL CONSTRAINT [DF_co_financial_charges_updated_at] DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_co_financial_charges] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UQ_co_financial_charges_uuid] UNIQUE NONCLUSTERED ([uuid]),
    CONSTRAINT [UQ_co_financial_charges_co_key] UNIQUE NONCLUSTERED ([change_order_uuid], [charge_key]),
    CONSTRAINT [FK_co_financial_charges_co] FOREIGN KEY ([change_order_uuid])
      REFERENCES [dbo].[change_orders]([uuid]) ON DELETE CASCADE ON UPDATE NO ACTION
  );
  CREATE INDEX [IX_co_financial_charges_corporation_uuid] ON [dbo].[co_financial_charges]([corporation_uuid]);
  CREATE INDEX [IX_co_financial_charges_change_order_uuid] ON [dbo].[co_financial_charges]([change_order_uuid]);
END;

IF OBJECT_ID(N'dbo.co_financial_taxes', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[co_financial_taxes] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] NVARCHAR(36) NOT NULL CONSTRAINT [DF_co_financial_taxes_uuid] DEFAULT LOWER(CONVERT(NVARCHAR(36),NEWID())),
    [corporation_uuid] NVARCHAR(36) NOT NULL,
    [change_order_uuid] NVARCHAR(36) NOT NULL,
    [tax_key] NVARCHAR(50) NOT NULL,
    [percentage] DECIMAL(18,6) NULL,
    [amount] DECIMAL(18,2) NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [DF_co_financial_taxes_created_at] DEFAULT SYSUTCDATETIME(),
    [updated_at] DATETIME2 NOT NULL CONSTRAINT [DF_co_financial_taxes_updated_at] DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_co_financial_taxes] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UQ_co_financial_taxes_uuid] UNIQUE NONCLUSTERED ([uuid]),
    CONSTRAINT [UQ_co_financial_taxes_co_key] UNIQUE NONCLUSTERED ([change_order_uuid], [tax_key]),
    CONSTRAINT [FK_co_financial_taxes_co] FOREIGN KEY ([change_order_uuid])
      REFERENCES [dbo].[change_orders]([uuid]) ON DELETE CASCADE ON UPDATE NO ACTION
  );
  CREATE INDEX [IX_co_financial_taxes_corporation_uuid] ON [dbo].[co_financial_taxes]([corporation_uuid]);
  CREATE INDEX [IX_co_financial_taxes_change_order_uuid] ON [dbo].[co_financial_taxes]([change_order_uuid]);
END;

IF OBJECT_ID(N'dbo.co_removed_items', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[co_removed_items] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] NVARCHAR(36) NOT NULL CONSTRAINT [DF_co_removed_items_uuid] DEFAULT LOWER(CONVERT(NVARCHAR(36),NEWID())),
    [corporation_uuid] NVARCHAR(36) NOT NULL,
    [change_order_uuid] NVARCHAR(36) NOT NULL,
    [item_uuid] NVARCHAR(36) NULL,
    [cost_code_uuid] NVARCHAR(36) NULL,
    [location_uuid] NVARCHAR(36) NULL,
    [source_item_uuid] NVARCHAR(36) NULL,
    [item_snapshot] NVARCHAR(MAX) NOT NULL,
    [removed_at] DATETIME2 NOT NULL CONSTRAINT [DF_co_removed_items_removed_at] DEFAULT SYSUTCDATETIME(),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [DF_co_removed_items_created_at] DEFAULT SYSUTCDATETIME(),
    [updated_at] DATETIME2 NOT NULL CONSTRAINT [DF_co_removed_items_updated_at] DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_co_removed_items] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UQ_co_removed_items_uuid] UNIQUE NONCLUSTERED ([uuid]),
    CONSTRAINT [FK_co_removed_items_co] FOREIGN KEY ([change_order_uuid])
      REFERENCES [dbo].[change_orders]([uuid]) ON DELETE CASCADE ON UPDATE NO ACTION
  );
  CREATE INDEX [IX_co_removed_items_co_removed_at] ON [dbo].[co_removed_items]([change_order_uuid], [removed_at]);
  CREATE INDEX [IX_co_removed_items_corporation_uuid] ON [dbo].[co_removed_items]([corporation_uuid]);
END;

IF OBJECT_ID(N'dbo.co_attachments', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[co_attachments] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] NVARCHAR(36) NOT NULL CONSTRAINT [DF_co_attachments_uuid] DEFAULT LOWER(CONVERT(NVARCHAR(36),NEWID())),
    [corporation_uuid] NVARCHAR(36) NOT NULL,
    [change_order_uuid] NVARCHAR(36) NOT NULL,
    [source_uuid] NVARCHAR(36) NULL,
    [document_name] NVARCHAR(255) NOT NULL,
    [mime_type] NVARCHAR(100) NULL,
    [file_size] BIGINT NULL,
    [file_url] NVARCHAR(MAX) NULL,
    [uploaded_at] DATETIME2 NULL,
    [uploaded_by] NVARCHAR(128) NULL,
    [sort_order] INT NOT NULL CONSTRAINT [DF_co_attachments_sort_order] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [DF_co_attachments_created_at] DEFAULT SYSUTCDATETIME(),
    [updated_at] DATETIME2 NOT NULL CONSTRAINT [DF_co_attachments_updated_at] DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_co_attachments] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UQ_co_attachments_uuid] UNIQUE NONCLUSTERED ([uuid]),
    CONSTRAINT [FK_co_attachments_co] FOREIGN KEY ([change_order_uuid])
      REFERENCES [dbo].[change_orders]([uuid]) ON DELETE CASCADE ON UPDATE NO ACTION
  );
  CREATE INDEX [IX_co_attachments_co_sort] ON [dbo].[co_attachments]([change_order_uuid], [sort_order]);
  CREATE INDEX [IX_co_attachments_corporation_uuid] ON [dbo].[co_attachments]([corporation_uuid]);
END;

IF OBJECT_ID(N'dbo.co_audit_events', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[co_audit_events] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] NVARCHAR(36) NOT NULL CONSTRAINT [DF_co_audit_events_uuid] DEFAULT LOWER(CONVERT(NVARCHAR(36),NEWID())),
    [corporation_uuid] NVARCHAR(36) NOT NULL,
    [change_order_uuid] NVARCHAR(36) NOT NULL,
    [event_type] NVARCHAR(100) NOT NULL,
    [payload] NVARCHAR(MAX) NULL,
    [created_by] NVARCHAR(128) NULL,
    [event_at] DATETIME2 NOT NULL CONSTRAINT [DF_co_audit_events_event_at] DEFAULT SYSUTCDATETIME(),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [DF_co_audit_events_created_at] DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_co_audit_events] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UQ_co_audit_events_uuid] UNIQUE NONCLUSTERED ([uuid]),
    CONSTRAINT [FK_co_audit_events_co] FOREIGN KEY ([change_order_uuid])
      REFERENCES [dbo].[change_orders]([uuid]) ON DELETE CASCADE ON UPDATE NO ACTION
  );
  CREATE INDEX [IX_co_audit_events_co_event_at] ON [dbo].[co_audit_events]([change_order_uuid], [event_at]);
  CREATE INDEX [IX_co_audit_events_corporation_uuid] ON [dbo].[co_audit_events]([corporation_uuid]);
END;

IF OBJECT_ID(N'dbo.co_item_approval_checks', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[co_item_approval_checks] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] NVARCHAR(36) NOT NULL CONSTRAINT [DF_co_item_approval_checks_uuid] DEFAULT LOWER(CONVERT(NVARCHAR(36),NEWID())),
    [change_order_item_uuid] NVARCHAR(36) NOT NULL,
    [approval_check_uuid] NVARCHAR(36) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [DF_co_item_approval_checks_created_at] DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_co_item_approval_checks] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UQ_co_item_approval_checks_uuid] UNIQUE NONCLUSTERED ([uuid]),
    CONSTRAINT [UQ_co_item_approval_checks_item_check] UNIQUE NONCLUSTERED ([change_order_item_uuid], [approval_check_uuid]),
    CONSTRAINT [FK_co_item_approval_checks_item] FOREIGN KEY ([change_order_item_uuid])
      REFERENCES [dbo].[change_order_items_list]([uuid]) ON DELETE CASCADE ON UPDATE NO ACTION
  );
  CREATE INDEX [IX_co_item_approval_checks_item] ON [dbo].[co_item_approval_checks]([change_order_item_uuid]);
  CREATE INDEX [IX_co_item_approval_checks_check] ON [dbo].[co_item_approval_checks]([approval_check_uuid]);
END;

IF OBJECT_ID(N'dbo.co_item_receipt_notes', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[co_item_receipt_notes] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] NVARCHAR(36) NOT NULL CONSTRAINT [DF_co_item_receipt_notes_uuid] DEFAULT LOWER(CONVERT(NVARCHAR(36),NEWID())),
    [change_order_item_uuid] NVARCHAR(36) NOT NULL,
    [receipt_note_uuid] NVARCHAR(36) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [DF_co_item_receipt_notes_created_at] DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_co_item_receipt_notes] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UQ_co_item_receipt_notes_uuid] UNIQUE NONCLUSTERED ([uuid]),
    CONSTRAINT [UQ_co_item_receipt_notes_item_rn] UNIQUE NONCLUSTERED ([change_order_item_uuid], [receipt_note_uuid]),
    CONSTRAINT [FK_co_item_receipt_notes_item] FOREIGN KEY ([change_order_item_uuid])
      REFERENCES [dbo].[change_order_items_list]([uuid]) ON DELETE CASCADE ON UPDATE NO ACTION
  );
  CREATE INDEX [IX_co_item_receipt_notes_item] ON [dbo].[co_item_receipt_notes]([change_order_item_uuid]);
  CREATE INDEX [IX_co_item_receipt_notes_rn] ON [dbo].[co_item_receipt_notes]([receipt_note_uuid]);
END;

-- ── Vendor invoice children ────────────────────────────────────────────────

IF OBJECT_ID(N'dbo.vi_financial_charges', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[vi_financial_charges] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] NVARCHAR(36) NOT NULL CONSTRAINT [DF_vi_financial_charges_uuid] DEFAULT LOWER(CONVERT(NVARCHAR(36),NEWID())),
    [corporation_uuid] NVARCHAR(36) NOT NULL,
    [vendor_invoice_uuid] NVARCHAR(36) NOT NULL,
    [charge_key] NVARCHAR(50) NOT NULL,
    [percentage] DECIMAL(18,6) NULL,
    [amount] DECIMAL(18,2) NULL,
    [taxable] BIT NOT NULL CONSTRAINT [DF_vi_financial_charges_taxable] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [DF_vi_financial_charges_created_at] DEFAULT SYSUTCDATETIME(),
    [updated_at] DATETIME2 NOT NULL CONSTRAINT [DF_vi_financial_charges_updated_at] DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_vi_financial_charges] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UQ_vi_financial_charges_uuid] UNIQUE NONCLUSTERED ([uuid]),
    CONSTRAINT [UQ_vi_financial_charges_vi_key] UNIQUE NONCLUSTERED ([vendor_invoice_uuid], [charge_key]),
    CONSTRAINT [FK_vi_financial_charges_vi] FOREIGN KEY ([vendor_invoice_uuid])
      REFERENCES [dbo].[vendor_invoices]([uuid]) ON DELETE CASCADE ON UPDATE NO ACTION
  );
  CREATE INDEX [IX_vi_financial_charges_corporation_uuid] ON [dbo].[vi_financial_charges]([corporation_uuid]);
  CREATE INDEX [IX_vi_financial_charges_vendor_invoice_uuid] ON [dbo].[vi_financial_charges]([vendor_invoice_uuid]);
END;

IF OBJECT_ID(N'dbo.vi_financial_taxes', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[vi_financial_taxes] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] NVARCHAR(36) NOT NULL CONSTRAINT [DF_vi_financial_taxes_uuid] DEFAULT LOWER(CONVERT(NVARCHAR(36),NEWID())),
    [corporation_uuid] NVARCHAR(36) NOT NULL,
    [vendor_invoice_uuid] NVARCHAR(36) NOT NULL,
    [tax_key] NVARCHAR(50) NOT NULL,
    [percentage] DECIMAL(18,6) NULL,
    [amount] DECIMAL(18,2) NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [DF_vi_financial_taxes_created_at] DEFAULT SYSUTCDATETIME(),
    [updated_at] DATETIME2 NOT NULL CONSTRAINT [DF_vi_financial_taxes_updated_at] DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_vi_financial_taxes] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UQ_vi_financial_taxes_uuid] UNIQUE NONCLUSTERED ([uuid]),
    CONSTRAINT [UQ_vi_financial_taxes_vi_key] UNIQUE NONCLUSTERED ([vendor_invoice_uuid], [tax_key]),
    CONSTRAINT [FK_vi_financial_taxes_vi] FOREIGN KEY ([vendor_invoice_uuid])
      REFERENCES [dbo].[vendor_invoices]([uuid]) ON DELETE CASCADE ON UPDATE NO ACTION
  );
  CREATE INDEX [IX_vi_financial_taxes_corporation_uuid] ON [dbo].[vi_financial_taxes]([corporation_uuid]);
  CREATE INDEX [IX_vi_financial_taxes_vendor_invoice_uuid] ON [dbo].[vi_financial_taxes]([vendor_invoice_uuid]);
END;

IF OBJECT_ID(N'dbo.vi_attachments', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[vi_attachments] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] NVARCHAR(36) NOT NULL CONSTRAINT [DF_vi_attachments_uuid] DEFAULT LOWER(CONVERT(NVARCHAR(36),NEWID())),
    [corporation_uuid] NVARCHAR(36) NOT NULL,
    [vendor_invoice_uuid] NVARCHAR(36) NOT NULL,
    [source_uuid] NVARCHAR(36) NULL,
    [document_name] NVARCHAR(255) NOT NULL,
    [mime_type] NVARCHAR(100) NULL,
    [file_size] BIGINT NULL,
    [file_url] NVARCHAR(MAX) NULL,
    [uploaded_at] DATETIME2 NULL,
    [uploaded_by] NVARCHAR(128) NULL,
    [sort_order] INT NOT NULL CONSTRAINT [DF_vi_attachments_sort_order] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [DF_vi_attachments_created_at] DEFAULT SYSUTCDATETIME(),
    [updated_at] DATETIME2 NOT NULL CONSTRAINT [DF_vi_attachments_updated_at] DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_vi_attachments] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UQ_vi_attachments_uuid] UNIQUE NONCLUSTERED ([uuid]),
    CONSTRAINT [FK_vi_attachments_vi] FOREIGN KEY ([vendor_invoice_uuid])
      REFERENCES [dbo].[vendor_invoices]([uuid]) ON DELETE CASCADE ON UPDATE NO ACTION
  );
  CREATE INDEX [IX_vi_attachments_vi_sort] ON [dbo].[vi_attachments]([vendor_invoice_uuid], [sort_order]);
  CREATE INDEX [IX_vi_attachments_corporation_uuid] ON [dbo].[vi_attachments]([corporation_uuid]);
END;

IF OBJECT_ID(N'dbo.labor_invoice_approval_checks', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[labor_invoice_approval_checks] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] NVARCHAR(36) NOT NULL CONSTRAINT [DF_labor_invoice_approval_checks_uuid] DEFAULT LOWER(CONVERT(NVARCHAR(36),NEWID())),
    [labor_invoice_item_uuid] NVARCHAR(36) NOT NULL,
    [approval_check_uuid] NVARCHAR(36) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [DF_labor_invoice_approval_checks_created_at] DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_labor_invoice_approval_checks] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UQ_labor_invoice_approval_checks_uuid] UNIQUE NONCLUSTERED ([uuid]),
    CONSTRAINT [UQ_labor_invoice_approval_checks_item_check] UNIQUE NONCLUSTERED ([labor_invoice_item_uuid], [approval_check_uuid]),
    CONSTRAINT [FK_labor_invoice_approval_checks_item] FOREIGN KEY ([labor_invoice_item_uuid])
      REFERENCES [dbo].[labor_invoice_items_list]([uuid]) ON DELETE CASCADE ON UPDATE NO ACTION
  );
  CREATE INDEX [IX_labor_invoice_approval_checks_item] ON [dbo].[labor_invoice_approval_checks]([labor_invoice_item_uuid]);
END;

-- ── GRN (stock_receipt_notes) children ─────────────────────────────────────

IF OBJECT_ID(N'dbo.grn_financial_charges', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[grn_financial_charges] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] NVARCHAR(36) NOT NULL CONSTRAINT [DF_grn_financial_charges_uuid] DEFAULT LOWER(CONVERT(NVARCHAR(36),NEWID())),
    [corporation_uuid] NVARCHAR(36) NOT NULL,
    [receipt_note_uuid] NVARCHAR(36) NOT NULL,
    [charge_key] NVARCHAR(50) NOT NULL,
    [percentage] DECIMAL(18,6) NULL,
    [amount] DECIMAL(18,2) NULL,
    [taxable] BIT NOT NULL CONSTRAINT [DF_grn_financial_charges_taxable] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [DF_grn_financial_charges_created_at] DEFAULT SYSUTCDATETIME(),
    [updated_at] DATETIME2 NOT NULL CONSTRAINT [DF_grn_financial_charges_updated_at] DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_grn_financial_charges] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UQ_grn_financial_charges_uuid] UNIQUE NONCLUSTERED ([uuid]),
    CONSTRAINT [UQ_grn_financial_charges_rn_key] UNIQUE NONCLUSTERED ([receipt_note_uuid], [charge_key]),
    CONSTRAINT [FK_grn_financial_charges_rn] FOREIGN KEY ([receipt_note_uuid])
      REFERENCES [dbo].[stock_receipt_notes]([uuid]) ON DELETE CASCADE ON UPDATE NO ACTION
  );
  CREATE INDEX [IX_grn_financial_charges_corporation_uuid] ON [dbo].[grn_financial_charges]([corporation_uuid]);
  CREATE INDEX [IX_grn_financial_charges_receipt_note_uuid] ON [dbo].[grn_financial_charges]([receipt_note_uuid]);
END;

IF OBJECT_ID(N'dbo.grn_financial_taxes', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[grn_financial_taxes] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] NVARCHAR(36) NOT NULL CONSTRAINT [DF_grn_financial_taxes_uuid] DEFAULT LOWER(CONVERT(NVARCHAR(36),NEWID())),
    [corporation_uuid] NVARCHAR(36) NOT NULL,
    [receipt_note_uuid] NVARCHAR(36) NOT NULL,
    [tax_key] NVARCHAR(50) NOT NULL,
    [percentage] DECIMAL(18,6) NULL,
    [amount] DECIMAL(18,2) NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [DF_grn_financial_taxes_created_at] DEFAULT SYSUTCDATETIME(),
    [updated_at] DATETIME2 NOT NULL CONSTRAINT [DF_grn_financial_taxes_updated_at] DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_grn_financial_taxes] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UQ_grn_financial_taxes_uuid] UNIQUE NONCLUSTERED ([uuid]),
    CONSTRAINT [UQ_grn_financial_taxes_rn_key] UNIQUE NONCLUSTERED ([receipt_note_uuid], [tax_key]),
    CONSTRAINT [FK_grn_financial_taxes_rn] FOREIGN KEY ([receipt_note_uuid])
      REFERENCES [dbo].[stock_receipt_notes]([uuid]) ON DELETE CASCADE ON UPDATE NO ACTION
  );
  CREATE INDEX [IX_grn_financial_taxes_corporation_uuid] ON [dbo].[grn_financial_taxes]([corporation_uuid]);
  CREATE INDEX [IX_grn_financial_taxes_receipt_note_uuid] ON [dbo].[grn_financial_taxes]([receipt_note_uuid]);
END;

IF OBJECT_ID(N'dbo.grn_attachments', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[grn_attachments] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] NVARCHAR(36) NOT NULL CONSTRAINT [DF_grn_attachments_uuid] DEFAULT LOWER(CONVERT(NVARCHAR(36),NEWID())),
    [corporation_uuid] NVARCHAR(36) NOT NULL,
    [receipt_note_uuid] NVARCHAR(36) NOT NULL,
    [source_uuid] NVARCHAR(36) NULL,
    [document_name] NVARCHAR(255) NOT NULL,
    [mime_type] NVARCHAR(100) NULL,
    [file_size] BIGINT NULL,
    [file_url] NVARCHAR(MAX) NULL,
    [uploaded_at] DATETIME2 NULL,
    [uploaded_by] NVARCHAR(128) NULL,
    [sort_order] INT NOT NULL CONSTRAINT [DF_grn_attachments_sort_order] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [DF_grn_attachments_created_at] DEFAULT SYSUTCDATETIME(),
    [updated_at] DATETIME2 NOT NULL CONSTRAINT [DF_grn_attachments_updated_at] DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_grn_attachments] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UQ_grn_attachments_uuid] UNIQUE NONCLUSTERED ([uuid]),
    CONSTRAINT [FK_grn_attachments_rn] FOREIGN KEY ([receipt_note_uuid])
      REFERENCES [dbo].[stock_receipt_notes]([uuid]) ON DELETE CASCADE ON UPDATE NO ACTION
  );
  CREATE INDEX [IX_grn_attachments_rn_sort] ON [dbo].[grn_attachments]([receipt_note_uuid], [sort_order]);
  CREATE INDEX [IX_grn_attachments_corporation_uuid] ON [dbo].[grn_attachments]([corporation_uuid]);
END;

IF OBJECT_ID(N'dbo.grn_audit_events', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[grn_audit_events] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] NVARCHAR(36) NOT NULL CONSTRAINT [DF_grn_audit_events_uuid] DEFAULT LOWER(CONVERT(NVARCHAR(36),NEWID())),
    [corporation_uuid] NVARCHAR(36) NOT NULL,
    [receipt_note_uuid] NVARCHAR(36) NOT NULL,
    [event_type] NVARCHAR(100) NOT NULL,
    [payload] NVARCHAR(MAX) NULL,
    [created_by] NVARCHAR(128) NULL,
    [event_at] DATETIME2 NOT NULL CONSTRAINT [DF_grn_audit_events_event_at] DEFAULT SYSUTCDATETIME(),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [DF_grn_audit_events_created_at] DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_grn_audit_events] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UQ_grn_audit_events_uuid] UNIQUE NONCLUSTERED ([uuid]),
    CONSTRAINT [FK_grn_audit_events_rn] FOREIGN KEY ([receipt_note_uuid])
      REFERENCES [dbo].[stock_receipt_notes]([uuid]) ON DELETE CASCADE ON UPDATE NO ACTION
  );
  CREATE INDEX [IX_grn_audit_events_rn_event_at] ON [dbo].[grn_audit_events]([receipt_note_uuid], [event_at]);
  CREATE INDEX [IX_grn_audit_events_corporation_uuid] ON [dbo].[grn_audit_events]([corporation_uuid]);
END;

-- ── Return (stock_return_notes) children ───────────────────────────────────

IF OBJECT_ID(N'dbo.return_financial_charges', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[return_financial_charges] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] NVARCHAR(36) NOT NULL CONSTRAINT [DF_return_financial_charges_uuid] DEFAULT LOWER(CONVERT(NVARCHAR(36),NEWID())),
    [corporation_uuid] NVARCHAR(36) NOT NULL,
    [return_note_uuid] NVARCHAR(36) NOT NULL,
    [charge_key] NVARCHAR(50) NOT NULL,
    [percentage] DECIMAL(18,6) NULL,
    [amount] DECIMAL(18,2) NULL,
    [taxable] BIT NOT NULL CONSTRAINT [DF_return_financial_charges_taxable] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [DF_return_financial_charges_created_at] DEFAULT SYSUTCDATETIME(),
    [updated_at] DATETIME2 NOT NULL CONSTRAINT [DF_return_financial_charges_updated_at] DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_return_financial_charges] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UQ_return_financial_charges_uuid] UNIQUE NONCLUSTERED ([uuid]),
    CONSTRAINT [UQ_return_financial_charges_rn_key] UNIQUE NONCLUSTERED ([return_note_uuid], [charge_key]),
    CONSTRAINT [FK_return_financial_charges_rn] FOREIGN KEY ([return_note_uuid])
      REFERENCES [dbo].[stock_return_notes]([uuid]) ON DELETE CASCADE ON UPDATE NO ACTION
  );
  CREATE INDEX [IX_return_financial_charges_corporation_uuid] ON [dbo].[return_financial_charges]([corporation_uuid]);
  CREATE INDEX [IX_return_financial_charges_return_note_uuid] ON [dbo].[return_financial_charges]([return_note_uuid]);
END;

IF OBJECT_ID(N'dbo.return_financial_taxes', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[return_financial_taxes] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] NVARCHAR(36) NOT NULL CONSTRAINT [DF_return_financial_taxes_uuid] DEFAULT LOWER(CONVERT(NVARCHAR(36),NEWID())),
    [corporation_uuid] NVARCHAR(36) NOT NULL,
    [return_note_uuid] NVARCHAR(36) NOT NULL,
    [tax_key] NVARCHAR(50) NOT NULL,
    [percentage] DECIMAL(18,6) NULL,
    [amount] DECIMAL(18,2) NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [DF_return_financial_taxes_created_at] DEFAULT SYSUTCDATETIME(),
    [updated_at] DATETIME2 NOT NULL CONSTRAINT [DF_return_financial_taxes_updated_at] DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_return_financial_taxes] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UQ_return_financial_taxes_uuid] UNIQUE NONCLUSTERED ([uuid]),
    CONSTRAINT [UQ_return_financial_taxes_rn_key] UNIQUE NONCLUSTERED ([return_note_uuid], [tax_key]),
    CONSTRAINT [FK_return_financial_taxes_rn] FOREIGN KEY ([return_note_uuid])
      REFERENCES [dbo].[stock_return_notes]([uuid]) ON DELETE CASCADE ON UPDATE NO ACTION
  );
  CREATE INDEX [IX_return_financial_taxes_corporation_uuid] ON [dbo].[return_financial_taxes]([corporation_uuid]);
  CREATE INDEX [IX_return_financial_taxes_return_note_uuid] ON [dbo].[return_financial_taxes]([return_note_uuid]);
END;

IF OBJECT_ID(N'dbo.return_attachments', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[return_attachments] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] NVARCHAR(36) NOT NULL CONSTRAINT [DF_return_attachments_uuid] DEFAULT LOWER(CONVERT(NVARCHAR(36),NEWID())),
    [corporation_uuid] NVARCHAR(36) NOT NULL,
    [return_note_uuid] NVARCHAR(36) NOT NULL,
    [source_uuid] NVARCHAR(36) NULL,
    [document_name] NVARCHAR(255) NOT NULL,
    [mime_type] NVARCHAR(100) NULL,
    [file_size] BIGINT NULL,
    [file_url] NVARCHAR(MAX) NULL,
    [uploaded_at] DATETIME2 NULL,
    [uploaded_by] NVARCHAR(128) NULL,
    [sort_order] INT NOT NULL CONSTRAINT [DF_return_attachments_sort_order] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [DF_return_attachments_created_at] DEFAULT SYSUTCDATETIME(),
    [updated_at] DATETIME2 NOT NULL CONSTRAINT [DF_return_attachments_updated_at] DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_return_attachments] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UQ_return_attachments_uuid] UNIQUE NONCLUSTERED ([uuid]),
    CONSTRAINT [FK_return_attachments_rn] FOREIGN KEY ([return_note_uuid])
      REFERENCES [dbo].[stock_return_notes]([uuid]) ON DELETE CASCADE ON UPDATE NO ACTION
  );
  CREATE INDEX [IX_return_attachments_rn_sort] ON [dbo].[return_attachments]([return_note_uuid], [sort_order]);
  CREATE INDEX [IX_return_attachments_corporation_uuid] ON [dbo].[return_attachments]([corporation_uuid]);
END;

IF OBJECT_ID(N'dbo.return_audit_events', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[return_audit_events] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] NVARCHAR(36) NOT NULL CONSTRAINT [DF_return_audit_events_uuid] DEFAULT LOWER(CONVERT(NVARCHAR(36),NEWID())),
    [corporation_uuid] NVARCHAR(36) NOT NULL,
    [return_note_uuid] NVARCHAR(36) NOT NULL,
    [event_type] NVARCHAR(100) NOT NULL,
    [payload] NVARCHAR(MAX) NULL,
    [created_by] NVARCHAR(128) NULL,
    [event_at] DATETIME2 NOT NULL CONSTRAINT [DF_return_audit_events_event_at] DEFAULT SYSUTCDATETIME(),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [DF_return_audit_events_created_at] DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_return_audit_events] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UQ_return_audit_events_uuid] UNIQUE NONCLUSTERED ([uuid]),
    CONSTRAINT [FK_return_audit_events_rn] FOREIGN KEY ([return_note_uuid])
      REFERENCES [dbo].[stock_return_notes]([uuid]) ON DELETE CASCADE ON UPDATE NO ACTION
  );
  CREATE INDEX [IX_return_audit_events_rn_event_at] ON [dbo].[return_audit_events]([return_note_uuid], [event_at]);
  CREATE INDEX [IX_return_audit_events_corporation_uuid] ON [dbo].[return_audit_events]([corporation_uuid]);
END;

-- ── Estimate children ──────────────────────────────────────────────────────

IF OBJECT_ID(N'dbo.estimate_attachments', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[estimate_attachments] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] NVARCHAR(36) NOT NULL CONSTRAINT [DF_estimate_attachments_uuid] DEFAULT LOWER(CONVERT(NVARCHAR(36),NEWID())),
    [corporation_uuid] NVARCHAR(36) NOT NULL,
    [estimate_uuid] NVARCHAR(36) NOT NULL,
    [source_uuid] NVARCHAR(36) NULL,
    [document_name] NVARCHAR(255) NOT NULL,
    [mime_type] NVARCHAR(100) NULL,
    [file_size] BIGINT NULL,
    [uploaded_at] DATETIME2 NULL,
    [uploaded_by] NVARCHAR(128) NULL,
    [file_url] NVARCHAR(MAX) NULL,
    [sort_order] INT NOT NULL CONSTRAINT [DF_estimate_attachments_sort_order] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [DF_estimate_attachments_created_at] DEFAULT SYSUTCDATETIME(),
    [updated_at] DATETIME2 NOT NULL CONSTRAINT [DF_estimate_attachments_updated_at] DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_estimate_attachments] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UQ_estimate_attachments_uuid] UNIQUE NONCLUSTERED ([uuid]),
    CONSTRAINT [FK_estimate_attachments_estimate] FOREIGN KEY ([estimate_uuid])
      REFERENCES [dbo].[estimates]([uuid]) ON DELETE CASCADE ON UPDATE NO ACTION
  );
  CREATE INDEX [IX_estimate_attachments_estimate_sort] ON [dbo].[estimate_attachments]([estimate_uuid], [sort_order]);
  CREATE INDEX [IX_estimate_attachments_corporation_uuid] ON [dbo].[estimate_attachments]([corporation_uuid]);
END;

IF OBJECT_ID(N'dbo.estimate_audit_events', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[estimate_audit_events] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] NVARCHAR(36) NOT NULL CONSTRAINT [DF_estimate_audit_events_uuid] DEFAULT LOWER(CONVERT(NVARCHAR(36),NEWID())),
    [corporation_uuid] NVARCHAR(36) NOT NULL,
    [estimate_uuid] NVARCHAR(36) NOT NULL,
    [event_type] NVARCHAR(100) NOT NULL,
    [payload] NVARCHAR(MAX) NULL,
    [created_by] NVARCHAR(128) NULL,
    [event_at] DATETIME2 NOT NULL CONSTRAINT [DF_estimate_audit_events_event_at] DEFAULT SYSUTCDATETIME(),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [DF_estimate_audit_events_created_at] DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_estimate_audit_events] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UQ_estimate_audit_events_uuid] UNIQUE NONCLUSTERED ([uuid]),
    CONSTRAINT [FK_estimate_audit_events_estimate] FOREIGN KEY ([estimate_uuid])
      REFERENCES [dbo].[estimates]([uuid]) ON DELETE CASCADE ON UPDATE NO ACTION
  );
  CREATE INDEX [IX_estimate_audit_events_estimate_event_at] ON [dbo].[estimate_audit_events]([estimate_uuid], [event_at]);
  CREATE INDEX [IX_estimate_audit_events_corporation_uuid] ON [dbo].[estimate_audit_events]([corporation_uuid]);
END;

IF OBJECT_ID(N'dbo.estimate_removed_cost_codes', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[estimate_removed_cost_codes] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] NVARCHAR(36) NOT NULL CONSTRAINT [DF_estimate_removed_cost_codes_uuid] DEFAULT LOWER(CONVERT(NVARCHAR(36),NEWID())),
    [corporation_uuid] NVARCHAR(36) NOT NULL,
    [estimate_uuid] NVARCHAR(36) NOT NULL,
    [cost_code_uuid] NVARCHAR(36) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [DF_estimate_removed_cost_codes_created_at] DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_estimate_removed_cost_codes] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UQ_estimate_removed_cost_codes_uuid] UNIQUE NONCLUSTERED ([uuid]),
    CONSTRAINT [UQ_estimate_removed_cost_codes_est_cc] UNIQUE NONCLUSTERED ([estimate_uuid], [cost_code_uuid]),
    CONSTRAINT [FK_estimate_removed_cost_codes_estimate] FOREIGN KEY ([estimate_uuid])
      REFERENCES [dbo].[estimates]([uuid]) ON DELETE CASCADE ON UPDATE NO ACTION
  );
  CREATE INDEX [IX_estimate_removed_cost_codes_estimate_uuid] ON [dbo].[estimate_removed_cost_codes]([estimate_uuid]);
  CREATE INDEX [IX_estimate_removed_cost_codes_corporation_uuid] ON [dbo].[estimate_removed_cost_codes]([corporation_uuid]);
END;

-- ── Project document tags ──────────────────────────────────────────────────

IF OBJECT_ID(N'dbo.project_document_tags', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[project_document_tags] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] NVARCHAR(36) NOT NULL CONSTRAINT [DF_project_document_tags_uuid] DEFAULT LOWER(CONVERT(NVARCHAR(36),NEWID())),
    [project_document_uuid] NVARCHAR(36) NOT NULL,
    [tag] NVARCHAR(100) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [DF_project_document_tags_created_at] DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_project_document_tags] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UQ_project_document_tags_uuid] UNIQUE NONCLUSTERED ([uuid]),
    CONSTRAINT [UQ_project_document_tags_doc_tag] UNIQUE NONCLUSTERED ([project_document_uuid], [tag]),
    CONSTRAINT [FK_project_document_tags_document] FOREIGN KEY ([project_document_uuid])
      REFERENCES [dbo].[project_documents]([uuid]) ON DELETE CASCADE ON UPDATE NO ACTION
  );
  CREATE INDEX [IX_project_document_tags_project_document_uuid] ON [dbo].[project_document_tags]([project_document_uuid]);
END;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. Soft-delete composite indexes
-- ═══════════════════════════════════════════════════════════════════════════

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE name = N'IX_po_items_po_removed_order'
    AND object_id = OBJECT_ID(N'dbo.purchase_order_items_list')
)
  CREATE INDEX [IX_po_items_po_removed_order]
    ON [dbo].[purchase_order_items_list]([purchase_order_uuid], [is_removed], [order_index]);

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE name = N'IX_labor_po_items_po_removed_order'
    AND object_id = OBJECT_ID(N'dbo.labor_purchase_order_items_list')
)
  CREATE INDEX [IX_labor_po_items_po_removed_order]
    ON [dbo].[labor_purchase_order_items_list]([purchase_order_uuid], [is_removed], [order_index]);

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE name = N'IX_po_lw_mat_po_removed_order'
    AND object_id = OBJECT_ID(N'dbo.po_location_wise_material')
)
  CREATE INDEX [IX_po_lw_mat_po_removed_order]
    ON [dbo].[po_location_wise_material]([purchase_order_uuid], [is_removed], [order_index]);

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE name = N'IX_co_items_co_removed_order'
    AND object_id = OBJECT_ID(N'dbo.change_order_items_list')
)
  CREATE INDEX [IX_co_items_co_removed_order]
    ON [dbo].[change_order_items_list]([change_order_uuid], [is_removed], [order_index]);

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE name = N'IX_advance_cc_vi_removed'
    AND object_id = OBJECT_ID(N'dbo.advance_payment_cost_codes')
)
  CREATE INDEX [IX_advance_cc_vi_removed]
    ON [dbo].[advance_payment_cost_codes]([vendor_invoice_uuid], [is_removed]);

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. Backfill financial charges / taxes from legacy JSON blobs
-- ═══════════════════════════════════════════════════════════════════════════

-- Purchase orders: financial_breakdown.charges / sales_taxes
INSERT INTO [dbo].[po_financial_charges] (
  [uuid], [corporation_uuid], [purchase_order_uuid], [charge_key],
  [percentage], [amount], [taxable], [created_at], [updated_at]
)
SELECT
  LOWER(CONVERT(NVARCHAR(36), NEWID())),
  p.[corporation_uuid],
  p.[uuid],
  CAST(c.[key] AS NVARCHAR(50)) COLLATE DATABASE_DEFAULT,
  TRY_CONVERT(DECIMAL(18,6), JSON_VALUE(c.[value], '$.percentage')),
  TRY_CONVERT(DECIMAL(18,2), JSON_VALUE(c.[value], '$.amount')),
  CASE WHEN LOWER(JSON_VALUE(c.[value], '$.taxable')) IN (N'true', N'1') THEN 1 ELSE 0 END,
  SYSUTCDATETIME(),
  SYSUTCDATETIME()
FROM [dbo].[purchase_order_forms] p
CROSS APPLY OPENJSON(p.[financial_breakdown], N'$.charges') c
WHERE p.[financial_breakdown] IS NOT NULL
  AND ISJSON(p.[financial_breakdown]) = 1
  AND NOT EXISTS (
    SELECT 1 FROM [dbo].[po_financial_charges] x
    WHERE x.[purchase_order_uuid] = p.[uuid] AND x.[charge_key] = CAST(c.[key] AS NVARCHAR(50)) COLLATE DATABASE_DEFAULT
  );

INSERT INTO [dbo].[po_financial_taxes] (
  [uuid], [corporation_uuid], [purchase_order_uuid], [tax_key],
  [percentage], [amount], [created_at], [updated_at]
)
SELECT
  LOWER(CONVERT(NVARCHAR(36), NEWID())),
  p.[corporation_uuid],
  p.[uuid],
  CAST(t.[key] AS NVARCHAR(50)) COLLATE DATABASE_DEFAULT,
  TRY_CONVERT(DECIMAL(18,6), JSON_VALUE(t.[value], '$.percentage')),
  TRY_CONVERT(DECIMAL(18,2), JSON_VALUE(t.[value], '$.amount')),
  SYSUTCDATETIME(),
  SYSUTCDATETIME()
FROM [dbo].[purchase_order_forms] p
CROSS APPLY OPENJSON(p.[financial_breakdown], N'$.sales_taxes') t
WHERE p.[financial_breakdown] IS NOT NULL
  AND ISJSON(p.[financial_breakdown]) = 1
  AND NOT EXISTS (
    SELECT 1 FROM [dbo].[po_financial_taxes] x
    WHERE x.[purchase_order_uuid] = p.[uuid] AND x.[tax_key] = CAST(t.[key] AS NVARCHAR(50)) COLLATE DATABASE_DEFAULT
  );

-- Change orders
INSERT INTO [dbo].[co_financial_charges] (
  [uuid], [corporation_uuid], [change_order_uuid], [charge_key],
  [percentage], [amount], [taxable], [created_at], [updated_at]
)
SELECT
  LOWER(CONVERT(NVARCHAR(36), NEWID())),
  c.[corporation_uuid],
  c.[uuid],
  CAST(ch.[key] AS NVARCHAR(50)) COLLATE DATABASE_DEFAULT,
  TRY_CONVERT(DECIMAL(18,6), JSON_VALUE(ch.[value], '$.percentage')),
  TRY_CONVERT(DECIMAL(18,2), JSON_VALUE(ch.[value], '$.amount')),
  CASE WHEN LOWER(JSON_VALUE(ch.[value], '$.taxable')) IN (N'true', N'1') THEN 1 ELSE 0 END,
  SYSUTCDATETIME(),
  SYSUTCDATETIME()
FROM [dbo].[change_orders] c
CROSS APPLY OPENJSON(c.[financial_breakdown], N'$.charges') ch
WHERE c.[financial_breakdown] IS NOT NULL
  AND ISJSON(c.[financial_breakdown]) = 1
  AND NOT EXISTS (
    SELECT 1 FROM [dbo].[co_financial_charges] x
    WHERE x.[change_order_uuid] = c.[uuid] AND x.[charge_key] = CAST(ch.[key] AS NVARCHAR(50)) COLLATE DATABASE_DEFAULT
  );

INSERT INTO [dbo].[co_financial_taxes] (
  [uuid], [corporation_uuid], [change_order_uuid], [tax_key],
  [percentage], [amount], [created_at], [updated_at]
)
SELECT
  LOWER(CONVERT(NVARCHAR(36), NEWID())),
  c.[corporation_uuid],
  c.[uuid],
  CAST(t.[key] AS NVARCHAR(50)) COLLATE DATABASE_DEFAULT,
  TRY_CONVERT(DECIMAL(18,6), JSON_VALUE(t.[value], '$.percentage')),
  TRY_CONVERT(DECIMAL(18,2), JSON_VALUE(t.[value], '$.amount')),
  SYSUTCDATETIME(),
  SYSUTCDATETIME()
FROM [dbo].[change_orders] c
CROSS APPLY OPENJSON(c.[financial_breakdown], N'$.sales_taxes') t
WHERE c.[financial_breakdown] IS NOT NULL
  AND ISJSON(c.[financial_breakdown]) = 1
  AND NOT EXISTS (
    SELECT 1 FROM [dbo].[co_financial_taxes] x
    WHERE x.[change_order_uuid] = c.[uuid] AND x.[tax_key] = CAST(t.[key] AS NVARCHAR(50)) COLLATE DATABASE_DEFAULT
  );

-- Vendor invoices
INSERT INTO [dbo].[vi_financial_charges] (
  [uuid], [corporation_uuid], [vendor_invoice_uuid], [charge_key],
  [percentage], [amount], [taxable], [created_at], [updated_at]
)
SELECT
  LOWER(CONVERT(NVARCHAR(36), NEWID())),
  v.[corporation_uuid],
  v.[uuid],
  CAST(c.[key] AS NVARCHAR(50)) COLLATE DATABASE_DEFAULT,
  TRY_CONVERT(DECIMAL(18,6), JSON_VALUE(c.[value], '$.percentage')),
  TRY_CONVERT(DECIMAL(18,2), JSON_VALUE(c.[value], '$.amount')),
  CASE WHEN LOWER(JSON_VALUE(c.[value], '$.taxable')) IN (N'true', N'1') THEN 1 ELSE 0 END,
  SYSUTCDATETIME(),
  SYSUTCDATETIME()
FROM [dbo].[vendor_invoices] v
CROSS APPLY OPENJSON(v.[financial_breakdown], N'$.charges') c
WHERE v.[financial_breakdown] IS NOT NULL
  AND ISJSON(v.[financial_breakdown]) = 1
  AND NOT EXISTS (
    SELECT 1 FROM [dbo].[vi_financial_charges] x
    WHERE x.[vendor_invoice_uuid] = v.[uuid] AND x.[charge_key] = CAST(c.[key] AS NVARCHAR(50)) COLLATE DATABASE_DEFAULT
  );

INSERT INTO [dbo].[vi_financial_taxes] (
  [uuid], [corporation_uuid], [vendor_invoice_uuid], [tax_key],
  [percentage], [amount], [created_at], [updated_at]
)
SELECT
  LOWER(CONVERT(NVARCHAR(36), NEWID())),
  v.[corporation_uuid],
  v.[uuid],
  CAST(t.[key] AS NVARCHAR(50)) COLLATE DATABASE_DEFAULT,
  TRY_CONVERT(DECIMAL(18,6), JSON_VALUE(t.[value], '$.percentage')),
  TRY_CONVERT(DECIMAL(18,2), JSON_VALUE(t.[value], '$.amount')),
  SYSUTCDATETIME(),
  SYSUTCDATETIME()
FROM [dbo].[vendor_invoices] v
CROSS APPLY OPENJSON(v.[financial_breakdown], N'$.sales_taxes') t
WHERE v.[financial_breakdown] IS NOT NULL
  AND ISJSON(v.[financial_breakdown]) = 1
  AND NOT EXISTS (
    SELECT 1 FROM [dbo].[vi_financial_taxes] x
    WHERE x.[vendor_invoice_uuid] = v.[uuid] AND x.[tax_key] = CAST(t.[key] AS NVARCHAR(50)) COLLATE DATABASE_DEFAULT
  );

-- GRN: metadata.financial_breakdown.charges / sales_taxes (when present)
INSERT INTO [dbo].[grn_financial_charges] (
  [uuid], [corporation_uuid], [receipt_note_uuid], [charge_key],
  [percentage], [amount], [taxable], [created_at], [updated_at]
)
SELECT
  LOWER(CONVERT(NVARCHAR(36), NEWID())),
  r.[corporation_uuid],
  r.[uuid],
  CAST(c.[key] AS NVARCHAR(50)) COLLATE DATABASE_DEFAULT,
  TRY_CONVERT(DECIMAL(18,6), JSON_VALUE(c.[value], '$.percentage')),
  TRY_CONVERT(DECIMAL(18,2), JSON_VALUE(c.[value], '$.amount')),
  CASE WHEN LOWER(JSON_VALUE(c.[value], '$.taxable')) IN (N'true', N'1') THEN 1 ELSE 0 END,
  SYSUTCDATETIME(),
  SYSUTCDATETIME()
FROM [dbo].[stock_receipt_notes] r
CROSS APPLY OPENJSON(r.[metadata], N'$.financial_breakdown.charges') c
WHERE r.[metadata] IS NOT NULL
  AND ISJSON(r.[metadata]) = 1
  AND NOT EXISTS (
    SELECT 1 FROM [dbo].[grn_financial_charges] x
    WHERE x.[receipt_note_uuid] = r.[uuid] AND x.[charge_key] = CAST(c.[key] AS NVARCHAR(50)) COLLATE DATABASE_DEFAULT
  );

INSERT INTO [dbo].[grn_financial_taxes] (
  [uuid], [corporation_uuid], [receipt_note_uuid], [tax_key],
  [percentage], [amount], [created_at], [updated_at]
)
SELECT
  LOWER(CONVERT(NVARCHAR(36), NEWID())),
  r.[corporation_uuid],
  r.[uuid],
  CAST(t.[key] AS NVARCHAR(50)) COLLATE DATABASE_DEFAULT,
  TRY_CONVERT(DECIMAL(18,6), JSON_VALUE(t.[value], '$.percentage')),
  TRY_CONVERT(DECIMAL(18,2), JSON_VALUE(t.[value], '$.amount')),
  SYSUTCDATETIME(),
  SYSUTCDATETIME()
FROM [dbo].[stock_receipt_notes] r
CROSS APPLY OPENJSON(r.[metadata], N'$.financial_breakdown.sales_taxes') t
WHERE r.[metadata] IS NOT NULL
  AND ISJSON(r.[metadata]) = 1
  AND NOT EXISTS (
    SELECT 1 FROM [dbo].[grn_financial_taxes] x
    WHERE x.[receipt_note_uuid] = r.[uuid] AND x.[tax_key] = CAST(t.[key] AS NVARCHAR(50)) COLLATE DATABASE_DEFAULT
  );

-- Stock return notes: same metadata path pattern
INSERT INTO [dbo].[return_financial_charges] (
  [uuid], [corporation_uuid], [return_note_uuid], [charge_key],
  [percentage], [amount], [taxable], [created_at], [updated_at]
)
SELECT
  LOWER(CONVERT(NVARCHAR(36), NEWID())),
  r.[corporation_uuid],
  r.[uuid],
  CAST(c.[key] AS NVARCHAR(50)) COLLATE DATABASE_DEFAULT,
  TRY_CONVERT(DECIMAL(18,6), JSON_VALUE(c.[value], '$.percentage')),
  TRY_CONVERT(DECIMAL(18,2), JSON_VALUE(c.[value], '$.amount')),
  CASE WHEN LOWER(JSON_VALUE(c.[value], '$.taxable')) IN (N'true', N'1') THEN 1 ELSE 0 END,
  SYSUTCDATETIME(),
  SYSUTCDATETIME()
FROM [dbo].[stock_return_notes] r
CROSS APPLY OPENJSON(r.[metadata], N'$.financial_breakdown.charges') c
WHERE r.[metadata] IS NOT NULL
  AND ISJSON(r.[metadata]) = 1
  AND NOT EXISTS (
    SELECT 1 FROM [dbo].[return_financial_charges] x
    WHERE x.[return_note_uuid] = r.[uuid] AND x.[charge_key] = CAST(c.[key] AS NVARCHAR(50)) COLLATE DATABASE_DEFAULT
  );

INSERT INTO [dbo].[return_financial_taxes] (
  [uuid], [corporation_uuid], [return_note_uuid], [tax_key],
  [percentage], [amount], [created_at], [updated_at]
)
SELECT
  LOWER(CONVERT(NVARCHAR(36), NEWID())),
  r.[corporation_uuid],
  r.[uuid],
  CAST(t.[key] AS NVARCHAR(50)) COLLATE DATABASE_DEFAULT,
  TRY_CONVERT(DECIMAL(18,6), JSON_VALUE(t.[value], '$.percentage')),
  TRY_CONVERT(DECIMAL(18,2), JSON_VALUE(t.[value], '$.amount')),
  SYSUTCDATETIME(),
  SYSUTCDATETIME()
FROM [dbo].[stock_return_notes] r
CROSS APPLY OPENJSON(r.[metadata], N'$.financial_breakdown.sales_taxes') t
WHERE r.[metadata] IS NOT NULL
  AND ISJSON(r.[metadata]) = 1
  AND NOT EXISTS (
    SELECT 1 FROM [dbo].[return_financial_taxes] x
    WHERE x.[return_note_uuid] = r.[uuid] AND x.[tax_key] = CAST(t.[key] AS NVARCHAR(50)) COLLATE DATABASE_DEFAULT
  );
