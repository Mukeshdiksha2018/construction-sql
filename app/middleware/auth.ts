import { fetchServerSession } from '~/utils/auth-session'
import type { NimbleSession } from '~/stores/auth'

/** Protects pages — requires login (aligned with server API auth cookie). */
export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()
  const runtimeConfig = useRuntimeConfig()
  const nimbleOn = String(runtimeConfig.public.nimbleIntegrations || '').toLowerCase() === 'true'
  const authId = String(to.query.authId ?? '').trim()

  if (!authStore.isAuthenticated && nimbleOn && authId) {
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
