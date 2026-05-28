import { updateCostCodeDivision } from '../../utils/costCodeDivisions'

/** PUT /api/cost-code-divisions/:uuid */
export default defineEventHandler(async (event) => {
  try {
    const uuid = getRouterParam(event, 'uuid') ?? ''
    if (!uuid) throw createError({ statusCode: 400, statusMessage: 'uuid is required' })

    const body = await readBody(event)
    const payload = (body ?? {}) as Record<string, unknown>

    const data = await updateCostCodeDivision(uuid, {
      ...(payload.division_number !== undefined && { division_number: String(payload.division_number) }),
      ...(payload.division_name !== undefined && { division_name: String(payload.division_name) }),
      ...(payload.division_order !== undefined && { division_order: Number(payload.division_order) }),
      ...(payload.description !== undefined && { description: payload.description ? String(payload.description) : null }),
      ...(payload.is_active !== undefined && { is_active: Boolean(payload.is_active) }),
      ...(payload.exclude_in_estimates_and_reports !== undefined && { exclude_in_estimates_and_reports: Boolean(payload.exclude_in_estimates_and_reports) }),
    })

    return { success: true, data, message: 'Cost code division updated successfully' }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number; statusMessage?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? 'Failed to update cost code division',
    })
  }
})
