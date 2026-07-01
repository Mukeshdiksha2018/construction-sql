import { createError } from 'h3'
import {
  hexToNimbleBinary,
  newNimbleBusinessId,
  normalizeNimbleHexId,
  nimbleBinaryToHex,
} from './nimbleBinaryId'
import { nimbleMssqlQueryParams } from './nimbleMssql'

/** `dbo.Frequency.Type` — payment / credit-days terms */
export const NIMBLE_FREQUENCY_TYPE_CREDIT_DAYS = 3

export type NimbleCreditDaysStatus = 0 | 1 | 3
export type NimbleCreditDaysStatusLabel = 'inactive' | 'active' | 'deleted'

export interface NimbleCreditDaysDto {
  credit_days_id: string
  name: string
  interval_days: number
  status: NimbleCreditDaysStatus
  status_label: NimbleCreditDaysStatusLabel
  client_id: string | null
  is_default: boolean | null
}

export interface NimbleCreditDaysInput {
  name: string
  interval_days: number
  status?: NimbleCreditDaysStatus
}

export interface CreditDaysOptionDto {
  id: string
  label: string
  value: string
  days: number | null
}

type FrequencyRow = {
  id_hex: string
  Name: string
  Interval: number
  Status: number
  IsDefault: boolean | number | null
  client_id_hex: string | null
}

const FREQUENCY_SELECT = `
  SELECT
    LOWER(CONVERT(varchar(36), f.ID, 2)) AS id_hex,
    f.Name,
    f.Interval,
    f.Status,
    f.IsDefault,
    LOWER(CONVERT(varchar(36), f.ClientID, 2)) AS client_id_hex
  FROM dbo.Frequency f
`

function safeString(value: unknown): string {
  return String(value ?? '').trim()
}

function parseStatus(value: unknown, fallback: NimbleCreditDaysStatus = 1): NimbleCreditDaysStatus {
  const n = Number(value)
  if (n === 0 || n === 1 || n === 3) return n
  return fallback
}

function statusLabel(status: number): NimbleCreditDaysStatusLabel {
  if (status === 1) return 'active'
  if (status === 3) return 'deleted'
  return 'inactive'
}

function nameToValue(name: string): string {
  return name.toUpperCase().replace(/\s+/g, '_')
}

export function mapFrequencyRow(row: FrequencyRow): NimbleCreditDaysDto {
  return {
    credit_days_id: normalizeNimbleHexId(row.id_hex),
    name: row.Name,
    interval_days: Number(row.Interval),
    status: parseStatus(row.Status),
    status_label: statusLabel(Number(row.Status)),
    client_id: row.client_id_hex ? normalizeNimbleHexId(row.client_id_hex) : null,
    is_default: row.IsDefault == null ? null : Boolean(row.IsDefault),
  }
}

export function mapToCreditDaysOption(row: NimbleCreditDaysDto): CreditDaysOptionDto {
  return {
    id: row.credit_days_id,
    label: row.name,
    value: nameToValue(row.name),
    days: Number.isFinite(row.interval_days) ? row.interval_days : null,
  }
}

export function parseNimbleCreditDaysBody(raw: unknown): NimbleCreditDaysInput {
  const body = (raw && typeof raw === 'object') ? raw as Record<string, unknown> : {}

  const name = safeString(body.name)
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'name is required' })
  }
  if (name.length > 50) {
    throw createError({ statusCode: 400, statusMessage: 'name must be 50 characters or fewer' })
  }

  const intervalRaw = body.interval_days ?? body.interval ?? body.creditDays
  const interval = Number(intervalRaw)
  if (!Number.isFinite(interval) || !Number.isInteger(interval) || interval < 0) {
    throw createError({ statusCode: 400, statusMessage: 'interval must be a non-negative integer' })
  }

  let status: NimbleCreditDaysStatus = 1
  if (body.status != null && body.status !== '') {
    status = parseStatus(body.status, 1)
  }
  else if (body.active != null) {
    status = body.active === false || body.active === 0 || body.active === 'false' ? 0 : 1
  }

  return { name, interval_days: interval, status }
}

export interface ListNimbleCreditDaysOptions {
  status?: NimbleCreditDaysStatus
  includeDeleted?: boolean
}

