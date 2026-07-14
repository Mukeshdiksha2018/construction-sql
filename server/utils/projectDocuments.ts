import { mssqlQueryParams } from './mssql'

export interface ProjectDocumentRow {
  id?: number
  uuid?: string
  project_uuid?: string
  document_name?: string
  document_type?: string
  file_size?: number | string | null
  mime_type?: string
  file_url?: string
  file_path?: string
  description?: string | null
  tags?: string | null
  is_primary?: boolean | number | null
  is_active?: boolean | number | null
  uploaded_by?: string | null
  created_at?: string | Date | null
  updated_at?: string | Date | null
}

export interface ProjectDocumentApiModel {
  id: number
  uuid: string
  project_uuid: string
  document_name: string
  document_type: string
  file_size: number
  mime_type: string
  file_url: string
  file_path: string
  description: string | null
  tags: string[]
  is_primary: boolean
  is_active: boolean
  uploaded_by: string | null
  created_at: string | null
  updated_at: string | null
}

export interface CreateDocumentInput {
  project_uuid: string
  document_name: string
  document_type: string
  file_size: number
  mime_type: string
  file_url: string
  file_path: string
  description?: string | null
  tags?: string[]
  is_primary?: boolean
  uploaded_by?: string | null
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

function parseTags(value: unknown): string[] {
  if (Array.isArray(value)) return value as string[]
  if (typeof value === 'string' && value.trim()) {
    try { return JSON.parse(value) as string[] } catch { return [] }
  }
  return []
}

function ns(value: unknown): string | null {
  const s = String(value ?? '').trim()
  return s ? s : null
}

export function toDocumentApiModel(row: ProjectDocumentRow): ProjectDocumentApiModel {
  return {
    id: Number(row.id ?? 0),
    uuid: String(row.uuid ?? ''),
    project_uuid: String(row.project_uuid ?? ''),
    document_name: String(row.document_name ?? ''),
    document_type: String(row.document_type ?? ''),
    file_size: Number(row.file_size ?? 0),
    mime_type: String(row.mime_type ?? ''),
    file_url: String(row.file_url ?? ''),
    file_path: String(row.file_path ?? ''),
    description: ns(row.description),
    tags: parseTags(row.tags),
    is_primary: toBoolean(row.is_primary),
    is_active: toBoolean(row.is_active),
    uploaded_by: ns(row.uploaded_by),
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
  }
}

export async function listProjectDocuments(projectUuid: string): Promise<ProjectDocumentApiModel[]> {
  const rows = await mssqlQueryParams<ProjectDocumentRow>(
    `
      SELECT *
      FROM dbo.project_documents
      WHERE project_uuid = @projectUuid
        AND ISNULL(is_active, 1) = 1
      ORDER BY created_at DESC
    `,
    { projectUuid },
  )
  return rows.map(toDocumentApiModel)
}

export async function getDocumentByUuid(uuid: string): Promise<ProjectDocumentApiModel | null> {
  const rows = await mssqlQueryParams<ProjectDocumentRow>(
    `SELECT TOP 1 * FROM dbo.project_documents WHERE uuid = @uuid`,
    { uuid },
  )
  if (!rows[0]) return null
  const model = toDocumentApiModel(rows[0])
  try {
    const tagRows = await mssqlQueryParams<{ tag: string }>(
      `SELECT tag FROM dbo.project_document_tags WHERE project_document_uuid = @uuid ORDER BY tag`,
      { uuid },
    )
    if (tagRows.length) model.tags = tagRows.map((t) => t.tag)
  }
  catch {
    // Table may not exist until migration is applied — fall back to JSON tags
  }
  return model
}

export async function createProjectDocument(input: CreateDocumentInput): Promise<ProjectDocumentApiModel> {
  const tagsJson = JSON.stringify(input.tags ?? [])

  const rows = await mssqlQueryParams<ProjectDocumentRow>(
    `
      INSERT INTO dbo.project_documents (
        uuid, project_uuid, document_name, document_type, file_size, mime_type,
        file_url, file_path, description, tags, is_primary, is_active, uploaded_by,
        created_at, updated_at
      )
      OUTPUT inserted.*
      VALUES (
        LOWER(CONVERT(NVARCHAR(36), NEWID())),
        @project_uuid, @document_name, @document_type, @file_size, @mime_type,
        @file_url, @file_path, @description, @tags, @is_primary, 1, @uploaded_by,
        GETUTCDATE(), GETUTCDATE()
      )
    `,
    {
      project_uuid: input.project_uuid,
      document_name: input.document_name,
      document_type: input.document_type,
      file_size: Number(input.file_size ?? 0),
      mime_type: input.mime_type,
      file_url: input.file_url,
      file_path: input.file_path,
      description: ns(input.description),
      tags: tagsJson,
      is_primary: (input.is_primary ?? false) ? 1 : 0,
      uploaded_by: ns(input.uploaded_by),
    },
  )

  const row = rows[0]
  if (!row) throw createError({ statusCode: 500, statusMessage: 'Failed to save document record' })

  // Dual-write tags into project_document_tags (prefer junction for queries)
  const tagList = Array.isArray(input.tags)
    ? [...new Set(input.tags.map((t) => String(t).trim()).filter(Boolean).map((t) => t.slice(0, 100)))]
    : []
  if (tagList.length && row.uuid) {
    for (const tag of tagList) {
      await mssqlQueryParams(
        `
          IF NOT EXISTS (
            SELECT 1 FROM dbo.project_document_tags
            WHERE project_document_uuid = @docUuid AND tag = @tag
          )
          INSERT INTO dbo.project_document_tags (uuid, project_document_uuid, tag, created_at)
          VALUES (LOWER(CONVERT(NVARCHAR(36), NEWID())), @docUuid, @tag, GETUTCDATE())
        `,
        { docUuid: row.uuid, tag },
      )
    }
  }

  return toDocumentApiModel(row)
}

export async function softDeleteProjectDocument(uuid: string): Promise<boolean> {
  await mssqlQueryParams(
    `UPDATE dbo.project_documents SET is_active = 0, updated_at = GETUTCDATE() WHERE uuid = @uuid`,
    { uuid },
  )
  return true
}
