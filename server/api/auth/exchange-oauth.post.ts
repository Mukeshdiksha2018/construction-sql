import { setSessionCookie } from '../../utils/auth-session'
import {
  AuthError,
  nimbleExchangeOAuth,
  resolveNimbleOAuthConfig,
} from '../../utils/nimble-auth'

/**
 * POST /api/auth/exchange-oauth
 * Exchanges Nimble authId from URL and sets session cookie.
 */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const authId = String((body as { authId?: string, token?: string } | null)?.authId
      || (body as { authId?: string, token?: string } | null)?.token
      || '')
      .trim()

    if (!authId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'authId is required',
      })
    }

    const config = resolveNimbleOAuthConfig(useRuntimeConfig().public)
    const result = await nimbleExchangeOAuth(authId, config, $fetch)

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
