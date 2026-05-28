import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed } from 'vue'

const mockHasPrivilege = vi.fn()
vi.stubGlobal('computed', computed)

// ── mock privileges store ─────────────────────────────────────────────────
vi.mock('../../../app/stores/privileges', () => ({
  usePrivilegesStore: () => ({
    hasPrivilege: (key: string) => mockHasPrivilege(key),
    loaded: true,
    privilegeMap: new Map(),
    approvals: [],
  }),
}))

// ── mock useRuntimeConfig ─────────────────────────────────────────────────
const mockRuntimeConfig = { public: { nimbleIntegrations: 'true' } }
vi.stubGlobal('useRuntimeConfig', () => mockRuntimeConfig)

// ── mock useAuthStore (Nuxt auto-import) ──────────────────────────────────
let mockIsAuthenticated = true
vi.stubGlobal('useAuthStore', () => ({ isAuthenticated: mockIsAuthenticated }))

const { usePermissions } = await import('../../../app/composables/usePermissions')

describe('usePermissions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsAuthenticated = true
    mockRuntimeConfig.public.nimbleIntegrations = 'true'
  })

  // ── Nimble off → always allow ─────────────────────────────────────────────

  describe('Nimble integration OFF', () => {
    beforeEach(() => {
      mockRuntimeConfig.public.nimbleIntegrations = 'false'
    })

    it('returns true for any permission key without consulting the store', () => {
      const { hasPermission } = usePermissions()
      expect(hasPermission('po_create')).toBe(true)
      expect(hasPermission('po_delete')).toBe(true)
      expect(hasPermission('completely_unknown_key')).toBe(true)
      expect(mockHasPrivilege).not.toHaveBeenCalled()
    })
  })

  // ── Nimble on → delegates to privileges store ─────────────────────────────

  describe('Nimble integration ON', () => {
    it('delegates to privileges store for regular permission keys', () => {
      mockHasPrivilege.mockReturnValue(true)
      const { hasPermission } = usePermissions()
      expect(hasPermission('po_create')).toBe(true)
      expect(mockHasPrivilege).toHaveBeenCalledWith('po_create')
    })

    it('returns false when store returns false', () => {
      mockHasPrivilege.mockReturnValue(false)
      const { hasPermission } = usePermissions()
      expect(hasPermission('po_delete')).toBe(false)
    })

    // ── _view implied by _edit rule ───────────────────────────────────────

    describe('_view implied by _edit', () => {
      it('returns true for _view when _edit is true (even if _view is false)', () => {
        mockHasPrivilege.mockImplementation((key: string) => key.endsWith('_edit'))
        const { hasPermission } = usePermissions()
        expect(hasPermission('po_view')).toBe(true)
      })

      it('returns true for _view when both _view and _edit are true', () => {
        mockHasPrivilege.mockReturnValue(true)
        const { hasPermission } = usePermissions()
        expect(hasPermission('po_view')).toBe(true)
      })

      it('returns false for _view when both _view and _edit are false', () => {
        mockHasPrivilege.mockReturnValue(false)
        const { hasPermission } = usePermissions()
        expect(hasPermission('po_view')).toBe(false)
      })

      it('checks the correct edit key for a given view key', () => {
        mockHasPrivilege.mockReturnValue(false)
        const { hasPermission } = usePermissions()
        hasPermission('project_estimates_view')
        expect(mockHasPrivilege).toHaveBeenCalledWith('project_estimates_view')
        expect(mockHasPrivilege).toHaveBeenCalledWith('project_estimates_edit')
      })

      it('does NOT apply implied-view logic to _edit, _create, _delete keys', () => {
        mockHasPrivilege.mockReturnValue(false)
        const { hasPermission } = usePermissions()
        hasPermission('po_edit')
        hasPermission('po_create')
        hasPermission('po_delete')
        // Each should be called exactly once, no implicit fallback
        expect(mockHasPrivilege).toHaveBeenNthCalledWith(1, 'po_edit')
        expect(mockHasPrivilege).toHaveBeenNthCalledWith(2, 'po_create')
        expect(mockHasPrivilege).toHaveBeenNthCalledWith(3, 'po_delete')
        expect(mockHasPrivilege).toHaveBeenCalledTimes(3)
      })
    })

    // ── isReady ────────────────────────────────────────────────────────────

    describe('isReady', () => {
      it('is true when user is authenticated', () => {
        const { isReady } = usePermissions()
        expect(isReady.value).toBe(true)
      })

      it('is false when user is not authenticated', () => {
        authStore.clearSession()
        const { isReady } = usePermissions()
        expect(isReady.value).toBe(false)
      })
    })

    // ── per-privilege button visibility scenarios ──────────────────────────

    describe('button visibility scenarios', () => {
      it('only view button shown when user has only view privilege', () => {
        mockHasPrivilege.mockImplementation((key: string) => key === 'po_view')
        const { hasPermission } = usePermissions()
        expect(hasPermission('po_view')).toBe(true)
        expect(hasPermission('po_edit')).toBe(false)
        expect(hasPermission('po_create')).toBe(false)
        expect(hasPermission('po_delete')).toBe(false)
      })

      it('view and edit buttons shown when user has only edit privilege', () => {
        mockHasPrivilege.mockImplementation((key: string) => key === 'po_edit')
        const { hasPermission } = usePermissions()
        expect(hasPermission('po_view')).toBe(true)  // implied by edit
        expect(hasPermission('po_edit')).toBe(true)
        expect(hasPermission('po_create')).toBe(false)
        expect(hasPermission('po_delete')).toBe(false)
      })

      it('only delete button shown when user has only delete privilege', () => {
        mockHasPrivilege.mockImplementation((key: string) => key === 'po_delete')
        const { hasPermission } = usePermissions()
        expect(hasPermission('po_view')).toBe(false)
        expect(hasPermission('po_edit')).toBe(false)
        expect(hasPermission('po_create')).toBe(false)
        expect(hasPermission('po_delete')).toBe(true)
      })

      it('all buttons shown when user has all privileges', () => {
        mockHasPrivilege.mockReturnValue(true)
        const { hasPermission } = usePermissions()
        expect(hasPermission('po_view')).toBe(true)
        expect(hasPermission('po_edit')).toBe(true)
        expect(hasPermission('po_create')).toBe(true)
        expect(hasPermission('po_delete')).toBe(true)
      })

      it('no buttons shown when user has no privileges (explicit deny)', () => {
        mockHasPrivilege.mockReturnValue(false)
        const { hasPermission } = usePermissions()
        expect(hasPermission('po_view')).toBe(false)
        expect(hasPermission('po_edit')).toBe(false)
        expect(hasPermission('po_create')).toBe(false)
        expect(hasPermission('po_delete')).toBe(false)
      })

      it('applies same logic for estimates permissions', () => {
        mockHasPrivilege.mockImplementation((key: string) => key === 'project_estimates_edit')
        const { hasPermission } = usePermissions()
        expect(hasPermission('project_estimates_view')).toBe(true)  // implied
        expect(hasPermission('project_estimates_edit')).toBe(true)
        expect(hasPermission('project_estimates_create')).toBe(false)
        expect(hasPermission('project_estimates_delete')).toBe(false)
      })
    })
  })
})
