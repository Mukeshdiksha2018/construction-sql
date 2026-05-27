import { deleteFreight } from '../../utils/freight'

/** DELETE /api/freight/:uuid */
export default defineEventHandler(async (event) => {
  try {
    const uuid = getRouterParam(event, 'uuid')
    if (!uuid) {
      throw createError({ statusCode: 400, statusMessage: 'Freight UUID is required' })
    }

    await deleteFreight(uuid)
    return { success: true, message: 'Freight deleted successfully' }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? 'Failed to delete freight',
    })
  }
})
