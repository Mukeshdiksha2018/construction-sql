import { requireAuthSession } from '../../utils/auth-session'

/**
 * GET /api/nimble/approvals?screenType=21
 * Fetches user approval policy details for the given corporations.
 * Endpoint: {NIMBLE_API3_URL}/v1/GetUserApprovalDetails
 *
 * Query: screenType (20=Journal, 21=Bill/PO)
 * Body:  corporationIds string[]
 * Response: array of approval entries
 */
export default defineEventHandler(async (event) => {
  const session = requireAuthSession(event)
  const config = useRuntimeConfig()
  const api3Url = String(config.nimbleApi3Url || '').trim()

  if (!api3Url) {
    throw createError({ statusCode: 500, statusMessage: 'NIMBLE_API3_URL is not configured' })
  }

  const query = getQuery(event)
  const screenType = Number(query.screenType ?? 21)

  const body = await readBody(event)
  const corporationIds: string[] = Array.isArray(body) ? body : (Array.isArray(body?.corporationIds) ? body.corporationIds : [])

  if (!corporationIds.length) {
    return { approvals: [] }
  }

  try {
    const data = await $fetch<Array<{
      corporationID: string
      name: string
      userName: string
      userID: string
      approvalOrder: number
      approvalType: number
      isCurrentUser: boolean
    }>>(`${api3Url}/v1/GetUserApprovalDetails`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.token}` },
      query: { screenType },
      body: corporationIds,
    })

    const approvals = (Array.isArray(data) ? data : []).map((entry) => ({
      corporationId: String(entry.corporationID || '').toLowerCase(),
      name: entry.name || '',
      userName: entry.userName || '',
      userId: String(entry.userID || '').toLowerCase(),
      approvalOrder: entry.approvalOrder ?? 0,
      approvalType: entry.approvalType ?? 0,
      isCurrentUser: Boolean(entry.isCurrentUser),
    }))

    return { approvals }
  }
  catch (err: unknown) {
    const status = (err as { statusCode?: number })?.statusCode ?? 502
    throw createError({
      statusCode: status,
      statusMessage: 'Failed to fetch approval details from Nimble',
      data: { details: String(err) },
    })
  }
})
