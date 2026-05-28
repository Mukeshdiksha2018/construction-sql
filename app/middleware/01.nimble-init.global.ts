import type { NimbleSession } from '~/stores/auth'
import { fetchServerSession } from '~/utils/auth-session'

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

  if (serverSession?.token) {
    if (!authStore.isAuthenticated || authStore.token !== serverSession.token) {
      authStore.setSession(serverSession)
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

  // Nimble always sends the correct page URL — each page handles tab routing
  // internally via syncTabFromMenuId. No global path redirect needed here.

  if (authId) {
    const nextQuery = { ...to.query }
    delete nextQuery.authId
    return navigateTo({ path: to.path, query: nextQuery }, { replace: true })
  }
})
