-- CreateTable: purchase_order_forms
CREATE TABLE [dbo].[purchase_order_forms] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] NVARCHAR(36) NOT NULL CONSTRAINT [purchase_order_forms_uuid_df] DEFAULT LOWER(CONVERT(NVARCHAR(36),NEWID())),
    [corporation_uuid] NVARCHAR(36) NOT NULL,
    [project_uuid] NVARCHAR(36),
    [po_number] NVARCHAR(100),
    [entry_date] DATETIME2,
    [po_type] NVARCHAR(20),
    [credit_days] NVARCHAR(100),
    [credit_days_id] NVARCHAR(100),
    [ship_via] NVARCHAR(255),
    [freight] NVARCHAR(255),
    [shipping_instructions] NVARCHAR(MAX),
    [estimated_delivery_date] DATETIME2,
    [include_items] NVARCHAR(MAX),
    [quote_reference] NVARCHAR(255),
    [terms_and_conditions] NVARCHAR(MAX),
    [item_total] DECIMAL(18,2),
    [charges_total] DECIMAL(18,2),
    [tax_total] DECIMAL(18,2),
    [total_po_amount] DECIMAL(18,2),
    [vendor_uuid] NVARCHAR(36),
    [billing_address_uuid] NVARCHAR(36),
    [shipping_address_uuid] NVARCHAR(36),
    [status] NVARCHAR(50) NOT NULL CONSTRAINT [purchase_order_forms_status_df] DEFAULT 'Draft',
    [financial_breakdown] NVARCHAR(MAX),
    [attachments] NVARCHAR(MAX),
    [removed_po_items] NVARCHAR(MAX),
    [audit_log] NVARCHAR(MAX),
    [prepared_by] NVARCHAR(255),
    [approved_by] NVARCHAR(255),
    [approved_at] DATETIME2,
    [print_include_approved_by_vendor] BIT,
    [print_use_entity_name] BIT,
    [special_instruction_uuid] NVARCHAR(36),
    [is_active] BIT NOT NULL CONSTRAINT [purchase_order_forms_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [purchase_order_forms_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [purchase_order_forms_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [purchase_order_forms_uuid_key] UNIQUE NONCLUSTERED ([uuid])
);

CREATE INDEX [purchase_order_forms_corporation_uuid_idx] ON [dbo].[purchase_order_forms]([corporation_uuid]);
CREATE INDEX [purchase_order_forms_project_uuid_idx] ON [dbo].[purchase_order_forms]([project_uuid]);
CREATE INDEX [purchase_order_forms_vendor_uuid_idx] ON [dbo].[purchase_order_forms]([vendor_uuid]);
CREATE INDEX [purchase_order_forms_status_idx] ON [dbo].[purchase_order_forms]([status]);
CREATE INDEX [purchase_order_forms_is_active_idx] ON [dbo].[purchase_order_forms]([is_active]);
CREATE INDEX [purchase_order_forms_entry_date_idx] ON [dbo].[purchase_order_forms]([entry_date] DESC);

-- CreateTable: purchase_order_items_list
CREATE TABLE [dbo].[purchase_order_items_list] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] NVARCHAR(36) NOT NULL CONSTRAINT [po_items_uuid_df] DEFAULT LOWER(CONVERT(NVARCHAR(36),NEWID())),
    [corporation_uuid] NVARCHAR(36),
    [project_uuid] NVARCHAR(36),
    [purchase_order_uuid] NVARCHAR(36) NOT NULL,
    [order_index] INT NOT NULL CONSTRAINT [po_items_order_index_df] DEFAULT 0,
    [source] NVARCHAR(100),
    [cost_code_uuid] NVARCHAR(36),
    [cost_code_label] NVARCHAR(255),
    [cost_code_number] NVARCHAR(100),
    [cost_code_name] NVARCHAR(255),
    [division_name] NVARCHAR(255),
    [category] NVARCHAR(100),
    [item_division_uuid] NVARCHAR(36),
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
    [quantity] DECIMAL(18,4),
    [unit_price] DECIMAL(18,4),
    [po_quantity] DECIMAL(18,4),
    [po_unit_price] DECIMAL(18,4),
    [po_total] DECIMAL(18,2),
    [total] DECIMAL(18,2),
    [approval_checks_uuids] NVARCHAR(MAX),
    [configuration_name] NVARCHAR(255),
    [metadata] NVARCHAR(MAX),
    [is_active] BIT NOT NULL CONSTRAINT [po_items_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [po_items_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [po_items_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [po_items_uuid_key] UNIQUE NONCLUSTERED ([uuid]),
    CONSTRAINT [po_items_po_fk] FOREIGN KEY ([purchase_order_uuid]) REFERENCES [dbo].[purchase_order_forms]([uuid]) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX [po_items_purchase_order_uuid_idx] ON [dbo].[purchase_order_items_list]([purchase_order_uuid]);
CREATE INDEX [po_items_corporation_uuid_idx] ON [dbo].[purchase_order_items_list]([corporation_uuid]);
CREATE INDEX [po_items_project_uuid_idx] ON [dbo].[purchase_order_items_list]([project_uuid]);

-- CreateTable: labor_purchase_order_items_list
CREATE TABLE [dbo].[labor_purchase_order_items_list] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] NVARCHAR(36) NOT NULL CONSTRAINT [labor_po_items_uuid_df] DEFAULT LOWER(CONVERT(NVARCHAR(36),NEWID())),
    [corporation_uuid] NVARCHAR(36),
    [project_uuid] NVARCHAR(36),
    [purchase_order_uuid] NVARCHAR(36) NOT NULL,
    [order_index] INT NOT NULL CONSTRAINT [labor_po_items_order_index_df] DEFAULT 0,
    [cost_code_uuid] NVARCHAR(36),
    [cost_code_label] NVARCHAR(255),
    [cost_code_number] NVARCHAR(100),
    [cost_code_name] NVARCHAR(255),
    [division_name] NVARCHAR(255),
    [location_uuid] NVARCHAR(36),
    [location_label] NVARCHAR(255),
    [labor_budgeted_amount] DECIMAL(18,2),
    [po_amount] DECIMAL(18,2) NOT NULL CONSTRAINT [labor_po_items_po_amount_df] DEFAULT 0,
    [description] NVARCHAR(MAX),
    [metadata] NVARCHAR(MAX),
    [is_active] BIT NOT NULL CONSTRAINT [labor_po_items_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [labor_po_items_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [labor_po_items_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [labor_po_items_uuid_key] UNIQUE NONCLUSTERED ([uuid]),
    CONSTRAINT [labor_po_items_po_fk] FOREIGN KEY ([purchase_order_uuid]) REFERENCES [dbo].[purchase_order_forms]([uuid]) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX [labor_po_items_purchase_order_uuid_idx] ON [dbo].[labor_purchase_order_items_list]([purchase_order_uuid]);
CREATE INDEX [labor_po_items_corporation_uuid_idx] ON [dbo].[labor_purchase_order_items_list]([corporation_uuid]);

-- CreateTable: po_location_wise_material
CREATE TABLE [dbo].[po_location_wise_material] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] NVARCHAR(36) NOT NULL CONSTRAINT [po_lw_mat_uuid_df] DEFAULT LOWER(CONVERT(NVARCHAR(36),NEWID())),
    [corporation_uuid] NVARCHAR(36),
    [project_uuid] NVARCHAR(36),
    [purchase_order_uuid] NVARCHAR(36) NOT NULL,
    [order_index] INT NOT NULL CONSTRAINT [po_lw_mat_order_index_df] DEFAULT 0,
    [cost_code_uuid] NVARCHAR(36),
    [cost_code_label] NVARCHAR(255),
    [cost_code_number] NVARCHAR(100),
    [cost_code_name] NVARCHAR(255),
    [division_name] NVARCHAR(255),
    [location_uuid] NVARCHAR(36),
    [location_label] NVARCHAR(255),
    [material_budgeted_amount] DECIMAL(18,2),
    [po_amount] DECIMAL(18,2) NOT NULL CONSTRAINT [po_lw_mat_po_amount_df] DEFAULT 0,
    [description] NVARCHAR(MAX),
    [metadata] NVARCHAR(MAX),
    [is_active] BIT NOT NULL CONSTRAINT [po_lw_mat_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [po_lw_mat_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [po_lw_mat_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [po_lw_mat_uuid_key] UNIQUE NONCLUSTERED ([uuid]),
    CONSTRAINT [po_lw_mat_po_fk] FOREIGN KEY ([purchase_order_uuid]) REFERENCES [dbo].[purchase_order_forms]([uuid]) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX [po_lw_mat_purchase_order_uuid_idx] ON [dbo].[po_location_wise_material]([purchase_order_uuid]);
CREATE INDEX [po_lw_mat_corporation_uuid_idx] ON [dbo].[po_location_wise_material]([corporation_uuid]);

-- CreateTable: stock_receipt_notes
CREATE TABLE [dbo].[stock_receipt_notes] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] NVARCHAR(36) NOT NULL CONSTRAINT [srn_uuid_df] DEFAULT LOWER(CONVERT(NVARCHAR(36),NEWID())),
    [corporation_uuid] NVARCHAR(36) NOT NULL,
    [project_uuid] NVARCHAR(36),
    [purchase_order_uuid] NVARCHAR(36),
    [receipt_type] NVARCHAR(50),
    [vendor_uuid] NVARCHAR(36),
    [entry_date] DATETIME2,
    [received_date] DATETIME2,
    [shipment_date] DATETIME2,
    [grn_number] NVARCHAR(100) NOT NULL,
    [reference_number] NVARCHAR(100),
    [received_by] NVARCHAR(255),
    [nimble_received_by_user_id] NVARCHAR(128),
    [location_uuid] NVARCHAR(36),
    [notes] NVARCHAR(MAX),
    [status] NVARCHAR(50) NOT NULL CONSTRAINT [srn_status_df] DEFAULT 'Shipment',
    [total_received_amount] DECIMAL(18,2),
    [attachments] NVARCHAR(MAX),
    [metadata] NVARCHAR(MAX),
    [audit_log] NVARCHAR(MAX),
    [is_active] BIT NOT NULL CONSTRAINT [srn_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [srn_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [srn_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [srn_uuid_key] UNIQUE NONCLUSTERED ([uuid]),
    CONSTRAINT [srn_po_fk] FOREIGN KEY ([purchase_order_uuid]) REFERENCES [dbo].[purchase_order_forms]([uuid])
);

CREATE INDEX [srn_corporation_uuid_idx] ON [dbo].[stock_receipt_notes]([corporation_uuid]);
CREATE INDEX [srn_project_uuid_idx] ON [dbo].[stock_receipt_notes]([project_uuid]);
CREATE INDEX [srn_purchase_order_uuid_idx] ON [dbo].[stock_receipt_notes]([purchase_order_uuid]);
CREATE INDEX [srn_vendor_uuid_idx] ON [dbo].[stock_receipt_notes]([vendor_uuid]);
CREATE INDEX [srn_status_idx] ON [dbo].[stock_receipt_notes]([status]);
CREATE INDEX [srn_is_active_idx] ON [dbo].[stock_receipt_notes]([is_active]);
CREATE INDEX [srn_entry_date_idx] ON [dbo].[stock_receipt_notes]([entry_date] DESC);

-- CreateTable: receipt_note_items
CREATE TABLE [dbo].[receipt_note_items] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] NVARCHAR(36) NOT NULL CONSTRAINT [rni_uuid_df] DEFAULT LOWER(CONVERT(NVARCHAR(36),NEWID())),
    [corporation_uuid] NVARCHAR(36),
    [project_uuid] NVARCHAR(36),
    [receipt_note_uuid] NVARCHAR(36) NOT NULL,
    [item_type] NVARCHAR(50),
    [purchase_order_uuid] NVARCHAR(36),
    [change_order_uuid] NVARCHAR(36),
    [cost_code_uuid] NVARCHAR(36),
    [cost_code_label] NVARCHAR(255),
    [cost_code_number] NVARCHAR(100),
    [cost_code_name] NVARCHAR(255),
    [division_name] NVARCHAR(255),
    [item_uuid] NVARCHAR(36),
    [item_name] NVARCHAR(500),
    [description] NVARCHAR(MAX),
    [model_number] NVARCHAR(255),
    [location_uuid] NVARCHAR(36),
    [unit_uuid] NVARCHAR(36),
    [unit_label] NVARCHAR(100),
    [category] NVARCHAR(100),
    [po_quantity] DECIMAL(18,4),
    [received_quantity] DECIMAL(18,4),
    [unit_price] DECIMAL(18,4),
    [total] DECIMAL(18,2),
    [po_item_uuid] NVARCHAR(36),
    [metadata] NVARCHAR(MAX),
    [is_active] BIT NOT NULL CONSTRAINT [rni_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [rni_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [rni_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [rni_uuid_key] UNIQUE NONCLUSTERED ([uuid]),
    CONSTRAINT [rni_srn_fk] FOREIGN KEY ([receipt_note_uuid]) REFERENCES [dbo].[stock_receipt_notes]([uuid]) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX [rni_receipt_note_uuid_idx] ON [dbo].[receipt_note_items]([receipt_note_uuid]);
CREATE INDEX [rni_purchase_order_uuid_idx] ON [dbo].[receipt_note_items]([purchase_order_uuid]);
CREATE INDEX [rni_corporation_uuid_idx] ON [dbo].[receipt_note_items]([corporation_uuid]);

-- CreateTable: stock_return_notes
CREATE TABLE [dbo].[stock_return_notes] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] NVARCHAR(36) NOT NULL CONSTRAINT [str_uuid_df] DEFAULT LOWER(CONVERT(NVARCHAR(36),NEWID())),
    [corporation_uuid] NVARCHAR(36) NOT NULL,
    [project_uuid] NVARCHAR(36),
    [purchase_order_uuid] NVARCHAR(36),
    [return_type] NVARCHAR(50),
    [vendor_uuid] NVARCHAR(36),
    [entry_date] DATETIME2,
    [return_note_number] NVARCHAR(100) NOT NULL,
    [reference_number] NVARCHAR(100),
    [location_uuid] NVARCHAR(36),
    [notes] NVARCHAR(MAX),
    [status] NVARCHAR(50) NOT NULL CONSTRAINT [str_status_df] DEFAULT 'Draft',
    [total_return_amount] DECIMAL(18,2),
    [attachments] NVARCHAR(MAX),
    [metadata] NVARCHAR(MAX),
    [audit_log] NVARCHAR(MAX),
    [is_active] BIT NOT NULL CONSTRAINT [str_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [str_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [str_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [str_uuid_key] UNIQUE NONCLUSTERED ([uuid]),
    CONSTRAINT [str_po_fk] FOREIGN KEY ([purchase_order_uuid]) REFERENCES [dbo].[purchase_order_forms]([uuid])
);

CREATE INDEX [str_corporation_uuid_idx] ON [dbo].[stock_return_notes]([corporation_uuid]);
CREATE INDEX [str_project_uuid_idx] ON [dbo].[stock_return_notes]([project_uuid]);
CREATE INDEX [str_purchase_order_uuid_idx] ON [dbo].[stock_return_notes]([purchase_order_uuid]);
CREATE INDEX [str_is_active_idx] ON [dbo].[stock_return_notes]([is_active]);
CREATE INDEX [str_entry_date_idx] ON [dbo].[stock_return_notes]([entry_date] DESC);

-- CreateTable: return_note_items
CREATE TABLE [dbo].[return_note_items] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] NVARCHAR(36) NOT NULL CONSTRAINT [rtn_i_uuid_df] DEFAULT LOWER(CONVERT(NVARCHAR(36),NEWID())),
    [corporation_uuid] NVARCHAR(36),
    [project_uuid] NVARCHAR(36),
    [return_note_uuid] NVARCHAR(36) NOT NULL,
    [item_type] NVARCHAR(50),
    [purchase_order_uuid] NVARCHAR(36),
    [change_order_uuid] NVARCHAR(36),
    [cost_code_uuid] NVARCHAR(36),
    [cost_code_label] NVARCHAR(255),
    [cost_code_number] NVARCHAR(100),
    [cost_code_name] NVARCHAR(255),
    [division_name] NVARCHAR(255),
    [item_uuid] NVARCHAR(36),
    [item_name] NVARCHAR(500),
    [description] NVARCHAR(MAX),
    [model_number] NVARCHAR(255),
    [location_uuid] NVARCHAR(36),
    [unit_uuid] NVARCHAR(36),
    [unit_label] NVARCHAR(100),
    [category] NVARCHAR(100),
    [po_quantity] DECIMAL(18,4),
    [return_quantity] DECIMAL(18,4),
    [unit_price] DECIMAL(18,4),
    [total] DECIMAL(18,2),
    [po_item_uuid] NVARCHAR(36),
    [receipt_note_uuid] NVARCHAR(36),
    [metadata] NVARCHAR(MAX),
    [is_active] BIT NOT NULL CONSTRAINT [rtn_i_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [rtn_i_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [rtn_i_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [rtn_i_uuid_key] UNIQUE NONCLUSTERED ([uuid]),
    CONSTRAINT [rtn_i_str_fk] FOREIGN KEY ([return_note_uuid]) REFERENCES [dbo].[stock_return_notes]([uuid]) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX [rtn_i_return_note_uuid_idx] ON [dbo].[return_note_items]([return_note_uuid]);
CREATE INDEX [rtn_i_purchase_order_uuid_idx] ON [dbo].[return_note_items]([purchase_order_uuid]);
CREATE INDEX [rtn_i_corporation_uuid_idx] ON [dbo].[return_note_items]([corporation_uuid]);
