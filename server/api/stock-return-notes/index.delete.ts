import { deleteStockReturnNote } from '../../utils/stockReturnNotes'

export default defineEventHandler(async (event) => {
  const { uuid } = getQuery(event)
  if (!uuid) throw createError({ statusCode: 400, statusMessage: 'uuid is required' })

  try {
    const note = await deleteStockReturnNote(String(uuid))
    if (!note) throw createError({ statusCode: 404, statusMessage: 'Return note not found' })
    return { data: note }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
