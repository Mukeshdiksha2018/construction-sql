import { nimbleMssqlQueryParams } from './nimbleMssql'

const NIMBLE_BINARY_ID_BYTES = 18

/** Strip dashes and lowercase — matches app `normalizeNimbleEntityId`. */
export function normalizeNimbleHexId(value: unknown): string {
  return String(value ?? '').replace(/-/g, '').trim().toLowerCase()
}

/** Convert app/Nimble hex ID to `binary(18)` for SQL parameters. */
export function hexToNimbleBinary(hex: string): Buffer {
  let normalized = normalizeNimbleHexId(hex)
  if (!normalized) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid Nimble ID' })
  }

  // Nimble packs a 16-byte value plus a 0x0000 suffix (36 hex chars total).
  if (normalized.length === 32) {
    normalized += '0000'
  }

  if (normalized.length !== 36) {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid Nimble ID length: ${normalized.length}`,
    })
  }

  const buf = Buffer.from(normalized, 'hex')
  if (buf.length !== NIMBLE_BINARY_ID_BYTES) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid Nimble ID byte length' })
  }

  return buf
}

/** Reverse `hexToNimbleBinary` for API responses. */
export function nimbleBinaryToHex(buf: Buffer | null | undefined): string | null {
  if (!buf || buf.length === 0) return null
  return Buffer.from(buf).toString('hex').toLowerCase()
}

export function optionalHexToNimbleBinary(hex: string | null | undefined): Buffer | null {
  if (!hex || !String(hex).trim()) return null
  return hexToNimbleBinary(hex)
}

/** Generate a new `Business.ID` using Nimble's 16-byte GUID + 0x0000 layout. */
export async function newNimbleBusinessId(): Promise<Buffer> {
  const rows = await nimbleMssqlQueryParams<{ id: Buffer }>(`
    SELECT CAST(SUBSTRING(CONVERT(binary(16), NEWID()), 1, 16) + 0x0000 AS binary(18)) AS id
  `)
  const id = rows[0]?.id
  if (!id || id.length !== NIMBLE_BINARY_ID_BYTES) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to generate Nimble business ID' })
  }
  return id
}
