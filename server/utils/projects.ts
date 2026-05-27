import { mssqlQueryParams } from './mssql'

export interface ProjectRow {
  id?: number
  uuid?: string
  corporation_uuid?: string
  project_name?: string
  project_id?: string
  project_type_uuid?: string | null
  service_type_uuid?: string | null
  customer_uuid?: string | null
  project_status?: string | null
  project_start_date?: string | Date | null
  project_estimated_completion_date?: string | Date | null
  estimated_amount?: number | string | null
  area_sq_ft?: number | string | null
  no_of_rooms?: number | string | null
  is_active?: boolean | number | null
}

export interface ProjectApiModel {
  id: number
  uuid: string
  corporation_uuid: string
  project_name: string
  project_id: string
  project_type_uuid: string | null
  service_type_uuid: string | null
  customer_uuid: string | null
  project_status: string
  project_start_date: string | null
  project_estimated_completion_date: string | null
  estimated_amount: number
  area_sq_ft: number | null
  no_of_rooms: number | null
  is_active: boolean
}

export interface UpsertProjectInput {
  corporation_uuid: string
  project_name: string
  project_id?: string
  project_type_uuid?: string | null
  service_type_uuid?: string | null
  customer_uuid?: string | null
  project_status?: string
  project_start_date?: string | null
  project_estimated_completion_date?: string | null
  estimated_amount?: number
  area_sq_ft?: number | null
  no_of_rooms?: number | null
}

function toIso(value: unknown): string | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(String(value))
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  return value !== null && value !== undefined
}

export function toProjectApiModel(row: ProjectRow): ProjectApiModel {
  return {
    id: Number(row.id ?? 0),
    uuid: String(row.uuid ?? ''),
    corporation_uuid: String(row.corporation_uuid ?? ''),
    project_name: String(row.project_name ?? ''),
    project_id: String(row.project_id ?? ''),
    project_type_uuid: row.project_type_uuid ? String(row.project_type_uuid) : null,
    service_type_uuid: row.service_type_uuid ? String(row.service_type_uuid) : null,
    customer_uuid: row.customer_uuid ? String(row.customer_uuid) : null,
    project_status: String(row.project_status ?? 'Pending'),
    project_start_date: toIso(row.project_start_date),
    project_estimated_completion_date: toIso(row.project_estimated_completion_date),
    estimated_amount: Number(row.estimated_amount ?? 0),
    area_sq_ft: row.area_sq_ft === null || row.area_sq_ft === undefined ? null : Number(row.area_sq_ft),
    no_of_rooms: row.no_of_rooms === null || row.no_of_rooms === undefined ? null : Number(row.no_of_rooms),
    is_active: toBoolean(row.is_active),
  }
}

function normalizeNullableString(value: unknown): string | null {
  const str = String(value ?? '').trim()
  return str ? str : null
}

function coerceNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

function normalizeDateInput(value: unknown): Date | null {
  const str = String(value ?? '').trim()
  if (!str) return null
  const date = new Date(str)
  return Number.isNaN(date.getTime()) ? null : date
}

function parseProjectStatus(value: unknown): string {
  const normalized = String(value ?? 'Pending').trim()
  return normalized || 'Pending'
}

async function generateNextProjectId(corporationUuid: string): Promise<string> {
  const rows = await mssqlQueryParams<{ project_id?: string }>(
    `
      SELECT TOP 200 project_id
      FROM dbo.projects
      WHERE corporation_uuid = @corporationUuid
      ORDER BY created_at DESC
    `,
    { corporationUuid },
  )

  let maxSeq = 100000
  const re = /^PRO-(\d+)$/i
  for (const row of rows) {
    const match = String(row.project_id ?? '').match(re)
    if (!match) continue
    const seq = Number(match[1])
    if (Number.isFinite(seq)) {
      maxSeq = Math.max(maxSeq, seq)
    }
  }

  return `PRO-${String(maxSeq + 1).padStart(6, '0')}`
}

async function ensureUniqueProjectId(corporationUuid: string, projectId?: string): Promise<string> {
  const candidate = String(projectId ?? '').trim()
  if (!candidate) {
    return generateNextProjectId(corporationUuid)
  }

  const rows = await mssqlQueryParams<{ id?: number }>(
    `
      SELECT TOP 1 id
      FROM dbo.projects
      WHERE corporation_uuid = @corporationUuid
        AND project_id = @projectId
    `,
    { corporationUuid, projectId: candidate },
  )
  if (rows.length > 0) {
    return generateNextProjectId(corporationUuid)
  }

  return candidate
}

export async function listProjects(corporationUuid: string): Promise<ProjectApiModel[]> {
  const rows = await mssqlQueryParams<ProjectRow>(
    `
      SELECT *
      FROM dbo.projects
      WHERE corporation_uuid = @corporationUuid
        AND ISNULL(is_active, 1) = 1
      ORDER BY created_at DESC
    `,
    { corporationUuid },
  )

  return rows.map(toProjectApiModel)
}

