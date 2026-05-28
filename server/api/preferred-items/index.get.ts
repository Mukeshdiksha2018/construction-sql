import { listPreferredItems } from '../../utils/preferredItems'

/** GET /api/preferred-items?corporation_uuid=...&project_uuid=... */
export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const corporationUuid = String(query.corporation_uuid || '').trim()
    const projectUuid = String(query.project_uuid || '').trim() || undefined

    if (!corporationUuid) {
      throw createError({ statusCode: 400, statusMessage: 'corporation_uuid is required' })
    }

    const data = await listPreferredItems(corporationUuid, projectUuid)
    return { success: true, data }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number; statusMessage?: string }
    throw createError({ statusCode: err.statusCode ?? 500, statusMessage: err.statusMessage ?? 'Failed to fetch items' })
  }
})
