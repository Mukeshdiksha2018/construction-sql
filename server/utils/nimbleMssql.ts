import sql from 'mssql'

declare global {
  // eslint-disable-next-line no-var
  var __nimbleMssqlPool: sql.ConnectionPool | undefined
}

function getNimbleMssqlConfig(): string {
  const { nimbleConnectionString } = useRuntimeConfig()

  if (!nimbleConnectionString) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Nimble MSSQL is not configured. Set NUXT_NIMBLE_CONNECTION_STRING in .env',
    })
  }

  return nimbleConnectionString
}

/** Shared Nimble DB connection pool (Sunray_06022026). */
export async function getNimbleMssqlPool(): Promise<sql.ConnectionPool> {
  const existing = globalThis.__nimbleMssqlPool
  if (existing?.connected) {
    return existing
  }

  const pool = new sql.ConnectionPool(getNimbleMssqlConfig())
  await pool.connect()
  globalThis.__nimbleMssqlPool = pool
  return pool
}

function bindInput(request: sql.Request, name: string, value: unknown) {
  if (Buffer.isBuffer(value)) {
    request.input(name, sql.VarBinary(18), value)
    return
  }
  request.input(name, value)
}

/** Run a parameterized SQL query against the Nimble database. */
export async function nimbleMssqlQueryParams<T = Record<string, unknown>>(
  queryText: string,
  inputs: Record<string, unknown> = {},
  transaction?: sql.Transaction,
): Promise<T[]> {
  const request = transaction
    ? new sql.Request(transaction)
    : (await getNimbleMssqlPool()).request()
  for (const [name, value] of Object.entries(inputs)) {
    bindInput(request, name, value)
  }
  const result = await request.query<T>(queryText)
  return result.recordset ?? []
}

/** Run queries in a Nimble DB transaction. */
export async function nimbleMssqlTransaction<T>(
  fn: (transaction: sql.Transaction) => Promise<T>,
): Promise<T> {
  const pool = await getNimbleMssqlPool()
  const transaction = new sql.Transaction(pool)
  await transaction.begin()
  try {
    const result = await fn(transaction)
    await transaction.commit()
    return result
  }
  catch (error) {
    await transaction.rollback()
    throw error
  }
}