export async function listNimbleCreditDays(
  options: ListNimbleCreditDaysOptions = {},
): Promise<NimbleCreditDaysDto[]> {
  const { status, includeDeleted = false } = options
  const conditions = [`f.Type = ${NIMBLE_FREQUENCY_TYPE_CREDIT_DAYS}`]
  const inputs: Record<string, unknown> = {}

  if (status != null) {
    conditions.push('f.Status = @status')
    inputs.status = status
  }
  else if (!includeDeleted) {
    conditions.push('f.Status <> 3')
  }

  const rows = await nimbleMssqlQueryParams<FrequencyRow>(
    `${FREQUENCY_SELECT}
     WHERE ${conditions.join(' AND ')}
     ORDER BY f.Name`,
    inputs,
  )

  return rows.map(mapFrequencyRow)
}

export async function getNimbleCreditDaysById(id: string): Promise<NimbleCreditDaysDto | null> {
  const rows = await nimbleMssqlQueryParams<FrequencyRow>(
    `${FREQUENCY_SELECT}
     WHERE f.ID = @id AND f.Type = @type`,
    {
      id: hexToNimbleBinary(id),
      type: NIMBLE_FREQUENCY_TYPE_CREDIT_DAYS,
    },
  )
  const row = rows[0]
  return row ? mapFrequencyRow(row) : null
}

export async function createNimbleCreditDays(
  input: NimbleCreditDaysInput,
): Promise<NimbleCreditDaysDto> {
  const id = await newNimbleBusinessId()
  const status = input.status ?? 1

  await nimbleMssqlQueryParams(
    `INSERT INTO dbo.Frequency (
      ID, Name, Type, Interval, Status, ClientID, IsDefault, FrequencyType, Optional
    ) VALUES (
      @id, @name, @type, @interval, @status, NULL, 0, NULL, NULL
    )`,
    {
      id,
      name: input.name,
      type: NIMBLE_FREQUENCY_TYPE_CREDIT_DAYS,
      interval: input.interval_days,
      status,
    },
  )

  const created = await getNimbleCreditDaysById(nimbleBinaryToHex(id)!)
  if (!created) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to load created credit days row' })
  }
  return created
}

export async function updateNimbleCreditDays(
  id: string,
  input: NimbleCreditDaysInput,
): Promise<NimbleCreditDaysDto> {
  const existing = await getNimbleCreditDaysById(id)
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Credit days not found' })
  }

  const status = input.status ?? existing.status

  await nimbleMssqlQueryParams(
    `UPDATE dbo.Frequency SET
      Name = @name,
      Interval = @interval,
      Status = @status
     WHERE ID = @id AND Type = @type`,
    {
      id: hexToNimbleBinary(id),
      type: NIMBLE_FREQUENCY_TYPE_CREDIT_DAYS,
      name: input.name,
      interval: input.interval_days,
      status,
    },
  )

  const updated = await getNimbleCreditDaysById(id)
  if (!updated) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to load updated credit days row' })
  }
  return updated
}

async function countCreditDaysReferences(id: string): Promise<number> {
  const binaryId = hexToNimbleBinary(id)
  const rows = await nimbleMssqlQueryParams<{ cnt: number }>(
    `SELECT
      (
        SELECT COUNT(*) FROM dbo.BusinessInfo WHERE CreditDaysID = @id
      ) + (
        SELECT COUNT(*) FROM dbo.CreditTerm WHERE CreditDays = @id
      ) AS cnt`,
    { id: binaryId },
  )
  return Number(rows[0]?.cnt ?? 0)
}

export async function softDeleteNimbleCreditDays(id: string): Promise<NimbleCreditDaysDto> {
  const existing = await getNimbleCreditDaysById(id)
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Credit days not found' })
  }

  const refCount = await countCreditDaysReferences(id)
  if (refCount > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: `Cannot delete credit days: ${refCount} record(s) still reference this term`,
    })
  }

  await nimbleMssqlQueryParams(
    `UPDATE dbo.Frequency SET Status = 3
     WHERE ID = @id AND Type = @type`,
    {
      id: hexToNimbleBinary(id),
      type: NIMBLE_FREQUENCY_TYPE_CREDIT_DAYS,
    },
  )

  const deleted = await getNimbleCreditDaysById(id)
  if (!deleted) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to load deleted credit days row' })
  }
  return deleted
}

export async function listCreditDaysOptions(): Promise<CreditDaysOptionDto[]> {
  const rows = await listNimbleCreditDays({ status: 1 })
  return rows.map(mapToCreditDaysOption)
}
