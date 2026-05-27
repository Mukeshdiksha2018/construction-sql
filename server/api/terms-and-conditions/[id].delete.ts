import { deleteTermsAndCondition } from '../../utils/terms-and-conditions'

/** DELETE /api/terms-and-conditions/:id */
export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID is required',
      })
    }

    await deleteTermsAndCondition(id)
    return { success: true, message: 'Terms and condition deleted successfully' }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string, message?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? err.message ?? 'Failed to delete terms and condition',
    })
  }
})
