import { deleteStockReceiptNote } from '../../utils/stockReceiptNotes'

export default defineEventHandler(async (event) => {
  const { uuid } = getQuery(event)
  if (!uuid) throw createError({ statusCode: 400, statusMessage: 'uuid is required' })

  try {
    const note = await deleteStockReceiptNote(String(uuid))
    if (!note) throw createError({ statusCode: 404, statusMessage: 'Receipt note not found' })
    return { data: note }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
