import { buildUsedQuantitiesByItem } from '../../utils/estimateQuantityAvailability'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const projectUuid = String(query.project_uuid || '').trim()
  const estimateUuid = String(query.estimate_uuid || '').trim()
  const corporationUuid = String(query.corporation_uuid || '').trim()
  const excludePoUuid = String(query.exclude_po_uuid || '').trim()

  if (!projectUuid || !estimateUuid || !corporationUuid) {
    throw createError({
      statusCode: 400,
      statusMessage: 'project_uuid, estimate_uuid, and corporation_uuid are required',
    })
  }

  try {
    const data = await buildUsedQuantitiesByItem({
      corporationUuid,
      projectUuid,
      estimateUuid,
      excludePoUuid: excludePoUuid || undefined,
    })
    return { data }
  } catch (error: any) {
    console.error('estimate-quantity-availability API failure', error)
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal server error',
    })
  }
})
