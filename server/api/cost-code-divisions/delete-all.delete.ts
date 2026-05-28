import { deleteAllCostCodeDivisions } from '../../utils/costCodeDivisions'

/** DELETE /api/cost-code-divisions/delete-all?corporation_uuid=... */
export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const corporationUuid = String(query.corporation_uuid ?? '')

    if (!corporationUuid) throw createError({ statusCode: 400, statusMessage: 'corporation_uuid is required' })

    await deleteAllCostCodeDivisions(corporationUuid)
    return { success: true, message: 'All cost code divisions deleted successfully' }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number; statusMessage?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? 'Failed to delete all cost code divisions',
    })
  }
})
