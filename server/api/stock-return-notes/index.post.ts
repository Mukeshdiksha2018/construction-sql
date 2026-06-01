import { createStockReturnNote } from '../../utils/stockReturnNotes'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!body?.corporation_uuid) throw createError({ statusCode: 400, statusMessage: 'corporation_uuid is required' })

  try {
    const note = await createStockReturnNote(body)
    return { data: note }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
