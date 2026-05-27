import { getSessionFromEvent } from '../../utils/auth-session'

/** GET /api/auth/session — return current session from cookie (401 if not logged in) */
export default defineEventHandler((event) => {
  const session = getSessionFromEvent(event)

  if (!session?.token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  return { session }
})
