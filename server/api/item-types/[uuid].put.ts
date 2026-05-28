import { updateItemType } from '../../utils/itemTypes'

/** PUT /api/item-types/:uuid */
export default defineEventHandler(async (event) => {
  try {
    const uuid = getRouterParam(event, 'uuid') ?? ''
    if (!uuid) throw createError({ statusCode: 400, statusMessage: 'UUID is required' })

    const body = await readBody(event)
    const payload = (body ?? {}) as Record<string, unknown>

    const data = await updateItemType(uuid, {
      ...(payload.corporation_uuid !== undefined && {
        corporation_uuid: typeof payload.corporation_uuid === 'string' ? payload.corporation_uuid : null,
      }),
      ...(payload.category !== undefined && { category: String(payload.category) }),
      ...(payload.spec_type !== undefined && { spec_type: String(payload.spec_type) }),
      ...(payload.item_division_uuid !== undefined && {
        item_division_uuid: typeof payload.item_division_uuid === 'string' ? payload.item_division_uuid : null,
      }),
      ...(payload.item_type !== undefined && { item_type: String(payload.item_type) }),
      ...(payload.description !== undefined && {
        description: typeof payload.description === 'string' ? payload.description : null,
      }),
      ...(payload.is_active !== undefined && { is_active: Boolean(payload.is_active) }),
    })

    return { success: true, data, message: 'Item type updated successfully' }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number; statusMessage?: string }
    throw createError({ statusCode: err.statusCode ?? 500, statusMessage: err.statusMessage ?? 'Failed to update item type' })
  }
})
