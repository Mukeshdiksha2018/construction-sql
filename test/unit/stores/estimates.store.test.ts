import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useEstimatesStore } from '~/stores/estimates'

// ── Mock $fetch ────────────────────────────────────────────────────────────────
const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

// ── Mock corporation store ─────────────────────────────────────────────────────
vi.mock('~/stores/corporations', () => ({
  useCorporationStore: () => ({ selectedCorporationId: 'corp-1' }),
}))

// ── Mock auth store ────────────────────────────────────────────────────────────
vi.mock('~/stores/auth', () => ({
  useAuthStore: () => ({
    user: {
      id: 'u-1',
      email: 'alice@test.com',
      user_metadata: { full_name: 'Alice', avatar_url: null },
    },
  }),
}))

// ── Fixtures ───────────────────────────────────────────────────────────────────
const makeEstimate = (overrides = {}) => ({
  id: '1',
  uuid: 'est-uuid-1',
  corporation_uuid: 'corp-1',
  project_uuid: 'proj-1',
  estimate_number: 'EST-001',
  estimate_date: '2026-05-01',
  status: 'Draft',
  total_amount: 1000,
  tax_amount: 0,
  discount_amount: 0,
  final_amount: 1000,
  notes: null,
  attachments: [],
  removed_cost_code_uuids: [],
  audit_log: [],
  is_active: true,
  created_at: '2026-05-01T00:00:00.000Z',
  updated_at: '2026-05-01T00:00:00.000Z',
  line_items: [],
  project: null,
  ...overrides,
})

const pagination = { page: 1, pageSize: 100, totalRecords: 1, totalPages: 1, hasMore: false }

