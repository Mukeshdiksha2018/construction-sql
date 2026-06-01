import type { RouteLocationNormalized } from 'vue-router'
import type { NimbleSession } from '~/stores/auth'
import { fetchServerSession } from '~/utils/auth-session'
import { readPersistedAuthSession } from '~/utils/printAuthBridge'
import { syncNimbleSessionFromAuth, waitForAuthReady } from '~/utils/authToken'

/** Nimble iframe / dev launcher query params (session may hydrate shortly after navigation). */
export function hasNimbleLaunchContext(to: Pick<RouteLocationNormalized, 'query'>): boolean {
  const q = to.query
  return Boolean(
    String(q.authId ?? '').trim()
    || String(q.corporationId ?? '').trim()
    || String(q.menuId ?? '').trim()
    || String(q.launcherBridgeToken ?? '').trim(),
  )
}

/** Read session from the current request cookie (SSR) or /api/auth/session (client). */
export async function fetchRouteSession(): Promise<NimbleSession | null> {
  if (import.meta.server) {
    try {
      const event = useRequestEvent()
      if (event) {
        const { getSessionFromEvent } = await import('../../server/utils/auth-session')
        const session = getSessionFromEvent(event)
        return session?.token ? (session as NimbleSession) : null
      }
    }
    catch {
      return null
    }
  }

  return fetchServerSession()
}

/**
 * Hydrate Pinia from persisted storage / cookie before auth middleware redirects.
 * Safe to call on server (no-op for wait/persisted) and client.
 */
export async function ensureAuthHydrated(): Promise<void> {
  const authStore = useAuthStore()

  if (authStore.isAuthenticated) return

  if (import.meta.client) {
    await waitForAuthReady()

    if (!authStore.isAuthenticated) {
      const persisted = readPersistedAuthSession()
      if (persisted?.token) {
        authStore.setSession(persisted)
        syncNimbleSessionFromAuth()
        return
      }
    }
  }

  if (!authStore.isAuthenticated) {
    const session = await fetchRouteSession()
    if (session?.token) {
      authStore.setSession(session)
      syncNimbleSessionFromAuth()
    }
  }
}
