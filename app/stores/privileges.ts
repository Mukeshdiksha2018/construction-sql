import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { normalizeMenuId, NIMBLE_MENU_ENTRIES } from '~/utils/nimbleMenuIds'

export interface MenuPrivilege {
  menuId: string
  create: boolean
  view: boolean
  update: boolean
  delete: boolean
}

export interface ApprovalEntry {
  corporationId: string
  name: string
  userName: string
  userId: string
  approvalOrder: number
  approvalType: number
  isCurrentUser: boolean
}

/**
 * Maps internal permission keys (used across PO/estimate components) to
 * the Nimble menuId and the action that should be checked.
 */
const PERMISSION_MAP: Record<string, { menuId: string; action: 'create' | 'view' | 'update' | 'delete' }> = {
  // Purchase Orders
  po_create: { menuId: '0x010000000000000000000000000000011131', action: 'create' },
  po_view: { menuId: '0x010000000000000000000000000000011131', action: 'view' },
  po_edit: { menuId: '0x010000000000000000000000000000011131', action: 'update' },
  po_delete: { menuId: '0x010000000000000000000000000000011131', action: 'delete' },
  // po_verify / po_approve use approval policy; fall back to update privilege
  po_verify: { menuId: '0x010000000000000000000000000000011131', action: 'update' },
  po_approve: { menuId: '0x010000000000000000000000000000011131', action: 'update' },

  // Projects
  project_create: { menuId: '0x010000000000000000000000000000011137', action: 'create' },
  project_view: { menuId: '0x010000000000000000000000000000011137', action: 'view' },
  project_edit: { menuId: '0x010000000000000000000000000000011137', action: 'update' },
  project_delete: { menuId: '0x010000000000000000000000000000011137', action: 'delete' },

  // Estimates (all aliases used across the codebase)
  estimate_create: { menuId: '0x010000000000000000000000000000011140', action: 'create' },
  estimate_view: { menuId: '0x010000000000000000000000000000011140', action: 'view' },
  estimate_edit: { menuId: '0x010000000000000000000000000000011140', action: 'update' },
  estimate_delete: { menuId: '0x010000000000000000000000000000011140', action: 'delete' },
  // Aliases used in Estimates.vue
  project_estimates_create: { menuId: '0x010000000000000000000000000000011140', action: 'create' },
  project_estimates_view: { menuId: '0x010000000000000000000000000000011140', action: 'view' },
  project_estimates_edit: { menuId: '0x010000000000000000000000000000011140', action: 'update' },
  project_estimates_delete: { menuId: '0x010000000000000000000000000000011140', action: 'delete' },

  // Project Items (Items tab under Projects)
  project_items_create: { menuId: '0x010000000000000000000000000000011138', action: 'create' },
  project_items_view: { menuId: '0x010000000000000000000000000000011138', action: 'view' },
  project_items_edit: { menuId: '0x010000000000000000000000000000011138', action: 'update' },
  project_items_delete: { menuId: '0x010000000000000000000000000000011138', action: 'delete' },

  // Project Cost Codes
  project_cost_codes_create: { menuId: '0x010000000000000000000000000000011139', action: 'create' },
  project_cost_codes_view: { menuId: '0x010000000000000000000000000000011139', action: 'view' },
  project_cost_codes_edit: { menuId: '0x010000000000000000000000000000011139', action: 'update' },
  project_cost_codes_delete: { menuId: '0x010000000000000000000000000000011139', action: 'delete' },

  // Configurations
  config_create: { menuId: '0x010000000000000000000000000000011134', action: 'create' },
  config_view: { menuId: '0x010000000000000000000000000000011134', action: 'view' },
  config_edit: { menuId: '0x010000000000000000000000000000011134', action: 'update' },
  config_delete: { menuId: '0x010000000000000000000000000000011134', action: 'delete' },

  // Vendor Invoices / Payables
  vendor_invoice_create: { menuId: '0x010000000000000000000000000000011133', action: 'create' },
  vendor_invoice_view: { menuId: '0x010000000000000000000000000000011133', action: 'view' },
  vendor_invoice_edit: { menuId: '0x010000000000000000000000000000011133', action: 'update' },
  vendor_invoice_delete: { menuId: '0x010000000000000000000000000000011133', action: 'delete' },

  // Reasons (shared component; no dedicated menu — uses Projects privilege as fallback)
  reasons_create: { menuId: '0x010000000000000000000000000000011137', action: 'create' },
  reasons_view: { menuId: '0x010000000000000000000000000000011137', action: 'view' },
  reasons_edit: { menuId: '0x010000000000000000000000000000011137', action: 'update' },
  reasons_delete: { menuId: '0x010000000000000000000000000000011137', action: 'delete' },
}

