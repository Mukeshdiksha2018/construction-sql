import { usePrivilegesStore } from '~/stores/privileges'

/**
 * Shared composable called immediately after any login (password or OAuth/iframe).
 * Fetches Nimble privileges + approval policies and populates the privileges store.
 *
 * Safe to call multiple times — the store deduplicates unless force=true.
 */
export function usePrivilegesFetch() {
  const privilegesStore = usePrivilegesStore()
  const corporationStore = useCorporationStore()
  const runtimeConfig = useRuntimeConfig()

  const nimbleOn = computed(() =>
    String(runtimeConfig.public.nimbleIntegrations || '').toLowerCase() === 'true',
  )

  /**
   * Trigger a full privileges + approvals load.
   * Automatically resolves corporation IDs from the corporation store.
   * @param force - bypass the already-loaded guard and re-fetch
   */
  const loadPrivileges = async (force = false): Promise<void> => {
    if (!nimbleOn.value) return

    // Ensure corporations are loaded so we can pass their IDs to the approvals API
    if (!corporationStore.corporations.length) {
      try {
        await corporationStore.fetchCorporations({ isShowAll: false })
      }
      catch {
        // Continue — approvals fetch will just get empty corp list
      }
    }

    const corporationIds = corporationStore.corporations.map((c) => c.id)
    await privilegesStore.fetchAll(corporationIds, force)
  }

  return { loadPrivileges, privilegesStore }
}
