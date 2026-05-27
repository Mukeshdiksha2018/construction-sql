import { mssqlQueryParams } from './mssql'

export interface ProjectLocationBreakdownRow {
  id?: number
  uuid?: string
  project_uuid?: string
  location_uuid?: string
  area_sq_ft?: number | string | null
  no_of_rooms?: number | string | null
  is_active?: boolean | number | null
  created_at?: string | Date | null
  updated_at?: string | Date | null
}

export interface ProjectLocationBreakdownApiModel {
  id: number
  uuid: string
  project_uuid: string
  location_uuid: string
  area_sq_ft: number | null
  no_of_rooms: number | null
  is_active: boolean
  created_at: string | null
  updated_at: string | null
}

export interface UpsertLocationBreakdownInput {
  project_uuid: string
  location_uuid: string
  area_sq_ft?: number | null
  no_of_rooms?: number | null
}

function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  return false
}

function toIso(value: unknown): string | null {
  if (!value) return null
  const d = value instanceof Date ? value : new Date(String(value))
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

function coerceNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export function toBreakdownApiModel(row: ProjectLocationBreakdownRow): ProjectLocationBreakdownApiModel {
  return {
    id: Number(row.id ?? 0),
    uuid: String(row.uuid ?? ''),
    project_uuid: String(row.project_uuid ?? ''),
    location_uuid: String(row.location_uuid ?? ''),
    area_sq_ft: coerceNumberOrNull(row.area_sq_ft),
    no_of_rooms: coerceNumberOrNull(row.no_of_rooms),
    is_active: toBoolean(row.is_active),
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
  }
}

export async function listProjectLocationBreakdowns(projectUuid: string): Promise<ProjectLocationBreakdownApiModel[]> {
  const rows = await mssqlQueryParams<ProjectLocationBreakdownRow>(
    `
      SELECT *
      FROM dbo.project_location_breakdowns
      WHERE project_uuid = @projectUuid
        AND ISNULL(is_active, 1) = 1
      ORDER BY created_at ASC
    `,
    { projectUuid },
  )
  return rows.map(toBreakdownApiModel)
}

export async function getLocationBreakdownByUuid(uuid: string): Promise<ProjectLocationBreakdownApiModel | null> {
  const rows = await mssqlQueryParams<ProjectLocationBreakdownRow>(
    `SELECT TOP 1 * FROM dbo.project_location_breakdowns WHERE uuid = @uuid`,
    { uuid },
  )
  return rows[0] ? toBreakdownApiModel(rows[0]) : null
}

export async function createLocationBreakdown(input: UpsertLocationBreakdownInput): Promise<ProjectLocationBreakdownApiModel> {
  const rows = await mssqlQueryParams<ProjectLocationBreakdownRow>(
    `
      INSERT INTO dbo.project_location_breakdowns (
        uuid, project_uuid, location_uuid, area_sq_ft, no_of_rooms, is_active, created_at, updated_at
      )
      OUTPUT inserted.*
      VALUES (
        LOWER(CONVERT(NVARCHAR(36), NEWID())),
        @project_uuid, @location_uuid, @area_sq_ft, @no_of_rooms, 1, GETUTCDATE(), GETUTCDATE()
      )
    `,
    {
      project_uuid: input.project_uuid,
      location_uuid: input.location_uuid,
      area_sq_ft: coerceNumberOrNull(input.area_sq_ft),
      no_of_rooms: coerceNumberOrNull(input.no_of_rooms),
    },
  )

  const row = rows[0]
  if (!row) throw createError({ statusCode: 500, statusMessage: 'Failed to create location breakdown' })
  return toBreakdownApiModel(row)
}

export async function updateLocationBreakdown(uuid: string, input: Partial<UpsertLocationBreakdownInput>): Promise<ProjectLocationBreakdownApiModel | null> {
  const existing = await getLocationBreakdownByUuid(uuid)
  if (!existing) return null

  const rows = await mssqlQueryParams<ProjectLocationBreakdownRow>(
    `
      UPDATE dbo.project_location_breakdowns
      SET
        location_uuid = @location_uuid,
        area_sq_ft    = @area_sq_ft,
        no_of_rooms   = @no_of_rooms,
        updated_at    = GETUTCDATE()
      OUTPUT inserted.*
      WHERE uuid = @uuid
    `,
    {
      uuid,
      location_uuid: input.location_uuid ?? existing.location_uuid,
      area_sq_ft: coerceNumberOrNull(input.area_sq_ft !== undefined ? input.area_sq_ft : existing.area_sq_ft),
      no_of_rooms: coerceNumberOrNull(input.no_of_rooms !== undefined ? input.no_of_rooms : existing.no_of_rooms),
    },
  )

  return rows[0] ? toBreakdownApiModel(rows[0]) : null
}

export async function softDeleteLocationBreakdown(uuid: string): Promise<boolean> {
  await mssqlQueryParams(
    `UPDATE dbo.project_location_breakdowns SET is_active = 0, updated_at = GETUTCDATE() WHERE uuid = @uuid`,
    { uuid },
  )
  return true
}
