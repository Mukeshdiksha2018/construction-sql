import type { H3Event } from 'h3'
import { getSessionFromEvent } from './auth-session'

/** Bearer token for Nimble API3: signed-in user first, then optional server fallback. */
export function resolveNimbleBearerForEvent(event: H3Event): string | null {
  const session = getSessionFromEvent(event)
  if (session?.token) return session.token

  const config = useRuntimeConfig()
  const fallback = String((config as Record<string, unknown>).nimbleToken || '').trim()
  return fallback || null
}
