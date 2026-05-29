import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useUOMStore } from '~/stores/uom'

vi.mock('~/utils/authToken', () => ({
  nimbleAuthFetchOptions: () => ({ credentials: 'include' as const }),
}))

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeNimbleUOM(overrides: Record<string, unknown> = {}) {
  return {
    ID: 'uom-uuid-1',
    ClientID: 'client-1',
    UOMType: 'type-1',
    UOMName: 'Kilogram',
    ShortName: 'KG',
    Status: 1,
    ...overrides,
  }
}

function makeApiResponse(uoms = [makeNimbleUOM()]) {
  return { uom: uoms, total: uoms.length }
}

describe('useUOMStore', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    setActivePinia(createPinia())
    mockFetch = vi.fn()
    vi.stubGlobal('$fetch', mockFetch)
    // Ensure client-side path is taken (import.meta.server is undefined / falsy in Vitest)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ── fetchUOM ──────────────────────────────────────────────────────────────

  describe('fetchUOM', () => {
    it('fetches UOM list from the proxy endpoint', async () => {
      mockFetch.mockResolvedValue(makeApiResponse())

      const store = useUOMStore()
      await store.fetchUOM()

      expect(mockFetch).toHaveBeenCalledWith('/api/nimble/uom', { credentials: 'include' })
    })

    it('normalises the raw Nimble DTO: ID → uuid, UOMName → name, ShortName → short_name', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([
        makeNimbleUOM({ ID: 'abc123', UOMName: 'Count', ShortName: 'C' }),
      ]))

      const store = useUOMStore()
      await store.fetchUOM()

      expect(store.uom[0]).toEqual({
        uuid: 'abc123',
        name: 'Count',
        short_name: 'C',
        uom_type_uuid: 'type-1',
        status: 'ACTIVE',
      })
    })

    it('normalises Status 1 → ACTIVE and Status 0 → INACTIVE', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([
        makeNimbleUOM({ ID: 'a1', Status: 1 }),
        makeNimbleUOM({ ID: 'a2', Status: 0 }),
      ]))

      const store = useUOMStore()
      await store.fetchUOM()

      expect(store.uom[0]?.status).toBe('ACTIVE')
      expect(store.uom[1]?.status).toBe('INACTIVE')
    })

    it('maps UOMType → uom_type_uuid', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([
        makeNimbleUOM({ UOMType: 'volume-type-uuid' }),
      ]))

      const store = useUOMStore()
      await store.fetchUOM()

      expect(store.uom[0]?.uom_type_uuid).toBe('volume-type-uuid')
    })

    it('sets loaded = true after successful fetch', async () => {
      mockFetch.mockResolvedValue(makeApiResponse())

      const store = useUOMStore()
      expect(store.loaded).toBe(false)
      await store.fetchUOM()
      expect(store.loaded).toBe(true)
    })

    it('sets loading = false after successful fetch', async () => {
      mockFetch.mockResolvedValue(makeApiResponse())

      const store = useUOMStore()
      await store.fetchUOM()
      expect(store.loading).toBe(false)
    })

    it('handles an empty UOMDTO array gracefully', async () => {
      mockFetch.mockResolvedValue({ uom: [], total: 0 })

      const store = useUOMStore()
      await store.fetchUOM()

      expect(store.uom).toHaveLength(0)
      expect(store.loaded).toBe(true)
    })

    it('uses the cache: skips fetch when already loaded with data', async () => {
      mockFetch.mockResolvedValue(makeApiResponse())

      const store = useUOMStore()
      await store.fetchUOM()
      await store.fetchUOM()

      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('bypasses the cache when forceRefresh = true', async () => {
      mockFetch.mockResolvedValue(makeApiResponse())

      const store = useUOMStore()
      await store.fetchUOM()
      await store.fetchUOM(undefined, true)

      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('sets error and keeps loaded = false on API failure', async () => {
      mockFetch.mockRejectedValue({ statusMessage: 'Unauthorized' })

      const store = useUOMStore()
      await store.fetchUOM()

      expect(store.error).toBeTruthy()
      expect(store.loaded).toBe(false)
      expect(store.uom).toHaveLength(0)
    })

    it('falls back to statusMessage then message for error text', async () => {
      mockFetch.mockRejectedValue({ data: { statusMessage: 'Custom error' } })

      const store = useUOMStore()
      await store.fetchUOM()

      expect(store.error).toBe('Custom error')
    })

    it('sets loading = false even on failure', async () => {
      mockFetch.mockRejectedValue(new Error('Network down'))

      const store = useUOMStore()
      await store.fetchUOM()

      expect(store.loading).toBe(false)
    })
  })

  // ── getActiveUOM getter ────────────────────────────────────────────────────

  describe('getActiveUOM getter', () => {
    it('returns only ACTIVE UOMs', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([
        makeNimbleUOM({ ID: 'active-1', Status: 1 }),
        makeNimbleUOM({ ID: 'inactive-1', Status: 0 }),
        makeNimbleUOM({ ID: 'active-2', Status: 1 }),
      ]))

      const store = useUOMStore()
      await store.fetchUOM()

      const active = store.getActiveUOM()
      expect(active).toHaveLength(2)
      expect(active.every(u => u.status === 'ACTIVE')).toBe(true)
    })

    it('returns all active UOMs regardless of the corporationUuid argument (Nimble UOMs are global)', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([
        makeNimbleUOM({ ID: 'a1', Status: 1 }),
      ]))

      const store = useUOMStore()
      await store.fetchUOM()

      const withCorp = store.getActiveUOM('some-corp-uuid')
      const withoutCorp = store.getActiveUOM()
      expect(withCorp).toHaveLength(1)
      expect(withoutCorp).toHaveLength(1)
    })

    it('returns empty array when no UOMs are loaded', () => {
      const store = useUOMStore()
      expect(store.getActiveUOM()).toEqual([])
    })
  })

  // ── getUOMById getter ──────────────────────────────────────────────────────

  describe('getUOMById getter', () => {
    it('finds a UOM by its UUID', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([
        makeNimbleUOM({ ID: 'find-me', UOMName: 'Litre' }),
      ]))

      const store = useUOMStore()
      await store.fetchUOM()

      const found = store.getUOMById('find-me')
      expect(found?.name).toBe('Litre')
    })

    it('returns undefined when UUID is not in the list', async () => {
      mockFetch.mockResolvedValue(makeApiResponse())

      const store = useUOMStore()
      await store.fetchUOM()

      expect(store.getUOMById('nonexistent')).toBeUndefined()
    })
  })

  // ── getShortName getter ────────────────────────────────────────────────────

  describe('getShortName getter', () => {
    it('returns the short_name when available', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([
        makeNimbleUOM({ ID: 'kg-uuid', UOMName: 'Kilogram', ShortName: 'KG' }),
      ]))

      const store = useUOMStore()
      await store.fetchUOM()

      expect(store.getShortName('kg-uuid')).toBe('KG')
    })

    it('falls back to name when short_name is empty', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([
        makeNimbleUOM({ ID: 'no-short', UOMName: 'Count', ShortName: '' }),
      ]))

      const store = useUOMStore()
      await store.fetchUOM()

      expect(store.getShortName('no-short')).toBe('Count')
    })

    it('returns the raw UUID when the ID is not in the store', async () => {
      mockFetch.mockResolvedValue(makeApiResponse())

      const store = useUOMStore()
      await store.fetchUOM()

      expect(store.getShortName('unknown-uuid')).toBe('unknown-uuid')
    })

    it('returns the raw ID before any data is loaded', () => {
      const store = useUOMStore()
      expect(store.getShortName('raw-id')).toBe('raw-id')
    })
  })

  // ── getUOMByUuid / getUOMById ─────────────────────────────────────────────

  describe('getUOMByUuid', () => {
    it('returns the UOM row for a matching uuid', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([
        makeNimbleUOM({ ID: 'uom-uuid-1', UOMName: 'Each', ShortName: 'EA' }),
      ]))

      const store = useUOMStore()
      await store.fetchUOM()

      expect(store.getUOMByUuid('uom-uuid-1')).toEqual({
        uuid: 'uom-uuid-1',
        name: 'Each',
        short_name: 'EA',
        uom_type_uuid: 'type-1',
        status: 'ACTIVE',
      })
    })

    it('returns undefined when uuid is not found', async () => {
      mockFetch.mockResolvedValue(makeApiResponse())

      const store = useUOMStore()
      await store.fetchUOM()

      expect(store.getUOMByUuid('missing')).toBeUndefined()
    })

    it('getUOMById resolves the same row as getUOMByUuid', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([
        makeNimbleUOM({ ID: 'uom-uuid-1' }),
      ]))

      const store = useUOMStore()
      await store.fetchUOM()

      expect(store.getUOMById('uom-uuid-1')).toEqual(store.getUOMByUuid('uom-uuid-1'))
    })
  })

  // ── refresh ────────────────────────────────────────────────────────────────

  describe('refresh', () => {
    it('forces a re-fetch even when data is already loaded', async () => {
      mockFetch.mockResolvedValue(makeApiResponse())

      const store = useUOMStore()
      await store.fetchUOM()
      await store.refresh()

      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })

  // ── clear ──────────────────────────────────────────────────────────────────

  describe('clear', () => {
    it('resets all state', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([makeNimbleUOM()]))

      const store = useUOMStore()
      await store.fetchUOM()
      expect(store.uom).toHaveLength(1)
      expect(store.loaded).toBe(true)

      store.clear()

      expect(store.uom).toHaveLength(0)
      expect(store.loaded).toBe(false)
      expect(store.error).toBeNull()
      expect(store.loading).toBe(false)
    })

    it('allows fetchUOM to run again after clear (cache is invalidated)', async () => {
      mockFetch.mockResolvedValue(makeApiResponse())

      const store = useUOMStore()
      await store.fetchUOM()
      store.clear()
      await store.fetchUOM()

      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })
})
