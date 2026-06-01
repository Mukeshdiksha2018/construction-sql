-- Change orders (MSSQL) — aligned with construction-management Supabase schema

CREATE TABLE [dbo].[change_orders] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] NVARCHAR(36) NOT NULL CONSTRAINT [change_orders_uuid_df] DEFAULT LOWER(CONVERT(NVARCHAR(36),NEWID())),
    [corporation_uuid] NVARCHAR(36) NOT NULL,
    [project_uuid] NVARCHAR(36),
    [vendor_uuid] NVARCHAR(36),
    [original_purchase_order_uuid] NVARCHAR(36),
    [co_number] NVARCHAR(100),
    [created_date] DATETIME2,
    [credit_days] NVARCHAR(100),
    [credit_days_id] NVARCHAR(100),
    [estimated_delivery_date] DATETIME2,
    [requested_by] NVARCHAR(36),
    [nimble_requested_by_user_id] NVARCHAR(128),
    [co_type] NVARCHAR(20),
    [ship_via_uuid] NVARCHAR(36),
    [freight_uuid] NVARCHAR(36),
    [shipping_instructions] NVARCHAR(MAX),
    [quote_reference] NVARCHAR(255),
    [reason] NVARCHAR(MAX),
    [reason_uuid] NVARCHAR(36),
    [shipping_address_uuid] NVARCHAR(36),
    [terms_and_conditions_uuid] NVARCHAR(36),
    [special_instruction_uuid] NVARCHAR(36),
    [financial_breakdown] NVARCHAR(MAX),
    [attachments] NVARCHAR(MAX),
    [removed_co_items] NVARCHAR(MAX),
    [audit_log] NVARCHAR(MAX),
    [prepared_by] NVARCHAR(255),
    [status] NVARCHAR(50) NOT NULL CONSTRAINT [change_orders_status_df] DEFAULT 'Draft',
    [print_include_approved_by_vendor] BIT,
    [print_use_entity_name] BIT,
    [is_revised] BIT NOT NULL CONSTRAINT [change_orders_is_revised_df] DEFAULT 0,
    [revision_number] NVARCHAR(50),
    [revision_notes] NVARCHAR(MAX),
    [revision_date] DATETIME2,
    [is_active] BIT NOT NULL CONSTRAINT [change_orders_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [change_orders_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [change_orders_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [change_orders_uuid_key] UNIQUE NONCLUSTERED ([uuid]),
    CONSTRAINT [change_orders_po_fk] FOREIGN KEY ([original_purchase_order_uuid]) REFERENCES [dbo].[purchase_order_forms]([uuid])
);

CREATE INDEX [change_orders_corporation_uuid_idx] ON [dbo].[change_orders]([corporation_uuid]);
CREATE INDEX [change_orders_project_uuid_idx] ON [dbo].[change_orders]([project_uuid]);
CREATE INDEX [change_orders_vendor_uuid_idx] ON [dbo].[change_orders]([vendor_uuid]);
CREATE INDEX [change_orders_original_po_uuid_idx] ON [dbo].[change_orders]([original_purchase_order_uuid]);
CREATE INDEX [change_orders_is_active_idx] ON [dbo].[change_orders]([is_active]);
CREATE INDEX [change_orders_created_at_idx] ON [dbo].[change_orders]([created_at] DESC);

CREATE TABLE [dbo].[change_order_items_list] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] NVARCHAR(36) NOT NULL CONSTRAINT [co_items_uuid_df] DEFAULT LOWER(CONVERT(NVARCHAR(36),NEWID())),
    [corporation_uuid] NVARCHAR(36),
    [project_uuid] NVARCHAR(36),
    [change_order_uuid] NVARCHAR(36) NOT NULL,
    [order_index] INT NOT NULL CONSTRAINT [co_items_order_index_df] DEFAULT 0,
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
    [storage_location_uuid] NVARCHAR(36),
    [storage_location_label] NVARCHAR(255),
    [unit_uuid] NVARCHAR(36),
    [unit_label] NVARCHAR(100),
    [quantity] DECIMAL(18,4),
    [unit_price] DECIMAL(18,4),
    [co_quantity] DECIMAL(18,4),
    [co_unit_price] DECIMAL(18,4),
    [co_total] DECIMAL(18,2),
    [total] DECIMAL(18,2),
    [approval_checks_uuids] NVARCHAR(MAX),
    [configuration_name] NVARCHAR(255),
    [metadata] NVARCHAR(MAX),
    [is_active] BIT NOT NULL CONSTRAINT [co_items_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [co_items_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [co_items_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [co_items_uuid_key] UNIQUE NONCLUSTERED ([uuid]),
    CONSTRAINT [co_items_co_fk] FOREIGN KEY ([change_order_uuid]) REFERENCES [dbo].[change_orders]([uuid]) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX [co_items_change_order_uuid_idx] ON [dbo].[change_order_items_list]([change_order_uuid]);
CREATE INDEX [co_items_corporation_uuid_idx] ON [dbo].[change_order_items_list]([corporation_uuid]);

CREATE TABLE [dbo].[labor_change_order_items_list] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] NVARCHAR(36) NOT NULL CONSTRAINT [labor_co_items_uuid_df] DEFAULT LOWER(CONVERT(NVARCHAR(36),NEWID())),
    [corporation_uuid] NVARCHAR(36),
    [project_uuid] NVARCHAR(36),
    [purchase_order_uuid] NVARCHAR(36) NOT NULL,
    [change_order_uuid] NVARCHAR(36) NOT NULL,
    [order_index] INT NOT NULL CONSTRAINT [labor_co_items_order_index_df] DEFAULT 0,
    [cost_code_uuid] NVARCHAR(36),
    [cost_code_number] NVARCHAR(100),
    [cost_code_name] NVARCHAR(255),
    [cost_code_label] NVARCHAR(255),
    [division_name] NVARCHAR(255),
    [location_uuid] NVARCHAR(36),
    [location_label] NVARCHAR(255),
    [po_amount] DECIMAL(18,2) NOT NULL CONSTRAINT [labor_co_items_po_amount_df] DEFAULT 0,
    [co_amount] DECIMAL(18,2),
    [description] NVARCHAR(MAX),
    [metadata] NVARCHAR(MAX),
    [is_active] BIT NOT NULL CONSTRAINT [labor_co_items_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [labor_co_items_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [labor_co_items_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [labor_co_items_uuid_key] UNIQUE NONCLUSTERED ([uuid]),
    CONSTRAINT [labor_co_items_co_fk] FOREIGN KEY ([change_order_uuid]) REFERENCES [dbo].[change_orders]([uuid]) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT [labor_co_items_po_fk] FOREIGN KEY ([purchase_order_uuid]) REFERENCES [dbo].[purchase_order_forms]([uuid])
);

CREATE INDEX [labor_co_items_change_order_uuid_idx] ON [dbo].[labor_change_order_items_list]([change_order_uuid]);
CREATE INDEX [labor_co_items_purchase_order_uuid_idx] ON [dbo].[labor_change_order_items_list]([purchase_order_uuid]);

CREATE TABLE [dbo].[co_location_wise_material] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [uuid] NVARCHAR(36) NOT NULL CONSTRAINT [co_lw_mat_uuid_df] DEFAULT LOWER(CONVERT(NVARCHAR(36),NEWID())),
    [corporation_uuid] NVARCHAR(36),
    [project_uuid] NVARCHAR(36),
    [change_order_uuid] NVARCHAR(36) NOT NULL,
    [purchase_order_uuid] NVARCHAR(36),
    [order_index] INT NOT NULL CONSTRAINT [co_lw_mat_order_index_df] DEFAULT 0,
    [cost_code_uuid] NVARCHAR(36),
    [cost_code_number] NVARCHAR(100),
    [cost_code_name] NVARCHAR(255),
    [cost_code_label] NVARCHAR(255),
    [division_name] NVARCHAR(255),
    [location_uuid] NVARCHAR(36),
    [location_label] NVARCHAR(255),
    [material_budgeted_amount] DECIMAL(18,2),
    [po_amount] DECIMAL(18,2) NOT NULL CONSTRAINT [co_lw_mat_po_amount_df] DEFAULT 0,
    [co_amount] DECIMAL(18,2),
    [description] NVARCHAR(MAX),
    [metadata] NVARCHAR(MAX),
    [is_active] BIT NOT NULL CONSTRAINT [co_lw_mat_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [co_lw_mat_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [co_lw_mat_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [co_lw_mat_uuid_key] UNIQUE NONCLUSTERED ([uuid]),
    CONSTRAINT [co_lw_mat_co_fk] FOREIGN KEY ([change_order_uuid]) REFERENCES [dbo].[change_orders]([uuid]) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX [co_lw_mat_change_order_uuid_idx] ON [dbo].[co_location_wise_material]([change_order_uuid]);
