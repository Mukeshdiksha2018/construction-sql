# Nimble Vendors CRUD (implemented)

Vendor master data is stored in **`dbo.Business`** on the Nimble database (`NUXT_NIMBLE_CONNECTION_STRING` → `Sunray_06022026`). Construction documents on `supabase` reference vendors via `vendor_uuid` (same Nimble `Business.ID` hex).

## Server

| Path | Purpose |
|------|---------|
| `server/utils/nimbleMssql.ts` | Dedicated Nimble MSSQL pool |
| `server/utils/nimbleBinaryId.ts` | `binary(18)` ↔ hex conversion |
| `server/utils/nimbleVendors.ts` | List/get/create/update/soft-delete |
| `server/api/nimble-vendors/*` | REST API (auth required) |

## Client

| Path | Purpose |
|------|---------|
| `app/pages/vendors/index.vue` | Vendors page |
| `app/components/vendors/VendorManagement.vue` | Table + modals |
| `app/components/vendors/VendorForm.vue` | Create/edit form |
| `app/stores/vendors.ts` | SQL CRUD + optional dropdown bridge |

## Env

- `NUXT_NIMBLE_CONNECTION_STRING` — Nimble DB (read/write `Business`)
- `NUXT_PUBLIC_USE_NIMBLE_DB_VENDORS=true` — use SQL list for `VendorSelect` dropdowns instead of Nimble API3

## Status values

| `Business.Status` | Label |
|-------------------|-------|
| 0 | inactive |
| 1 | active |
| 3 | deleted (soft delete) |
