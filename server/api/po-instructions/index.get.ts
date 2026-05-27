import { listPOInstructions } from '../../utils/po-instructions'

/** GET /api/po-instructions?corporation_uuid=... */
export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const corporationUuid = String(query.corporation_uuid ?? '').trim()

    if (!corporationUuid) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Corporation UUID is required',
      })
    }

    const data = await listPOInstructions(corporationUuid)
    return { success: true, data }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? 'Failed to fetch PO instructions',
    })
  }
})
