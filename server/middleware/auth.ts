import { getRequestURL } from 'h3'
import { isPublicApiRoute, requiresAuthForMethod } from '../utils/api-auth-routes'
import { getSessionFromEvent } from '../utils/auth-session'

/**
 * Protects mutating /api/* routes (POST/PUT/PATCH/DELETE).
 * GET requests are allowed through — same pattern as construction-management print preview.
 * Handlers that need a user token can call requireAuthSession() themselves.
 */
export default defineEventHandler((event) => {
  const { pathname } = getRequestURL(event)

  if (!pathname.startsWith('/api/')) {
    return
  }

  const method = event.method || 'GET'
  if (!requiresAuthForMethod(method)) {
    return
  }

  if (isPublicApiRoute(pathname, method)) {
    return
  }

  const session = getSessionFromEvent(event)
  if (!session?.token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  event.context.auth = { session }
})
