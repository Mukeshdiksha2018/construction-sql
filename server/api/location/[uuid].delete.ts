import { deleteLocation } from '../../utils/location'

/** DELETE /api/location/:uuid */
export default defineEventHandler(async (event) => {
  try {
    const uuid = getRouterParam(event, 'uuid')
    if (!uuid) {
      throw createError({ statusCode: 400, statusMessage: 'Location UUID is required' })
    }

    await deleteLocation(uuid)
    return { success: true, message: 'Location deleted successfully' }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? 'Failed to delete location',
    })
  }
})
