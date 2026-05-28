import { listItemTypes } from '../../utils/itemTypes'

/** GET /api/item-types?corporation_uuid=... */
export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const corporationUuid = String(query.corporation_uuid || '').trim() || undefined
    const data = await listItemTypes(corporationUuid)
    return { success: true, data }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number; statusMessage?: string }
    throw createError({ statusCode: err.statusCode ?? 500, statusMessage: err.statusMessage ?? 'Failed to fetch item types' })
  }
})
