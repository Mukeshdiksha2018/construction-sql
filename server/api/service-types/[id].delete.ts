import { deleteServiceType } from '../../utils/service-types'

/** DELETE /api/service-types/:id */
export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Service type ID is required',
      })
    }

    await deleteServiceType(id)
    return { success: true, message: 'Service type deleted successfully' }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string, message?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? err.message ?? 'Failed to delete service type',
    })
  }
})
