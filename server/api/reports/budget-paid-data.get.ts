import { getBudgetPaidData } from '../../utils/reports/budgetPaidData'

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
    const data = await getBudgetPaidData({
      corporationUuid,
      projectUuid,
      billDateFrom: query.bill_date_from ? String(query.bill_date_from) : undefined,
      billDateTo: query.bill_date_to ? String(query.bill_date_to) : undefined,
    })
    return { data }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
