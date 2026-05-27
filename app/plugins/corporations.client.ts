import { fetchServerSession } from '~/utils/auth-session'

/**
 * Load corporations for the signed-in user as soon as the client app boots.
 */
export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()
  const corporationStore = useCorporationStore()

  async function ensureSession() {
    if (!authStore.isAuthenticated) {
      const session = await fetchServerSession()
      if (session) {
        authStore.setSession(session)
      }
    }
  }

  async function loadCorporations() {
    await ensureSession()
    if (!authStore.isAuthenticated) return

    try {
      await corporationStore.fetchCorporations({ isShowAll: false })
    }
    catch {
      // Store keeps errorMessage; UI can show empty/disabled select
    }
  }

  await loadCorporations()

  watch(
    () => authStore.isAuthenticated,
    async (isAuthenticated) => {
      if (isAuthenticated) {
        await loadCorporations()
      }
      else {
        corporationStore.clear()
      }
    },
  )
})
