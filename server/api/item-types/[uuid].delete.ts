import { deleteItemType } from '../../utils/itemTypes'

/** DELETE /api/item-types/:uuid */
export default defineEventHandler(async (event) => {
  try {
    const uuid = getRouterParam(event, 'uuid') ?? ''
    if (!uuid) throw createError({ statusCode: 400, statusMessage: 'UUID is required' })

    await deleteItemType(uuid)
    return { success: true, message: 'Item type deleted successfully' }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number; statusMessage?: string }
    throw createError({ statusCode: err.statusCode ?? 500, statusMessage: err.statusMessage ?? 'Failed to delete item type' })
  }
})
