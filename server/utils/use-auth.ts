import type { H3Event } from 'h3'
import type { AuthContext } from './auth-session'
import { requireAuthSession } from './auth-session'

/** Returns authenticated session from event context (set by server middleware). */
export function useAuth(event: H3Event): AuthContext {
  const auth = event.context.auth as AuthContext | undefined
  if (auth?.session?.token) {
    return auth
  }

  const session = requireAuthSession(event)
  return { session }
}
