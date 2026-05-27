import { softDeleteProject } from '../../utils/projects'

/** DELETE /api/projects?uuid=... */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const uuid = String(query.uuid ?? '').trim()

  if (!uuid) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Project UUID is required for deletion',
    })
  }

  try {
    const data = await softDeleteProject(uuid)
    if (!data) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Project not found',
      })
    }
    return { data }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string, message?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? err.message ?? 'Failed to delete project',
    })
  }
})
