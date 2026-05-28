import { computed } from 'vue'
import { usePrivilegesStore } from '~/stores/privileges'

/**
 * Permission facade used across PO / Estimate / Project components.
 *
 * When Nimble privileges have been loaded (after login), delegates to the
 * privileges store. Until they load, defaults to `true` so the UI never
 * incorrectly locks out users during the initial load window.
 */
export function usePermissions() {
  const authStore = useAuthStore()
  const privilegesStore = usePrivilegesStore()
  const runtimeConfig = useRuntimeConfig()

  const nimbleOn = computed(() =>
    String(runtimeConfig.public.nimbleIntegrations || '').toLowerCase() === 'true',
  )

  /** True once both auth and privileges are resolved. */
  const isReady = computed(() => authStore.isAuthenticated)

  /**
   * Check whether the current user has a named permission.
   *
   * When Nimble integration is off, or privileges have not loaded yet,
   * always returns true (open access). Once loaded with Nimble on,
   * delegates to the privileges store.
   */
  const hasPermission = (permission: string): boolean => {
    if (!nimbleOn.value) return true
    return privilegesStore.hasPrivilege(permission)
  }

  return {
    isReady,
    hasPermission,
  }
}
