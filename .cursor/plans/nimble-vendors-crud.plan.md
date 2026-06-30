# Nimble Vendors CRUD (implemented)

Vendor master data is stored in **`dbo.Business`** (+ **`dbo.BusinessInfo`** profile fields) on the Nimble database (`NUXT_NIMBLE_CONNECTION_STRING` → `Sunray_06022026`). Construction documents on `supabase` reference vendors via `vendor_uuid` (same Nimble `Business.ID` hex).

## Server

| Path | Purpose |
|------|---------|
| `server/utils/nimbleMssql.ts` | Dedicated Nimble MSSQL pool + transactions |
| `server/utils/nimbleBinaryId.ts` | `binary(18)` ↔ hex conversion |
| `server/utils/nimbleVendors.ts` | List/get/create/update/soft-delete (`Business` + `BusinessInfo`) |
| `server/utils/nimbleVendorAddresses.ts` | Address CRUD (`VendorAddress` → `Address` + `Contact`) |
| `server/utils/nimbleLookups.ts` | Country/state dropdowns |
| `server/api/nimble-vendors/*` | Vendor REST API (auth required) |
| `server/api/nimble-vendors/:id/addresses/*` | Vendor address REST API |
| `server/api/nimble-lookups/*` | Country/state lookup API |

## Client

| Path | Purpose |
|------|---------|
| `app/pages/vendors/index.vue` | Vendors page (list only, no page title) |
| `app/components/vendors/VendorManagement.vue` | Table + modals (ProjectDetails-style) |
| `app/components/vendors/VendorForm.vue` | Create/edit — profile + accordion sections |
| `app/components/vendors/VendorAddressTable.vue` | Address list inside vendor form |
| `app/components/vendors/VendorAddressForm.vue` | Add/edit address modal |
| `app/stores/vendors.ts` | SQL CRUD + addresses; `fetchVendors` / `VendorSelect` use `/api/nimble-vendors` |

## Data model (addresses)

```text
dbo.Business (Type=1 vendor)
  └── dbo.VendorAddress (BusinessID, AdressID, ContactID, AddressType, IsDefault, Status)
        ├── dbo.Address (Address1, City, State, Country, ZipCode)
        └── dbo.Contact (ContactName, phones, Fax, Email, Website)
```

Create address: single transaction inserts `Address` + `Contact` + `VendorAddress`.

## Env

- `NUXT_NIMBLE_CONNECTION_STRING` — Nimble DB (read/write `Business`, `BusinessInfo`, addresses)

## Status values

| `Business.Type` | Meaning |
|-----------------|---------|
| 0 | Customer |
| 1 | Vendor (only these rows are returned by `/api/nimble-vendors`) |

| `Business.Status` | Label | `is_active` in dropdowns |
|-------------------|-------|--------------------------|
| 0 | inactive | false |
| 1 | active | true |
| 3 | deleted (soft delete) | excluded from dropdowns |

## Phase 1b (not yet implemented)

- `VendorContract` CRUD and contract attachments
- Payment Preferences / Additional Information / Notes & Attachments
- Opening balance writes (`AdjustOpeningBalance` / corp preferences)
- Replacing PO print's `/api/nimble/vendors` HTTP proxy (unchanged)
