import { replaceReturnNoteItems } from '../../utils/stockReturnNotes'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { return_note_uuid, corporation_uuid, project_uuid, items } = body ?? {}
  if (!return_note_uuid) throw createError({ statusCode: 400, statusMessage: 'return_note_uuid is required' })

  try {
    const result = await replaceReturnNoteItems(
      String(return_note_uuid),
      corporation_uuid ? String(corporation_uuid) : null,
      project_uuid ? String(project_uuid) : null,
      Array.isArray(items) ? items : []
    )
    return { data: result }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
