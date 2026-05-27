import { softDeleteLocationBreakdown } from '../../../utils/projectLocationBreakdowns'

/** DELETE /api/projects/location-breakdowns?uuid=xxx */
export default defineEventHandler(async (event) => {
  const uuid = String(getQuery(event).uuid ?? '').trim()
  if (!uuid) throw createError({ statusCode: 400, statusMessage: 'uuid is required' })

  try {
    await softDeleteLocationBreakdown(uuid)
    return { success: true }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string, message?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? err.message ?? 'Failed to delete location breakdown',
    })
  }
})
