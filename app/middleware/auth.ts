import { fetchServerSession } from '~/utils/auth-session'
import type { NimbleSession } from '~/stores/auth'

/** Protects pages — requires login (aligned with server API auth cookie). */
export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()
  const runtimeConfig = useRuntimeConfig()
  const nimbleOn = String(runtimeConfig.public.nimbleIntegrations || '').toLowerCase() === 'true'
  const authId = String(to.query.authId ?? '').trim()

  const serverSession = await fetchServerSession()
  if (serverSession?.token) {
    if (!authStore.isAuthenticated || authStore.token !== serverSession.token) {
      authStore.setSession(serverSession)
    }
    return
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
      }
    }
    catch {
      // Fall through to normal unauthenticated redirect handling.
    }
  }

  if (authStore.isAuthenticated) {
    authStore.clear()
  }

  if (!authStore.isAuthenticated) {
    return navigateTo({
      path: '/',
      query: { redirect: to.fullPath },
    })
  }
})
