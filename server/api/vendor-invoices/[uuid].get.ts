import { getVendorInvoice } from '../../utils/vendorInvoices'

export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, 'uuid')
  if (!uuid?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'uuid is required' })
  }
  try {
    const data = await getVendorInvoice(uuid.trim())
    if (!data) {
      throw createError({ statusCode: 404, statusMessage: 'Vendor invoice not found' })
    }
    return { data }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
