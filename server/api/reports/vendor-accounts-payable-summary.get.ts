import { getVendorAccountsPayableSummary } from '../../utils/reports/vendorAccountsPayableSummary'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const corporationUuid = String(query.corporation_uuid || '').trim()
  const projectUuid = String(query.project_uuid || '').trim()
  const startDate = String(query.start_date || '').trim()
  const endDate = String(query.end_date || '').trim()

  if (!corporationUuid || !projectUuid || !startDate || !endDate) {
    throw createError({
      statusCode: 400,
      statusMessage: 'corporation_uuid, project_uuid, start_date, and end_date are required',
    })
  }

  try {
    return await getVendorAccountsPayableSummary(event, {
      corporationUuid,
      projectUuid,
      startDate,
      endDate,
    })
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
