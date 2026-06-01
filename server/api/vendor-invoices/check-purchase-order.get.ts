import { hasVendorInvoicesForPurchaseOrder } from '../../utils/vendorInvoices'

export default defineEventHandler(async (event) => {
  const { purchase_order_uuid } = getQuery(event)
  if (!purchase_order_uuid || !String(purchase_order_uuid).trim()) {
    throw createError({ statusCode: 400, statusMessage: 'purchase_order_uuid is required' })
  }
  try {
    const hasVendorInvoices = await hasVendorInvoicesForPurchaseOrder(String(purchase_order_uuid).trim())
    return { data: { hasVendorInvoices } }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
