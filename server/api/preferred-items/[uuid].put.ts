import { updatePreferredItem } from '../../utils/preferredItems'

/** PUT /api/preferred-items/:uuid */
export default defineEventHandler(async (event) => {
  try {
    const uuid = getRouterParam(event, 'uuid') ?? ''
    if (!uuid) throw createError({ statusCode: 400, statusMessage: 'UUID is required' })

    const body = await readBody(event)
    const payload = (body ?? {}) as Record<string, unknown>

    const data = await updatePreferredItem(uuid, {
      ...(payload.project_uuid !== undefined && { project_uuid: typeof payload.project_uuid === 'string' ? payload.project_uuid : null }),
      ...(payload.cost_code_configuration_uuid !== undefined && { cost_code_configuration_uuid: typeof payload.cost_code_configuration_uuid === 'string' ? payload.cost_code_configuration_uuid : null }),
      ...(payload.item_type_uuid !== undefined && { item_type_uuid: typeof payload.item_type_uuid === 'string' ? payload.item_type_uuid : null }),
      ...(payload.category !== undefined && { category: typeof payload.category === 'string' ? payload.category : null }),
      ...(payload.item_name !== undefined && { item_name: String(payload.item_name) }),
      ...(payload.unit_price !== undefined && { unit_price: payload.unit_price != null ? Number(payload.unit_price) : null }),
      ...(payload.unit !== undefined && { unit: typeof payload.unit === 'string' ? payload.unit : null }),
      ...(payload.description !== undefined && { description: typeof payload.description === 'string' ? payload.description : null }),
      ...(payload.status !== undefined && { status: String(payload.status) }),
      ...(payload.is_active !== undefined && { is_active: Boolean(payload.is_active) }),
    })

    return { success: true, data, message: 'Item updated successfully' }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number; statusMessage?: string }
    throw createError({ statusCode: err.statusCode ?? 500, statusMessage: err.statusMessage ?? 'Failed to update item' })
  }
})
