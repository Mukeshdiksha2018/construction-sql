import { requireAuthSession } from '../../utils/auth-session'

/**
 * GET /api/credit-days
 * Proxies the Nimble API3 Credit Days list using the signed-in user's Bearer token.
 * Endpoint: {NIMBLE_API3_URL}/v1/GetCreditDaysList
 */
export default defineEventHandler(async (event) => {
  const session = requireAuthSession(event)
  const config = useRuntimeConfig()
  const api3Url = String(config.nimbleApi3Url || '').trim()

  if (!api3Url) {
    throw createError({
      statusCode: 500,
      statusMessage: 'NIMBLE_API3_URL is not configured',
    })
  }

  try {
    const data = await $fetch<{
      listInfo: Array<{
        id: string
        name: string
        creditDays: number | null
        status: number
      }>
    }>(`${api3Url}/v1/GetCreditDaysList`, {
      headers: { Authorization: `Bearer ${session.token}` },
    })

    const list = (data.listInfo || []).map((item) => ({
      id: String(item.id || '').toLowerCase(),
      label: item.name || '',
      value: (item.name || '').toUpperCase().replace(/\s+/g, '_'),
      days: typeof item.creditDays === 'number' ? item.creditDays : null,
    }))

    return { data: list }
  }
  catch (err: unknown) {
    const status = (err as { statusCode?: number })?.statusCode ?? 502
    throw createError({
      statusCode: status,
      statusMessage: 'Failed to fetch Credit Days list from Nimble',
      data: { details: String(err) },
    })
  }
})
