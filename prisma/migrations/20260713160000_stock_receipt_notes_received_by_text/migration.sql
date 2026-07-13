-- Store received_by as free-text person name only (parity with construction-management
-- 202607082000_stock_receipt_notes_received_by_text).
-- received_by was already NVARCHAR(255) in MSSQL (never a UUID FK).
-- Drop the separate Nimble user-id column and clear any values that were stored there.

IF COL_LENGTH(N'dbo.stock_receipt_notes', N'nimble_received_by_user_id') IS NOT NULL
BEGIN
  -- Prefer free-text already in received_by; if empty, copy leftover Nimble-id text into received_by.
  UPDATE [dbo].[stock_receipt_notes]
  SET [received_by] = COALESCE(
    NULLIF(LTRIM(RTRIM([received_by])), N''),
    NULLIF(LTRIM(RTRIM([nimble_received_by_user_id])), N'')
  );

  ALTER TABLE [dbo].[stock_receipt_notes]
  DROP COLUMN [nimble_received_by_user_id];
END
