import type { NimbleSession } from '~/stores/auth'

/**
 * Exchange a one-time Nimble `authId` from the launch URL for a Bearer session token.
 * Call whenever `authId` is present — do not skip when an older cookie/Pinia session exists.
 */
export async function exchangeNimbleAuthId(authId: string): Promise<NimbleSession | null> {
  const trimmed = String(authId ?? '').trim()
  if (!trimmed) return null

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
