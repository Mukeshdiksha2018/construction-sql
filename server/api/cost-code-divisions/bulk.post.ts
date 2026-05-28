import { bulkCreateCostCodeDivisions } from '../../utils/costCodeDivisions'

/** POST /api/cost-code-divisions/bulk */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const payload = (body ?? {}) as Record<string, unknown>

    const corporationUuid = typeof payload.corporation_uuid === 'string' ? payload.corporation_uuid.trim() : ''
    if (!corporationUuid) throw createError({ statusCode: 400, statusMessage: 'corporation_uuid is required' })

    const divisions = Array.isArray(payload.divisions) ? payload.divisions : []
    const result = await bulkCreateCostCodeDivisions(corporationUuid, divisions)

    return {
      success: true,
      data: result,
      message: `Imported ${result.created} division(s). Skipped ${result.skipped} duplicate(s).`,
    }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number; statusMessage?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? 'Failed to bulk import cost code divisions',
    })
  }
})
