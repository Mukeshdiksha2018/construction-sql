import { updatePreferredItem } from '../../utils/preferredItems'

/** PUT /api/preferred-items/:uuid */
export default defineEventHandler(async (event) => {
  try {
    const uuid = getRouterParam(event, 'uuid') ?? ''
    if (!uuid) throw createError({ statusCode: 400, statusMessage: 'UUID is required' })

    const body = await readBody(event)
    const p = (body ?? {}) as Record<string, unknown>

    const data = await updatePreferredItem(uuid, {
      ...(p.project_uuid !== undefined && { project_uuid: typeof p.project_uuid === 'string' ? p.project_uuid : null }),
      ...(p.cost_code_configuration_uuid !== undefined && { cost_code_configuration_uuid: typeof p.cost_code_configuration_uuid === 'string' ? p.cost_code_configuration_uuid : null }),
      ...(p.item_type_uuid !== undefined && { item_type_uuid: typeof p.item_type_uuid === 'string' ? p.item_type_uuid : null }),
      ...(p.category !== undefined && { category: typeof p.category === 'string' ? p.category : null }),
      ...(p.item_name !== undefined && { item_name: String(p.item_name) }),
      ...(p.item_sequence !== undefined && { item_sequence: typeof p.item_sequence === 'string' ? p.item_sequence : null }),
      ...(p.model_number !== undefined && { model_number: typeof p.model_number === 'string' ? p.model_number : null }),
      ...(p.unit_price !== undefined && { unit_price: p.unit_price != null ? Number(p.unit_price) : null }),
      ...(p.uom_uuid !== undefined && { uom_uuid: typeof p.uom_uuid === 'string' ? p.uom_uuid : null }),
      ...(p.location_uuid !== undefined && { location_uuid: typeof p.location_uuid === 'string' ? p.location_uuid : null }),
      ...(p.preferred_vendor_uuid !== undefined && { preferred_vendor_uuid: typeof p.preferred_vendor_uuid === 'string' ? p.preferred_vendor_uuid : null }),
      ...(p.initial_quantity !== undefined && { initial_quantity: p.initial_quantity != null && p.initial_quantity !== '' ? Number(p.initial_quantity) : null }),
      ...(p.as_of_date !== undefined && { as_of_date: typeof p.as_of_date === 'string' ? p.as_of_date : null }),
      ...(p.reorder_point !== undefined && { reorder_point: p.reorder_point != null && p.reorder_point !== '' ? Number(p.reorder_point) : null }),
      ...(p.maximum_limit !== undefined && { maximum_limit: p.maximum_limit != null && p.maximum_limit !== '' ? Number(p.maximum_limit) : null }),
      ...(p.description !== undefined && { description: typeof p.description === 'string' ? p.description : null }),
      ...(p.status !== undefined && { status: String(p.status) }),
      ...(p.is_active !== undefined && { is_active: Boolean(p.is_active) }),
    })

    return { success: true, data, message: 'Item updated successfully' }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number; statusMessage?: string }
    throw createError({ statusCode: err.statusCode ?? 500, statusMessage: err.statusMessage ?? 'Failed to update item' })
  }
})
