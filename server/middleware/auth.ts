import { getRequestURL } from 'h3'
import { isPublicApiRoute } from '../utils/api-auth-routes'
import { getSessionFromEvent } from '../utils/auth-session'

/**
 * Protects /api/* routes (except public auth endpoints).
 * Sets event.context.auth when a valid session cookie is present.
 */
export default defineEventHandler((event) => {
  const { pathname } = getRequestURL(event)

  if (!pathname.startsWith('/api/')) {
    return
  }

  const method = event.method || 'GET'
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
