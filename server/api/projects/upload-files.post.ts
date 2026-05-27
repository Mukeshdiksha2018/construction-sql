import { createProjectDocument } from '../utils/projectDocuments'

/**
 * POST /api/projects/upload-files
 *
 * Accepts multipart/form-data with:
 *   - project_uuid  (string)
 *   - uploaded_by   (string, optional)
 *   - files[]       (File objects)
 *
 * Each file is read into a Buffer and stored as a base64 data URL inside
 * project_documents.  In a production setup you would upload to a cloud
 * storage bucket and persist only the URL; the structure here matches the
 * reference project's document shape so the UI works without modification.
 */
export default defineEventHandler(async (event) => {
  const form = await readMultipartFormData(event)
  if (!form) throw createError({ statusCode: 400, statusMessage: 'Multipart form data required' })

  const field = (name: string): string =>
    String(form.find(f => f.name === name)?.data?.toString('utf-8') ?? '').trim()

  const projectUuid = field('project_uuid')
  if (!projectUuid) throw createError({ statusCode: 400, statusMessage: 'project_uuid is required' })

  const uploadedBy = field('uploaded_by') || null

  const fileEntries = form.filter(f => f.name === 'files' || f.name === 'files[]')
  if (!fileEntries.length) throw createError({ statusCode: 400, statusMessage: 'No files provided' })

  try {
    const saved = await Promise.all(
      fileEntries.map(async (entry) => {
        const fileName = entry.filename ?? 'upload'
        const mimeType = entry.type ?? 'application/octet-stream'
        const fileSize = entry.data.length
        const ext = fileName.split('.').pop() ?? 'bin'

        // Generate a deterministic-looking path (no real cloud storage here)
        const ts = Date.now()
        const rand = Math.random().toString(36).slice(2, 10)
        const filePath = `projects/${projectUuid}/documents/${ts}-${rand}.${ext}`
        // Use a data-URL as the file_url placeholder so the UI can render a preview
        const fileUrl = `data:${mimeType};base64,${entry.data.toString('base64')}`

        return createProjectDocument({
          project_uuid: projectUuid,
          document_name: fileName,
          document_type: ext,
          file_size: fileSize,
          mime_type: mimeType,
          file_url: fileUrl,
          file_path: filePath,
          tags: [],
          is_primary: false,
          uploaded_by: uploadedBy,
        })
      }),
    )

    return { data: saved }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string, message?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? err.message ?? 'Failed to upload files',
    })
  }
})
