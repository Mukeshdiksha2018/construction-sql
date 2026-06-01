import { getReceiptNoteItems } from '../../utils/stockReceiptNotes'

export default defineEventHandler(async (event) => {
  const { receipt_note_uuid } = getQuery(event)
  if (!receipt_note_uuid) {
    throw createError({ statusCode: 400, statusMessage: 'receipt_note_uuid is required' })
  }

  try {
    const items = await getReceiptNoteItems(String(receipt_note_uuid))
    return { data: items }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
