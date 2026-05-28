import { createCostCodeConfiguration } from '../../utils/costCodeConfigurations'

/** POST /api/cost-code-configurations */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const payload = (body ?? {}) as Record<string, unknown>

    const corporationUuid = typeof payload.corporation_uuid === 'string' ? payload.corporation_uuid.trim() : ''
    const costCodeNumber = typeof payload.cost_code_number === 'string' ? payload.cost_code_number.trim() : ''
    const costCodeName = typeof payload.cost_code_name === 'string' ? payload.cost_code_name.trim() : ''

    if (!corporationUuid) throw createError({ statusCode: 400, statusMessage: 'corporation_uuid is required' })
    if (!costCodeNumber) throw createError({ statusCode: 400, statusMessage: 'cost_code_number is required' })
    if (!costCodeName) throw createError({ statusCode: 400, statusMessage: 'cost_code_name is required' })

    const data = await createCostCodeConfiguration({
      corporation_uuid: corporationUuid,
      cost_code_number: costCodeNumber,
      cost_code_name: costCodeName,
      division_uuid: typeof payload.division_uuid === 'string' ? payload.division_uuid : null,
      parent_cost_code_uuid: typeof payload.parent_cost_code_uuid === 'string' ? payload.parent_cost_code_uuid : null,
      order_number: typeof payload.order_number === 'number' ? payload.order_number : (typeof payload.order === 'number' ? payload.order : null),
      gl_account_uuid: typeof payload.gl_account_uuid === 'string' ? payload.gl_account_uuid : null,
      effective_from: typeof payload.effective_from === 'string' ? payload.effective_from : null,
      description: typeof payload.description === 'string' ? payload.description : null,
      update_previous_transactions: payload.update_previous_transactions === true,
      is_active: payload.is_active !== false,
    })

    return { success: true, data, message: 'Cost code configuration created successfully' }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number; statusMessage?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? 'Failed to create cost code configuration',
    })
  }
})
