import {
  parseNimbleCreditDaysBody,
  updateNimbleCreditDays,
} from '../../utils/nimbleCreditDays'
import { useAuth } from '../../utils/use-auth'

/** PUT /api/nimble-credit-days/:id */
export default defineEventHandler(async (event) => {
  try {
    useAuth(event)

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'Credit days ID is required' })
    }

    const body = await readBody(event)
    const input = parseNimbleCreditDaysBody(body)
    const credit_days = await updateNimbleCreditDays(id, input)

    return {
      success: true,
      credit_days,
      message: 'Credit days updated successfully',
    }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? 'Failed to update credit days',
    })
  }
})
