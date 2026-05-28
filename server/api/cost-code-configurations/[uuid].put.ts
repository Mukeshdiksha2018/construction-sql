import { updateCostCodeConfiguration } from '../../utils/costCodeConfigurations'

/** PUT /api/cost-code-configurations/:uuid */
export default defineEventHandler(async (event) => {
  try {
    const uuid = getRouterParam(event, 'uuid') ?? ''
    if (!uuid) throw createError({ statusCode: 400, statusMessage: 'uuid is required' })

    const body = await readBody(event)
    const payload = (body ?? {}) as Record<string, unknown>

    const data = await updateCostCodeConfiguration(uuid, {
      ...(payload.division_uuid !== undefined && { division_uuid: payload.division_uuid ? String(payload.division_uuid) : null }),
      ...(payload.cost_code_number !== undefined && { cost_code_number: String(payload.cost_code_number) }),
      ...(payload.cost_code_name !== undefined && { cost_code_name: String(payload.cost_code_name) }),
      ...(payload.parent_cost_code_uuid !== undefined && { parent_cost_code_uuid: payload.parent_cost_code_uuid ? String(payload.parent_cost_code_uuid) : null }),
      ...(payload.order_number !== undefined && { order_number: payload.order_number !== null ? Number(payload.order_number) : null }),
      ...(payload.order !== undefined && payload.order_number === undefined && { order_number: payload.order !== null ? Number(payload.order) : null }),
      ...(payload.gl_account_uuid !== undefined && { gl_account_uuid: payload.gl_account_uuid ? String(payload.gl_account_uuid) : null }),
      ...(payload.effective_from !== undefined && { effective_from: payload.effective_from ? String(payload.effective_from) : null }),
      ...(payload.description !== undefined && { description: payload.description ? String(payload.description) : null }),
      ...(payload.update_previous_transactions !== undefined && { update_previous_transactions: Boolean(payload.update_previous_transactions) }),
      ...(payload.is_active !== undefined && { is_active: Boolean(payload.is_active) }),
    })

    return { success: true, data, message: 'Cost code configuration updated successfully' }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number; statusMessage?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? 'Failed to update cost code configuration',
    })
  }
})
