# Nimble SQL database reference

**Database:** `Sunray_06022026`  
**Server:** `10.4.1.12` (see `NUXT_NIMBLE_CONNECTION_STRING` in `.env`)

Read-only architecture snapshot of the Nimble Property MSSQL database. The running app and Prisma migrations use **construction accounting** (`NUXT_CONSTRUCTION_ACCOUNTING_CONNECTION_STRING` → `Database=supabase`).

**Vendor master:** `dbo.Business` is the vendor table for the construction app. CRUD is implemented via `/api/nimble-vendors` (see [`.cursor/plans/nimble-vendors-crud.plan.md`](../../.cursor/plans/nimble-vendors-crud.plan.md)). Construction `vendor_uuid` fields store `Business.ID` as lowercase hex (36 chars, `0000` suffix).

## Files

| File | Description |
|------|-------------|
| [`Sunray_06022026-tables.md`](Sunray_06022026-tables.md) | All **397** base tables (`dbo.*`) |
| [`Sunray_06022026-columns.md`](Sunray_06022026-columns.md) | Column-level reference (**6355** columns) |

Generated: 2026-06-30 from `INFORMATION_SCHEMA`.
