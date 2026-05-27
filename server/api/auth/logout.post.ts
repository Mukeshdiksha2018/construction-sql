import { clearSessionCookie } from '../../utils/auth-session'

/** POST /api/auth/logout — clear server session cookie */
export default defineEventHandler((event) => {
  clearSessionCookie(event)
  return { ok: true }
})
