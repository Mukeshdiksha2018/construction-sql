import { requireAuthSession } from '../../utils/auth-session'

/**
 * GET /api/nimble/uom
 * Proxies the Nimble API5 UOM list using the signed-in user's Bearer token.
 * Endpoint: {NIMBLE_API_BASE_URL}/v1/UOM/List
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
      UOMDTO: Array<{
        ID: string
        ClientID: string
        UOMType: string
        UOMName: string
        ShortName: string
        Status: number
      }>
      StatusCode: number
      Status: string
    }>(`${baseUrl}/v1/UOM/List`, {
      headers: { Authorization: `Bearer ${session.token}` },
    })

    return { uom: data.UOMDTO || [], total: (data.UOMDTO || []).length }
  }
  catch (err: unknown) {
    const status = (err as { statusCode?: number })?.statusCode ?? 502
    throw createError({
      statusCode: status,
      statusMessage: 'Failed to fetch UOM list from Nimble',
      data: { details: String(err) },
    })
  }
})
