import { exchangeNimbleAuthId } from '~/utils/nimbleAuthIdExchange'
import { syncNimbleSessionFromAuth } from '~/utils/authToken'
import { ensureAuthHydrated, fetchRouteSession, hasNimbleLaunchContext } from '~/utils/routeAuth'
import { usePrivilegesStore } from '~/stores/privileges'

export default defineNuxtRouteMiddleware(async (to) => {
  if (!hasNimbleLaunchContext(to)) return

  const authId = String(to.query.authId ?? '').trim()
  const corporationId = String(to.query.corporationId ?? '').trim()
  const menuId = String(to.query.menuId ?? '').trim()

  const authStore = useAuthStore()
  const corporationStore = useCorporationStore()

  // Fresh Nimble launch — exchange authId once here (do not re-exchange in auth/guest middleware).
  if (authId) {
    const freshSession = await exchangeNimbleAuthId(authId)
    if (freshSession) {
      authStore.setSession(freshSession)
      syncNimbleSessionFromAuth()
    }
  }
  else {
    await ensureAuthHydrated()
    if (!authStore.isAuthenticated) {
      const session = await fetchRouteSession()
      if (session?.token) {
        authStore.setSession(session)
        syncNimbleSessionFromAuth()
      }
    }
  }

  if (authStore.isAuthenticated && corporationId) {
    try {
      await corporationStore.fetchCorporations({ isShowAll: false })
    }
    catch {
      // Ignore and continue with available state.
    }

    const hasCorp = corporationStore.corporations.some(c => c.id === corporationId)
    if (hasCorp) {
      corporationStore.setSelectedCorporation(corporationId)
    }
  }

  const privilegesStore = usePrivilegesStore()
  if (authStore.isAuthenticated && !privilegesStore.loaded) {
    const { loadPrivileges } = usePrivilegesFetch()
    loadPrivileges().catch((err: unknown) => {
      console.warn('[Privileges] Background load failed:', err)
    })
  }

  // Strip authId on the client only — avoids an extra SSR redirect before the session cookie is visible.
  if (import.meta.client && authId && authStore.isAuthenticated) {
    const nextQuery = { ...to.query }
    delete nextQuery.authId
    return navigateTo({ path: to.path, query: nextQuery }, { replace: true })
  }
})
