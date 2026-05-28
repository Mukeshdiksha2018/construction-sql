import { createPreferredItem } from '../../utils/preferredItems'

/** POST /api/preferred-items */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const p = (body ?? {}) as Record<string, unknown>

    if (!p.corporation_uuid) throw createError({ statusCode: 400, statusMessage: 'corporation_uuid is required' })
    if (!p.item_name) throw createError({ statusCode: 400, statusMessage: 'item_name is required' })

    const data = await createPreferredItem({
      corporation_uuid: String(p.corporation_uuid),
      project_uuid: typeof p.project_uuid === 'string' ? p.project_uuid : null,
      cost_code_configuration_uuid: typeof p.cost_code_configuration_uuid === 'string' ? p.cost_code_configuration_uuid : null,
      item_type_uuid: typeof p.item_type_uuid === 'string' ? p.item_type_uuid : null,
      category: typeof p.category === 'string' ? p.category : null,
      item_name: String(p.item_name),
      item_sequence: typeof p.item_sequence === 'string' ? p.item_sequence : null,
      model_number: typeof p.model_number === 'string' ? p.model_number : null,
      unit_price: p.unit_price != null ? Number(p.unit_price) : null,
      unit: typeof p.unit === 'string' ? p.unit : null,
      location_uuid: typeof p.location_uuid === 'string' ? p.location_uuid : null,
      preferred_vendor_uuid: typeof p.preferred_vendor_uuid === 'string' ? p.preferred_vendor_uuid : null,
      initial_quantity: p.initial_quantity != null && p.initial_quantity !== '' ? Number(p.initial_quantity) : null,
      as_of_date: typeof p.as_of_date === 'string' ? p.as_of_date : null,
      reorder_point: p.reorder_point != null && p.reorder_point !== '' ? Number(p.reorder_point) : null,
      maximum_limit: p.maximum_limit != null && p.maximum_limit !== '' ? Number(p.maximum_limit) : null,
      description: typeof p.description === 'string' ? p.description : null,
      status: typeof p.status === 'string' ? p.status : 'Active',
      is_active: p.is_active !== false,
    })

    return { success: true, data, message: 'Item created successfully' }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number; statusMessage?: string }
    throw createError({ statusCode: err.statusCode ?? 500, statusMessage: err.statusMessage ?? 'Failed to create item' })
  }
})
