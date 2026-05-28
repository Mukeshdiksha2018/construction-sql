import { getReturnNoteItems } from '../../utils/purchaseOrders'

export default defineEventHandler(async (event) => {
  const { return_note_uuid } = getQuery(event)
  if (!return_note_uuid) throw createError({ statusCode: 400, statusMessage: 'return_note_uuid is required' })

  try {
    const items = await getReturnNoteItems(String(return_note_uuid))
    return { data: items }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
