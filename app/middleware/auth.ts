import { fetchServerSession } from '~/utils/auth-session'
import { exchangeNimbleAuthId } from '~/utils/nimbleAuthIdExchange'
import { syncNimbleSessionFromAuth } from '~/utils/authToken'

/** Protects pages — requires login (aligned with server API auth cookie). */
export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()
  const runtimeConfig = useRuntimeConfig()
  const nimbleOn = String(runtimeConfig.public.nimbleIntegrations || '').toLowerCase() === 'true'
  const authId = String(to.query.authId ?? '').trim()

  // Fresh Nimble launch token — exchange before trusting any existing cookie/Pinia session.
  if (nimbleOn && authId) {
    const freshSession = await exchangeNimbleAuthId(authId)
    if (freshSession) {
      authStore.setSession(freshSession)
      syncNimbleSessionFromAuth()
      return
    }
  }

  const serverSession = await fetchServerSession()
  if (serverSession?.token) {
    if (!authStore.isAuthenticated || authStore.token !== serverSession.token) {
      authStore.setSession(serverSession)
      syncNimbleSessionFromAuth()
    }
    return
  }

  // Cookie may be unavailable in a new tab (e.g. Nimble iframe) while Pinia still
  // has a valid persisted token — allow navigation; API calls use Bearer auth.
  if (authStore.isAuthenticated) {
    return
  }

  return navigateTo({
    path: '/',
    query: { redirect: to.fullPath },
  })
})
