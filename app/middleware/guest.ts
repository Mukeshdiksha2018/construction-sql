import { getSafeRedirect, DEFAULT_AUTHENTICATED_ROUTE } from '~/utils/safe-redirect'
import { getPathForMenuId } from '~/utils/nimbleMenuIds'
import { ensureAuthHydrated, hasNimbleLaunchContext } from '~/utils/routeAuth'

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
  const menuId = String(to.query.menuId ?? '').trim()
  const corporationId = String(to.query.corporationId ?? '').trim()
  const menuRedirect = toMenuRedirect(getPathForMenuId(menuId), corporationId)

  // authId exchange is handled by nimble-init.global — only hydrate here.
  if (hasNimbleLaunchContext(to) || import.meta.client) {
    await ensureAuthHydrated()
  }

  if (authStore.isAuthenticated) {
    return navigateTo(menuRedirect || getSafeRedirect(to.query.redirect, DEFAULT_AUTHENTICATED_ROUTE))
  }
})
