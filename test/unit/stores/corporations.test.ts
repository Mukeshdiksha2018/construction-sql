import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCorporationStore } from '~/stores/corporations'
import {
  makeCorporation,
  mockCorporationsApiResponse,
} from '../../helpers/corporations'

describe('useCorporationStore', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    setActivePinia(createPinia())
    mockFetch = vi.fn()
    vi.stubGlobal('$fetch', mockFetch)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getters', () => {
    it('selectedCorporation returns the matching corporation', () => {
      const store = useCorporationStore()
      const corp = makeCorporation({ id: 'selected-id' })
      store.corporations = [corp, makeCorporation({ id: 'other' })]
      store.selectedCorporationId = 'selected-id'

      expect(store.selectedCorporation).toEqual(corp)
      expect(store.hasCorporations).toBe(true)
    })

    it('selectedCorporation is undefined when nothing is selected', () => {
      const store = useCorporationStore()
      store.corporations = [makeCorporation()]

      expect(store.selectedCorporation).toBeUndefined()
    })
  })

  describe('setSelectedCorporation', () => {
    it('updates selectedCorporationId', () => {
      const store = useCorporationStore()
      store.setSelectedCorporation('corp-99')
      expect(store.selectedCorporationId).toBe('corp-99')
      store.setSelectedCorporation(null)
      expect(store.selectedCorporationId).toBeNull()
    })
  })

  describe('clear', () => {
    it('resets all state including error and loaded flags', () => {
      const store = useCorporationStore()
      store.corporations = [makeCorporation()]
      store.selectedCorporationId = 'corp-1'
      store.loading = true
      store.errorMessage = 'previous error'
      store.loaded = true

      store.clear()

      expect(store.corporations).toEqual([])
      expect(store.selectedCorporationId).toBeNull()
      expect(store.loading).toBe(false)
      expect(store.errorMessage).toBe('')
      expect(store.loaded).toBe(false)
      expect(store.hasCorporations).toBe(false)
    })
  })

  describe('fetchCorporations', () => {
    it('loads corporations from the API with credentials', async () => {
      mockFetch.mockResolvedValue(mockCorporationsApiResponse([
        makeCorporation({ id: 'corp-1', name: 'Alpha' }),
        makeCorporation({ id: 'corp-2', name: 'Beta' }),
      ]))

      const store = useCorporationStore()
      await store.fetchCorporations()

      expect(mockFetch).toHaveBeenCalledOnce()
      expect(mockFetch).toHaveBeenCalledWith('/api/nimble/corporations', {
        query: { IsShowAll: false },
        credentials: 'include',
      })
      expect(store.corporations).toHaveLength(2)
      expect(store.loaded).toBe(true)
      expect(store.loading).toBe(false)
      expect(store.errorMessage).toBe('')
    })

    it('skips refetch when already loaded unless force is true', async () => {
      mockFetch.mockResolvedValue(mockCorporationsApiResponse())

      const store = useCorporationStore()
      await store.fetchCorporations()
      await store.fetchCorporations()

      expect(mockFetch).toHaveBeenCalledTimes(1)

      await store.fetchCorporations({ force: true })
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('does not skip refetch when loaded but list is empty', async () => {
      mockFetch
        .mockResolvedValueOnce({ corporations: [] })
        .mockResolvedValueOnce(mockCorporationsApiResponse())

      const store = useCorporationStore()
      await store.fetchCorporations()
      await store.fetchCorporations()

      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('passes IsShowAll=true when requested', async () => {
      mockFetch.mockResolvedValue(mockCorporationsApiResponse())

      const store = useCorporationStore()
      await store.fetchCorporations({ isShowAll: true })

      expect(mockFetch).toHaveBeenCalledWith('/api/nimble/corporations', {
        query: { IsShowAll: true },
        credentials: 'include',
      })
    })

    it('clears selectedCorporationId when selection is no longer in the list', async () => {
      mockFetch.mockResolvedValue(mockCorporationsApiResponse([
        makeCorporation({ id: 'still-here' }),
      ]))

      const store = useCorporationStore()
      store.selectedCorporationId = 'removed-id'
      await store.fetchCorporations()

      expect(store.selectedCorporationId).toBeNull()
    })

    it('keeps selectedCorporationId when it still exists in the list', async () => {
      mockFetch.mockResolvedValue(mockCorporationsApiResponse([
        makeCorporation({ id: 'keep-me' }),
      ]))

      const store = useCorporationStore()
      store.selectedCorporationId = 'keep-me'
      await store.fetchCorporations()

      expect(store.selectedCorporationId).toBe('keep-me')
      expect(store.selectedCorporation?.name).toBe('Corp One')
    })

    it('sets errorMessage and rethrows when the API fails', async () => {
      const apiError = {
        data: { statusMessage: 'Unauthorized' },
        message: '401 Unauthorized',
      }
      mockFetch.mockRejectedValue(apiError)

      const store = useCorporationStore()
      await expect(store.fetchCorporations()).rejects.toEqual(apiError)

      expect(store.errorMessage).toBe('Unauthorized')
      expect(store.loading).toBe(false)
      expect(store.loaded).toBe(false)
    })

    it('uses a fallback error message when API error has no statusMessage', async () => {
      mockFetch.mockRejectedValue(new Error('Network down'))

      const store = useCorporationStore()
      await expect(store.fetchCorporations()).rejects.toThrow('Network down')

      expect(store.errorMessage).toBe('Network down')
    })

    it('does not start a second fetch while one is in progress', async () => {
      let resolveFetch!: (value: unknown) => void
      mockFetch.mockImplementation(
        () => new Promise(resolve => { resolveFetch = resolve }),
      )

      const store = useCorporationStore()
      const first = store.fetchCorporations()
      const second = store.fetchCorporations()

      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(store.loading).toBe(true)

      resolveFetch(mockCorporationsApiResponse())
      await Promise.all([first, second])

      expect(store.loading).toBe(false)
    })

    it('handles missing corporations array in response', async () => {
      mockFetch.mockResolvedValue({})

      const store = useCorporationStore()
      await store.fetchCorporations()

      expect(store.corporations).toEqual([])
      expect(store.loaded).toBe(true)
    })
  })

  describe('ensureReady', () => {
    it('fetches corporations when not yet loaded', async () => {
      mockFetch.mockResolvedValue(mockCorporationsApiResponse())

      const store = useCorporationStore()
      await store.ensureReady()

      expect(mockFetch).toHaveBeenCalledOnce()
      expect(store.loaded).toBe(true)
      expect(store.corporations.length).toBeGreaterThan(0)
    })

    it('skips fetch when corporations are already loaded', async () => {
      mockFetch.mockResolvedValue(mockCorporationsApiResponse())

      const store = useCorporationStore()
      store.corporations = [makeCorporation()]
      store.loaded = true

      await store.ensureReady()

      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('waits for an in-flight fetch instead of starting a duplicate', async () => {
      let resolveFetch!: (value: unknown) => void
      mockFetch.mockImplementation(
        () => new Promise(resolve => { resolveFetch = resolve }),
      )

      const store = useCorporationStore()
      const inFlight = store.fetchCorporations()
      const ready = store.ensureReady()

      expect(mockFetch).toHaveBeenCalledTimes(1)

      resolveFetch(mockCorporationsApiResponse())
      await Promise.all([inFlight, ready])

      expect(store.loaded).toBe(true)
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })
})
