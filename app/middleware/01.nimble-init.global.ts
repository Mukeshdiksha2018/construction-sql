import { fetchServerSession } from '~/utils/auth-session'
import { exchangeNimbleAuthId } from '~/utils/nimbleAuthIdExchange'
import { syncNimbleSessionFromAuth } from '~/utils/authToken'
import { usePrivilegesStore } from '~/stores/privileges'

export default defineNuxtRouteMiddleware(async (to) => {
  // Browser-only (Nimble launch query). Use typeof window so unit tests in happy-dom can cover this path.
  if (typeof window === 'undefined') return

  const authId = String(to.query.authId ?? '').trim()
  const corporationId = String(to.query.corporationId ?? '').trim()
  const menuId = String(to.query.menuId ?? '').trim()
  const hasNimbleQuery = Boolean(authId || corporationId || menuId)

  if (!hasNimbleQuery) return

  const authStore = useAuthStore()
  const corporationStore = useCorporationStore()
  const serverSession = await fetchServerSession()

  let sessionChanged = false

  // Fresh Nimble launch — always exchange authId even when a stale session cookie exists.
  if (authId) {
    const freshSession = await exchangeNimbleAuthId(authId)
    if (freshSession) {
      authStore.setSession(freshSession)
      syncNimbleSessionFromAuth()
      sessionChanged = true
    }
  }
  else if (serverSession?.token) {
    if (!authStore.isAuthenticated || authStore.token !== serverSession.token) {
      authStore.setSession(serverSession)
      syncNimbleSessionFromAuth()
      sessionChanged = true
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

  // Fetch privileges + approvals when authenticated and not yet loaded.
  // This covers both:
  //  a) Fresh login (sessionChanged=true)
  //  b) Already authenticated (persisted session, page refresh / direct navigation)
  // Runs in the background — does not block navigation.
  const privilegesStore = usePrivilegesStore()
  if (authStore.isAuthenticated && !privilegesStore.loaded) {
    const { loadPrivileges } = usePrivilegesFetch()
    loadPrivileges().catch((err: unknown) => {
      console.warn('[Privileges] Background load failed:', err)
    })
  }

  // Nimble always sends the correct page URL — each page handles tab routing
  // internally via syncTabFromMenuId. No global path redirect needed here.

  if (authId) {
    const nextQuery = { ...to.query }
    delete nextQuery.authId
    return navigateTo({ path: to.path, query: nextQuery }, { replace: true })
  }
})
