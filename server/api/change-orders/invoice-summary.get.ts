import { getChangeOrderInvoiceSummary } from '../../utils/vendorInvoiceSummary'

export default defineEventHandler(async (event) => {
  const { change_order_uuid } = getQuery(event)
  if (!change_order_uuid) {
    throw createError({ statusCode: 400, statusMessage: 'change_order_uuid is required' })
  }

  try {
    const summary = await getChangeOrderInvoiceSummary(String(change_order_uuid))
    if (!summary) {
      throw createError({ statusCode: 404, statusMessage: 'Change order not found' })
    }
    return { data: summary }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
