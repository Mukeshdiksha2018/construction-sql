/**
 * GET /api/db/health — verify MSSQL connectivity (server-side only).
 */
export default defineEventHandler(async () => {
  const start = Date.now()

  const rows = await mssqlQuery<{ ok: number }>('SELECT 1 AS ok')
  const elapsedMs = Date.now() - start

  const config = useRuntimeConfig()
  const conn = config.mssqlConnectionString
  const server = conn.match(/(?:^|;)Server=([^;]+)/i)?.[1]
  const database = conn.match(/(?:^|;)Database=([^;]+)/i)?.[1]

  return {
    connected: rows[0]?.ok === 1,
    server,
    database,
    elapsedMs,
  }
})
