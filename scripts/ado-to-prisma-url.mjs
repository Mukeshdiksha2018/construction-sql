/** @param {string} adoConnectionString */
export function adoConnectionStringToPrismaUrl(adoConnectionString) {
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

  const segments = [`sqlserver://${host}:${port}`, `database=${database}`]

  if (!integrated && user) {
    segments.push(`user=${wrapPrismaSqlServerValue(user)}`)
    if (password) segments.push(`password=${wrapPrismaSqlServerValue(password)}`)
  }

  if ((parts.TrustServerCertificate ?? '').toLowerCase() === 'true') {
    segments.push('trustServerCertificate=true')
  }

  const encryptRaw = parts.Encrypt?.toLowerCase()
  const encrypt = encryptRaw === 'true' || encryptRaw === 'yes'
  segments.push(`encrypt=${encrypt ? 'true' : 'false'}`)

  return segments.join(';')
}

/** @param {string} value */
export function wrapPrismaSqlServerValue(value) {
  if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
    return `{${value.replace(/}/g, '}}')}}`
  }
  return value
}

/** @param {string} value */
export function encodePrismaSqlServerValue(value) {
  return value.replace(/[^a-zA-Z0-9\-_.~]/g, (char) =>
    `%${char.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')}`,
  )
}

/** @param {string} connectionString */
function parseAdoConnectionString(connectionString) {
  /** @type {Record<string, string>} */
  const result = {}
  let stripped = connectionString.trim()
  if (stripped.startsWith('"') && stripped.endsWith('"')) {
    stripped = stripped.slice(1, -1)
  }
  for (const segment of stripped.split(';')) {
    const eq = segment.indexOf('=')
    if (eq < 0) continue
    const key = segment.slice(0, eq).trim()
    let value = segment.slice(eq + 1).trim()
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
    if (key) result[key] = value
  }
  return result
}
