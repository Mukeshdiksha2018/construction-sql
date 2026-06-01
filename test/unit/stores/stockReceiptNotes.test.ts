import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { useStockReceiptNotesStore } from '~/stores/stockReceiptNotes'
import type { StockReceiptNote } from '~/stores/stockReceiptNotes'

const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

describe('useStockReceiptNotesStore', () => {
  let store: ReturnType<typeof useStockReceiptNotesStore>

  const sampleNote: StockReceiptNote = {
    uuid: 'rn-1',
    corporation_uuid: 'corp-1',
    project_uuid: 'proj-1',
    purchase_order_uuid: 'po-1',
    change_order_uuid: null,
    receipt_type: 'purchase_order',
    entry_date: '2025-06-01',
    grn_number: 'GRN-1',
    status: 'Shipment',
    total_received_amount: 500,
    created_at: '2025-06-01T00:00:00Z',
    updated_at: '2025-06-01T00:00:00Z',
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useStockReceiptNotesStore()
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('$fetch', mockFetch)
  })

  it('has empty initial state', () => {
    expect(store.stockReceiptNotes).toEqual([])
    expect(store.loading).toBe(false)
    expect(store.error).toBe(null)
  })

  it('fetchStockReceiptNotes loads and normalizes GRN numbers', async () => {
    mockFetch.mockResolvedValue({
      data: [{ ...sampleNote, grn_number: 'grn-2' }],
    })

    await store.fetchStockReceiptNotes('corp-1', { force: true })
    await flushPromises()

    expect(mockFetch).toHaveBeenCalledWith('/api/stock-receipt-notes', {
      query: { corporation_uuid: 'corp-1' },
    })
    expect(store.stockReceiptNotes[0].grn_number).toBe('GRN-2')
  })

  it('generateNextGrnNumber increments from cached notes', async () => {
    mockFetch.mockResolvedValue({
      data: [
        { ...sampleNote, grn_number: 'GRN-5' },
        { ...sampleNote, uuid: 'rn-2', grn_number: 'GRN-12' },
      ],
    })
    await store.fetchStockReceiptNotes('corp-1', { force: true })
    expect(store.generateNextGrnNumber('corp-1')).toBe('GRN-13')
  })

  it('createStockReceiptNote POSTs and merges into store', async () => {
    mockFetch.mockResolvedValue({
      data: { ...sampleNote, uuid: 'rn-new', grn_number: 'GRN-99' },
    })

    const created = await store.createStockReceiptNote({
      corporation_uuid: 'corp-1',
      receipt_type: 'purchase_order',
      purchase_order_uuid: 'po-1',
      receipt_items: [{ uuid: 'line-1', received_quantity: 1 }],
    } as any)

    expect(mockFetch).toHaveBeenCalledWith('/api/stock-receipt-notes', expect.objectContaining({
      method: 'POST',
    }))
    expect(created?.uuid).toBe('rn-new')
    expect(store.stockReceiptNotes.some(n => n.uuid === 'rn-new')).toBe(true)
  })

  it('updateStockReceiptNote PUTs with uuid', async () => {
    mockFetch.mockResolvedValueOnce({ data: [sampleNote] })
    await store.fetchStockReceiptNotes('corp-1', { force: true })
    mockFetch.mockResolvedValue({
      data: { ...sampleNote, status: 'Received' },
    })

    const updated = await store.updateStockReceiptNote({
      uuid: 'rn-1',
      corporation_uuid: 'corp-1',
      status: 'Received',
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/stock-receipt-notes', expect.objectContaining({
      method: 'PUT',
      body: expect.objectContaining({ uuid: 'rn-1', status: 'Received' }),
    }))
    expect(updated?.status).toBe('Received')
  })

  it('deleteStockReceiptNote removes from store', async () => {
    mockFetch.mockResolvedValueOnce({ data: [sampleNote] })
    await store.fetchStockReceiptNotes('corp-1', { force: true })
    mockFetch.mockResolvedValue({ data: sampleNote })

    const ok = await store.deleteStockReceiptNote('rn-1')

    expect(ok).toBe(true)
    expect(mockFetch).toHaveBeenCalledWith('/api/stock-receipt-notes', expect.objectContaining({
      method: 'DELETE',
      query: { uuid: 'rn-1' },
    }))
    expect(store.getNoteByUuid('rn-1')).toBeNull()
  })

  it('notesByStatus groups by Shipment and Received', async () => {
    mockFetch.mockResolvedValue({
      data: [
        sampleNote,
        { ...sampleNote, uuid: 'rn-2', status: 'Received' },
      ],
    })
    await store.fetchStockReceiptNotes('corp-1', { force: true })
    const grouped = store.notesByStatus
    expect(grouped.Shipment).toHaveLength(1)
    expect(grouped.Received).toHaveLength(1)
  })

  it('clearData resets store', async () => {
    mockFetch.mockResolvedValue({ data: [sampleNote] })
    await store.fetchStockReceiptNotes('corp-1', { force: true })
    store.clearData()
    expect(store.stockReceiptNotes).toHaveLength(0)
    expect(store.error).toBe(null)
  })
})
