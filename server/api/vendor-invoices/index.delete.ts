import { deleteVendorInvoice } from '../../utils/vendorInvoices'

export default defineEventHandler(async (event) => {
  const { uuid } = getQuery(event)
  if (!uuid || !String(uuid).trim()) {
    throw createError({ statusCode: 400, statusMessage: 'uuid is required' })
  }
  try {
    const data = await deleteVendorInvoice(String(uuid).trim())
    return { data }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
