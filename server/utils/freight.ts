import { createError } from 'h3'
import type { SqlError } from 'mssql'
import { ensureFreightTable } from './freight-schema'
import { getMssqlPool, mssqlQuery, mssqlQueryParams } from './mssql'

export interface FreightRow {
  id: number
  uuid: string
  freight_name: string
  description: string | null
  active: boolean | number
  created_at: Date | string
  updated_at: Date | string
  created_by: string | null
  updated_by: string | null
}

export interface Freight {
  id: number
  uuid: string
  freight_name: string
  description: string | null
  active: boolean
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export interface CreateFreightInput {
  freight_name: string
  description?: string | null
  active?: boolean
}

export interface UpdateFreightInput {
  freight_name: string
  description?: string | null
  active: boolean
}

function normalizeUuid(value: string | { toString(): string }): string {
  return String(value).toLowerCase()
}

function toIsoString(value: Date | string): string {
  if (value instanceof Date) return value.toISOString()
  return new Date(value).toISOString()
}

export function mapFreightRow(row: FreightRow): Freight {
  return {
    id: Number(row.id),
    uuid: normalizeUuid(row.uuid),
    freight_name: row.freight_name,
    description: row.description ?? null,
    active: Boolean(row.active),
    created_at: toIsoString(row.created_at),
    updated_at: toIsoString(row.updated_at),
    created_by: row.created_by ?? null,
    updated_by: row.updated_by ?? null,
  }
}

export function isDuplicateFreightError(err: unknown): boolean {
  const sqlErr = err as SqlError
  return sqlErr?.number === 2627 || sqlErr?.number === 2601
}

export async function listFreight(): Promise<Freight[]> {
  await ensureFreightTable()
  const rows = await mssqlQuery<FreightRow>(`
    SELECT id, uuid, freight_name, description, active, created_at, updated_at, created_by, updated_by
    FROM dbo.freight
    ORDER BY created_at DESC
  `)
  return rows.map(mapFreightRow)
}

export async function createFreight(
  input: CreateFreightInput,
  userId?: string | null,
): Promise<Freight> {
  await ensureFreightTable()

  const freightName = input.freight_name.trim()
  const description = input.description?.trim() || null
  const active = input.active ?? true

  try {
    const rows = await mssqlQueryParams<FreightRow>(`
      INSERT INTO dbo.freight (freight_name, description, active, created_by, updated_by)
      OUTPUT
        INSERTED.id,
        INSERTED.uuid,
        INSERTED.freight_name,
        INSERTED.description,
        INSERTED.active,
        INSERTED.created_at,
        INSERTED.updated_at,
        INSERTED.created_by,
        INSERTED.updated_by
      VALUES (@freightName, @description, @active, @userId, @userId)
    `, {
      freightName,
      description,
      active: active ? 1 : 0,
      userId: userId ?? null,
    })

    const row = rows[0]
    if (!row) {
      throw createError({ statusCode: 500, statusMessage: 'Failed to create freight' })
    }
    return mapFreightRow(row)
  }
  catch (err: unknown) {
    if (isDuplicateFreightError(err)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Freight entry with this name already exists',
      })
    }
    throw err
  }
}

export async function updateFreight(
  uuid: string,
  input: UpdateFreightInput,
  userId?: string | null,
): Promise<Freight> {
  await ensureFreightTable()

  const freightName = input.freight_name.trim()
  const description = input.description?.trim() || null

  try {
    const rows = await mssqlQueryParams<FreightRow>(`
      UPDATE dbo.freight
      SET
        freight_name = @freightName,
        description = @description,
        active = @active,
        updated_at = SYSUTCDATETIME(),
        updated_by = @userId
      OUTPUT
        INSERTED.id,
        INSERTED.uuid,
        INSERTED.freight_name,
        INSERTED.description,
        INSERTED.active,
        INSERTED.created_at,
        INSERTED.updated_at,
        INSERTED.created_by,
        INSERTED.updated_by
      WHERE uuid = @uuid
    `, {
      uuid: normalizeUuid(uuid),
      freightName,
      description,
      active: input.active ? 1 : 0,
      userId: userId ?? null,
    })

    const row = rows[0]
    if (!row) {
      throw createError({ statusCode: 404, statusMessage: 'Freight not found' })
    }
    return mapFreightRow(row)
  }
  catch (err: unknown) {
    if (isDuplicateFreightError(err)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Freight entry with this name already exists',
      })
    }
    throw err
  }
}

export async function deleteFreight(uuid: string): Promise<void> {
  await ensureFreightTable()

  const pool = await getMssqlPool()
  const result = await pool.request()
    .input('uuid', normalizeUuid(uuid))
    .query('DELETE FROM dbo.freight WHERE uuid = @uuid')

  const affected = result.rowsAffected[0] ?? 0
  if (!affected) {
    throw createError({ statusCode: 404, statusMessage: 'Freight not found' })
  }
}

export function parseFreightBody(body: unknown): CreateFreightInput {
  const payload = (body ?? {}) as Record<string, unknown>
  const freight_name = typeof payload.freight_name === 'string' ? payload.freight_name : ''
  const description = typeof payload.description === 'string' ? payload.description : null
  const active = payload.active

  if (!freight_name.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Freight name is required' })
  }
  if (active !== undefined && typeof active !== 'boolean') {
    throw createError({ statusCode: 400, statusMessage: 'Active must be a boolean value' })
  }

  return { freight_name, description, active: active ?? true }
}

export function parseFreightUpdateBody(body: unknown): UpdateFreightInput {
  const payload = (body ?? {}) as Record<string, unknown>
  const freight_name = typeof payload.freight_name === 'string' ? payload.freight_name : ''
  const description = typeof payload.description === 'string' ? payload.description : null
  const active = payload.active

  if (!freight_name.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Freight name is required' })
  }
  if (typeof active !== 'boolean') {
    throw createError({ statusCode: 400, statusMessage: 'Active must be a boolean value' })
  }

  return { freight_name, description, active }
}
