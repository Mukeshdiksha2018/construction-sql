import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

// Stub defineStore and createPinia are handled by setup.ts (Pinia activated)
// normalizeMenuId is called inside the store — we need the real implementation
vi.mock('../../../app/utils/nimbleMenuIds', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../app/utils/nimbleMenuIds')>()
  return {
    ...actual,
    NIMBLE_MENU_ENTRIES: [
      { menuId: '0x010000000000000000000000000000011131', label: 'Purchase Orders', path: '/purchase-orders' },
      { menuId: '0x010000000000000000000000000000011137', label: 'Projects', path: '/projects' },
      { menuId: '0x010000000000000000000000000000011140', label: 'Project Estimates', path: '/projects?tab=estimates' },
    ],
  }
})

async function loadStore() {
  vi.resetModules()
  const { usePrivilegesStore } = await import('../../../app/stores/privileges')
  return usePrivilegesStore()
}

const PO_MENU_ID = '010000000000000000000000000000011131'
const PROJ_MENU_ID = '010000000000000000000000000000011137'
const EST_MENU_ID = '010000000000000000000000000000011140'

function makePrivilegeEntry(menuId: string, overrides: Partial<Record<'create' | 'view' | 'update' | 'delete', boolean>> = {}) {
  return { menuId, create: true, view: true, update: true, delete: true, ...overrides }
}

