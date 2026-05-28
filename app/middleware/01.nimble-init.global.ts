import type { NimbleSession } from '~/stores/auth'
import { fetchServerSession } from '~/utils/auth-session'
import { usePrivilegesStore } from '~/stores/privileges'

export default defineNuxtRouteMiddleware(async (to) => {
  if (!import.meta.client) return

  const authId = String(to.query.authId ?? '').trim()
  const corporationId = String(to.query.corporationId ?? '').trim()
  const menuId = String(to.query.menuId ?? '').trim()
  const hasNimbleQuery = Boolean(authId || corporationId || menuId)

  if (!hasNimbleQuery) return

  const authStore = useAuthStore()
  const corporationStore = useCorporationStore()
  const serverSession = await fetchServerSession()

  let sessionChanged = false

  if (serverSession?.token) {
    if (!authStore.isAuthenticated || authStore.token !== serverSession.token) {
      authStore.setSession(serverSession)
      sessionChanged = true
    }
  }

  if (authId && !serverSession?.token) {
    try {
      const result = await $fetch<{ session: NimbleSession }>('/api/auth/exchange-oauth', {
        method: 'POST',
        body: { authId },
        credentials: 'include',
      })

      if (result?.session) {
        authStore.setSession(result.session)
        sessionChanged = true
      }
    }
    catch {
      return
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
