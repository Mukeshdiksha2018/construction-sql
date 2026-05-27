/**
 * Convert an ADO.NET-style MSSQL connection string (NUXT_MSSQL_CONNECTION_STRING)
 * to a Prisma `sqlserver://` URL for DATABASE_URL.
 */
export function adoConnectionStringToPrismaUrl(adoConnectionString: string): string {
  const parts = parseAdoConnectionString(adoConnectionString)

  const serverRaw = parts.Server ?? parts['Data Source'] ?? 'localhost'
  let host = serverRaw
  let port = '1433'
  if (serverRaw.includes(',')) {
    const [h, p] = serverRaw.split(',', 2)
    host = h?.trim() ?? host
    port = p?.trim() ?? port
  }
  else if (serverRaw.includes(':')) {
    const [h, p] = serverRaw.split(':', 2)
    host = h?.trim() ?? host
    port = p?.trim() ?? port
  }

  const database = parts.Database ?? parts['Initial Catalog'] ?? ''
  if (!database) {
    throw new Error('Connection string must include Database or Initial Catalog')
  }

  const user = parts['User ID'] ?? parts.User ?? ''
  const password = parts.Password ?? ''
  const integrated
    = (parts['Integrated Security'] ?? parts.IntegratedSecurity ?? '').toLowerCase() === 'true'

  const segments = [
    `sqlserver://${host}:${port}`,
    `database=${database}`,
  ]

  if (!integrated && user) {
    segments.push(`user=${wrapPrismaSqlServerValue(user)}`)
    if (password) {
      segments.push(`password=${wrapPrismaSqlServerValue(password)}`)
    }
  }

  const trust = (parts.TrustServerCertificate ?? '').toLowerCase() === 'true'
  if (trust) {
    segments.push('trustServerCertificate=true')
  }

  // Match node-mssql defaults when Encrypt is omitted (common for on-prem / IP hosts).
  const encryptRaw = parts.Encrypt?.toLowerCase()
  const encrypt = encryptRaw === 'true' || encryptRaw === 'yes'
  segments.push(`encrypt=${encrypt ? 'true' : 'false'}`)

  return segments.join(';')
}

/**
 * Prisma SQL Server URLs require `{value}` when credentials contain
 * `: \ = ; / [ ] { }` or other reserved characters.
 */
export function wrapPrismaSqlServerValue(value: string): string {
  if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
    return `{${value.replace(/}/g, '}}')}}`
  }
  return value
}

/** @deprecated Prefer wrapPrismaSqlServerValue for Prisma SQL Server URLs */
export function encodePrismaSqlServerValue(value: string): string {
  return value.replace(/[^a-zA-Z0-9\-_.~]/g, (char) =>
    `%${char.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')}`,
  )
}

function parseAdoConnectionString(connectionString: string): Record<string, string> {
  const result: Record<string, string> = {}
  let stripped = connectionString.trim()
  if (stripped.startsWith('"') && stripped.endsWith('"')) {
    stripped = stripped.slice(1, -1)
  }

  for (const segment of stripped.split(';')) {
    const eq = segment.indexOf('=')
    if (eq < 0) continue
    const key = segment.slice(0, eq).trim()
    let value = segment.slice(eq + 1).trim()
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1)
    }
    if (key) result[key] = value
  }
  return result
}

/** Resolve Prisma URL from DATABASE_URL or NUXT_MSSQL_CONNECTION_STRING. */
export function resolveDatabaseUrl(): string {
  const direct = process.env.DATABASE_URL?.trim()
  if (direct) return direct

  const ado = process.env.NUXT_MSSQL_CONNECTION_STRING?.trim()
  if (ado) return adoConnectionStringToPrismaUrl(ado)

  throw new Error(
    'Database URL not configured. Set DATABASE_URL or NUXT_MSSQL_CONNECTION_STRING in .env',
  )
}
