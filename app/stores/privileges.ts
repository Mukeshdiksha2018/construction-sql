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

  // Estimates
  estimate_create: { menuId: '0x010000000000000000000000000000011140', action: 'create' },
  estimate_view: { menuId: '0x010000000000000000000000000000011140', action: 'view' },
  estimate_edit: { menuId: '0x010000000000000000000000000000011140', action: 'update' },
  estimate_delete: { menuId: '0x010000000000000000000000000000011140', action: 'delete' },

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
   * Falls back to `true` when privileges haven't been loaded yet (safe default
   * so the UI doesn't lock out users during initial load).
   */
  const hasPrivilege = (permissionKey: string): boolean => {
    if (!loaded.value) return true

    const mapping = PERMISSION_MAP[permissionKey]
    if (!mapping) {
      // Unknown permission key — deny when privileges are loaded
      return false
    }

    const normalized = normalizeMenuId(mapping.menuId)
    const priv = privilegeMap.value.get(normalized)
    if (!priv) return false

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
   */
  const fetchPrivileges = async (): Promise<void> => {
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
    }
    catch (err: any) {
      console.warn('[Privileges] Failed to fetch privileges:', err?.message ?? err)
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
      await fetchPrivileges()
      if (corporationIds.length) {
        await fetchApprovals(corporationIds)
      }
      loaded.value = true
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
