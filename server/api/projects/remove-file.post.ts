import { softDeleteProjectDocument } from '../utils/projectDocuments'

/**
 * POST /api/projects/remove-file
 * Body: { uuid: string }
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const uuid = String(body?.uuid ?? '').trim()
  if (!uuid) throw createError({ statusCode: 400, statusMessage: 'Document uuid is required' })

  try {
    await softDeleteProjectDocument(uuid)
    return { success: true }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string, message?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? err.message ?? 'Failed to remove file',
    })
  }
})