export async function getProjectByUuid(uuid: string): Promise<ProjectApiModel | null> {
  const rows = await mssqlQueryParams<ProjectRow>(
    `
      SELECT TOP 1 *
      FROM dbo.projects
      WHERE uuid = @uuid
        AND ISNULL(is_active, 1) = 1
    `,
    { uuid },
  )

  const row = rows[0]
  return row ? toProjectApiModel(row) : null
}

export async function createProject(input: UpsertProjectInput): Promise<ProjectApiModel> {
  const projectId = await ensureUniqueProjectId(input.corporation_uuid, input.project_id)
  const rows = await mssqlQueryParams<ProjectRow>(
    `
      INSERT INTO dbo.projects (
        uuid,
        corporation_uuid,
        project_name,
        project_id,
        project_type_uuid,
        service_type_uuid,
        customer_uuid,
        project_status,
        project_start_date,
        project_estimated_completion_date,
        estimated_amount,
        area_sq_ft,
        no_of_rooms,
        is_active,
        created_at,
        updated_at
      )
      OUTPUT inserted.*
      VALUES (
        LOWER(CONVERT(varchar(36), NEWID())),
        @corporation_uuid,
        @project_name,
        @project_id,
        @project_type_uuid,
        @service_type_uuid,
        @customer_uuid,
        @project_status,
        @project_start_date,
        @project_estimated_completion_date,
        @estimated_amount,
        @area_sq_ft,
        @no_of_rooms,
        1,
        GETUTCDATE(),
        GETUTCDATE()
      )
    `,
    {
      corporation_uuid: input.corporation_uuid,
      project_name: input.project_name,
      project_id: projectId,
      project_type_uuid: normalizeNullableString(input.project_type_uuid),
      service_type_uuid: normalizeNullableString(input.service_type_uuid),
      customer_uuid: normalizeNullableString(input.customer_uuid),
      project_status: parseProjectStatus(input.project_status),
      project_start_date: normalizeDateInput(input.project_start_date),
      project_estimated_completion_date: normalizeDateInput(input.project_estimated_completion_date),
      estimated_amount: Number(input.estimated_amount ?? 0),
      area_sq_ft: coerceNumberOrNull(input.area_sq_ft),
      no_of_rooms: coerceNumberOrNull(input.no_of_rooms),
    },
  )

  const row = rows[0]
  if (!row) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create project',
    })
  }

  return toProjectApiModel(row)
}

export async function updateProject(uuid: string, input: Partial<UpsertProjectInput>): Promise<ProjectApiModel | null> {
  const existing = await getProjectByUuid(uuid)
  if (!existing) return null

  const nextProjectId = input.project_id && input.project_id !== existing.project_id
    ? await ensureUniqueProjectId(existing.corporation_uuid, input.project_id)
    : existing.project_id

  const rows = await mssqlQueryParams<ProjectRow>(
    `
      UPDATE dbo.projects
      SET
        project_name = @project_name,
        project_id = @project_id,
        project_type_uuid = @project_type_uuid,
        service_type_uuid = @service_type_uuid,
        customer_uuid = @customer_uuid,
        project_status = @project_status,
        project_start_date = @project_start_date,
        project_estimated_completion_date = @project_estimated_completion_date,
        estimated_amount = @estimated_amount,
        area_sq_ft = @area_sq_ft,
        no_of_rooms = @no_of_rooms,
        updated_at = GETUTCDATE()
      OUTPUT inserted.*
      WHERE uuid = @uuid
    `,
    {
      uuid,
      project_name: String(input.project_name ?? existing.project_name),
      project_id: nextProjectId,
      project_type_uuid: normalizeNullableString(input.project_type_uuid ?? existing.project_type_uuid),
      service_type_uuid: normalizeNullableString(input.service_type_uuid ?? existing.service_type_uuid),
      customer_uuid: normalizeNullableString(input.customer_uuid ?? existing.customer_uuid),
      project_status: parseProjectStatus(input.project_status ?? existing.project_status),
      project_start_date: normalizeDateInput(input.project_start_date ?? existing.project_start_date),
      project_estimated_completion_date: normalizeDateInput(input.project_estimated_completion_date ?? existing.project_estimated_completion_date),
      estimated_amount: Number(input.estimated_amount ?? existing.estimated_amount ?? 0),
      area_sq_ft: coerceNumberOrNull(input.area_sq_ft ?? existing.area_sq_ft),
      no_of_rooms: coerceNumberOrNull(input.no_of_rooms ?? existing.no_of_rooms),
    },
  )

  const row = rows[0]
  return row ? toProjectApiModel(row) : null
}

export async function softDeleteProject(uuid: string): Promise<ProjectApiModel | null> {
  const rows = await mssqlQueryParams<ProjectRow>(
    `
      UPDATE dbo.projects
      SET
        is_active = 0,
        updated_at = GETUTCDATE()
      OUTPUT inserted.*
      WHERE uuid = @uuid
    `,
    { uuid },
  )

  const row = rows[0]
  return row ? toProjectApiModel(row) : null
}
