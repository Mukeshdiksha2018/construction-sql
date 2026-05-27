import { listProjects } from '../../utils/projects'

/** GET /api/projects?corporation_uuid=... */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const corporationUuid = String(query.corporation_uuid ?? '').trim()

  if (!corporationUuid) {
    throw createError({
      statusCode: 400,
      statusMessage: 'corporation_uuid is required',
    })
  }

  try {
    const data = await listProjects(corporationUuid)
    return { data }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string, message?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? err.message ?? 'Failed to fetch projects',
    })
  }
})
