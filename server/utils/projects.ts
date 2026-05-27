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
