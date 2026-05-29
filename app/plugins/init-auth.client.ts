import { fetchServerSession } from '~/utils/auth-session'
import {
  consumePrintAuthSession,
  readPersistedAuthSession,
} from '~/utils/printAuthBridge'
import { resolveAuthToken, syncNimbleSessionFromAuth } from '~/utils/authToken'

let resolveAuthReady!: () => void
const authReadyPromise = new Promise<void>((resolve) => {
  resolveAuthReady = resolve
})

export { authReadyPromise }

/** Hydrate auth on client boot — never clear a persisted session when the cookie is absent. */
export default defineNuxtPlugin({
  name: 'init-auth',
  dependsOn: ['pinia-persistedstate'],
  async setup(nuxtApp) {
    try {
      const authStore = useAuthStore()

      const bridged = consumePrintAuthSession()
      if (bridged?.token) {
        authStore.setSession(bridged)
        syncNimbleSessionFromAuth()
        return
      }

      const persisted = readPersistedAuthSession()
      if (persisted?.token && !authStore.token) {
        authStore.setSession(persisted)
        syncNimbleSessionFromAuth()
        return
      }

      if (authStore.token) {
        authStore.isInitialized = true
        syncNimbleSessionFromAuth()
        return
      }

      const session = await fetchServerSession()
      if (session?.token) {
        authStore.setSession(session)
        syncNimbleSessionFromAuth()
      }
    }
    finally {
      resolveAuthReady()
      nuxtApp.provide('authReady', authReadyPromise)
    }
  },
})
