import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { ref, computed } from 'vue'

// Auto-import stubs
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('reactive', (await import('vue')).reactive)

const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)
vi.stubGlobal('defineStore', (await import('pinia')).defineStore)

describe('usePurchaseOrderResourcesStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  async function getStore() {
    const { usePurchaseOrderResourcesStore } = await import('../../../app/stores/purchaseOrderResources')
    return usePurchaseOrderResourcesStore()
  }

  // ── Key helpers ────────────────────────────────────────────────────────────

  describe('projectKey / estimateKey', () => {
    it('projectKey combines corp + project uuids', async () => {
      const store = await getStore()
      expect(store.projectKey('corp-1', 'proj-1')).toBe('corp-1::proj-1')
    })

    it('projectKey handles missing project uuid', async () => {
      const store = await getStore()
      expect(store.projectKey('corp-1')).toBe('corp-1::')
    })

    it('estimateKey appends estimate uuid', async () => {
      const store = await getStore()
      expect(store.estimateKey('corp-1', 'proj-1', 'est-1')).toBe('corp-1::proj-1::est-1')
    })

    it('estimateKey handles missing estimate uuid', async () => {
      const store = await getStore()
      expect(store.estimateKey('corp-1', 'proj-1')).toBe('corp-1::proj-1::')
    })
  })

  // ── Sync getters ───────────────────────────────────────────────────────────

  describe('getEstimateItems (sync)', () => {
    it('returns empty array when no data cached', async () => {
      const store = await getStore()
      expect(store.getEstimateItems('corp-1', 'proj-1', 'est-1')).toEqual([])
    })

    it('returns empty array for missing estimateUuid', async () => {
      const store = await getStore()
      expect(store.getEstimateItems('corp-1', 'proj-1', undefined)).toEqual([])
    })

    it('returns empty array for missing corporationUuid', async () => {
      const store = await getStore()
      expect(store.getEstimateItems(undefined, 'proj-1', 'est-1')).toEqual([])
    })
  })

  describe('getEstimateItemsLoading', () => {
    it('returns false when no data cached', async () => {
      const store = await getStore()
      expect(store.getEstimateItemsLoading('corp-1', 'proj-1', 'est-1')).toBe(false)
    })

    it('returns false for missing inputs', async () => {
      const store = await getStore()
      expect(store.getEstimateItemsLoading(undefined, undefined, undefined)).toBe(false)
    })
  })

  describe('getEstimateItemsError', () => {
    it('returns null when no data cached', async () => {
      const store = await getStore()
      expect(store.getEstimateItemsError('corp-1', 'proj-1', 'est-1')).toBeNull()
    })

    it('returns null for missing inputs', async () => {
      const store = await getStore()
      expect(store.getEstimateItemsError(undefined, undefined, undefined)).toBeNull()
    })
  })

  describe('getEstimatesByProject', () => {
    it('returns empty array when no data cached', async () => {
      const store = await getStore()
      expect(store.getEstimatesByProject('corp-1', 'proj-1')).toEqual([])
    })

    it('returns empty array for undefined inputs', async () => {
      const store = await getStore()
      expect(store.getEstimatesByProject(undefined, undefined)).toEqual([])
    })

    // ── Root-cause regression: estimates must be stored under corp::project key ──

    it('returns estimates after ensureEstimates is called WITH projectUuid', async () => {
      mockFetch.mockResolvedValue({ data: [{ uuid: 'est-abc', estimate_number: 'E-001' }] })
      const store = await getStore()

      await store.ensureEstimates({ corporationUuid: 'corp-1', projectUuid: 'proj-1' })

      const result = store.getEstimatesByProject('corp-1', 'proj-1')
      expect(result).toHaveLength(1)
      expect(result[0].uuid).toBe('est-abc')
    })

    it('returns empty when ensureEstimates was called WITHOUT projectUuid (old bug reproduction)', async () => {
      // Old bug: ensureEstimates called without projectUuid stores under key corp::
      // getEstimatesByProject looks under corp::proj-1 → never finds them
      mockFetch.mockResolvedValue({ data: [{ uuid: 'est-abc' }] })
      const store = await getStore()

      // Intentionally omit projectUuid (simulates the old broken call sites)
      await store.ensureEstimates({ corporationUuid: 'corp-1' })

      // Under the project-scoped key the estimates should NOT be visible
      expect(store.getEstimatesByProject('corp-1', 'proj-1')).toEqual([])
      // But they ARE visible under the unscoped key (no project)
      expect(store.getEstimatesByProject('corp-1', undefined)).toHaveLength(1)
    })

    it('does not bleed estimates across different projects', async () => {
      mockFetch
        .mockResolvedValueOnce({ data: [{ uuid: 'est-p1', estimate_number: 'E-P1' }] })
        .mockResolvedValueOnce({ data: [{ uuid: 'est-p2', estimate_number: 'E-P2' }] })
      const store = await getStore()

      await store.ensureEstimates({ corporationUuid: 'corp-1', projectUuid: 'proj-1' })
      await store.ensureEstimates({ corporationUuid: 'corp-1', projectUuid: 'proj-2' })

      expect(store.getEstimatesByProject('corp-1', 'proj-1')[0].uuid).toBe('est-p1')
      expect(store.getEstimatesByProject('corp-1', 'proj-2')[0].uuid).toBe('est-p2')
      // No cross-contamination
      expect(store.getEstimatesByProject('corp-1', 'proj-1')).toHaveLength(1)
      expect(store.getEstimatesByProject('corp-1', 'proj-2')).toHaveLength(1)
    })

    it('does not bleed estimates across different corporations', async () => {
      mockFetch
        .mockResolvedValueOnce({ data: [{ uuid: 'est-c1' }] })
        .mockResolvedValueOnce({ data: [{ uuid: 'est-c2' }] })
      const store = await getStore()

      await store.ensureEstimates({ corporationUuid: 'corp-1', projectUuid: 'proj-1' })
      await store.ensureEstimates({ corporationUuid: 'corp-2', projectUuid: 'proj-1' })

      expect(store.getEstimatesByProject('corp-1', 'proj-1')[0].uuid).toBe('est-c1')
      expect(store.getEstimatesByProject('corp-2', 'proj-1')[0].uuid).toBe('est-c2')
    })
  })

  // ── Async actions ──────────────────────────────────────────────────────────

  describe('ensureEstimates', () => {
    it('fetches from /api/estimates and caches result', async () => {
      mockFetch.mockResolvedValue({ data: [{ uuid: 'est-1', name: 'Estimate 1' }] })
      const store = await getStore()

      const result = await store.ensureEstimates({ corporationUuid: 'corp-1', projectUuid: 'proj-1' })

      expect(mockFetch).toHaveBeenCalledWith('/api/estimates', expect.objectContaining({
        query: expect.objectContaining({ corporation_uuid: 'corp-1' }),
      }))
      expect(result).toHaveLength(1)
      expect(result[0].uuid).toBe('est-1')
    })

    it('does not fetch again if already loaded', async () => {
      mockFetch.mockResolvedValue({ data: [{ uuid: 'est-1' }] })
      const store = await getStore()

      await store.ensureEstimates({ corporationUuid: 'corp-1' })
      await store.ensureEstimates({ corporationUuid: 'corp-1' })

      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('re-fetches when force=true', async () => {
      mockFetch.mockResolvedValue({ data: [] })
      const store = await getStore()

      await store.ensureEstimates({ corporationUuid: 'corp-1' })
      await store.ensureEstimates({ corporationUuid: 'corp-1', force: true })

      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('returns empty array for missing corporationUuid', async () => {
      const store = await getStore()
      const result = await store.ensureEstimates({ corporationUuid: '' })
      expect(result).toEqual([])
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('ensureItemTypes', () => {
    it('fetches from /api/item-types', async () => {
      mockFetch.mockResolvedValue({ data: [{ uuid: 'it-1', item_type: 'Steel' }] })
      const store = await getStore()

      const result = await store.ensureItemTypes({ corporationUuid: 'corp-1' })
      expect(mockFetch).toHaveBeenCalledWith('/api/item-types', expect.objectContaining({
        query: { corporation_uuid: 'corp-1' },
      }))
      expect(result).toHaveLength(1)
    })

    it('caches item types and avoids duplicate requests', async () => {
      mockFetch.mockResolvedValue({ data: [{ uuid: 'it-1' }] })
      const store = await getStore()
      await store.ensureItemTypes({ corporationUuid: 'corp-1' })
      await store.ensureItemTypes({ corporationUuid: 'corp-1' })
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('clear / clearProject', () => {
    it('clear removes all cached project states', async () => {
      mockFetch.mockResolvedValue({ data: [] })
      const store = await getStore()
      await store.ensureEstimates({ corporationUuid: 'corp-1', projectUuid: 'proj-1' })

      store.clear()

      // After clear, getEstimatesByProject returns empty again
      expect(store.getEstimatesByProject('corp-1', 'proj-1')).toEqual([])
    })

    it('clearProject only removes the specified project', async () => {
      mockFetch.mockResolvedValue({ data: [{ uuid: 'est-1' }] })
      const store = await getStore()
      await store.ensureEstimates({ corporationUuid: 'corp-1', projectUuid: 'proj-1' })
      await store.ensureEstimates({ corporationUuid: 'corp-1', projectUuid: 'proj-2' })

      store.clearProject('corp-1', 'proj-1')

      expect(store.getEstimatesByProject('corp-1', 'proj-1')).toEqual([])
      // proj-2 still has data
      expect(store.getEstimatesByProject('corp-1', 'proj-2')).toHaveLength(1)
    })
  })

  describe('ensureProjectResources', () => {
    it('runs ensureItemTypes, ensureCostCodeConfigurations, ensurePreferredItems in parallel', async () => {
      mockFetch.mockResolvedValue({ data: [] })
      const store = await getStore()

      await store.ensureProjectResources({ corporationUuid: 'corp-1', projectUuid: 'proj-1' })

      const urls = mockFetch.mock.calls.map((c: any[]) => c[0] as string)
      expect(urls).toContain('/api/item-types')
      expect(urls.some((u: string) => u.includes('cost-code-configurations'))).toBe(true)
    })

    it('does nothing for empty corporationUuid', async () => {
      const store = await getStore()
      await store.ensureProjectResources({ corporationUuid: '' })
      expect(mockFetch).not.toHaveBeenCalled()
    })

    // ── Regression: ensureProjectResources must also fetch estimates ──────────

    it('fetches /api/estimates as part of the resource batch when projectUuid is given', async () => {
      mockFetch.mockResolvedValue({ data: [] })
      const store = await getStore()

      await store.ensureProjectResources({ corporationUuid: 'corp-1', projectUuid: 'proj-1' })

      const urls = mockFetch.mock.calls.map((c: any[]) => c[0] as string)
      expect(urls).toContain('/api/estimates')
    })

    it('passes projectUuid to /api/estimates so results land in the project-scoped cache slot', async () => {
      mockFetch.mockImplementation((url: string, opts: any) => {
        if (url === '/api/estimates') {
          return Promise.resolve({ data: [{ uuid: 'est-from-resources', estimate_number: 'E-001' }] })
        }
        return Promise.resolve({ data: [] })
      })
      const store = await getStore()

      await store.ensureProjectResources({ corporationUuid: 'corp-1', projectUuid: 'proj-1' })

      // Verify the estimates API was called with the project UUID
      const estimatesCall = mockFetch.mock.calls.find((c: any[]) => c[0] === '/api/estimates')
      expect(estimatesCall).toBeDefined()
      expect(estimatesCall![1]?.query?.project_uuid).toBe('proj-1')

      // Verify the estimates are retrievable via getEstimatesByProject after the call
      const cached = store.getEstimatesByProject('corp-1', 'proj-1')
      expect(cached).toHaveLength(1)
      expect(cached[0].uuid).toBe('est-from-resources')
    })

    it('skips /api/estimates when no projectUuid is provided', async () => {
      mockFetch.mockResolvedValue({ data: [] })
      const store = await getStore()

      await store.ensureProjectResources({ corporationUuid: 'corp-1' })

      const urls = mockFetch.mock.calls.map((c: any[]) => c[0] as string)
      // Should NOT call estimates endpoint without a project scope
      expect(urls).not.toContain('/api/estimates')
    })

    it('full round-trip: after ensureProjectResources, getEstimatesByProject returns project estimates', async () => {
      const fakeEstimates = [
        { uuid: 'est-001', estimate_number: 'E-001', status: 'Approved', estimate_date: '2026-01-15' },
        { uuid: 'est-002', estimate_number: 'E-002', status: 'Draft',    estimate_date: '2026-02-20' },
      ]
      mockFetch.mockImplementation((url: string) => {
        if (url === '/api/estimates') return Promise.resolve({ data: fakeEstimates })
        return Promise.resolve({ data: [] })
      })
      const store = await getStore()

      await store.ensureProjectResources({ corporationUuid: 'corp-1', projectUuid: 'proj-1' })

      const estimates = store.getEstimatesByProject('corp-1', 'proj-1')
      expect(estimates).toHaveLength(2)
      expect(estimates.map((e: any) => e.uuid)).toEqual(expect.arrayContaining(['est-001', 'est-002']))
    })
  })

  describe('ensureEstimateItems (async)', () => {
    it('calls /api/estimate-line-items with all three required params', async () => {
      mockFetch.mockImplementation((url: string) => {
        // preferred items (cost-code-configurations/project-filtered)
        if (url.includes('cost-code-configurations')) return Promise.resolve({ data: [] })
        // line items — material_items already embedded in response
        if (url === '/api/estimate-line-items') {
          return Promise.resolve({
            data: [{
              uuid: 'li-1',
              cost_code_uuid: 'cc-1',
              cost_code_label: 'Concrete',
              cost_code_number: '03000',
              cost_code_name: 'Concrete',
              division_name: 'Division 3',
              material_items: [{ uuid: 'mat-1', item_uuid: 'item-1', item_name: 'Steel Beam', unit_price: '100', quantity: '2' }],
            }],
          })
        }
        return Promise.resolve({ data: [] })
      })

      const store = await getStore()
      const result = await store.ensureEstimateItems({
        corporationUuid: 'corp-1',
        projectUuid: 'proj-1',
        estimateUuid: 'est-1',
      })

      // Verify the API was called with all required query params
      const lineItemsCall = mockFetch.mock.calls.find((c: any[]) => c[0] === '/api/estimate-line-items')
      expect(lineItemsCall).toBeDefined()
      expect(lineItemsCall![1]?.query).toMatchObject({
        estimate_uuid: 'est-1',
        project_uuid: 'proj-1',
        corporation_uuid: 'corp-1',
      })

      // ensureEstimateItems now returns the poItems array directly
      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(1)
      // The poItems are transformed from rawItems; verify the cost_code_uuid is carried over
      expect(result[0].cost_code_uuid).toBe('cc-1')
    })

    it('does NOT make separate /api/estimate-material-items calls (uses embedded material_items)', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('cost-code-configurations')) return Promise.resolve({ data: [] })
        if (url === '/api/estimate-line-items') {
          return Promise.resolve({
            data: [{ uuid: 'li-1', cost_code_uuid: 'cc-1', material_items: [] }],
          })
        }
        return Promise.resolve({ data: [] })
      })

      const store = await getStore()
      await store.ensureEstimateItems({ corporationUuid: 'corp-1', projectUuid: 'proj-1', estimateUuid: 'est-1' })

      const urls = mockFetch.mock.calls.map((c: any[]) => c[0] as string)
      expect(urls).not.toContain('/api/estimate-material-items')
    })

    it('flattens material_items from multiple line items, tagging each with cost_code info', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('cost-code-configurations')) return Promise.resolve({ data: [] })
        if (url === '/api/estimate-line-items') {
          return Promise.resolve({
            data: [
              { uuid: 'li-1', cost_code_uuid: 'cc-1', cost_code_number: '03000', material_items: [
                { uuid: 'mat-1', item_uuid: 'i1', item_name: 'Beam', unit_price: '100', quantity: '1' },
              ]},
              { uuid: 'li-2', cost_code_uuid: 'cc-2', cost_code_number: '04000', material_items: [
                { uuid: 'mat-2', item_uuid: 'i2', item_name: 'Block', unit_price: '50',  quantity: '3' },
                { uuid: 'mat-3', item_uuid: 'i3', item_name: 'Mortar', unit_price: '10', quantity: '5' },
              ]},
            ],
          })
        }
        return Promise.resolve({ data: [] })
      })

      const store = await getStore()
      const result = await store.ensureEstimateItems({ corporationUuid: 'corp-1', projectUuid: 'proj-1', estimateUuid: 'est-1' })

      // Returns poItems array directly; cost_code_uuid is carried through transform
      expect(result).toHaveLength(3)
      expect(result[0].cost_code_uuid).toBe('cc-1')
      expect(result[1].cost_code_uuid).toBe('cc-2')
      expect(result[2].cost_code_uuid).toBe('cc-2')
    })

    it('returns empty array for missing inputs', async () => {
      const store = await getStore()
      const result = await store.ensureEstimateItems({ corporationUuid: '', estimateUuid: '' })
      // Returns empty array directly (no poItems/rawItems wrapper)
      expect(Array.isArray(result)).toBe(true)
      expect(result).toEqual([])
    })

    it('caches result so second call with same key skips the API', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('cost-code-configurations')) return Promise.resolve({ data: [] })
        if (url === '/api/estimate-line-items') return Promise.resolve({ data: [{ uuid: 'li-1', cost_code_uuid: 'cc-1', material_items: [] }] })
        return Promise.resolve({ data: [] })
      })
      const store = await getStore()
      const args = { corporationUuid: 'corp-1', projectUuid: 'proj-1', estimateUuid: 'est-1' }

      await store.ensureEstimateItems(args)
      const callCount = mockFetch.mock.calls.length
      await store.ensureEstimateItems(args) // second call — should use cache

      expect(mockFetch.mock.calls.length).toBe(callCount) // no new calls
    })

    it('re-fetches when force=true', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('cost-code-configurations')) return Promise.resolve({ data: [] })
        if (url === '/api/estimate-line-items') return Promise.resolve({ data: [] })
        return Promise.resolve({ data: [] })
      })
      const store = await getStore()
      const args = { corporationUuid: 'corp-1', projectUuid: 'proj-1', estimateUuid: 'est-1' }

      await store.ensureEstimateItems(args)
      const firstCount = mockFetch.mock.calls.length
      await store.ensureEstimateItems({ ...args, force: true })

      expect(mockFetch.mock.calls.length).toBeGreaterThan(firstCount)
    })

    // ── Timing regression: after ensureEstimates resolves, calling ensureEstimateItems ──
    // ── directly (as the dedicated watcher does) should populate getEstimateItems cache ──

    it('getEstimateItems returns items after ensureEstimateItems is called (watcher timing fix)', async () => {
      const matItem = { uuid: 'mat-1', item_uuid: 'item-1', item_name: 'Brick', unit_price: '50', quantity: '10' }
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('cost-code-configurations')) return Promise.resolve({ data: [] })
        if (url === '/api/estimate-line-items') {
          return Promise.resolve({
            data: [{ uuid: 'li-1', cost_code_uuid: 'cc-1', cost_code_number: '03000', material_items: [matItem] }],
          })
        }
        return Promise.resolve({ data: [] })
      })
      const store = await getStore()

      // Simulate the timing: items are empty before the fetch
      expect(store.getEstimateItems('corp-1', 'proj-1', 'est-1')).toEqual([])

      // The dedicated watcher calls ensureEstimateItems when effectiveEstimateUuid resolves
      await store.ensureEstimateItems({ corporationUuid: 'corp-1', projectUuid: 'proj-1', estimateUuid: 'est-1' })

      // Now getEstimateItems should return the cached items
      const cached = store.getEstimateItems('corp-1', 'proj-1', 'est-1')
      expect(cached).toHaveLength(1)
      expect(cached[0].cost_code_uuid).toBe('cc-1')
    })
  })

  describe('fetchPurchaseOrderItems', () => {
    const mockPOItems = [
      { uuid: 'poi-1', purchase_order_uuid: 'po-1', item_name: 'Widget', po_quantity: 2 },
    ]

    it('fetches items from /api/purchase-order-items', async () => {
      mockFetch.mockResolvedValue({ data: mockPOItems })
      const store = await getStore()

      const result = await store.fetchPurchaseOrderItems('po-1')

      expect(mockFetch).toHaveBeenCalledWith('/api/purchase-order-items', {
        method: 'GET',
        query: { purchase_order_uuid: 'po-1' },
      })
      expect(result).toHaveLength(1)
      expect(result[0].uuid).toBe('poi-1')
    })

    it('returns empty array when uuid is missing', async () => {
      const store = await getStore()
      expect(await store.fetchPurchaseOrderItems('')).toEqual([])
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('returns empty array on API error', async () => {
      mockFetch.mockRejectedValue(new Error('API Error'))
      const store = await getStore()
      expect(await store.fetchPurchaseOrderItems('po-1')).toEqual([])
    })

    it('returns empty array when response data is not an array', async () => {
      mockFetch.mockResolvedValue({ data: null })
      const store = await getStore()
      expect(await store.fetchPurchaseOrderItems('po-1')).toEqual([])
    })
  })
})
