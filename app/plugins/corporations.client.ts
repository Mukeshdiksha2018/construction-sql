import { fetchServerSession } from '~/utils/auth-session'

/**
 * Load corporations for the signed-in user as soon as the client app boots.
 */
export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()
  const corporationStore = useCorporationStore()

  async function ensureSession() {
    const session = await fetchServerSession()
    if (session?.token) {
      if (!authStore.isAuthenticated || authStore.token !== session.token) {
        authStore.setSession(session)
      }
      return
    }

    if (authStore.isAuthenticated) {
      authStore.clear()
      corporationStore.clear()
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
