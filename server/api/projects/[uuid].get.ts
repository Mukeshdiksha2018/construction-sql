import { getProjectByUuid } from '../../utils/projects'

/** GET /api/projects/:uuid */
export default defineEventHandler(async (event) => {
  const uuid = String(getRouterParam(event, 'uuid') ?? '').trim()
  if (!uuid) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Project UUID is required',
    })
  }

  try {
    const data = await getProjectByUuid(uuid)
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
      statusMessage: err.statusMessage ?? err.message ?? 'Failed to fetch project',
    })
  }
})
