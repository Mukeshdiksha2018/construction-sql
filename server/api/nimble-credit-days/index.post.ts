import { createNimbleCreditDays, parseNimbleCreditDaysBody } from '../../utils/nimbleCreditDays'
import { useAuth } from '../../utils/use-auth'

/** POST /api/nimble-credit-days */
export default defineEventHandler(async (event) => {
  try {
    useAuth(event)
    const body = await readBody(event)
    const input = parseNimbleCreditDaysBody(body)
    const credit_days = await createNimbleCreditDays(input)

    return {
      success: true,
      credit_days,
      message: 'Credit days created successfully',
    }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? 'Failed to create credit days',
    })
  }
})
