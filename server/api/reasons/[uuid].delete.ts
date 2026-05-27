import { deleteReason } from '../../utils/reasons'

/** DELETE /api/reasons/:uuid */
export default defineEventHandler(async (event) => {
  try {
    const uuid = getRouterParam(event, 'uuid')
    if (!uuid) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Reason UUID is required',
      })
    }

    await deleteReason(uuid)
    return { success: true, message: 'Reason deleted successfully' }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string, message?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? err.message ?? 'Failed to delete reason',
    })
  }
})
