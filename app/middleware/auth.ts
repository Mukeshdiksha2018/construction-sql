import { fetchServerSession } from '~/utils/auth-session'

/** Protects pages — requires login (aligned with server API auth cookie). */
export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()

  if (!authStore.isAuthenticated) {
    const session = await fetchServerSession()
    if (session) {
      authStore.setSession(session)
      return
    }

    return navigateTo({
      path: '/',
      query: { redirect: to.fullPath },
    })
  }
})
