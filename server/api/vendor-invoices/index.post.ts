import { createVendorInvoice } from '../../utils/vendorInvoices'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  try {
    const data = await createVendorInvoice(body)
    return { data }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
