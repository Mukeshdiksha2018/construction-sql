# Prisma Setup Guide

This guide explains the Prisma setup in this project in the exact order it runs.

## 1) Files Added/Used for Prisma

### Core Prisma files
- `prisma/schema.prisma`
  - Defines datasource (`sqlserver`), generator, and models.
  - `Freight.freight_name` is mapped to DB column `ship_via` using `@map("ship_via")`.
- `prisma/migrations/migration_lock.toml`
  - Locks migration provider (`mssql`) for migration history compatibility.
- `prisma/migrations/20260527150000_init/migration.sql`
  - Initial SQL migration (creates `dbo.freight` and indexes).

### Runtime/server integration
- `server/utils/prisma.ts`
  - Creates and reuses a singleton `PrismaClient`.
  - Injects datasource URL dynamically.
- `server/utils/database-url.ts`
  - Converts `NUXT_MSSQL_CONNECTION_STRING` (ADO style) to Prisma SQL Server URL.
  - Handles special password formatting for Prisma (`{...}` wrapping when needed).

### CLI/script integration
- `scripts/run-prisma.mjs`
  - Wrapper used by npm scripts.
  - Loads `.env`, sets `DATABASE_URL` if missing, then runs `npx prisma ...`.
- `scripts/ado-to-prisma-url.mjs`
  - JS version of the URL conversion logic used by the wrapper.

### Package scripts/dependencies
- `package.json`
  - Added Prisma deps:
    - `@prisma/client`
    - `prisma`
  - Added scripts:
    - `db:generate`
    - `db:migrate`
    - `db:migrate:dev`
    - `db:migrate:status`
    - `db:studio`
    - `db:push`

---

## 2) End-to-End Sequence: How Prisma Works Here

## Step A: You keep DB credentials in `.env`

Primary value currently used:
- `NUXT_MSSQL_CONNECTION_STRING="Server=...;Database=...;User ID=...;Password=...;..."`

Optional direct Prisma URL:
- `DATABASE_URL="sqlserver://..."`

If `DATABASE_URL` is missing, project code builds it from `NUXT_MSSQL_CONNECTION_STRING`.

## Step B: Prisma CLI command starts via npm script

Example:
- `npm run db:migrate`

This runs:
- `dotenvx run -- node scripts/run-prisma.mjs migrate deploy`

`run-prisma.mjs` does:
1. Load `.env`.
2. If `DATABASE_URL` not set, convert `NUXT_MSSQL_CONNECTION_STRING` to Prisma URL.
3. Execute Prisma command (`npx prisma migrate deploy` etc.).

## Step C: Prisma reads schema and migrations

Prisma uses:
- `prisma/schema.prisma`
- `prisma/migrations/*`

For this project, model is:
- `Freight` -> table `dbo.freight`
- field mapping:
  - Prisma `freight_name` -> SQL column `ship_via`

This mapping avoids breaking existing DB shape while keeping clean API naming in app code.

## Step D: Migration tracking and versioning

When migrations are applied/baselined, Prisma tracks state in:
- SQL table `_prisma_migrations` (inside your MSSQL database)

This is how duplicates are skipped.

## Step E: App runtime uses Prisma client

At request time:
1. Server code calls `getPrisma()` from `server/utils/prisma.ts`.
2. `getPrisma()` resolves DB URL using:
   - `DATABASE_URL` first, or
   - converted `NUXT_MSSQL_CONNECTION_STRING`.
3. Reuses singleton client (`globalThis.__prisma`) across requests.

---

## 3) How table creation happens in this setup

Current behavior:
- Tables are created/updated via Prisma migrations (`prisma/migrations/...`).
- Not by ad-hoc SQL at runtime.

Useful commands:
- `npm run db:migrate:dev -- --name <name>`  
  Create/apply migration in development.
- `npm run db:migrate`  
  Apply pending migrations (deploy/CI safe).
- `npm run db:migrate:status`  
  Check migration status.

---

## 4) Seeding: What is configured right now?

Important:
- There is **no Prisma seed script configured yet**.
- No `prisma/seed.ts` (or JS seed file) and no `prisma.seed` entry in `package.json`.

So currently:
- Prisma manages schema/migrations.
- Data seeding is manual (or via app/API usage), not automated.

If needed, next step is to add:
1. `prisma/seed.ts`
2. `package.json` -> `"prisma": { "seed": "tsx prisma/seed.ts" }`
3. script e.g. `npm run db:seed`

---

## 5) Important project-specific notes

- Existing DB table still uses `ship_via`; Prisma model maps it to `freight_name`.
- `migration_lock.toml` currently uses provider `mssql` to match migration history behavior in this repo.
- Keep `.env` connection string wrapped in quotes, especially when password has special chars (`#`, `!`, `^`, `*`, etc.).

---

## 6) Quick operational checklist

1. Ensure `.env` has valid DB connection.
2. Run `npm install`.
3. Run `npm run db:generate`.
4. Run `npm run db:migrate:status`.
5. Run `npm run db:migrate`.
6. Start app: `npm run dev`.