describe('usePrivilegesStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({ details: [] })
  })

  // ── hasPrivilege — fail-open defaults ─────────────────────────────────────

  describe('hasPrivilege — fail-open rules', () => {
    it('returns true when privileges are not loaded yet', async () => {
      const store = await loadStore()
      expect(store.loaded).toBe(false)
      expect(store.hasPrivilege('po_create')).toBe(true)
    })

    it('returns true when map is empty after load (fetch returned no data)', async () => {
      mockFetch.mockResolvedValue({ details: [] })
      const store = await loadStore()
      await store.fetchAll()
      expect(store.loaded).toBe(true)
      expect(store.privilegeMap.size).toBe(0)
      expect(store.hasPrivilege('po_create')).toBe(true)
    })

    it('returns true for unknown permission key when loaded', async () => {
      mockFetch.mockResolvedValue({
        details: [makePrivilegeEntry(PO_MENU_ID)],
      })
      const store = await loadStore()
      await store.fetchAll()
      expect(store.hasPrivilege('completely_unknown_key')).toBe(true)
    })

    it('returns true when menuId is not in Nimble response', async () => {
      // Only PO menu ID returned — Estimates menu ID absent
      mockFetch.mockResolvedValue({
        details: [makePrivilegeEntry(PO_MENU_ID)],
      })
      const store = await loadStore()
      await store.fetchAll()
      expect(store.hasPrivilege('estimate_create')).toBe(true)
    })
  })

  // ── hasPrivilege — explicit Nimble values ─────────────────────────────────

  describe('hasPrivilege — explicit Nimble data', () => {
    it('returns the explicit boolean value from Nimble response', async () => {
      mockFetch.mockResolvedValue({
        details: [makePrivilegeEntry(PO_MENU_ID, { create: false, view: true, update: false, delete: false })],
      })
      const store = await loadStore()
      await store.fetchAll()

      expect(store.hasPrivilege('po_create')).toBe(false)
      expect(store.hasPrivilege('po_view')).toBe(true)
      expect(store.hasPrivilege('po_edit')).toBe(false)
      expect(store.hasPrivilege('po_delete')).toBe(false)
    })

    it('respects all four privilege actions independently', async () => {
      mockFetch.mockResolvedValue({
        details: [makePrivilegeEntry(EST_MENU_ID, { create: true, view: false, update: true, delete: false })],
      })
      const store = await loadStore()
      await store.fetchAll()

      expect(store.hasPrivilege('estimate_create')).toBe(true)
      expect(store.hasPrivilege('estimate_view')).toBe(false)
      expect(store.hasPrivilege('estimate_edit')).toBe(true)
      expect(store.hasPrivilege('estimate_delete')).toBe(false)
    })

    it('handles all-false privileges correctly', async () => {
      mockFetch.mockResolvedValue({
        details: [makePrivilegeEntry(PROJ_MENU_ID, { create: false, view: false, update: false, delete: false })],
      })
      const store = await loadStore()
      await store.fetchAll()

      expect(store.hasPrivilege('project_create')).toBe(false)
      expect(store.hasPrivilege('project_view')).toBe(false)
      expect(store.hasPrivilege('project_edit')).toBe(false)
      expect(store.hasPrivilege('project_delete')).toBe(false)
    })
  })

  // ── loaded / fetchAll state management ───────────────────────────────────

  describe('fetchAll state management', () => {
    it('sets loaded=true after successful fetch', async () => {
      mockFetch.mockResolvedValue({ details: [makePrivilegeEntry(PO_MENU_ID)] })
      const store = await loadStore()
      expect(store.loaded).toBe(false)
      await store.fetchAll()
      expect(store.loaded).toBe(true)
    })

    it('does NOT set loaded=true when fetchPrivileges fails', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      const store = await loadStore()
      await store.fetchAll()
      // fetchPrivileges swallowed the error, returned false → loaded stays false
      expect(store.loaded).toBe(false)
    })

    it('does not re-fetch when already loaded (deduplication)', async () => {
      mockFetch.mockResolvedValue({ details: [makePrivilegeEntry(PO_MENU_ID)] })
      const store = await loadStore()
      await store.fetchAll()
      await store.fetchAll() // second call should be a no-op
      // $fetch called once for privileges, once for approvals fetch skipped (no corp IDs)
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('re-fetches when force=true even if already loaded', async () => {
      mockFetch.mockResolvedValue({ details: [makePrivilegeEntry(PO_MENU_ID)] })
      const store = await loadStore()
      await store.fetchAll([], false)
      await store.fetchAll([], true) // force
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('populates privilegeMap with normalized keys', async () => {
      mockFetch.mockResolvedValue({
        details: [makePrivilegeEntry(PO_MENU_ID)],
      })
      const store = await loadStore()
      await store.fetchAll()
      expect(store.privilegeMap.size).toBe(1)
      expect(store.privilegeMap.has(PO_MENU_ID)).toBe(true)
    })
  })

  // ── getMenuPrivilege ──────────────────────────────────────────────────────

  describe('getMenuPrivilege', () => {
    it('returns privilege object for a known normalized menuId', async () => {
      mockFetch.mockResolvedValue({
        details: [makePrivilegeEntry(PO_MENU_ID, { view: true, create: false })],
      })
      const store = await loadStore()
      await store.fetchAll()

      const priv = store.getMenuPrivilege('0x' + PO_MENU_ID)
      expect(priv).not.toBeNull()
      expect(priv!.view).toBe(true)
      expect(priv!.create).toBe(false)
    })

    it('returns null for an unknown menuId', async () => {
      mockFetch.mockResolvedValue({ details: [] })
      const store = await loadStore()
      await store.fetchAll()
      expect(store.getMenuPrivilege('0xdeadbeef')).toBeNull()
    })
  })

  // ── approvals ─────────────────────────────────────────────────────────────

  describe('approvals', () => {
    it('fetches and stores approval entries when corporationIds provided', async () => {
      mockFetch
        .mockResolvedValueOnce({ details: [makePrivilegeEntry(PO_MENU_ID)] }) // fetchPrivileges
        .mockResolvedValueOnce({ // fetchApprovals
          approvals: [
            { corporationId: 'corp-1', name: 'Alice', userName: 'alice@test.com', userId: 'u1', approvalOrder: 1, approvalType: 2, isCurrentUser: true },
          ],
        })

      const store = await loadStore()
      await store.fetchAll(['corp-1'])

      expect(store.approvals).toHaveLength(1)
      expect(store.approvals[0].name).toBe('Alice')
    })

    it('skips approval fetch when no corporationIds given', async () => {
      mockFetch.mockResolvedValue({ details: [makePrivilegeEntry(PO_MENU_ID)] })
      const store = await loadStore()
      await store.fetchAll([])

      expect(mockFetch).toHaveBeenCalledTimes(1) // only privileges fetch
      expect(store.approvals).toHaveLength(0)
    })

    it('getApprovalsForCorporation filters by corporation ID', async () => {
      const store = await loadStore()
      store.approvals = [
        { corporationId: 'corp-aaa', name: 'Alice', userName: 'a@test.com', userId: 'u1', approvalOrder: 1, approvalType: 2, isCurrentUser: true },
        { corporationId: 'corp-bbb', name: 'Bob', userName: 'b@test.com', userId: 'u2', approvalOrder: 2, approvalType: 2, isCurrentUser: false },
        { corporationId: 'corp-aaa', name: 'Carol', userName: 'c@test.com', userId: 'u3', approvalOrder: 3, approvalType: 3, isCurrentUser: false },
      ] as any

      const result = store.getApprovalsForCorporation('CORP-AAA') // case-insensitive
      expect(result).toHaveLength(2)
      expect(result.map((a: any) => a.name)).toEqual(['Alice', 'Carol'])
    })

    it('isApprover returns true when current user is in approval chain', async () => {
      const store = await loadStore()
      store.approvals = [
        { corporationId: 'corp-x', name: 'Me', userName: 'me@test.com', userId: 'u-me', approvalOrder: 1, approvalType: 2, isCurrentUser: true },
      ] as any

      expect(store.isApprover('corp-x')).toBe(true)
    })

    it('isApprover returns false when current user is NOT in chain', async () => {
      const store = await loadStore()
      store.approvals = [
        { corporationId: 'corp-x', name: 'Other', userName: 'other@test.com', userId: 'u-other', approvalOrder: 1, approvalType: 2, isCurrentUser: false },
      ] as any

      expect(store.isApprover('corp-x')).toBe(false)
    })
  })

  // ── clear ─────────────────────────────────────────────────────────────────

  describe('clear', () => {
    it('resets all state', async () => {
      mockFetch.mockResolvedValue({ details: [makePrivilegeEntry(PO_MENU_ID)] })
      const store = await loadStore()
      await store.fetchAll()
      expect(store.loaded).toBe(true)

      store.clear()

      expect(store.loaded).toBe(false)
      expect(store.privilegeMap.size).toBe(0)
      expect(store.approvals).toHaveLength(0)
      expect(store.error).toBeNull()
    })
  })
})
