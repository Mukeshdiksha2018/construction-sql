import { listProjectDocuments } from '../../../utils/projectDocuments'

/** GET /api/projects/documents?project_uuid=xxx */
export default defineEventHandler(async (event) => {
  const projectUuid = String(getQuery(event).project_uuid ?? '').trim()
  if (!projectUuid) throw createError({ statusCode: 400, statusMessage: 'project_uuid is required' })

  try {
    const data = await listProjectDocuments(projectUuid)
    return { data }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string, message?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? err.message ?? 'Failed to fetch project documents',
    })
  }
})
