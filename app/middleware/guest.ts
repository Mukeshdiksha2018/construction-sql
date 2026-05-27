import { fetchServerSession } from '~/utils/auth-session'
import { getSafeRedirect } from '~/utils/safe-redirect'

/** For login page — redirect authenticated users away from guest routes. */
export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()

  if (authStore.isAuthenticated) {
    return navigateTo(getSafeRedirect(to.query.redirect))
  }

  const session = await fetchServerSession()
  if (session) {
    authStore.setSession(session)
    return navigateTo(getSafeRedirect(to.query.redirect))
  }
})
