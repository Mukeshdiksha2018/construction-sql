import { createPreferredItem, updatePreferredItem, deletePreferredItem, getPreferredItemsByProjectAndItemType } from '../../utils/preferredItems'

/**
 * POST /api/preferred-items/bulk
 * Saves an array of rows for a given project + item type combination.
 * Existing rows that are not in the incoming list are deleted.
 */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { corporation_uuid, project_uuid, item_type_uuid, rows } = (body ?? {}) as {
      corporation_uuid?: string
      project_uuid?: string
      item_type_uuid?: string
      rows?: Record<string, unknown>[]
    }

    if (!corporation_uuid) throw createError({ statusCode: 400, statusMessage: 'corporation_uuid is required' })
    if (!project_uuid) throw createError({ statusCode: 400, statusMessage: 'project_uuid is required' })
    if (!item_type_uuid) throw createError({ statusCode: 400, statusMessage: 'item_type_uuid is required' })
    if (!Array.isArray(rows)) throw createError({ statusCode: 400, statusMessage: 'rows must be an array' })

    // Get existing rows in the DB for this combination
    const existing = await getPreferredItemsByProjectAndItemType(corporation_uuid, project_uuid, item_type_uuid)
    const existingUuids = new Set(existing.map(r => r.uuid))
    const incomingUuids = new Set(rows.filter(r => r.uuid).map(r => String(r.uuid)))

    // Delete rows that were removed
    for (const ex of existing) {
      if (!incomingUuids.has(ex.uuid)) {
        await deletePreferredItem(ex.uuid)
      }
    }

    const saved = []
    for (const row of rows) {
      const p = row as Record<string, unknown>
      const payload = {
        corporation_uuid,
        project_uuid,
        item_type_uuid,
        cost_code_configuration_uuid: typeof p.cost_code_configuration_uuid === 'string' ? p.cost_code_configuration_uuid : null,
        category: typeof p.category === 'string' ? p.category : null,
        item_name: String(p.item_name || '').trim(),
        item_sequence: typeof p.item_sequence === 'string' ? p.item_sequence : null,
        model_number: typeof p.model_number === 'string' ? p.model_number : null,
        unit_price: p.unit_price != null && p.unit_price !== '' ? Number(p.unit_price) : null,
        uom_uuid: typeof p.uom_uuid === 'string' ? p.uom_uuid : null,
        location_uuid: typeof p.location_uuid === 'string' ? p.location_uuid : null,
        preferred_vendor_uuid: typeof p.preferred_vendor_uuid === 'string' ? p.preferred_vendor_uuid : null,
        initial_quantity: p.initial_quantity != null && p.initial_quantity !== '' ? Number(p.initial_quantity) : null,
        as_of_date: typeof p.as_of_date === 'string' ? p.as_of_date : null,
        reorder_point: p.reorder_point != null && p.reorder_point !== '' ? Number(p.reorder_point) : null,
        maximum_limit: p.maximum_limit != null && p.maximum_limit !== '' ? Number(p.maximum_limit) : null,
        description: typeof p.description === 'string' ? p.description : null,
        status: typeof p.status === 'string' ? p.status : 'Active',
        is_active: p.is_active !== false,
      }

      if (typeof p.uuid === 'string' && existingUuids.has(p.uuid)) {
        saved.push(await updatePreferredItem(p.uuid, payload))
      }
      else {
        saved.push(await createPreferredItem(payload))
      }
    }

    return { success: true, data: saved, message: 'Items saved successfully' }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number; statusMessage?: string }
    throw createError({ statusCode: err.statusCode ?? 500, statusMessage: err.statusMessage ?? 'Failed to save items' })
  }
})
