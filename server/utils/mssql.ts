import sql from 'mssql'

declare global {
  // eslint-disable-next-line no-var
  var __mssqlPool: sql.ConnectionPool | undefined
}

function getMssqlConfig(): string {
  const { mssqlConnectionString } = useRuntimeConfig()

  if (!mssqlConnectionString) {
    throw createError({
      statusCode: 500,
      statusMessage: 'MSSQL is not configured. Set NUXT_MSSQL_CONNECTION_STRING in .env',
    })
  }

  return mssqlConnectionString
}

/** Shared connection pool (reused across Nitro requests). */
export async function getMssqlPool(): Promise<sql.ConnectionPool> {
  const existing = globalThis.__mssqlPool
  if (existing?.connected) {
    return existing
  }

  const pool = new sql.ConnectionPool(getMssqlConfig())
  await pool.connect()
  globalThis.__mssqlPool = pool
  return pool
}

/** Run a SQL query and return the recordset. */
export async function mssqlQuery<T = Record<string, unknown>>(
  queryText: string,
): Promise<T[]> {
  const pool = await getMssqlPool()
  const result = await pool.request().query<T>(queryText)
  return result.recordset ?? []
}
