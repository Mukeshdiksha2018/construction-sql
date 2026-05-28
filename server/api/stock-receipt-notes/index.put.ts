import { updateStockReceiptNote } from '../../utils/purchaseOrders'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { uuid } = body ?? {}
  if (!uuid) throw createError({ statusCode: 400, statusMessage: 'uuid is required' })

  try {
    const note = await updateStockReceiptNote(String(uuid), body)
    if (!note) throw createError({ statusCode: 404, statusMessage: 'Receipt note not found' })
    return { data: note }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
