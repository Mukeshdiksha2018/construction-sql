import {
  listNimbleCreditDays,
  type NimbleCreditDaysStatus,
} from '../../utils/nimbleCreditDays'
import { useAuth } from '../../utils/use-auth'

/** GET /api/nimble-credit-days */
export default defineEventHandler(async (event) => {
  try {
    useAuth(event)

    const query = getQuery(event)
    const statusRaw = query.status
    const status = statusRaw != null && statusRaw !== ''
      ? Number(statusRaw) as NimbleCreditDaysStatus
      : undefined
    const includeDeleted = String(query.include_deleted ?? '').toLowerCase() === 'true'

    const credit_days = await listNimbleCreditDays({ status, includeDeleted })

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
