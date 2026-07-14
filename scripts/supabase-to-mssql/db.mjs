import pg from 'pg'
import sql from 'mssql'
import { createRestSource } from './restSource.mjs'
import { warn } from './utils.mjs'

/**
 * @param {string} connectionString
 */
export async function createPgPool(connectionString) {
  const pool = new pg.Pool({
    connectionString,
    max: 8,
    ssl: connectionString.includes('supabase.co') || connectionString.includes('pooler.supabase.com')
      ? { rejectUnauthorized: false }
      : undefined,
  })
  await pool.query('select 1')
  return {
    kind: 'pg',
    querySql: async (text, params = []) => {
      const res = await pool.query(text, params)
      return res.rows
    },
    end: async () => { await pool.end() },
    pool,
  }
}

/**
 * Prefer Postgres URI; on failure (e.g. IPv6-only host unreachable), use PostgREST HTTPS.
 * @param {{
 *   pgUrl?: string,
 *   supabaseUrl?: string,
 *   serviceRoleKey?: string,
 *   transport?: 'auto'|'pg'|'rest',
 * }} opts
 */
export async function createSourceClient(opts) {
  const transport = opts.transport || 'auto'

  if (transport === 'rest') {
    return createRestSource({
      url: opts.supabaseUrl || '',
      serviceRoleKey: opts.serviceRoleKey || '',
    })
  }

  if (opts.pgUrl) {
    try {
      return await createPgPool(opts.pgUrl)
    }
    catch (e) {
      if (transport === 'pg') throw e
      warn(`Postgres connect failed (${e.message}); falling back to REST HTTPS`)
    }
  }

  return createRestSource({
    url: opts.supabaseUrl || '',
    serviceRoleKey: opts.serviceRoleKey || '',
  })
}

/**
 * @param {any} config
 */
export async function createMssqlPool(config) {
  const pool = await sql.connect(config)
  await pool.request().query('SELECT 1 AS ok')
  return pool
}

export { sql }

/**
 * @param {{ querySql: Function } | import('pg').Pool} client
 * @param {string} text
 * @param {unknown[]} [params]
 */
export async function pgQuery(client, text, params = []) {
  if (client && typeof client.querySql === 'function') {
    return client.querySql(text, params)
  }
  const res = await client.query(text, params)
  return res.rows
}

/**
 * @param {import('mssql').ConnectionPool} pool
 * @param {string} text
 * @param {Record<string, unknown>} [params]
 */
export async function mssqlQuery(pool, text, params = {}) {
  const req = pool.request()
  for (const [key, value] of Object.entries(params)) {
    req.input(key, value)
  }
  const res = await req.query(text)
  return res.recordset || []
}
