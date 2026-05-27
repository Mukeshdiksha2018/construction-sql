import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCorporationStore } from '~/stores/corporations'

describe('corporation store', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('stores corporations from API response', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      corporations: [{
        id: 'corp-1',
        profitCenterId: null,
        name: 'Corp One',
        legalName: 'Corp One Legal',
        sortOrder: 1,
        propertyType: 1,
        strId: 0,
      }],
    })
    vi.stubGlobal('$fetch', mockFetch)

    const store = useCorporationStore()
    await store.fetchCorporations()

    expect(mockFetch).toHaveBeenCalledWith('/api/nimble/corporations', {
      query: { IsShowAll: false },
      credentials: 'include',
    })
    expect(store.corporations).toHaveLength(1)
    expect(store.loaded).toBe(true)
  })

  it('clears selection when corporation list is reset', () => {
    const store = useCorporationStore()
    store.selectedCorporationId = 'missing-id'
    store.clear()
    expect(store.selectedCorporationId).toBeNull()
    expect(store.corporations).toEqual([])
  })
})
