import { listSpecialInstructions } from '../../utils/special-instructions'

/** GET /api/special-instructions */
export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const data = await listSpecialInstructions({
      corporation_uuid: String(query.corporation_uuid ?? ''),
      project_uuid: String(query.project_uuid ?? ''),
    })
    return { success: true, data }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string, message?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? err.message ?? 'Failed to fetch special instructions',
    })
  }
})