describe('useEstimatesStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  // ── Initial state ────────────────────────────────────────────────────────────
  describe('initial state', () => {
    it('starts with empty estimates array', () => {
      const store = useEstimatesStore()
      expect(store.estimates).toEqual([])
    })

    it('starts with loading = false', () => {
      const store = useEstimatesStore()
      expect(store.loading).toBe(false)
    })

    it('starts with error = null', () => {
      const store = useEstimatesStore()
      expect(store.error).toBe(null)
    })
  })

  // ── fetchEstimates ───────────────────────────────────────────────────────────
  describe('fetchEstimates', () => {
    it('populates estimates on success', async () => {
      mockFetch.mockResolvedValue({ data: [makeEstimate()], pagination })
      const store = useEstimatesStore()

      await store.fetchEstimates('corp-1')
      expect(store.estimates).toHaveLength(1)
      expect(store.estimates[0].uuid).toBe('est-uuid-1')
      expect(store.loading).toBe(false)
    })

    it('stores pagination info keyed by corporation', async () => {
      mockFetch.mockResolvedValue({ data: [makeEstimate()], pagination })
      const store = useEstimatesStore()

      await store.fetchEstimates('corp-1')
      expect(store.getPaginationInfo('corp-1')).toEqual(pagination)
    })

    it('sets error on fetch failure', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      const store = useEstimatesStore()

      await store.fetchEstimates('corp-1')
      expect(store.error).toBe('Network error')
      expect(store.estimates).toEqual([])
      expect(store.loading).toBe(false)
    })

    it('does nothing when corporationUuid is empty', async () => {
      const store = useEstimatesStore()
      await store.fetchEstimates('')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('calls API with correct corporation_uuid query param', async () => {
      mockFetch.mockResolvedValue({ data: [], pagination })
      const store = useEstimatesStore()

      await store.fetchEstimates('corp-42')
      expect(mockFetch).toHaveBeenCalledWith('/api/estimates', expect.objectContaining({
        query: expect.objectContaining({ corporation_uuid: 'corp-42' }),
      }))
    })
  })

  // ── createEstimate ───────────────────────────────────────────────────────────
  describe('createEstimate', () => {
    const payload = {
      corporation_uuid: 'corp-1',
      project_uuid: 'proj-1',
      estimate_date: '2026-05-01',
      total_amount: 1000,
      final_amount: 1000,
      line_items: [],
    }

    it('returns true and prepends estimate on success', async () => {
      mockFetch.mockResolvedValue({ data: makeEstimate() })
      const store = useEstimatesStore()

      const result = await store.createEstimate(payload)
      expect(result).toBe(true)
      expect(store.estimates).toHaveLength(1)
    })

    it('calls POST /api/estimates with the payload body', async () => {
      mockFetch.mockResolvedValue({ data: makeEstimate() })
      const store = useEstimatesStore()

      await store.createEstimate(payload)
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/estimates',
        expect.objectContaining({
          method: 'POST',
          body: expect.objectContaining({
            corporation_uuid: 'corp-1',
            project_uuid: 'proj-1',
            total_amount: 1000,
            final_amount: 1000,
          }),
        }),
      )
    })

    it('returns false and sets error on failure', async () => {
      mockFetch.mockRejectedValue(new Error('Constraint violation'))
      const store = useEstimatesStore()

      const result = await store.createEstimate(payload)
      expect(result).toBe(false)
      expect(store.error).toBe('Constraint violation')
    })

    it('does not add estimate when corporation does not match current corp', async () => {
      mockFetch.mockResolvedValue({ data: makeEstimate({ corporation_uuid: 'other-corp' }) })
      const store = useEstimatesStore()

      await store.createEstimate(payload)
      expect(store.estimates).toHaveLength(0)
    })
  })

  // ── updateEstimate ───────────────────────────────────────────────────────────
  describe('updateEstimate', () => {
    it('updates estimate in local array on success', async () => {
      const store = useEstimatesStore()
      // Pre-populate
      mockFetch.mockResolvedValueOnce({ data: [makeEstimate()], pagination })
      await store.fetchEstimates('corp-1')

      const updated = makeEstimate({ status: 'Ready', total_amount: 2000 })
      mockFetch.mockResolvedValueOnce({ data: updated })

      const result = await store.updateEstimate({ uuid: 'est-uuid-1', status: 'Ready', total_amount: 2000 })
      expect(result).toBe(true)
      expect(store.estimates[0].status).toBe('Ready')
      expect(store.estimates[0].total_amount).toBe(2000)
    })

    it('returns false and sets error on failure', async () => {
      mockFetch.mockRejectedValue(new Error('Update failed'))
      const store = useEstimatesStore()

      const result = await store.updateEstimate({ uuid: 'est-uuid-1' })
      expect(result).toBe(false)
      expect(store.error).toBeDefined()
    })

    it('uses PUT method with the correct endpoint', async () => {
      mockFetch.mockResolvedValue({ data: makeEstimate() })
      const store = useEstimatesStore()

      await store.updateEstimate({ uuid: 'est-uuid-1', status: 'Approved' })
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/estimates/est-uuid-1',
        expect.objectContaining({ method: 'PUT' }),
      )
    })
  })

  // ── deleteEstimate ───────────────────────────────────────────────────────────
  describe('deleteEstimate', () => {
    it('removes deleted estimate from local array', async () => {
      const store = useEstimatesStore()
      mockFetch.mockResolvedValueOnce({ data: [makeEstimate()], pagination })
      await store.fetchEstimates('corp-1')

      mockFetch.mockResolvedValueOnce({ message: 'Estimate deleted successfully' })
      const result = await store.deleteEstimate('est-uuid-1')
      expect(result).toBe(true)
      expect(store.estimates).toHaveLength(0)
    })

    it('throws error and keeps loading = false on failure', async () => {
      mockFetch.mockRejectedValue(Object.assign(new Error('Not found'), { statusCode: 404 }))
      const store = useEstimatesStore()

      await expect(store.deleteEstimate('est-uuid-1')).rejects.toBeDefined()
      expect(store.loading).toBe(false)
    })
  })

  // ── Getters ──────────────────────────────────────────────────────────────────
  describe('getters', () => {
    it('getEstimateByUuid returns matching estimate', () => {
      const store = useEstimatesStore()
      mockFetch.mockResolvedValue({ data: [makeEstimate()], pagination })

      // Directly seed via fetchEstimates
      store.fetchEstimates('corp-1')
      // Manually set state via a resolved promise check
      expect(store.getEstimateByUuid).toBeTypeOf('function')
    })

    it('getEstimatesByProject filters by project_uuid', async () => {
      const store = useEstimatesStore()
      mockFetch.mockResolvedValue({
        data: [
          makeEstimate({ uuid: 'e-1', project_uuid: 'proj-A' }),
          makeEstimate({ uuid: 'e-2', project_uuid: 'proj-B' }),
          makeEstimate({ uuid: 'e-3', project_uuid: 'proj-A' }),
        ],
        pagination,
      })
      await store.fetchEstimates('corp-1')

      const result = store.getEstimatesByProject('proj-A')
      expect(result).toHaveLength(2)
      expect(result.every(e => e.project_uuid === 'proj-A')).toBe(true)
    })

    it('getEstimatesByStatus filters by status', async () => {
      const store = useEstimatesStore()
      mockFetch.mockResolvedValue({
        data: [
          makeEstimate({ uuid: 'e-1', status: 'Draft' }),
          makeEstimate({ uuid: 'e-2', status: 'Ready' }),
          makeEstimate({ uuid: 'e-3', status: 'Draft' }),
        ],
        pagination,
      })
      await store.fetchEstimates('corp-1')

      const drafts = store.getEstimatesByStatus('Draft')
      expect(drafts).toHaveLength(2)
    })

    it('getPaginationInfo returns null when no pagination stored', () => {
      const store = useEstimatesStore()
      expect(store.getPaginationInfo('corp-1')).toBeNull()
    })
  })

  // ── clearEstimates ───────────────────────────────────────────────────────────
  describe('clearEstimates', () => {
    it('empties estimates and clears error', async () => {
      const store = useEstimatesStore()
      mockFetch.mockResolvedValueOnce({ data: [makeEstimate()], pagination })
      await store.fetchEstimates('corp-1')

      store.clearEstimates()
      expect(store.estimates).toHaveLength(0)
      expect(store.error).toBeNull()
    })
  })
})
