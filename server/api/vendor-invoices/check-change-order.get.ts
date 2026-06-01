import { hasVendorInvoicesForChangeOrder } from '../../utils/vendorInvoices'

export default defineEventHandler(async (event) => {
  const { change_order_uuid } = getQuery(event)
  if (!change_order_uuid || !String(change_order_uuid).trim()) {
    throw createError({ statusCode: 400, statusMessage: 'change_order_uuid is required' })
  }
  try {
    const hasVendorInvoices = await hasVendorInvoicesForChangeOrder(String(change_order_uuid).trim())
    return { data: { hasVendorInvoices } }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
