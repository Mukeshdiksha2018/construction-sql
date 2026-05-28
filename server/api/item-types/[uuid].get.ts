import { getItemTypeByUuid } from '../../utils/itemTypes'

/** GET /api/item-types/:uuid */
export default defineEventHandler(async (event) => {
  try {
    const uuid = getRouterParam(event, 'uuid') ?? ''
    if (!uuid) throw createError({ statusCode: 400, statusMessage: 'UUID is required' })

    const data = await getItemTypeByUuid(uuid)
    if (!data) throw createError({ statusCode: 404, statusMessage: 'Item type not found' })

    return { success: true, data }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number; statusMessage?: string }
    throw createError({ statusCode: err.statusCode ?? 500, statusMessage: err.statusMessage ?? 'Failed to fetch item type' })
  }
})
