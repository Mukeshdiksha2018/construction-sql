import { updateVendorInvoice } from '../../utils/vendorInvoices'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const uuid = body?.uuid ? String(body.uuid) : ''
  if (!uuid) {
    throw createError({ statusCode: 400, statusMessage: 'uuid is required' })
  }
  try {
    const data = await updateVendorInvoice(uuid, body)
    return { data }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
