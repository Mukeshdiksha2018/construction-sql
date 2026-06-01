import {
  ensureAuthHydrated,
  fetchRouteSession,
  hasNimbleLaunchContext,
} from '~/utils/routeAuth'
import { syncNimbleSessionFromAuth } from '~/utils/authToken'

/**
 * Protects pages — requires login.
 * Nimble authId exchange runs in `01.nimble-init.global` only (one-time token).
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()

  // Nimble launch: wait for init-auth / persisted Pinia before redirecting to login.
  if (hasNimbleLaunchContext(to) || import.meta.client) {
    await ensureAuthHydrated()
  }

  if (authStore.isAuthenticated) {
    return
  }

  const session = await fetchRouteSession()
  if (session?.token) {
    authStore.setSession(session)
    syncNimbleSessionFromAuth()
    return
  }

  // Cookie may be unavailable in iframe while Pinia still has a valid persisted token.
  if (authStore.isAuthenticated) {
    return
  }

  // Still launching from Nimble — nimble-init may be exchanging authId; avoid login flash.
  if (String(to.query.authId ?? '').trim()) {
    return
  }

  return navigateTo({
    path: '/',
    query: { redirect: to.fullPath },
  })
})
