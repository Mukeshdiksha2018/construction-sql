import { PrismaClient } from '@prisma/client'
import { adoConnectionStringToPrismaUrl, resolveDatabaseUrl } from './database-url'

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

function getDatabaseUrl(): string {
  try {
    return resolveDatabaseUrl()
  }
  catch {
    const { mssqlConnectionString } = useRuntimeConfig()
    if (mssqlConnectionString?.trim()) {
      return adoConnectionStringToPrismaUrl(mssqlConnectionString)
    }
    throw new Error(
      'Database URL not configured. Set DATABASE_URL or NUXT_MSSQL_CONNECTION_STRING in .env',
    )
  }
}

/** Shared Prisma client (reused across Nitro requests). */
export function getPrisma(): PrismaClient {
  const existing = globalThis.__prisma
  if (existing) return existing

  const prisma = new PrismaClient({
    datasources: {
      db: { url: getDatabaseUrl() },
    },
  })

  globalThis.__prisma = prisma
  return prisma
}
