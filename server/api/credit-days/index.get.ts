import { requireAuthSession } from '../../utils/auth-session'
import { listCreditDaysOptions } from '../../utils/nimbleCreditDays'

/**
 * GET /api/credit-days
 * Active credit days options from Nimble MSSQL (`dbo.Frequency`, Type = 3).
 */
export default defineEventHandler(async (event) => {
  requireAuthSession(event)

  try {
    const data = await listCreditDaysOptions()
    return { data }
  }
  catch (err: unknown) {
    const status = (err as { statusCode?: number })?.statusCode ?? 502
    throw createError({
      statusCode: status,
      statusMessage: 'Failed to fetch credit days list',
      data: { details: String(err) },
    })
  }
})
