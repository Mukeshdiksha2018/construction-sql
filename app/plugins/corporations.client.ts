const PRINT_ROUTE = /^\/(purchase-orders|estimates)\/print\//

/**
 * Load corporations for the signed-in user as soon as the client app boots.
 * Skipped on print routes — they only need the document payload, not corp context.
 */
export default defineNuxtPlugin({
  name: 'corporations',
  dependsOn: ['init-auth'],
  async setup() {
    const route = useRoute()
    if (PRINT_ROUTE.test(route.path)) return

    const authStore = useAuthStore()
    const corporationStore = useCorporationStore()

    async function loadCorporations() {
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
  },
})
