# Cursor project configuration

This folder holds project-local Cursor configuration for **construction-sql** (Nuxt 4 + Prisma + MS SQL Server).

```
.cursor/
├── README.md          # This file
├── plans/             # Implementation plans and architecture docs for agents
│   └── *.plan.md
└── rules/             # Persistent AI rules (.mdc files)
    └── *.mdc
```

## Plans (`plans/`)

- [`plans/port-from-construction-management.plan.md`](plans/port-from-construction-management.plan.md) — Master port tracker (June 2026 CM → MSSQL)
- [`plans/currency-conversion-mssql.plan.md`](plans/currency-conversion-mssql.plan.md) — PO/CO currency conversion on MSSQL
- [`plans/nimble-entityusage-sync.plan.md`](plans/nimble-entityusage-sync.plan.md) — **Skipped** for this MSSQL deployment

## Reference project

Business logic source: `../construction-management` (Supabase/PostgreSQL). Port with Prisma, not Supabase client.

## Rules (`rules/`)

- `project-overview.mdc` — always apply
- `porting-from-reference.mdc` — when editing `app/` or `server/`
- `prisma-mssql.mdc` — when editing `prisma/`
