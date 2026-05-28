import { createCostCodeDivision } from '../../utils/costCodeDivisions'

/** POST /api/cost-code-divisions */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const payload = (body ?? {}) as Record<string, unknown>

    const corporationUuid = typeof payload.corporation_uuid === 'string' ? payload.corporation_uuid.trim() : ''
    const divisionNumber = typeof payload.division_number === 'string' ? payload.division_number.trim() : ''
    const divisionName = typeof payload.division_name === 'string' ? payload.division_name.trim() : ''

    if (!corporationUuid) throw createError({ statusCode: 400, statusMessage: 'corporation_uuid is required' })
    if (!divisionNumber) throw createError({ statusCode: 400, statusMessage: 'division_number is required' })
    if (!divisionName) throw createError({ statusCode: 400, statusMessage: 'division_name is required' })

    const data = await createCostCodeDivision({
      corporation_uuid: corporationUuid,
      division_number: divisionNumber,
      division_name: divisionName,
      division_order: typeof payload.division_order === 'number' ? payload.division_order : 1,
      description: typeof payload.description === 'string' ? payload.description : null,
      is_active: payload.is_active !== false,
      exclude_in_estimates_and_reports: payload.exclude_in_estimates_and_reports === true,
    })

    return { success: true, data, message: 'Cost code division created successfully' }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number; statusMessage?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? 'Failed to create cost code division',
    })
  }
})
