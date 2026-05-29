import { getSessionFromEvent } from '../../utils/auth-session'

/** GET /api/auth/session — return current session from cookie (null when not logged in). */
export default defineEventHandler((event) => {
  const session = getSessionFromEvent(event)
  return { session: session?.token ? session : null }
})
