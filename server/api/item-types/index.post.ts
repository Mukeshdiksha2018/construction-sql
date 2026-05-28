import { createItemType } from '../../utils/itemTypes'

/** POST /api/item-types */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const payload = (body ?? {}) as Record<string, unknown>

    const category = typeof payload.category === 'string' ? payload.category.trim() : ''
    const specType = typeof payload.spec_type === 'string' ? payload.spec_type.trim() : ''
    const itemType = typeof payload.item_type === 'string' ? payload.item_type.trim() : ''

    if (!category) throw createError({ statusCode: 400, statusMessage: 'Category is required' })
    if (!specType) throw createError({ statusCode: 400, statusMessage: 'Spec Type is required' })
    if (!itemType) throw createError({ statusCode: 400, statusMessage: 'Item Type is required' })

    const data = await createItemType({
      corporation_uuid: typeof payload.corporation_uuid === 'string' ? payload.corporation_uuid : null,
      category,
      spec_type: specType,
      item_division_uuid: typeof payload.item_division_uuid === 'string' ? payload.item_division_uuid : null,
      item_type: itemType,
      description: typeof payload.description === 'string' ? payload.description : null,
      is_active: payload.is_active !== false,
    })

    return { success: true, data, message: 'Item type created successfully' }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number; statusMessage?: string }
    throw createError({ statusCode: err.statusCode ?? 500, statusMessage: err.statusMessage ?? 'Failed to create item type' })
  }
})
