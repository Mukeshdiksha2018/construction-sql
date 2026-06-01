import type { NimbleSession } from '~/stores/auth'

/**
 * Exchange a one-time Nimble `authId` from the launch URL for a Bearer session token.
 * On the server, sets the session cookie on the incoming request so SSR + iframe loads work.
 */
export async function exchangeNimbleAuthId(authId: string): Promise<NimbleSession | null> {
  const trimmed = String(authId ?? '').trim()
  if (!trimmed) return null

  if (import.meta.server) {
    try {
      const event = useRequestEvent()
      if (event) {
        const { nimbleExchangeOAuth, resolveNimbleOAuthConfig } = await import(
          '../../server/utils/nimble-auth'
        )
        const { setSessionCookie } = await import('../../server/utils/auth-session')
        const config = resolveNimbleOAuthConfig(useRuntimeConfig().public)
        const result = await nimbleExchangeOAuth(trimmed, config, $fetch)
        setSessionCookie(event, result.session)
        return result.session as NimbleSession
      }
    }
    catch {
      return null
    }
  }

  try {
    const result = await $fetch<{ session: NimbleSession }>('/api/auth/exchange-oauth', {
      method: 'POST',
      body: { authId: trimmed },
      credentials: 'include',
    })
    return result?.session?.token ? result.session : null
  }
  catch {
    return null
  }
}
