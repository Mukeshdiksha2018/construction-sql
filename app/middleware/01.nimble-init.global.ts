import { getPathForMenuId } from '~/utils/nimbleMenuIds'
import type { NimbleSession } from '~/stores/auth'

function parsePathWithQuery(pathWithQuery: string): { path: string, query: Record<string, string> } {
  const [path, rawQuery = ''] = pathWithQuery.split('?')
  const query: Record<string, string> = {}
  const params = new URLSearchParams(rawQuery)
  params.forEach((value, key) => {
    query[key] = value
  })
  return { path, query }
}

export default defineNuxtRouteMiddleware(async (to) => {
  if (!import.meta.client) return

  const authId = String(to.query.authId ?? '').trim()
  const corporationId = String(to.query.corporationId ?? '').trim()
  const menuId = String(to.query.menuId ?? '').trim()
  const hasNimbleQuery = Boolean(authId || corporationId || menuId)

  if (!hasNimbleQuery) return

  const authStore = useAuthStore()
  const corporationStore = useCorporationStore()

  if (authId && !authStore.isAuthenticated) {
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

  const mappedPath = getPathForMenuId(menuId)
  if (mappedPath) {
    const { path, query } = parsePathWithQuery(mappedPath)
    const nextQuery: Record<string, string> = { ...query }
    if (menuId) nextQuery.menuId = menuId
    if (corporationId) nextQuery.corporationId = corporationId

    const currentPath = to.path
    const currentTab = String(to.query.tab ?? '')
    const nextTab = String(nextQuery.tab ?? '')
    const samePath = currentPath === path
    const sameTab = currentTab === nextTab

    if (!samePath || (nextTab && !sameTab)) {
      return navigateTo({ path, query: nextQuery }, { replace: true })
    }
  }

  if (authId) {
    const nextQuery = { ...to.query }
    delete nextQuery.authId
    return navigateTo({ path: to.path, query: nextQuery }, { replace: true })
  }
})
