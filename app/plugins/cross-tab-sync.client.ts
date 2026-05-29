import type { NimbleSession } from '~/stores/auth'
import { fetchServerSession } from '~/utils/auth-session'
import { AUTH_PINIA_STORAGE_KEY } from '~/utils/printAuthBridge'

/** Keep auth in sync across tabs (same pattern as construction-management reference). */
export default defineNuxtPlugin({
  name: 'cross-tab-sync',
  dependsOn: ['init-auth'],
  setup() {
    const authStore = useAuthStore()

    const handleStorageChange = (event: StorageEvent) => {
      if (event.storageArea !== localStorage || event.key !== AUTH_PINIA_STORAGE_KEY || !event.newValue) {
        return
      }

      try {
        const parsed = JSON.parse(event.newValue) as {
          session?: NimbleSession | null
          state?: { session?: NimbleSession | null }
        }
        const session = parsed.session ?? parsed.state?.session ?? null
        const incomingToken = session?.token ?? null
        if (incomingToken && incomingToken !== authStore.token) {
          authStore.syncAuthState(session)
        }
        else if (!incomingToken && authStore.isAuthenticated) {
          authStore.clear()
        }
      }
      catch (error) {
        console.error('[auth] Failed to process cross-tab storage event:', error)
      }
    }

    window.addEventListener('storage', handleStorageChange)

    const handleFocus = async () => {
      if (!authStore.isInitialized || !authStore.isAuthenticated) return
      try {
        const session = await fetchServerSession()
        if (session?.token && session.token !== authStore.token) {
          authStore.setSession(session)
        }
      }
      catch (error) {
        console.error('[auth] Failed to sync session on focus:', error)
      }
    }

    window.addEventListener('focus', handleFocus)

    const cleanup = () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('focus', handleFocus)
    }

    window.addEventListener('beforeunload', cleanup)
  },
})
