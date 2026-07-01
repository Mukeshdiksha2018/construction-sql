import { softDeleteNimbleCreditDays } from '../../utils/nimbleCreditDays'
import { useAuth } from '../../utils/use-auth'

/** DELETE /api/nimble-credit-days/:id — soft delete (Status = 3) */
export default defineEventHandler(async (event) => {
  try {
    useAuth(event)

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'Credit days ID is required' })
    }

    const credit_days = await softDeleteNimbleCreditDays(id)

    return {
      success: true,
      credit_days,
      message: 'Credit days deleted successfully',
    }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? 'Failed to delete credit days',
    })
  }
})
