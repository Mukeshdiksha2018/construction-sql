import type { NimbleSession } from '~/stores/auth'

/** Sync Pinia auth state from the server session cookie. */
export async function fetchServerSession(): Promise<NimbleSession | null> {
  try {
    const data = await $fetch<{ session: NimbleSession | null }>('/api/auth/session', {
      credentials: 'include',
    })
    return data?.session ?? null
  }
  catch {
    return null
  }
}
