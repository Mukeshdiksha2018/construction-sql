# Supabase → MS SQL sync

On-demand CLI that upserts construction data from Supabase Postgres into this app’s MS SQL database.

## Prerequisites

1. MS SQL schema migrated (`npm run db:migrate`).
2. Env in `.env`:
   - **Preferred (direct/pooler Postgres):** `NUXT_SUPABASE_DATABASE_URL`  
     If the dashboard says IPv4 is not enabled, use the **Session pooler** URI (not `db.*.supabase.co`).
   - **Fallback (no Postgres socket):** `NUXT_SUPABASE_URL` + `NUXT_SUPABASE_SERVICE_ROLE_KEY`  
     Force with `--rest` or `NUXT_SUPABASE_SYNC_TRANSPORT=rest` (HTTPS / PostgREST — works on IPv4-only office networks).
   - `NUXT_MSSQL_CONNECTION_STRING` or `NUXT_CONSTRUCTION_ACCOUNTING_CONNECTION_STRING`

## Run

```bash
npm run db:sync:supabase
npm run db:sync:supabase -- --dry-run
npm run db:sync:supabase -- --rest --dry-run
npm run db:sync:supabase -- --phase=masters,projects
npm run db:sync:supabase -- --corporation=<local-properties-uuid-or-nimble-corp-id>
npm run db:sync:supabase -- --strict
```

## Behaviour

- **Upsert by `uuid`** on header/catalog/line tables.
- **Replace-set** for normalized children (financial charges/taxes, attachments, audit events, junctions).
- **Does not copy** Nimble catalogs (`properties`, `vendors`, `uom`, `ship_via`, `chart_of_accounts`, …).
- Those tables are read only to **remap** `corporation_uuid` / `vendor_uuid` / `uom_uuid` / `ship_via` / `gl_account_uuid` to Nimble IDs before writing MS SQL.
- If a remap miss occurs, the original UUID is kept and counted (unless `--strict`).

## Phase order

1. `masters` — freight, approvals, location, PO instructions, reasons, types, terms, cost codes, item types, preferred items, customers  
2. `projects` — projects + addresses/breakdowns/documents/tags + special instructions  
3. `estimates` — headers + children + blob expansion  
4. `pos` — purchase orders + items + normalized children  
5. `cos` — change orders + items + normalized children  
6. `inventory` — GRN + returns  
7. `invoices` — vendor invoices + line/AP/COA tables  
8. `validate` — count comparison + remap-miss report  

## Notes

- Re-runs are safe (uuid upsert + child replace-set).
- Column widths for corp/vendor are often `NVarChar(36)` — long Nimble IDs are truncated with a warning.
- Ship-via / freight remappers are idempotent if the value is already a Nimble id.
- Customers dual identity: migrate local `customers` rows; `projects.customer_uuid` stays local UUID; `nimble_customer_id` is copied.
- No continuous sync in v1 — on-demand only.
- Do not commit `.env` secrets; placeholders live in `.env.example`.

## Spot-check after a run

1. Review Phase 8 count table and remap-miss samples.
2. Open one remapped PO in the app — charges/taxes/attachments from child tables; `vendor_uuid` should match a Nimble vendor id.
3. Confirm a GRN / invoice under the same project still links by preserved document UUIDs.
