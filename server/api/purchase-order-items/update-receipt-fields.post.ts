import { applyPurchaseOrderReceiptFieldsUpdate } from '../../utils/receiptNoteReceiptLinePersistence'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!body) {
    throw createError({ statusCode: 400, statusMessage: 'Request body is required' })
  }

  try {
    return await applyPurchaseOrderReceiptFieldsUpdate(body)
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
