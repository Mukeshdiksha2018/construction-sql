import { fetchServerSession } from '~/utils/auth-session'
import {
  consumePrintAuthSession,
  readPersistedAuthSession,
} from '~/utils/printAuthBridge'

/** Hydrate auth on client boot — never clear a persisted session when the cookie is absent. */
export default defineNuxtPlugin({
  name: 'init-auth',
  dependsOn: ['pinia-persistedstate'],
  async setup() {
    const authStore = useAuthStore()
    if (authStore.token) {
      authStore.isInitialized = true
      return
    }

    const bridged = consumePrintAuthSession()
    if (bridged?.token) {
      authStore.setSession(bridged)
      return
    }

    const persisted = readPersistedAuthSession()
    if (persisted?.token) {
      authStore.setSession(persisted)
      return
    }

    const session = await fetchServerSession()
    if (session?.token) {
      authStore.setSession(session)
    }
  },
})
