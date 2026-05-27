import { fetchServerSession } from '~/utils/auth-session'
import { getSafeRedirect } from '~/utils/safe-redirect'
import { getPathForMenuId } from '~/utils/nimbleMenuIds'
import type { NimbleSession } from '~/stores/auth'

function toMenuRedirect(menuPath: string | undefined, corporationId: string): string | null {
  if (!menuPath) return null
  const [path, rawQuery = ''] = menuPath.split('?')
  const params = new URLSearchParams(rawQuery)
  if (corporationId) params.set('corporationId', corporationId)
  const queryString = params.toString()
  return queryString ? `${path}?${queryString}` : path
}

/** For login page — redirect authenticated users away from guest routes. */
export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()
  const runtimeConfig = useRuntimeConfig()
  const nimbleOn = String(runtimeConfig.public.nimbleIntegrations || '').toLowerCase() === 'true'
  const authId = String(to.query.authId ?? '').trim()
  const menuId = String(to.query.menuId ?? '').trim()
  const corporationId = String(to.query.corporationId ?? '').trim()
  const menuRedirect = toMenuRedirect(getPathForMenuId(menuId), corporationId)

  const serverSession = await fetchServerSession()
  if (serverSession?.token) {
    if (!authStore.isAuthenticated || authStore.token !== serverSession.token) {
      authStore.setSession(serverSession)
    }
    return navigateTo(menuRedirect || getSafeRedirect(to.query.redirect))
  }

  if (nimbleOn && authId) {
    try {
      const result = await $fetch<{ session: NimbleSession }>('/api/auth/exchange-oauth', {
        method: 'POST',
        body: { authId },
        credentials: 'include',
      })
      if (result?.session) {
        authStore.setSession(result.session)
        return navigateTo(menuRedirect || getSafeRedirect(to.query.redirect))
      }
    }
    catch {
      // Leave user on login page if exchange fails.
    }
  }

  if (authStore.isAuthenticated) {
    authStore.clear()
  }
})
