import { createSpecialInstruction } from '../../utils/special-instructions'

/** POST /api/special-instructions */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const payload = body as Record<string, unknown>
    const data = await createSpecialInstruction({
      corporation_uuid: String(payload.corporation_uuid ?? ''),
      project_uuid: String(payload.project_uuid ?? ''),
      name: String(payload.name ?? ''),
      content: String(payload.content ?? ''),
      isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : true,
    })
    return { success: true, data }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string, message?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? err.message ?? 'Failed to create special instruction',
    })
  }
})
