import { getPurchaseOrderInvoiceSummary } from '../../utils/vendorInvoiceSummary'

export default defineEventHandler(async (event) => {
  const { purchase_order_uuid, currentInvoiceUuid } = getQuery(event)
  if (!purchase_order_uuid) {
    throw createError({ statusCode: 400, statusMessage: 'purchase_order_uuid is required' })
  }
  try {
    const summary = await getPurchaseOrderInvoiceSummary(
      String(purchase_order_uuid),
      currentInvoiceUuid ? String(currentInvoiceUuid) : undefined,
    )
    if (!summary) {
      throw createError({ statusCode: 404, statusMessage: 'Purchase order not found' })
    }
    return { data: summary }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
