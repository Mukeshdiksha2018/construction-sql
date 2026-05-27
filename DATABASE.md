# Database (Prisma + MSSQL)

This project uses [Prisma](https://www.prisma.io/) (v6) to manage the SQL Server schema, run migrations, and access data from the Nuxt server.

## Prerequisites

1. A reachable SQL Server instance.
2. Connection settings in `.env` (see below).
3. Dependencies installed: `npm install` (runs `prisma generate` via `postinstall`).

## Environment variables

Use **one** of these approaches:

### Option A — ADO.NET string (recommended if you already use Nuxt)

```env
NUXT_MSSQL_CONNECTION_STRING="Server=HOST;Database=MYDB;User ID=sa;Password=YOUR_PASSWORD;TrustServerCertificate=true;Encrypt=true"
```

Prisma CLI scripts and the app derive `DATABASE_URL` from this automatically.

### Option B — Prisma URL directly

```env
DATABASE_URL="sqlserver://HOST:1433;database=MYDB;user=sa;password=YOUR_PASSWORD;encrypt=true;trustServerCertificate=true"
```

Special characters in the password must be handled correctly:

- **In `.env`:** keep the full connection string in **double quotes** so `#` is not treated as a comment.
- **For Prisma:** passwords with characters like `#`, `!`, `^`, `*` are auto-wrapped as `{password}` when converting from `NUXT_MSSQL_CONNECTION_STRING`.

If migration still fails with `P1000`, set an explicit Prisma URL:

```env
DATABASE_URL="sqlserver://10.4.1.12:1433;database=supabase;user=sa;password={YOUR_PASSWORD};trustServerCertificate=true;encrypt=false"
```

Use `{curly braces}` around the password when it contains special characters (see [Prisma SQL Server docs](https://www.prisma.io/docs/orm/overview/databases/sql-server)).

## Commands

| Command | Purpose |
|---------|---------|
| `npm run db:migrate:dev` | **Development:** create/apply migrations (prompts for migration name when schema changes) |
| `npm run db:migrate` | **Production/CI:** apply pending migrations only (`prisma migrate deploy`) |
| `npm run db:migrate:status` | Show which migrations have been applied |
| `npm run db:generate` | Regenerate Prisma Client after schema changes |
| `npm run db:studio` | Open Prisma Studio (GUI for data) |
| `npm run db:push` | Push schema without migration files (prototyping only; avoid in production) |

All `db:*` scripts load `.env` via `dotenvx` and set `DATABASE_URL` from `NUXT_MSSQL_CONNECTION_STRING` when needed.

## First-time setup

1. Configure `.env` with your SQL Server connection.
2. Run migrations:

   ```bash
   npm run db:migrate:dev
   ```

   When prompted for a migration name, use something like `init` for the first run.

3. Start the app:

   ```bash
   npm run dev
   ```

4. Open **Masters → Freight** to verify CRUD against `dbo.freight`.

## Workflow when you change the schema

1. Edit `prisma/schema.prisma`.
2. Run `npm run db:migrate:dev` and enter a descriptive migration name.
3. Commit both `schema.prisma` and the new folder under `prisma/migrations/`.
4. On deploy, run `npm run db:migrate` before or during startup.

## Where migration history is stored

Prisma records applied migrations in the **`_prisma_migrations`** table in **the same database** as your app data (the one in your connection string). It does not re-run migrations that are already listed there.

| What | Location |
|------|----------|
| Schema definition | `prisma/schema.prisma` |
| Migration SQL | `prisma/migrations/<timestamp>_<name>/migration.sql` |
| Applied migration log | SQL Server table `_prisma_migrations` |
| Generated client | `node_modules/@prisma/client` |

## Existing `dbo.freight` table

If you already created `freight` manually or via an older script:

- If the table **matches** `prisma/schema.prisma`, run:

  ```bash
  npm run db:migrate:dev
  ```

  and choose to baseline, or use `prisma migrate resolve` for the specific migration.

- If the table **differs** (e.g. old `ship_via` column), add a new migration in `schema.prisma` or align the table before migrating.

## Project layout

```text
prisma/
  schema.prisma          # Models and datasource
  migrations/            # Versioned SQL (created by migrate dev)
server/utils/
  prisma.ts              # Shared PrismaClient for API routes
  database-url.ts        # ADO.NET → Prisma URL (used at runtime)
scripts/
  run-prisma.mjs         # Wrapper for Prisma CLI + .env
  ado-to-prisma-url.mjs  # Same URL conversion for scripts
```

## Production deploy

1. Build: `npm run build`
2. Apply migrations: `npm run db:migrate`
3. Start: `npm run start`

Ensure the deploy environment has the same `DATABASE_URL` or `NUXT_MSSQL_CONNECTION_STRING` as the target database.

## Troubleshooting

- **P1001 / connection errors** — Check host, firewall, SQL auth, and `TrustServerCertificate=true` for dev servers.
- **Migration already applied** — Normal; `db:migrate` skips completed migrations.
- **Client out of date** — Run `npm run db:generate` after pulling schema changes.
