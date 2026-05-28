import { getEstimateLineItems } from '../../utils/estimates'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const projectUuid = String(query.project_uuid || '').trim()
  const estimateUuid = String(query.estimate_uuid || '').trim()
  const corporationUuid = String(query.corporation_uuid || '').trim()

  if (!projectUuid || !estimateUuid || !corporationUuid) {
    throw createError({
      statusCode: 400,
      statusMessage: 'project_uuid, estimate_uuid, and corporation_uuid are required',
    })
  }

  try {
    return await getEstimateLineItems(estimateUuid, projectUuid, corporationUuid)
  }
  catch (err: any) {
    if (err.statusCode) throw err
    throw createError({ statusCode: 500, statusMessage: err.message || 'Failed to fetch estimate line items' })
  }
})
