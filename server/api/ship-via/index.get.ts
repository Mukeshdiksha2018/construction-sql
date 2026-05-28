import { requireAuthSession } from '../../utils/auth-session'

/**
 * GET /api/ship-via
 * Proxies the Nimble API5 ShipVia list using the signed-in user's Bearer token.
 * Endpoint: {NIMBLE_API_BASE_URL}/v1/ShipVia/List
 */
export default defineEventHandler(async (event) => {
  const session = requireAuthSession(event)
  const config = useRuntimeConfig()
  const baseUrl = String(config.nimbleApiBaseUrl || '').trim()

  if (!baseUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: 'NIMBLE_API_BASE_URL is not configured',
    })
  }

  try {
    const data = await $fetch<{
      ShipViaDto: Array<{
        ID: string
        ShipViaName: string
        Description: string | null
        Status: number
      }>
      StatusCode: number
      Status: string
    }>(`${baseUrl}/v1/ShipVia/List`, {
      headers: { Authorization: `Bearer ${session.token}` },
    })

    const list = (data.ShipViaDto || []).map((item) => ({
      id: 0,
      uuid: String(item.ID || '').toLowerCase(),
      ship_via: item.ShipViaName || '',
      description: item.Description ?? null,
      active: item.Status === 1,
    }))

    return { data: list }
  }
  catch (err: unknown) {
    const status = (err as { statusCode?: number })?.statusCode ?? 502
    throw createError({
      statusCode: status,
      statusMessage: 'Failed to fetch ShipVia list from Nimble',
      data: { details: String(err) },
    })
  }
})
