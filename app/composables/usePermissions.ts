import { computed } from 'vue'

/**
 * Lightweight permission facade.
 * Nimble privileges can be wired later; for now this keeps Project Details UI parity.
 */
export function usePermissions() {
  const authStore = useAuthStore()

  const isReady = computed(() => authStore.isAuthenticated)
  const hasPermission = (_permission: string) => true

  return {
    isReady,
    hasPermission,
  }
}
