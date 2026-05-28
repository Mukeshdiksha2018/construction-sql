import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { usePreferredItemsStore } from '~/stores/preferredItems'

const makeItem = (overrides = {}) => ({
  id: 1,
  uuid: 'item-uuid-1',
  corporation_uuid: 'corp-1',
  project_uuid: 'proj-1',
  cost_code_configuration_uuid: null,
  item_type_uuid: 'it-1',
  category: 'construction',
  item_name: 'Steel Beam 10ft',
  unit_price: 49.99,
  unit: 'ea',
  description: null,
  status: 'Active',
  is_active: true,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  ...overrides,
})

describe('usePreferredItemsStore', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    setActivePinia(createPinia())
    mockFetch = vi.fn()
    vi.stubGlobal('$fetch', mockFetch)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ── fetchItems ──────────────────────────────────────────────────────────────
  describe('fetchItems', () => {
    it('fetches items by corporation uuid', async () => {
      mockFetch.mockResolvedValue({ data: [makeItem()] })

      const store = usePreferredItemsStore()
      await store.fetchItems('corp-1')

      expect(mockFetch).toHaveBeenCalledWith('/api/preferred-items?corporation_uuid=corp-1')
      expect(store.items).toHaveLength(1)
      expect(store.items[0]?.item_name).toBe('Steel Beam 10ft')
    })

    it('includes project_uuid in URL when provided', async () => {
      mockFetch.mockResolvedValue({ data: [] })

      const store = usePreferredItemsStore()
      await store.fetchItems('corp-1', 'proj-1')

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/preferred-items?corporation_uuid=corp-1&project_uuid=proj-1',
      )
    })

    it('returns early when corporation uuid is empty', async () => {
      const store = usePreferredItemsStore()
      await store.fetchItems('')

      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('sets error on fetch failure', async () => {
      mockFetch.mockRejectedValue(new Error('Server error'))

      const store = usePreferredItemsStore()
      await store.fetchItems('corp-1')

      expect(store.error).toBe('Server error')
      expect(store.items).toHaveLength(0)
    })

    it('sets loading to false after fetch', async () => {
      mockFetch.mockResolvedValue({ data: [] })

      const store = usePreferredItemsStore()
      await store.fetchItems('corp-1')

      expect(store.loading).toBe(false)
    })
  })

  // ── createItem ──────────────────────────────────────────────────────────────
  describe('createItem', () => {
    it('creates item and prepends to list', async () => {
      const created = makeItem({ uuid: 'new-uuid', item_name: 'Concrete Block' })
      mockFetch.mockResolvedValue({ data: created })

      const store = usePreferredItemsStore()
      const result = await store.createItem({
        corporation_uuid: 'corp-1',
        item_name: 'Concrete Block',
        status: 'Active',
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/preferred-items', {
        method: 'POST',
        body: expect.objectContaining({ item_name: 'Concrete Block' }),
      })
      expect(result?.item_name).toBe('Concrete Block')
      expect(store.items[0]?.item_name).toBe('Concrete Block')
    })

    it('returns null and sets error on create failure', async () => {
      mockFetch.mockRejectedValue({ data: { statusMessage: 'item_name is required' } })

      const store = usePreferredItemsStore()
      const result = await store.createItem({ corporation_uuid: 'corp-1', item_name: '' })

      expect(result).toBeNull()
      expect(store.error).toBeTruthy()
    })
  })

  // ── updateItem ──────────────────────────────────────────────────────────────
  describe('updateItem', () => {
    it('updates item and replaces in list', async () => {
      // Populate via fetchItems first
      const existing = makeItem()
      mockFetch.mockResolvedValueOnce({ data: [existing] })
      const store = usePreferredItemsStore()
      await store.fetchItems('corp-1')

      const updated = { ...existing, item_name: 'Updated Beam' }
      mockFetch.mockResolvedValueOnce({ data: updated })

      const result = await store.updateItem('item-uuid-1', { item_name: 'Updated Beam' })

      expect(mockFetch).toHaveBeenLastCalledWith('/api/preferred-items/item-uuid-1', {
        method: 'PUT',
        body: { item_name: 'Updated Beam' },
      })
      expect(result?.item_name).toBe('Updated Beam')
      expect(store.items[0]?.item_name).toBe('Updated Beam')
    })

    it('returns null and sets error on update failure', async () => {
      mockFetch.mockRejectedValue(new Error('Not found'))

      const store = usePreferredItemsStore()
      const result = await store.updateItem('missing-uuid', { item_name: 'Test' })

      expect(result).toBeNull()
      expect(store.error).toBe('Not found')
    })
  })

  // ── deleteItem ──────────────────────────────────────────────────────────────
  describe('deleteItem', () => {
    it('deletes item and removes from list', async () => {
      // Populate via fetchItems first
      mockFetch.mockResolvedValueOnce({ data: [makeItem()] })
      const store = usePreferredItemsStore()
      await store.fetchItems('corp-1')

      mockFetch.mockResolvedValueOnce({})
      const result = await store.deleteItem('item-uuid-1')

      expect(mockFetch).toHaveBeenLastCalledWith('/api/preferred-items/item-uuid-1', { method: 'DELETE' })
      expect(result).toBe(true)
      expect(store.items).toHaveLength(0)
    })

    it('returns false and sets error on delete failure', async () => {
      mockFetch.mockRejectedValue(new Error('Not found'))

      const store = usePreferredItemsStore()
      const result = await store.deleteItem('missing-uuid')

      expect(result).toBe(false)
      expect(store.error).toBe('Not found')
    })

    it('does not affect other items when deleting one', async () => {
      const item1 = makeItem({ uuid: 'item-uuid-1' })
      const item2 = makeItem({ uuid: 'item-uuid-2', item_name: 'Bolt' })
      mockFetch.mockResolvedValueOnce({ data: [item1, item2] })
      const store = usePreferredItemsStore()
      await store.fetchItems('corp-1')

      mockFetch.mockResolvedValueOnce({})
      await store.deleteItem('item-uuid-1')

      expect(store.items).toHaveLength(1)
      expect(store.items[0]?.item_name).toBe('Bolt')
    })
  })

  // ── clearData ───────────────────────────────────────────────────────────────
  describe('clearData', () => {
    it('resets items and error', async () => {
      mockFetch.mockResolvedValue({ data: [makeItem()] })
      const store = usePreferredItemsStore()
      await store.fetchItems('corp-1')
      expect(store.items).toHaveLength(1)

      store.clearData()

      expect(store.items).toHaveLength(0)
      expect(store.error).toBeNull()
    })
  })
})
