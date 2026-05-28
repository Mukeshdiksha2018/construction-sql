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
  })

  describe('ensureEstimateItems (async)', () => {
    it('fetches estimate line items and material items', async () => {
      mockFetch
        .mockResolvedValueOnce({ data: [{ uuid: 'pref-1' }] }) // preferred items (cost-code-configurations)
        .mockResolvedValueOnce({ data: [{ uuid: 'li-1', cost_code_uuid: 'cc-1' }] }) // line items
        .mockResolvedValueOnce({ data: [{ uuid: 'mat-1', item_name: 'Steel Beam' }] }) // material items

      const store = await getStore()
      const result = await store.ensureEstimateItems({
        corporationUuid: 'corp-1',
        projectUuid: 'proj-1',
        estimateUuid: 'est-1',
      })

      expect(result).toHaveProperty('poItems')
      expect(result).toHaveProperty('rawItems')
    })

    it('returns empty arrays for missing inputs', async () => {
      const store = await getStore()
      const result = await store.ensureEstimateItems({ corporationUuid: '', estimateUuid: '' })
      expect(result.poItems).toEqual([])
      expect(result.rawItems).toEqual([])
    })
  })
})
