import { computed } from 'vue'
import { usePrivilegesStore } from '~/stores/privileges'

/**
 * Permission facade used across PO / Estimate / Project components.
 *
 * Rules (mirrors Nimble's access model):
 *  - `create`  → show Add / New buttons
 *  - `view`    → show View button  (also true when user has `edit`)
 *  - `edit`    → show Edit button
 *  - `delete`  → show Delete button
 *
 * When Nimble integration is off, or privileges have not loaded yet,
 * all checks return `true` so the UI never incorrectly locks out users.
 */
export function usePermissions() {
  const authStore = useAuthStore()
  const privilegesStore = usePrivilegesStore()
  const runtimeConfig = useRuntimeConfig()

  const nimbleOn = computed(() =>
    String(runtimeConfig.public.nimbleIntegrations || '').toLowerCase() === 'true',
  )

  /** True once auth is resolved on the client; always true during SSR to avoid hydration mismatches. */
  const isReady = computed(() => import.meta.server || authStore.isAuthenticated)

  /**
   * Check whether the current user has a named permission.
   *
   * Special rule: a `_view` permission is also granted when the user has the
   * corresponding `_edit` privilege — you must be able to see a record to edit it.
   */
  const hasPermission = (permission: string): boolean => {
    if (!nimbleOn.value) return true

    // _view is implicitly granted when _edit is granted
    if (permission.endsWith('_view')) {
      const editKey = permission.replace(/_view$/, '_edit')
      return privilegesStore.hasPrivilege(permission) || privilegesStore.hasPrivilege(editKey)
    }

    return privilegesStore.hasPrivilege(permission)
  }

  return {
    isReady,
    hasPermission,
  }
}
