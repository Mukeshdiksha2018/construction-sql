import { getNimbleCreditDaysById } from '../../utils/nimbleCreditDays'
import { useAuth } from '../../utils/use-auth'

/** GET /api/nimble-credit-days/:id */
export default defineEventHandler(async (event) => {
  try {
    useAuth(event)

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'Credit days ID is required' })
    }

    const credit_days = await getNimbleCreditDaysById(id)
    if (!credit_days) {
      throw createError({ statusCode: 404, statusMessage: 'Credit days not found' })
    }

    return { success: true, credit_days }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? 'Failed to fetch credit days',
    })
  }
})
