import { randomUUID } from 'node:crypto'

/** Bill entry attachment upload — stores metadata in response (stub). */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const files = Array.isArray(body?.files) ? body.files : []
  const attachments = files.map((file: any) => ({
    uuid: randomUUID(),
    document_name: file?.name || 'attachment',
    mime_type: file?.type || 'application/octet-stream',
    file_size: Number(file?.size) || 0,
    file_url: file?.fileData || file?.url || null,
    uploaded_at: new Date().toISOString(),
  }))
  return { success: true, attachments, errors: [] }
})
