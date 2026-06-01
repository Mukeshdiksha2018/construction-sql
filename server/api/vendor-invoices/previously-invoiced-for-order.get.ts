import { getPreviouslyInvoicedForOrder } from '../../utils/vendorInvoices'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  try {
    return await getPreviouslyInvoicedForOrder({
      corporation_uuid: String(q.corporation_uuid || ''),
      purchase_order_uuid: q.purchase_order_uuid ? String(q.purchase_order_uuid) : undefined,
      change_order_uuid: q.change_order_uuid ? String(q.change_order_uuid) : undefined,
      exclude_vendor_invoice_uuid: q.exclude_vendor_invoice_uuid
        ? String(q.exclude_vendor_invoice_uuid)
        : undefined,
    })
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
