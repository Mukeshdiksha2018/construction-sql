import { setSessionCookie } from '../../utils/auth-session'
import {
  AuthError,
  nimbleLogin,
  parseLoginBody,
  resolveNimbleAuthConfig,
} from '../../utils/nimble-auth'

/**
 * POST /api/auth/login
 * Authenticates via Nimble Open API (uses NUXT_PUBLIC_NIMBLE_OAUTH_EXCHANGE_URL + NUXT_PUBLIC_NIMBLE_PAYABLE_ENV).
 */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const credentials = parseLoginBody(body)
    const config = resolveNimbleAuthConfig(useRuntimeConfig().public)

    const result = await nimbleLogin(credentials, config, $fetch)
    setSessionCookie(event, result.session)
    return result
  }
  catch (error: unknown) {
    if (error instanceof AuthError) {
      throw createError({
        statusCode: error.statusCode,
        statusMessage: error.message,
      })
    }
    throw error
  }
})
