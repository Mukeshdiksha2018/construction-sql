import { getApAgingReportStub } from '../../../utils/reports/apAgingReport'

export default defineEventHandler(async (event) => {
  const corporationUuid = getRouterParam(event, 'corporationUuid')
  if (!corporationUuid?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Corporation UUID is required' })
  }

  return { data: getApAgingReportStub() }
})
