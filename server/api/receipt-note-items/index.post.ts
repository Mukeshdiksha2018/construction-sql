import { replaceReceiptNoteItems } from '../../utils/stockReceiptNotes'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { receipt_note_uuid, corporation_uuid, project_uuid, items } = body || {}

  if (!receipt_note_uuid) {
    throw createError({ statusCode: 400, statusMessage: 'receipt_note_uuid is required' })
  }

  try {
    const result = await replaceReceiptNoteItems(
      String(receipt_note_uuid),
      corporation_uuid ? String(corporation_uuid) : null,
      project_uuid ? String(project_uuid) : null,
      Array.isArray(items) ? items : [],
    )
    return { data: result }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
