import { listCostCodeConfigurations } from '../../utils/costCodeConfigurations'

/** GET /api/cost-code-configurations?corporation_uuid=... */
export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const corporationUuid = String(query.corporation_uuid ?? '')

    if (!corporationUuid) throw createError({ statusCode: 400, statusMessage: 'corporation_uuid is required' })

    const data = await listCostCodeConfigurations(corporationUuid)
    return { success: true, data }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number; statusMessage?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? 'Failed to fetch cost code configurations',
    })
  }
})
