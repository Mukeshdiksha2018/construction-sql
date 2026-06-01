import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { useStockReturnNotesStore } from '~/stores/stockReturnNotes'
import type { StockReturnNote } from '~/stores/stockReturnNotes'

const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

describe('useStockReturnNotesStore', () => {
  let store: ReturnType<typeof useStockReturnNotesStore>

  const sampleNote: StockReturnNote = {
    uuid: 'rtn-1',
    corporation_uuid: 'corp-1',
    project_uuid: 'proj-1',
    purchase_order_uuid: 'po-1',
    change_order_uuid: null,
    return_type: 'purchase_order',
    entry_date: '2025-06-01',
    return_note_number: 'RTN-1',
    status: 'Returned',
    total_return_amount: 300,
    created_at: '2025-06-01T00:00:00Z',
    updated_at: '2025-06-01T00:00:00Z',
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useStockReturnNotesStore()
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('$fetch', mockFetch)
  })

  it('has empty initial state', () => {
    expect(store.stockReturnNotes).toEqual([])
    expect(store.loading).toBe(false)
    expect(store.error).toBe(null)
  })

  it('fetchStockReturnNotes loads and normalizes return numbers', async () => {
    mockFetch.mockResolvedValue({
      data: [{ ...sampleNote, return_number: 'rtn-2' }],
    })

    await store.fetchStockReturnNotes('corp-1', { force: true })
    await flushPromises()

    expect(mockFetch).toHaveBeenCalledWith('/api/stock-return-notes', {
      query: { corporation_uuid: 'corp-1' },
    })
    expect(store.stockReturnNotes[0].return_number).toBe('RTN-2')
    expect(store.stockReturnNotes[0].return_note_number).toBe('RTN-2')
  })

  it('generateNextReturnNumber increments from cached notes', async () => {
    mockFetch.mockResolvedValue({
      data: [
        { ...sampleNote, return_number: 'RTN-5' },
        { ...sampleNote, uuid: 'rtn-2', return_number: 'RTN-12' },
      ],
    })
    await store.fetchStockReturnNotes('corp-1', { force: true })
    expect(store.generateNextReturnNumber('corp-1')).toBe('RTN-13')
  })

  it('createStockReturnNote POSTs with return_items and merges into store', async () => {
    mockFetch.mockResolvedValue({
      data: { ...sampleNote, uuid: 'rtn-new', return_number: 'RTN-99' },
    })

    const created = await store.createStockReturnNote({
      corporation_uuid: 'corp-1',
      return_type: 'purchase_order',
      purchase_order_uuid: 'po-1',
      return_items: [{ uuid: 'line-1', return_quantity: 1 }],
    } as any)

    expect(mockFetch).toHaveBeenCalledWith('/api/stock-return-notes', expect.objectContaining({
      method: 'POST',
    }))
    expect(created?.uuid).toBe('rtn-new')
    expect(store.stockReturnNotes.some(n => n.uuid === 'rtn-new')).toBe(true)
  })

  it('updateStockReturnNote PUTs with uuid', async () => {
    mockFetch.mockResolvedValueOnce({ data: [sampleNote] })
    await store.fetchStockReturnNotes('corp-1', { force: true })
    mockFetch.mockResolvedValue({
      data: { ...sampleNote, status: 'Returned', return_number: 'RTN-1' },
    })

    const updated = await store.updateStockReturnNote({
      uuid: 'rtn-1',
      corporation_uuid: 'corp-1',
      status: 'Returned',
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/stock-return-notes', expect.objectContaining({
      method: 'PUT',
      body: expect.objectContaining({ uuid: 'rtn-1' }),
    }))
    expect(updated?.status).toBe('Returned')
  })

  it('deleteStockReturnNote removes from store', async () => {
    mockFetch.mockResolvedValueOnce({ data: [sampleNote] })
    await store.fetchStockReturnNotes('corp-1', { force: true })
    mockFetch.mockResolvedValue({ data: sampleNote })

    const ok = await store.deleteStockReturnNote('rtn-1')

    expect(ok).toBe(true)
    expect(mockFetch).toHaveBeenCalledWith('/api/stock-return-notes', expect.objectContaining({
      method: 'DELETE',
      query: { uuid: 'rtn-1' },
    }))
    expect(store.getNoteByUuid('rtn-1')).toBeNull()
  })

  it('clearData resets store', async () => {
    mockFetch.mockResolvedValue({ data: [sampleNote] })
    await store.fetchStockReturnNotes('corp-1', { force: true })
    store.clearData()
    expect(store.stockReturnNotes).toHaveLength(0)
    expect(store.error).toBe(null)
  })
})
