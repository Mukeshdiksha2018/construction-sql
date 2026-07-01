import {
  createNimbleCreditDays,
  parseNimbleCreditDaysBody,
} from '../../utils/nimbleCreditDays'
import { useAuth } from '../../utils/use-auth'

/**
 * POST /api/nimble/credit-days
 * Legacy Nimble API3-shaped response for CreditDaysSelect inline add.
 */
export default defineEventHandler(async (event) => {
  try {
    useAuth(event)
    const body = await readBody(event)
    const input = parseNimbleCreditDaysBody(body)
    const created = await createNimbleCreditDays(input)

    return {
      ID: created.credit_days_id,
      Name: created.name,
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
