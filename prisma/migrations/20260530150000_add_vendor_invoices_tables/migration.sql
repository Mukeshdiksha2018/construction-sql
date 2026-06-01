-- Vendor invoices and child tables (MSSQL)

CREATE TABLE [dbo].[vendor_invoices] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] NVARCHAR(36) NOT NULL CONSTRAINT [vendor_invoices_uuid_df] DEFAULT LOWER(CONVERT(NVARCHAR(36),NEWID())),
    [corporation_uuid] NVARCHAR(36) NOT NULL,
    [project_uuid] NVARCHAR(36),
    [vendor_uuid] NVARCHAR(36),
    [purchase_order_uuid] NVARCHAR(36),
    [change_order_uuid] NVARCHAR(36),
    [invoice_type] NVARCHAR(50) NOT NULL,
    [number] NVARCHAR(100),
    [bill_date] DATETIME2 NOT NULL,
    [due_date] DATETIME2,
    [credit_days] NVARCHAR(50),
    [credit_days_id] NVARCHAR(100),
    [amount] DECIMAL(18,2) NOT NULL CONSTRAINT [vendor_invoices_amount_df] DEFAULT 0,
    [holdback] DECIMAL(5,2),
    [financial_breakdown] NVARCHAR(MAX),
    [attachments] NVARCHAR(MAX),
    [status] NVARCHAR(50) NOT NULL CONSTRAINT [vendor_invoices_status_df] DEFAULT 'Draft',
    [is_active] BIT NOT NULL CONSTRAINT [vendor_invoices_is_active_df] DEFAULT 1,
    [adjusted_against_vendor_invoice_uuid] NVARCHAR(36),
    [adjusted_advance_payment_uuid] NVARCHAR(36),
    [removed_advance_payment_cost_codes] NVARCHAR(MAX),
    [holdback_fully_paid] BIT,
    [nimble_jeid] NVARCHAR(100),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [vendor_invoices_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [vendor_invoices_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [vendor_invoices_uuid_key] UNIQUE NONCLUSTERED ([uuid])
);

CREATE INDEX [vendor_invoices_corporation_uuid_idx] ON [dbo].[vendor_invoices]([corporation_uuid]);
CREATE INDEX [vendor_invoices_project_uuid_idx] ON [dbo].[vendor_invoices]([project_uuid]);
CREATE INDEX [vendor_invoices_vendor_uuid_idx] ON [dbo].[vendor_invoices]([vendor_uuid]);
CREATE INDEX [vendor_invoices_purchase_order_uuid_idx] ON [dbo].[vendor_invoices]([purchase_order_uuid]);
CREATE INDEX [vendor_invoices_change_order_uuid_idx] ON [dbo].[vendor_invoices]([change_order_uuid]);
CREATE INDEX [vendor_invoices_invoice_type_idx] ON [dbo].[vendor_invoices]([invoice_type]);
CREATE INDEX [vendor_invoices_bill_date_idx] ON [dbo].[vendor_invoices]([bill_date]);
CREATE INDEX [vendor_invoices_is_active_idx] ON [dbo].[vendor_invoices]([is_active]);
CREATE INDEX [vendor_invoices_created_at_idx] ON [dbo].[vendor_invoices]([created_at] DESC);

ALTER TABLE [dbo].[vendor_invoices] ADD CONSTRAINT [vendor_invoices_purchase_order_uuid_fkey] FOREIGN KEY ([purchase_order_uuid]) REFERENCES [dbo].[purchase_order_forms]([uuid]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[vendor_invoices] ADD CONSTRAINT [vendor_invoices_change_order_uuid_fkey] FOREIGN KEY ([change_order_uuid]) REFERENCES [dbo].[change_orders]([uuid]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[vendor_invoices] ADD CONSTRAINT [vendor_invoices_adjusted_against_fkey] FOREIGN KEY ([adjusted_against_vendor_invoice_uuid]) REFERENCES [dbo].[vendor_invoices]([uuid]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[vendor_invoices] ADD CONSTRAINT [vendor_invoices_adjusted_advance_fkey] FOREIGN KEY ([adjusted_advance_payment_uuid]) REFERENCES [dbo].[vendor_invoices]([uuid]) ON DELETE NO ACTION ON UPDATE NO ACTION;

CREATE TABLE [dbo].[direct_vendor_invoice_line_items] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] NVARCHAR(36) NOT NULL CONSTRAINT [dvi_line_items_uuid_df] DEFAULT LOWER(CONVERT(NVARCHAR(36),NEWID())),
    [corporation_uuid] NVARCHAR(36) NOT NULL,
    [project_uuid] NVARCHAR(36),
    [vendor_invoice_uuid] NVARCHAR(36) NOT NULL,
    [order_index] INT NOT NULL CONSTRAINT [dvi_line_items_order_index_df] DEFAULT 0,
    [cost_code_uuid] NVARCHAR(36),
    [cost_code_label] NVARCHAR(255),
    [cost_code_number] NVARCHAR(100),
    [cost_code_name] NVARCHAR(255),
    [division_name] NVARCHAR(255),
    [sequence_uuid] NVARCHAR(36),
    [item_uuid] NVARCHAR(36),
    [item_name] NVARCHAR(500),
    [description] NVARCHAR(MAX),
    [unit_price] DECIMAL(18,2),
    [quantity] DECIMAL(18,4),
    [total] DECIMAL(18,2),
    [uom] NVARCHAR(100),
    [unit_label] NVARCHAR(100),
    [unit_uuid] NVARCHAR(36),
    [metadata] NVARCHAR(MAX),
    [is_active] BIT NOT NULL CONSTRAINT [dvi_line_items_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [dvi_line_items_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [dvi_line_items_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [dvi_line_items_uuid_key] UNIQUE NONCLUSTERED ([uuid])
);
CREATE INDEX [dvi_line_items_vendor_invoice_uuid_idx] ON [dbo].[direct_vendor_invoice_line_items]([vendor_invoice_uuid]);
ALTER TABLE [dbo].[direct_vendor_invoice_line_items] ADD CONSTRAINT [dvi_line_items_vendor_invoice_fkey] FOREIGN KEY ([vendor_invoice_uuid]) REFERENCES [dbo].[vendor_invoices]([uuid]) ON DELETE CASCADE ON UPDATE NO ACTION;

CREATE TABLE [dbo].[purchase_order_invoice_items_list] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] NVARCHAR(36) NOT NULL CONSTRAINT [po_inv_items_uuid_df] DEFAULT LOWER(CONVERT(NVARCHAR(36),NEWID())),
    [corporation_uuid] NVARCHAR(36),
    [project_uuid] NVARCHAR(36),
    [purchase_order_uuid] NVARCHAR(36),
    [vendor_invoice_uuid] NVARCHAR(36) NOT NULL,
    [order_index] INT NOT NULL CONSTRAINT [po_inv_items_order_index_df] DEFAULT 0,
    [po_item_uuid] NVARCHAR(36),
    [cost_code_uuid] NVARCHAR(36),
    [cost_code_label] NVARCHAR(255),
    [cost_code_number] NVARCHAR(100),
    [cost_code_name] NVARCHAR(255),
    [division_name] NVARCHAR(255),
    [item_type_uuid] NVARCHAR(36),
    [item_type_label] NVARCHAR(255),
    [item_uuid] NVARCHAR(36),
    [item_name] NVARCHAR(500),
    [description] NVARCHAR(MAX),
    [model_number] NVARCHAR(255),
    [location_uuid] NVARCHAR(36),
    [location_label] NVARCHAR(255),
    [unit_uuid] NVARCHAR(36),
    [unit_label] NVARCHAR(100),
    [invoice_quantity] DECIMAL(18,4),
    [invoice_unit_price] DECIMAL(18,4),
    [invoice_total] DECIMAL(18,2),
    [metadata] NVARCHAR(MAX),
    [is_active] BIT NOT NULL CONSTRAINT [po_inv_items_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [po_inv_items_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [po_inv_items_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [po_inv_items_uuid_key] UNIQUE NONCLUSTERED ([uuid])
);
CREATE INDEX [po_inv_items_vendor_invoice_uuid_idx] ON [dbo].[purchase_order_invoice_items_list]([vendor_invoice_uuid]);
CREATE INDEX [po_inv_items_purchase_order_uuid_idx] ON [dbo].[purchase_order_invoice_items_list]([purchase_order_uuid]);
ALTER TABLE [dbo].[purchase_order_invoice_items_list] ADD CONSTRAINT [po_inv_items_vendor_invoice_fkey] FOREIGN KEY ([vendor_invoice_uuid]) REFERENCES [dbo].[vendor_invoices]([uuid]) ON DELETE CASCADE ON UPDATE NO ACTION;

CREATE TABLE [dbo].[change_order_invoice_items_list] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] NVARCHAR(36) NOT NULL CONSTRAINT [co_inv_items_uuid_df] DEFAULT LOWER(CONVERT(NVARCHAR(36),NEWID())),
    [corporation_uuid] NVARCHAR(36),
    [project_uuid] NVARCHAR(36),
    [change_order_uuid] NVARCHAR(36),
    [vendor_invoice_uuid] NVARCHAR(36) NOT NULL,
    [order_index] INT NOT NULL CONSTRAINT [co_inv_items_order_index_df] DEFAULT 0,
    [co_item_uuid] NVARCHAR(36),
    [cost_code_uuid] NVARCHAR(36),
    [cost_code_label] NVARCHAR(255),
    [cost_code_number] NVARCHAR(100),
    [cost_code_name] NVARCHAR(255),
    [division_name] NVARCHAR(255),
    [item_type_uuid] NVARCHAR(36),
    [item_type_label] NVARCHAR(255),
    [item_uuid] NVARCHAR(36),
    [item_name] NVARCHAR(500),
    [description] NVARCHAR(MAX),
    [model_number] NVARCHAR(255),
    [location_uuid] NVARCHAR(36),
    [location_label] NVARCHAR(255),
    [unit_uuid] NVARCHAR(36),
    [unit_label] NVARCHAR(100),
    [invoice_quantity] DECIMAL(18,4),
    [invoice_unit_price] DECIMAL(18,4),
    [invoice_total] DECIMAL(18,2),
    [metadata] NVARCHAR(MAX),
    [is_active] BIT NOT NULL CONSTRAINT [co_inv_items_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [co_inv_items_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [co_inv_items_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [co_inv_items_uuid_key] UNIQUE NONCLUSTERED ([uuid])
);
CREATE INDEX [co_inv_items_vendor_invoice_uuid_idx] ON [dbo].[change_order_invoice_items_list]([vendor_invoice_uuid]);
CREATE INDEX [co_inv_items_change_order_uuid_idx] ON [dbo].[change_order_invoice_items_list]([change_order_uuid]);
ALTER TABLE [dbo].[change_order_invoice_items_list] ADD CONSTRAINT [co_inv_items_vendor_invoice_fkey] FOREIGN KEY ([vendor_invoice_uuid]) REFERENCES [dbo].[vendor_invoices]([uuid]) ON DELETE CASCADE ON UPDATE NO ACTION;

CREATE TABLE [dbo].[po_lwm_invoice_items] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] NVARCHAR(36) NOT NULL CONSTRAINT [po_lwm_inv_uuid_df] DEFAULT LOWER(CONVERT(NVARCHAR(36),NEWID())),
    [corporation_uuid] NVARCHAR(36),
    [project_uuid] NVARCHAR(36),
    [purchase_order_uuid] NVARCHAR(36),
    [vendor_invoice_uuid] NVARCHAR(36) NOT NULL,
    [order_index] INT NOT NULL CONSTRAINT [po_lwm_inv_order_index_df] DEFAULT 0,
    [po_lwm_uuid] NVARCHAR(36),
    [cost_code_uuid] NVARCHAR(36),
    [cost_code_number] NVARCHAR(100),
    [cost_code_name] NVARCHAR(255),
    [cost_code_label] NVARCHAR(255),
    [division_name] NVARCHAR(255),
    [location_uuid] NVARCHAR(36),
    [location_label] NVARCHAR(255),
    [material_budgeted_amount] DECIMAL(18,2),
    [po_amount] DECIMAL(18,2),
    [invoice_amount] DECIMAL(18,2),
    [description] NVARCHAR(MAX),
    [metadata] NVARCHAR(MAX),
    [is_active] BIT NOT NULL CONSTRAINT [po_lwm_inv_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [po_lwm_inv_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [po_lwm_inv_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [po_lwm_inv_uuid_key] UNIQUE NONCLUSTERED ([uuid])
);
CREATE INDEX [po_lwm_inv_vendor_invoice_uuid_idx] ON [dbo].[po_lwm_invoice_items]([vendor_invoice_uuid]);
ALTER TABLE [dbo].[po_lwm_invoice_items] ADD CONSTRAINT [po_lwm_inv_vendor_invoice_fkey] FOREIGN KEY ([vendor_invoice_uuid]) REFERENCES [dbo].[vendor_invoices]([uuid]) ON DELETE CASCADE ON UPDATE NO ACTION;

CREATE TABLE [dbo].[co_lwm_invoice_items] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] NVARCHAR(36) NOT NULL CONSTRAINT [co_lwm_inv_uuid_df] DEFAULT LOWER(CONVERT(NVARCHAR(36),NEWID())),
    [corporation_uuid] NVARCHAR(36),
    [project_uuid] NVARCHAR(36),
    [change_order_uuid] NVARCHAR(36),
    [purchase_order_uuid] NVARCHAR(36),
    [vendor_invoice_uuid] NVARCHAR(36) NOT NULL,
    [order_index] INT NOT NULL CONSTRAINT [co_lwm_inv_order_index_df] DEFAULT 0,
    [co_lwm_uuid] NVARCHAR(36),
    [cost_code_uuid] NVARCHAR(36),
    [cost_code_number] NVARCHAR(100),
    [cost_code_name] NVARCHAR(255),
    [cost_code_label] NVARCHAR(255),
    [division_name] NVARCHAR(255),
    [location_uuid] NVARCHAR(36),
    [location_label] NVARCHAR(255),
    [material_budgeted_amount] DECIMAL(18,2),
    [co_amount] DECIMAL(18,2),
    [invoice_amount] DECIMAL(18,2),
    [description] NVARCHAR(MAX),
    [metadata] NVARCHAR(MAX),
    [is_active] BIT NOT NULL CONSTRAINT [co_lwm_inv_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [co_lwm_inv_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [co_lwm_inv_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [co_lwm_inv_uuid_key] UNIQUE NONCLUSTERED ([uuid])
);
CREATE INDEX [co_lwm_inv_vendor_invoice_uuid_idx] ON [dbo].[co_lwm_invoice_items]([vendor_invoice_uuid]);
ALTER TABLE [dbo].[co_lwm_invoice_items] ADD CONSTRAINT [co_lwm_inv_vendor_invoice_fkey] FOREIGN KEY ([vendor_invoice_uuid]) REFERENCES [dbo].[vendor_invoices]([uuid]) ON DELETE CASCADE ON UPDATE NO ACTION;

CREATE TABLE [dbo].[labor_invoice_items_list] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] NVARCHAR(36) NOT NULL CONSTRAINT [labor_inv_items_uuid_df] DEFAULT LOWER(CONVERT(NVARCHAR(36),NEWID())),
    [corporation_uuid] NVARCHAR(36) NOT NULL,
    [project_uuid] NVARCHAR(36),
    [vendor_invoice_uuid] NVARCHAR(36) NOT NULL,
    [purchase_order_uuid] NVARCHAR(36),
    [change_order_uuid] NVARCHAR(36),
    [order_index] INT NOT NULL CONSTRAINT [labor_inv_items_order_index_df] DEFAULT 0,
    [labor_po_item_uuid] NVARCHAR(36),
    [labor_co_item_uuid] NVARCHAR(36),
    [cost_code_uuid] NVARCHAR(36),
    [cost_code_label] NVARCHAR(255),
    [cost_code_number] NVARCHAR(100),
    [cost_code_name] NVARCHAR(255),
    [division_name] NVARCHAR(255),
    [invoice_amount] DECIMAL(18,2),
    [approval_checks] NVARCHAR(MAX),
    [metadata] NVARCHAR(MAX),
    [is_active] BIT NOT NULL CONSTRAINT [labor_inv_items_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [labor_inv_items_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [labor_inv_items_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [labor_inv_items_uuid_key] UNIQUE NONCLUSTERED ([uuid])
);
CREATE INDEX [labor_inv_items_vendor_invoice_uuid_idx] ON [dbo].[labor_invoice_items_list]([vendor_invoice_uuid]);
ALTER TABLE [dbo].[labor_invoice_items_list] ADD CONSTRAINT [labor_inv_items_vendor_invoice_fkey] FOREIGN KEY ([vendor_invoice_uuid]) REFERENCES [dbo].[vendor_invoices]([uuid]) ON DELETE CASCADE ON UPDATE NO ACTION;

CREATE TABLE [dbo].[advance_payment_cost_codes] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] NVARCHAR(36) NOT NULL CONSTRAINT [apcc_uuid_df] DEFAULT LOWER(CONVERT(NVARCHAR(36),NEWID())),
    [vendor_invoice_uuid] NVARCHAR(36) NOT NULL,
    [corporation_uuid] NVARCHAR(36) NOT NULL,
    [project_uuid] NVARCHAR(36),
    [vendor_uuid] NVARCHAR(36),
    [purchase_order_uuid] NVARCHAR(36),
    [change_order_uuid] NVARCHAR(36),
    [cost_code_uuid] NVARCHAR(36),
    [gl_account_uuid] NVARCHAR(36),
    [cost_code_label] NVARCHAR(255),
    [cost_code_number] NVARCHAR(100),
    [cost_code_name] NVARCHAR(255),
    [total_amount] DECIMAL(18,2),
    [advance_amount] DECIMAL(18,2) NOT NULL CONSTRAINT [apcc_advance_amount_df] DEFAULT 0,
    [metadata] NVARCHAR(MAX),
    [is_active] BIT NOT NULL CONSTRAINT [apcc_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [apcc_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [apcc_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [apcc_uuid_key] UNIQUE NONCLUSTERED ([uuid])
);
CREATE INDEX [apcc_vendor_invoice_uuid_idx] ON [dbo].[advance_payment_cost_codes]([vendor_invoice_uuid]);
ALTER TABLE [dbo].[advance_payment_cost_codes] ADD CONSTRAINT [apcc_vendor_invoice_fkey] FOREIGN KEY ([vendor_invoice_uuid]) REFERENCES [dbo].[vendor_invoices]([uuid]) ON DELETE CASCADE ON UPDATE NO ACTION;

CREATE TABLE [dbo].[holdback_cost_codes] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] NVARCHAR(36) NOT NULL CONSTRAINT [hcc_uuid_df] DEFAULT LOWER(CONVERT(NVARCHAR(36),NEWID())),
    [vendor_invoice_uuid] NVARCHAR(36) NOT NULL,
    [corporation_uuid] NVARCHAR(36),
    [project_uuid] NVARCHAR(36),
    [vendor_uuid] NVARCHAR(36),
    [purchase_order_uuid] NVARCHAR(36),
    [change_order_uuid] NVARCHAR(36),
    [holdback_invoice_uuid] NVARCHAR(36),
    [cost_code_uuid] NVARCHAR(36),
    [gl_account_uuid] NVARCHAR(36),
    [cost_code_label] NVARCHAR(255),
    [cost_code_number] NVARCHAR(100),
    [cost_code_name] NVARCHAR(255),
    [total_amount] DECIMAL(18,2),
    [retainage_amount] DECIMAL(18,2),
    [release_amount] DECIMAL(18,2),
    [metadata] NVARCHAR(MAX),
    [is_active] BIT NOT NULL CONSTRAINT [hcc_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [hcc_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [hcc_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [hcc_uuid_key] UNIQUE NONCLUSTERED ([uuid])
);
CREATE INDEX [hcc_vendor_invoice_uuid_idx] ON [dbo].[holdback_cost_codes]([vendor_invoice_uuid]);
ALTER TABLE [dbo].[holdback_cost_codes] ADD CONSTRAINT [hcc_vendor_invoice_fkey] FOREIGN KEY ([vendor_invoice_uuid]) REFERENCES [dbo].[vendor_invoices]([uuid]) ON DELETE CASCADE ON UPDATE NO ACTION;

CREATE TABLE [dbo].[adjusted_advance_payment_cost_codes] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] NVARCHAR(36) NOT NULL CONSTRAINT [aapcc_uuid_df] DEFAULT LOWER(CONVERT(NVARCHAR(36),NEWID())),
    [vendor_invoice_uuid] NVARCHAR(36) NOT NULL,
    [advance_payment_uuid] NVARCHAR(36) NOT NULL,
    [corporation_uuid] NVARCHAR(36),
    [project_uuid] NVARCHAR(36),
    [purchase_order_uuid] NVARCHAR(36),
    [change_order_uuid] NVARCHAR(36),
    [cost_code_uuid] NVARCHAR(36),
    [cost_code_label] NVARCHAR(255),
    [cost_code_number] NVARCHAR(100),
    [cost_code_name] NVARCHAR(255),
    [adjusted_amount] DECIMAL(18,2) NOT NULL CONSTRAINT [aapcc_adjusted_amount_df] DEFAULT 0,
    [metadata] NVARCHAR(MAX),
    [is_active] BIT NOT NULL CONSTRAINT [aapcc_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [aapcc_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [aapcc_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [aapcc_uuid_key] UNIQUE NONCLUSTERED ([uuid])
);
CREATE INDEX [aapcc_vendor_invoice_uuid_idx] ON [dbo].[adjusted_advance_payment_cost_codes]([vendor_invoice_uuid]);
ALTER TABLE [dbo].[adjusted_advance_payment_cost_codes] ADD CONSTRAINT [aapcc_vendor_invoice_fkey] FOREIGN KEY ([vendor_invoice_uuid]) REFERENCES [dbo].[vendor_invoices]([uuid]) ON DELETE CASCADE ON UPDATE NO ACTION;

CREATE TABLE [dbo].[vendor_invoice_holdback_coa_breakdown] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] NVARCHAR(36) NOT NULL CONSTRAINT [vihcb_uuid_df] DEFAULT LOWER(CONVERT(NVARCHAR(36),NEWID())),
    [corporation_uuid] NVARCHAR(36),
    [project_uuid] NVARCHAR(36),
    [vendor_uuid] NVARCHAR(36),
    [vendor_invoice_uuid] NVARCHAR(36) NOT NULL,
    [purchase_order_uuid] NVARCHAR(36),
    [change_order_uuid] NVARCHAR(36),
    [cost_code_uuid] NVARCHAR(36),
    [cost_code_label] NVARCHAR(255),
    [cost_code_number] NVARCHAR(100),
    [cost_code_name] NVARCHAR(255),
    [gl_account_uuid] NVARCHAR(36),
    [holdback_amount] DECIMAL(18,2),
    [sort_order] INT NOT NULL CONSTRAINT [vihcb_sort_order_df] DEFAULT 0,
    [metadata] NVARCHAR(MAX),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [vihcb_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [vihcb_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [vihcb_uuid_key] UNIQUE NONCLUSTERED ([uuid])
);
CREATE INDEX [vihcb_vendor_invoice_uuid_idx] ON [dbo].[vendor_invoice_holdback_coa_breakdown]([vendor_invoice_uuid]);
ALTER TABLE [dbo].[vendor_invoice_holdback_coa_breakdown] ADD CONSTRAINT [vihcb_vendor_invoice_fkey] FOREIGN KEY ([vendor_invoice_uuid]) REFERENCES [dbo].[vendor_invoices]([uuid]) ON DELETE CASCADE ON UPDATE NO ACTION;

CREATE TABLE [dbo].[vendor_invoice_coa_assignments] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] NVARCHAR(36) NOT NULL CONSTRAINT [vica_uuid_df] DEFAULT LOWER(CONVERT(NVARCHAR(36),NEWID())),
    [corporation_uuid] NVARCHAR(36) NOT NULL,
    [vendor_invoice_uuid] NVARCHAR(36) NOT NULL,
    [gl_account_uuid] NVARCHAR(36),
    [segment] NVARCHAR(255) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [vica_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [vica_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [vica_uuid_key] UNIQUE NONCLUSTERED ([uuid]),
    CONSTRAINT [vica_vendor_invoice_segment_key] UNIQUE NONCLUSTERED ([vendor_invoice_uuid], [segment])
);
CREATE INDEX [vica_vendor_invoice_uuid_idx] ON [dbo].[vendor_invoice_coa_assignments]([vendor_invoice_uuid]);
ALTER TABLE [dbo].[vendor_invoice_coa_assignments] ADD CONSTRAINT [vica_vendor_invoice_fkey] FOREIGN KEY ([vendor_invoice_uuid]) REFERENCES [dbo].[vendor_invoices]([uuid]) ON DELETE CASCADE ON UPDATE NO ACTION;
