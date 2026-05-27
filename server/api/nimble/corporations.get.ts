import { fetchNimbleCorporations } from '../../utils/nimble-corporations'
import { requireAuthSession } from '../../utils/auth-session'

/**
 * GET /api/nimble/corporations?IsShowAll=false
 * Proxies Nimble API5 corporations list using the signed-in user's Bearer token.
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

  const query = getQuery(event)
  const isShowAll = query.IsShowAll === 'true' || query.IsShowAll === true

  try {
    const corporations = await fetchNimbleCorporations(baseUrl, session.token, isShowAll)
    return { corporations }
  }
  catch (err: unknown) {
    const status = (err as { statusCode?: number })?.statusCode ?? 502
    throw createError({
      statusCode: status,
      statusMessage: 'Failed to fetch corporations from Nimble',
      data: { details: String(err) },
    })
  }
})
