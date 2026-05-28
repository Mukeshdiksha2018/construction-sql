import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useItemTypesStore } from '~/stores/itemTypes'

const makeItemType = (overrides = {}) => ({
  id: 1,
  uuid: 'it-uuid-1',
  corporation_uuid: 'corp-1',
  category: 'construction',
  spec_type: 'Structural',
  item_division_uuid: null,
  item_type: 'Steel Beam',
  description: null,
  is_active: true,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  ...overrides,
})

describe('useItemTypesStore', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    setActivePinia(createPinia())
    mockFetch = vi.fn()
    vi.stubGlobal('$fetch', mockFetch)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ── fetchItemTypes ──────────────────────────────────────────────────────────
  describe('fetchItemTypes', () => {
    it('fetches with corporation UUID query param', async () => {
      mockFetch.mockResolvedValue({ data: [makeItemType()] })

      const store = useItemTypesStore()
      await store.fetchItemTypes('corp-1')

      expect(mockFetch).toHaveBeenCalledWith('/api/item-types?corporation_uuid=corp-1')
      expect(store.itemTypes).toHaveLength(1)
      expect(store.itemTypes[0]?.item_type).toBe('Steel Beam')
    })

    it('fetches without corporation UUID when not provided', async () => {
      mockFetch.mockResolvedValue({ data: [makeItemType({ corporation_uuid: null })] })

      const store = useItemTypesStore()
      await store.fetchItemTypes()

      expect(mockFetch).toHaveBeenCalledWith('/api/item-types')
    })

    it('skips fetch when data is already cached', async () => {
      mockFetch.mockResolvedValue({ data: [makeItemType()] })

      const store = useItemTypesStore()
      await store.fetchItemTypes('corp-1')
      await store.fetchItemTypes('corp-1')

      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('re-fetches when forceRefresh is true', async () => {
      mockFetch.mockResolvedValue({ data: [makeItemType()] })

      const store = useItemTypesStore()
      await store.fetchItemTypes('corp-1')
      await store.fetchItemTypes('corp-1', true)

      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('sets error on fetch failure', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const store = useItemTypesStore()
      await store.fetchItemTypes('corp-1')

      expect(store.error).toBe('Network error')
    })

    it('merges item types by corporation when switching corps', async () => {
      const corp1Item = makeItemType({ corporation_uuid: 'corp-1', uuid: 'it-1' })
      const corp2Item = makeItemType({ corporation_uuid: 'corp-2', uuid: 'it-2', item_type: 'PVC Pipe' })
      mockFetch
        .mockResolvedValueOnce({ data: [corp1Item] })
        .mockResolvedValueOnce({ data: [corp2Item] })

      const store = useItemTypesStore()
      await store.fetchItemTypes('corp-1')
      await store.fetchItemTypes('corp-2')

      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })

  // ── createItemType ──────────────────────────────────────────────────────────
  describe('createItemType', () => {
    it('creates and prepends to list', async () => {
      const created = makeItemType({ uuid: 'new-uuid', item_type: 'Lumber' })
      mockFetch.mockResolvedValue({ data: created })

      const store = useItemTypesStore()
      const result = await store.createItemType({
        corporation_uuid: 'corp-1',
        category: 'construction',
        spec_type: 'Framing',
        item_type: 'Lumber',
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/item-types', {
        method: 'POST',
        body: expect.objectContaining({ item_type: 'Lumber' }),
      })
      expect(result?.item_type).toBe('Lumber')
      expect(store.itemTypes[0]?.item_type).toBe('Lumber')
    })

    it('returns null and sets error on create failure', async () => {
      mockFetch.mockRejectedValue({ statusCode: 409, statusMessage: 'Item type already exists' })

      const store = useItemTypesStore()
      const result = await store.createItemType({
        corporation_uuid: 'corp-1',
        category: 'construction',
        spec_type: 'Structural',
        item_type: 'Steel Beam',
      })

      expect(result).toBeNull()
      expect(store.error).toBeTruthy()
    })
  })

  // ── updateItemType ──────────────────────────────────────────────────────────
  describe('updateItemType', () => {
    it('updates item type in the list', async () => {
      const existing = makeItemType()
      const updated = { ...existing, item_type: 'Steel Column' }
      mockFetch.mockResolvedValue({ data: updated })

      const store = useItemTypesStore()
      store.setItemTypes([existing])

      const result = await store.updateItemType({ uuid: 'it-uuid-1', item_type: 'Steel Column' })

      expect(mockFetch).toHaveBeenCalledWith('/api/item-types/it-uuid-1', {
        method: 'PUT',
        body: { uuid: 'it-uuid-1', item_type: 'Steel Column' },
      })
      expect(result?.item_type).toBe('Steel Column')
      expect(store.itemTypes[0]?.item_type).toBe('Steel Column')
    })

    it('returns null and sets error on update failure', async () => {
      mockFetch.mockRejectedValue(new Error('Not found'))

      const store = useItemTypesStore()
      const result = await store.updateItemType({ uuid: 'missing', item_type: 'Test' })

      expect(result).toBeNull()
      expect(store.error).toBeTruthy()
    })
  })

  // ── deleteItemType ──────────────────────────────────────────────────────────
  describe('deleteItemType', () => {
    it('deletes item type and removes from list', async () => {
      mockFetch.mockResolvedValue({})

      const store = useItemTypesStore()
      store.setItemTypes([makeItemType()])

      const result = await store.deleteItemType('it-uuid-1')

      expect(mockFetch).toHaveBeenCalledWith('/api/item-types/it-uuid-1', { method: 'DELETE' })
      expect(result).toBe(true)
      expect(store.itemTypes).toHaveLength(0)
    })

    it('returns false and sets error on delete failure', async () => {
      mockFetch.mockRejectedValue(new Error('Not found'))

      const store = useItemTypesStore()
      const result = await store.deleteItemType('missing-uuid')

      expect(result).toBe(false)
      expect(store.error).toBeTruthy()
    })
  })

  // ── getActiveItemTypes ──────────────────────────────────────────────────────
  describe('getActiveItemTypes', () => {
    it('returns only active item types', () => {
      const store = useItemTypesStore()
      store.setItemTypes([
        makeItemType({ is_active: true, corporation_uuid: 'corp-1' }),
        makeItemType({ uuid: 'it-2', is_active: false, corporation_uuid: 'corp-1' }),
      ])

      expect(store.getActiveItemTypes('corp-1')).toHaveLength(1)
    })

    it('includes global types (null corporation_uuid) for any corp', () => {
      const store = useItemTypesStore()
      store.setItemTypes([
        makeItemType({ uuid: 'it-global', corporation_uuid: null }),
        makeItemType({ uuid: 'it-corp', corporation_uuid: 'corp-1' }),
      ])

      const result = store.getActiveItemTypes('corp-1')
      expect(result).toHaveLength(2)
    })

    it('returns all active when no corporation provided', () => {
      const store = useItemTypesStore()
      store.setItemTypes([
        makeItemType({ is_active: true }),
        makeItemType({ uuid: 'it-2', is_active: false }),
        makeItemType({ uuid: 'it-3', corporation_uuid: 'corp-99', is_active: true }),
      ])

      expect(store.getActiveItemTypes()).toHaveLength(2)
    })
  })

  // ── searchItemTypes ─────────────────────────────────────────────────────────
  describe('searchItemTypes', () => {
    it('filters by query string (case insensitive)', () => {
      const store = useItemTypesStore()
      store.setItemTypes([
        makeItemType({ item_type: 'Steel Beam' }),
        makeItemType({ uuid: 'it-2', item_type: 'PVC Pipe' }),
      ])

      expect(store.searchItemTypes('steel')).toHaveLength(1)
      expect(store.searchItemTypes('STEEL')).toHaveLength(1)
    })

    it('returns all active when query is empty', () => {
      const store = useItemTypesStore()
      store.setItemTypes([makeItemType(), makeItemType({ uuid: 'it-2', item_type: 'Bolt' })])

      expect(store.searchItemTypes('')).toHaveLength(2)
    })

    it('searches description field too', () => {
      const store = useItemTypesStore()
      store.setItemTypes([makeItemType({ description: 'heavy duty structural steel' })])

      expect(store.searchItemTypes('structural')).toHaveLength(1)
    })
  })

  // ── getItemTypeById ─────────────────────────────────────────────────────────
  describe('getItemTypeById', () => {
    it('returns item type by uuid', () => {
      const store = useItemTypesStore()
      store.setItemTypes([makeItemType()])

      expect(store.getItemTypeById('it-uuid-1')?.item_type).toBe('Steel Beam')
      expect(store.getItemTypeById('nonexistent')).toBeUndefined()
    })
  })

  // ── clearData ───────────────────────────────────────────────────────────────
  describe('clearData', () => {
    it('resets itemTypes and error', () => {
      const store = useItemTypesStore()
      store.setItemTypes([makeItemType()])

      store.clearData()

      expect(store.itemTypes).toHaveLength(0)
      expect(store.error).toBeNull()
    })
  })

  // ── hasCachedData ───────────────────────────────────────────────────────────
  describe('hasCachedData', () => {
    it('returns false before fetching', () => {
      const store = useItemTypesStore()
      expect(store.hasCachedData('corp-1')).toBe(false)
    })

    it('returns true after successful fetch', async () => {
      mockFetch.mockResolvedValue({ data: [] })

      const store = useItemTypesStore()
      await store.fetchItemTypes('corp-1')

      expect(store.hasCachedData('corp-1')).toBe(true)
    })
  })
})
