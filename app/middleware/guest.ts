import { fetchServerSession } from '~/utils/auth-session'
import { exchangeNimbleAuthId } from '~/utils/nimbleAuthIdExchange'
import { syncNimbleSessionFromAuth } from '~/utils/authToken'
import { getSafeRedirect, DEFAULT_AUTHENTICATED_ROUTE } from '~/utils/safe-redirect'
import { getPathForMenuId } from '~/utils/nimbleMenuIds'

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

  if (nimbleOn && authId) {
    const freshSession = await exchangeNimbleAuthId(authId)
    if (freshSession) {
      authStore.setSession(freshSession)
      syncNimbleSessionFromAuth()
      return navigateTo(menuRedirect || getSafeRedirect(to.query.redirect, DEFAULT_AUTHENTICATED_ROUTE))
    }
  }

  const serverSession = await fetchServerSession()
  if (serverSession?.token) {
    if (!authStore.isAuthenticated || authStore.token !== serverSession.token) {
      authStore.setSession(serverSession)
      syncNimbleSessionFromAuth()
    }
    return navigateTo(menuRedirect || getSafeRedirect(to.query.redirect, DEFAULT_AUTHENTICATED_ROUTE))
  }

  if (authStore.isAuthenticated) {
    return navigateTo(menuRedirect || getSafeRedirect(to.query.redirect, DEFAULT_AUTHENTICATED_ROUTE))
  }
})
