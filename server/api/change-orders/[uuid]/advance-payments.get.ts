import { listAdvancePaymentsForChangeOrder } from '../../../utils/vendorInvoiceAdvancePayments'

export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, 'uuid')
  if (!uuid?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Change order UUID is required' })
  }

  try {
    const data = await listAdvancePaymentsForChangeOrder(uuid.trim())
    return { data }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
