import { getPoWiseStockReport } from '../../utils/reports/poWiseStockReport'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const corporationUuid = String(query.corporation_uuid || '').trim()
  const projectUuid = String(query.project_uuid || '').trim()

  if (!corporationUuid || !projectUuid) {
    throw createError({
      statusCode: 400,
      statusMessage: 'corporation_uuid and project_uuid are required',
    })
  }

  try {
    return await getPoWiseStockReport(event, corporationUuid, projectUuid)
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
