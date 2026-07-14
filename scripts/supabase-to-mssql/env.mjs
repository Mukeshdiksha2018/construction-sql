import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { adoConnectionStringToPrismaUrl } from '../ado-to-prisma-url.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
export const ROOT = resolve(__dirname, '../..')

export function loadEnvFile(path = resolve(ROOT, '.env')) {
  if (!existsSync(path)) return
  const content = readFileSync(path, 'utf8')
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith('\'') && value.endsWith('\''))
    ) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = value
  }
}

/** Parse ADO MSSQL connection string for the `mssql` package. */
export function parseAdoMssqlConfig(ado) {
  /** @type {Record<string, string>} */
  const parts = {}
  let stripped = String(ado || '').trim()
  if (stripped.startsWith('"') && stripped.endsWith('"')) stripped = stripped.slice(1, -1)
  for (const segment of stripped.split(';')) {
    const eq = segment.indexOf('=')
    if (eq < 0) continue
    const key = segment.slice(0, eq).trim()
    let value = segment.slice(eq + 1).trim()
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
    if (key) parts[key] = value
  }

  const serverRaw = parts.Server ?? parts['Data Source'] ?? 'localhost'
  let server = serverRaw
  let port = 1433
  if (serverRaw.includes(',')) {
    const [h, p] = serverRaw.split(',', 2)
    server = h?.trim() ?? server
    port = Number(p?.trim() || 1433)
  }
  else if (serverRaw.includes(':') && !serverRaw.startsWith('tcp:')) {
    const [h, p] = serverRaw.split(':', 2)
    server = h?.trim() ?? server
    port = Number(p?.trim() || 1433)
  }

  return {
    server,
    port,
    database: parts.Database ?? parts['Initial Catalog'] ?? '',
    user: parts['User ID'] ?? parts.User ?? '',
    password: parts.Password ?? '',
    options: {
      encrypt: (parts.Encrypt ?? '').toLowerCase() === 'true',
      trustServerCertificate: (parts.TrustServerCertificate ?? '').toLowerCase() === 'true',
      enableArithAbort: true,
    },
    pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
  }
}

export function getMssqlAdoString() {
  return (
    process.env.NUXT_CONSTRUCTION_ACCOUNTING_CONNECTION_STRING
    || process.env.NUXT_MSSQL_CONNECTION_STRING
    || ''
  ).trim()
}

export function getSupabaseDatabaseUrl() {
  return (process.env.NUXT_SUPABASE_DATABASE_URL || process.env.SUPABASE_DATABASE_URL || '').trim()
}

export function getSupabaseRestConfig() {
  return {
    url: (process.env.NUXT_SUPABASE_URL || '').trim(),
    serviceRoleKey: (process.env.NUXT_SUPABASE_SERVICE_ROLE_KEY || '').trim(),
  }
}

export function assertEnv() {
  const pgUrl = getSupabaseDatabaseUrl()
  const rest = getSupabaseRestConfig()
  const ado = getMssqlAdoString()
  const canRest = !!(rest.url && rest.serviceRoleKey)
  if (!pgUrl && !canRest) {
    throw new Error(
      'Need either NUXT_SUPABASE_DATABASE_URL (Postgres) or NUXT_SUPABASE_URL + NUXT_SUPABASE_SERVICE_ROLE_KEY (REST fallback).',
    )
  }
  if (!ado) {
    throw new Error(
      'Missing NUXT_CONSTRUCTION_ACCOUNTING_CONNECTION_STRING or NUXT_MSSQL_CONNECTION_STRING.',
    )
  }
  if (!process.env.DATABASE_URL?.trim()) {
    try {
      process.env.DATABASE_URL = adoConnectionStringToPrismaUrl(ado)
    }
    catch { /* optional */ }
  }
  return {
    pgUrl,
    rest,
    mssqlConfig: parseAdoMssqlConfig(ado),
  }
}

export function parseCliArgs(argv = process.argv.slice(2)) {
  /** @type {{ dryRun: boolean, strict: boolean, phases: string[]|null, corporation: string|null, help: boolean, transport: 'auto'|'pg'|'rest' }} */
  const opts = {
    dryRun: false,
    strict: false,
    phases: null,
    corporation: null,
    help: false,
    transport: 'auto',
  }
  const envTransport = (process.env.NUXT_SUPABASE_SYNC_TRANSPORT || '').trim().toLowerCase()
  if (envTransport === 'rest' || envTransport === 'pg' || envTransport === 'auto') {
    opts.transport = envTransport
  }
  for (const arg of argv) {
    if (arg === '--dry-run') opts.dryRun = true
    else if (arg === '--strict') opts.strict = true
    else if (arg.startsWith('--phase=')) {
      opts.phases = arg.slice('--phase='.length).split(',').map((s) => s.trim()).filter(Boolean)
    }
    else if (arg.startsWith('--corporation=')) {
      opts.corporation = arg.slice('--corporation='.length).trim() || null
    }
    else if (arg === '--rest') opts.transport = 'rest'
    else if (arg.startsWith('--transport=')) {
      const t = arg.slice('--transport='.length).trim().toLowerCase()
      if (t === 'rest' || t === 'pg' || t === 'auto') opts.transport = t
    }
    else if (arg === '--help' || arg === '-h') {
      opts.help = true
    }
  }
  return opts
}
