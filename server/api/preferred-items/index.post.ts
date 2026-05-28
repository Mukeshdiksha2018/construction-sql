import { createPreferredItem } from '../../utils/preferredItems'

/** POST /api/preferred-items */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const payload = (body ?? {}) as Record<string, unknown>

    if (!payload.corporation_uuid) throw createError({ statusCode: 400, statusMessage: 'corporation_uuid is required' })
    if (!payload.item_name) throw createError({ statusCode: 400, statusMessage: 'item_name is required' })

    const data = await createPreferredItem({
      corporation_uuid: String(payload.corporation_uuid),
      project_uuid: typeof payload.project_uuid === 'string' ? payload.project_uuid : null,
      cost_code_configuration_uuid: typeof payload.cost_code_configuration_uuid === 'string' ? payload.cost_code_configuration_uuid : null,
      item_type_uuid: typeof payload.item_type_uuid === 'string' ? payload.item_type_uuid : null,
      category: typeof payload.category === 'string' ? payload.category : null,
      item_name: String(payload.item_name),
      unit_price: payload.unit_price != null ? Number(payload.unit_price) : null,
      unit: typeof payload.unit === 'string' ? payload.unit : null,
      description: typeof payload.description === 'string' ? payload.description : null,
      status: typeof payload.status === 'string' ? payload.status : 'Active',
      is_active: payload.is_active !== false,
    })

    return { success: true, data, message: 'Item created successfully' }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number; statusMessage?: string }
    throw createError({ statusCode: err.statusCode ?? 500, statusMessage: err.statusMessage ?? 'Failed to create item' })
  }
})