export const usePrivilegesStore = defineStore('privileges', () => {
  /** Map from normalized menuId → privilege object. */
  const privilegeMap = ref<Map<string, MenuPrivilege>>(new Map())

  /** Approval entries (PO/Bill level) across corporations. */
  const approvals = ref<ApprovalEntry[]>([])

  const loading = ref(false)
  const loaded = ref(false)
  const error = ref<string | null>(null)

  // ── Getters ────────────────────────────────────────────────────────────────

  const isLoaded = computed(() => loaded.value)

  /**
   * Check if the current user has a specific internal permission key.
   *
   * Allow-by-default rules (fail-open, never locks out accidentally):
   *  1. Not loaded yet → allow (loading window)
   *  2. Map is empty (fetch failed or returned nothing) → allow
   *  3. Unknown permission key → allow (no restriction defined)
   *  4. MenuId not returned by Nimble → allow (no restriction = full access)
   *  5. MenuId present in Nimble response → use the explicit flag
   */
  const hasPrivilege = (permissionKey: string): boolean => {
    if (!loaded.value) return true

    // If the fetch succeeded but Nimble returned no data, allow everything
    if (privilegeMap.value.size === 0) return true

    const mapping = PERMISSION_MAP[permissionKey]
    // Unknown key — no restriction defined, allow
    if (!mapping) return true

    const normalized = normalizeMenuId(mapping.menuId)
    const priv = privilegeMap.value.get(normalized)
    // MenuId not in Nimble response — no restriction configured, allow
    if (!priv) return true

    return priv[mapping.action]
  }

  /**
   * Get the privilege object for a specific menuId directly.
   * Useful for checking raw Nimble menuId access.
   */
  const getMenuPrivilege = (menuId: string): MenuPrivilege | null => {
    const normalized = normalizeMenuId(menuId)
    return privilegeMap.value.get(normalized) ?? null
  }

  /**
   * Get approval entries for a specific corporation.
   */
  const getApprovalsForCorporation = (corporationId: string): ApprovalEntry[] => {
    const norm = String(corporationId || '').toLowerCase()
    return approvals.value.filter((a) => a.corporationId === norm)
  }

  /**
   * Whether the current user is in the approval chain for a corporation.
   */
  const isApprover = (corporationId: string): boolean => {
    return getApprovalsForCorporation(corporationId).some((a) => a.isCurrentUser)
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  /**
   * Fetch privileges from Nimble for all known construction menu IDs.
   * Returns true if the fetch was successful (even if empty), false on error.
   */
  const fetchPrivileges = async (): Promise<boolean> => {
    const menuIds = NIMBLE_MENU_ENTRIES.map((e) => e.menuId)

    try {
      const response = await $fetch<{ details: MenuPrivilege[] }>('/api/nimble/privileges', {
        method: 'POST',
        body: { menuIds },
      })

      const newMap = new Map<string, MenuPrivilege>()
      for (const detail of response.details ?? []) {
        newMap.set(normalizeMenuId(detail.menuId), detail)
      }
      privilegeMap.value = newMap
      return true
    }
    catch (err: any) {
      console.warn('[Privileges] Failed to fetch privileges:', err?.message ?? err)
      return false
    }
  }

  /**
   * Fetch approval policy details for the given corporations (screenType=21 for PO/Bills).
   */
  const fetchApprovals = async (corporationIds: string[], screenType = 21): Promise<void> => {
    if (!corporationIds.length) return

    try {
      const response = await $fetch<{ approvals: ApprovalEntry[] }>('/api/nimble/approvals', {
        method: 'GET',
        query: { screenType },
        body: corporationIds,
      })
      approvals.value = response.approvals ?? []
    }
    catch (err: any) {
      console.warn('[Privileges] Failed to fetch approvals:', err?.message ?? err)
    }
  }

  /**
   * Main entry point: fetch both privileges and approvals after login.
   * Safe to call multiple times — does nothing if already loaded unless force=true.
   */
  const fetchAll = async (corporationIds: string[] = [], force = false): Promise<void> => {
    if (loaded.value && !force) return

    loading.value = true
    error.value = null

    try {
      const privilegesOk = await fetchPrivileges()
      if (corporationIds.length) {
        await fetchApprovals(corporationIds)
      }
      // Only mark as loaded when we got a real response from Nimble.
      // If the fetch failed (no config, API down, etc.) leave loaded=false so
      // the fail-open "not loaded → allow" path in hasPrivilege stays active.
      if (privilegesOk) {
        loaded.value = true
      }
    }
    catch (err: any) {
      error.value = err?.message ?? 'Failed to load privileges'
    }
    finally {
      loading.value = false
    }
  }

  const clear = () => {
    privilegeMap.value = new Map()
    approvals.value = []
    loaded.value = false
    error.value = null
  }

  return {
    loading,
    loaded,
    isLoaded,
    error,
    privilegeMap,
    approvals,
    hasPrivilege,
    getMenuPrivilege,
    getApprovalsForCorporation,
    isApprover,
    fetchPrivileges,
    fetchApprovals,
    fetchAll,
    clear,
  }
})
