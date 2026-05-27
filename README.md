# Construction SQL (Nuxt + MSSQL)

Nuxt app with Nimble auth and SQL Server data via Prisma.

## Database

See **[DATABASE.md](./DATABASE.md)** for Prisma setup, migrations (`npm run db:migrate`), and connection configuration.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:<NUXT_DEV_SERVER_PORT>` (from `.env`, defaults to `3000`):

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

If the configured port is busy, Nuxt may automatically use another local port (for example `3001`). In that case, open the exact `Local:` URL printed in terminal; API routes still work on that same origin because app calls use relative `/api/...` paths.

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
