/**
 * Tests for three fixes in the purchase-orders module:
 *
 * FIX 1 — usePurchaseOrdersStore.paginationInfo
 *   The component was calling purchaseOrdersStore.getPaginationInfo(uuid) as a function
 *   but the store exposes paginationInfo as a Record<string, PaginationInfo> ref.
 *   Tests verify the data shape and that the correct key lookup works.
 *
 * FIX 2 — fetchPurchaseOrders options object
 *   All call sites were passing positional args (force, page, pageSize, filters) but the
 *   store signature is (corporationUuid, options: { force?, filters? }).
 *   Passing a boolean as `options` caused destructuring to throw at runtime.
 *   Tests verify that force / filters inside the options object are respected.
 *
 * FIX 3 — savePOItems / saveLaborPOItems / saveLocationWiseMaterial called on save
 *   The savePurchaseOrder flow in PurchaseOrdersList.vue only saved the PO header.
 *   po_items, labor_po_items, and location_wise_material were never persisted.
 *   Tests verify each save helper calls the correct endpoint with the correct payload.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { ref, computed } from 'vue'

// ── Auto-import stubs ─────────────────────────────────────────────────────────
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('reactive', (await import('vue')).reactive)
vi.stubGlobal('defineStore', (await import('pinia')).defineStore)
vi.stubGlobal('readonly', (await import('vue')).readonly)

const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

// ── Row factories ─────────────────────────────────────────────────────────────

function makePORow(overrides: Record<string, unknown> = {}) {
  return {
    uuid: 'po-uuid-1',
    corporation_uuid: 'corp-1',
    project_uuid: 'proj-1',
    po_number: 'PO-001',
    entry_date: '2026-05-01',
    status: 'Draft',
    total_po_amount: 1000,
    po_items: [],
    labor_po_items: [],
    location_wise_material: [],
    ...overrides,
  }
}

function makePoItem(overrides: Record<string, unknown> = {}) {
  return {
    uuid: 'item-1',
    cost_code_uuid: 'cc-1',
    item_uuid: 'item-uuid-1',
    name: 'Concrete',
    quantity: 2,
    unit_price: 500,
    total: 1000,
    po_quantity: 2,
    po_unit_price: 500,
    po_total: 1000,
    ...overrides,
  }
}

async function getStore() {
  const { usePurchaseOrdersStore } = await import('../../../app/stores/purchaseOrders')
  return usePurchaseOrdersStore()
}

// ══════════════════════════════════════════════════════════════════════════════
// FIX 1 — paginationInfo is a Record, not a function
// ══════════════════════════════════════════════════════════════════════════════
describe('usePurchaseOrdersStore – paginationInfo (Record, not a function)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('paginationInfo is a plain object (not a function)', async () => {
    const store = await getStore()
    expect(typeof store.paginationInfo).toBe('object')
    expect(typeof store.paginationInfo).not.toBe('function')
  })

  it('paginationInfo[unknownCorp] is undefined (not an error)', async () => {
    const store = await getStore()
    expect(store.paginationInfo['no-such-corp']).toBeUndefined()
  })

  it('paginationInfo[corpUuid] returns the pagination after a successful fetch', async () => {
    mockFetch.mockResolvedValue({
      data: [makePORow()],
      pagination: { page: 1, pageSize: 100, totalRecords: 42, totalPages: 1, hasMore: false },
    })
    const store = await getStore()
    await store.fetchPurchaseOrders('corp-1', { force: true })

    const info = store.paginationInfo['corp-1']
    expect(info).toBeDefined()
    expect(info?.totalRecords).toBe(42)
    expect(info?.page).toBe(1)
    expect(info?.hasMore).toBe(false)
  })

  it('paginationInfo[corpUuid] returns undefined when fetch returns no pagination', async () => {
    mockFetch.mockResolvedValue({ data: [] })
    const store = await getStore()
    await store.fetchPurchaseOrders('corp-2', { force: true })
    expect(store.paginationInfo['corp-2']).toBeUndefined()
  })

  it('paginationInfo[corpUuid] is updated on each successful fetch', async () => {
    mockFetch
      .mockResolvedValueOnce({ data: [], pagination: { page: 1, pageSize: 100, totalRecords: 10, totalPages: 1, hasMore: false } })
      .mockResolvedValueOnce({ data: [], pagination: { page: 1, pageSize: 100, totalRecords: 99, totalPages: 1, hasMore: false } })

    const store = await getStore()
    await store.fetchPurchaseOrders('corp-1', { force: true })
    expect(store.paginationInfo['corp-1']?.totalRecords).toBe(10)

    await store.fetchPurchaseOrders('corp-1', { force: true })
    expect(store.paginationInfo['corp-1']?.totalRecords).toBe(99)
  })

  it('paginationInfo is cleared by clearData()', async () => {
    mockFetch.mockResolvedValue({ data: [], pagination: { page: 1, pageSize: 100, totalRecords: 5, totalPages: 1, hasMore: false } })
    const store = await getStore()
    await store.fetchPurchaseOrders('corp-1', { force: true })
    expect(store.paginationInfo['corp-1']).toBeDefined()
    store.clearData()
    expect(store.paginationInfo['corp-1']).toBeUndefined()
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// FIX 2 — fetchPurchaseOrders options object (force + filters)
// ══════════════════════════════════════════════════════════════════════════════
describe('usePurchaseOrdersStore – fetchPurchaseOrders options object', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({ data: [] })
  })

  it('does NOT throw when options is an object (regression guard for boolean crash)', async () => {
    const store = await getStore()
    // This would throw "Cannot destructure property 'force' of 'false'" with the old call style
    await expect(store.fetchPurchaseOrders('corp-1', { force: true })).resolves.not.toThrow()
    await expect(store.fetchPurchaseOrders('corp-1', { force: false })).resolves.not.toThrow()
  })

  it('skips fetch when data is already loaded and force is false', async () => {
    mockFetch.mockResolvedValue({ data: [makePORow()] })
    const store = await getStore()
    await store.fetchPurchaseOrders('corp-1', { force: true }) // prime cache

    vi.clearAllMocks()
    await store.fetchPurchaseOrders('corp-1', { force: false })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('re-fetches when force is true even when data is cached', async () => {
    mockFetch.mockResolvedValue({ data: [makePORow()] })
    const store = await getStore()
    await store.fetchPurchaseOrders('corp-1', { force: true }) // prime cache

    vi.clearAllMocks()
    mockFetch.mockResolvedValue({ data: [makePORow(), makePORow({ uuid: 'po-2' })] })
    await store.fetchPurchaseOrders('corp-1', { force: true })
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('includes project_uuid in query when passed in filters', async () => {
    const store = await getStore()
    await store.fetchPurchaseOrders('corp-1', { force: true, filters: { project_uuid: 'proj-1' } })

    const [, opts] = mockFetch.mock.calls[0]
    expect(opts.query.project_uuid).toBe('proj-1')
  })

  it('includes vendor_uuid in query when passed in filters', async () => {
    const store = await getStore()
    await store.fetchPurchaseOrders('corp-1', { force: true, filters: { vendor_uuid: 'vendor-1' } })

    const [, opts] = mockFetch.mock.calls[0]
    expect(opts.query.vendor_uuid).toBe('vendor-1')
  })

  it('includes page and page_size in query when passed in filters', async () => {
    const store = await getStore()
    await store.fetchPurchaseOrders('corp-1', { force: true, filters: { page: 2, page_size: 50 } })

    const [, opts] = mockFetch.mock.calls[0]
    expect(opts.query.page).toBe('2')
    expect(opts.query.page_size).toBe('50')
  })

  it('includes entry date range in query when passed in filters', async () => {
    const store = await getStore()
    await store.fetchPurchaseOrders('corp-1', {
      force: true,
      filters: { entry_date_from: '2026-01-01', entry_date_to: '2026-12-31' },
    })

    const [, opts] = mockFetch.mock.calls[0]
    expect(opts.query.entry_date_from).toBe('2026-01-01')
    expect(opts.query.entry_date_to).toBe('2026-12-31')
  })

  it('always includes corporation_uuid in query', async () => {
    const store = await getStore()
    await store.fetchPurchaseOrders('corp-abc', { force: true })

    const [, opts] = mockFetch.mock.calls[0]
    expect(opts.query.corporation_uuid).toBe('corp-abc')
  })

  it('treats presence of filters as hasListFilters and does NOT update the corp cache', async () => {
    mockFetch.mockResolvedValue({ data: [makePORow()] })
    const store = await getStore()
    // Fetch WITH filters — should not mark corp as cached
    await store.fetchPurchaseOrders('corp-1', { force: true, filters: { vendor_uuid: 'v-1' } })

    vi.clearAllMocks()
    // Without force and no cache, should still fetch
    await store.fetchPurchaseOrders('corp-1')
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('returns the fetched rows', async () => {
    mockFetch.mockResolvedValue({ data: [makePORow({ uuid: 'po-ret-1' })] })
    const store = await getStore()
    const rows = await store.fetchPurchaseOrders('corp-1', { force: true })
    expect(Array.isArray(rows)).toBe(true)
    expect((rows as any[])[0].uuid).toBe('po-ret-1')
  })

  it('stores page 1 rows even when only pagination filters are passed', async () => {
    mockFetch.mockResolvedValue({
      data: [makePORow({ uuid: 'po-page1' })],
      pagination: { page: 1, pageSize: 100, totalRecords: 1, totalPages: 1, hasMore: false },
    })
    const store = await getStore()
    await store.fetchPurchaseOrders('corp-1', { force: true, filters: { page: 1, page_size: 100 } })

    expect(store.purchaseOrders.some((po: any) => po.uuid === 'po-page1')).toBe(true)
  })

  it('merges page > 1 rows into existing corporation rows', async () => {
    mockFetch
      .mockResolvedValueOnce({
        data: [makePORow({ uuid: 'po-page1' })],
        pagination: { page: 1, pageSize: 100, totalRecords: 2, totalPages: 2, hasMore: true },
      })
      .mockResolvedValueOnce({
        data: [makePORow({ uuid: 'po-page2' })],
        pagination: { page: 2, pageSize: 100, totalRecords: 2, totalPages: 2, hasMore: false },
      })
    const store = await getStore()

    await store.fetchPurchaseOrders('corp-1', { force: true, filters: { page: 1, page_size: 100 } })
    await store.fetchPurchaseOrders('corp-1', { force: false, filters: { page: 2, page_size: 100 } })

    const corpRows = store.purchaseOrders.filter((po: any) => po.corporation_uuid === 'corp-1')
    expect(corpRows.some((po: any) => po.uuid === 'po-page1')).toBe(true)
    expect(corpRows.some((po: any) => po.uuid === 'po-page2')).toBe(true)
  })

  it('sets error and does not throw when fetch fails', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))
    const store = await getStore()
    await expect(store.fetchPurchaseOrders('corp-1', { force: true })).resolves.toBeUndefined()
    expect(store.error).toMatch(/Network error/)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// FIX 3 — savePOItems / saveLaborPOItems / saveLocationWiseMaterial
// ══════════════════════════════════════════════════════════════════════════════
describe('usePurchaseOrdersStore – savePOItems', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('posts to /api/purchase-order-items with correct purchase_order_uuid', async () => {
    mockFetch.mockResolvedValue({ data: [] })
    const store = await getStore()
    await store.savePOItems('po-uuid-1', [], {})

    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toBe('/api/purchase-order-items')
    expect(opts.method).toBe('POST')
    expect(opts.body.purchase_order_uuid).toBe('po-uuid-1')
  })

  it('includes items in the request body', async () => {
    mockFetch.mockResolvedValue({ data: [makePoItem()] })
    const store = await getStore()
    const items = [makePoItem(), makePoItem({ uuid: 'item-2' })]
    await store.savePOItems('po-1', items, {})

    const [, opts] = mockFetch.mock.calls[0]
    expect(opts.body.items).toHaveLength(2)
  })

  it('includes corporation_uuid and project_uuid in body', async () => {
    mockFetch.mockResolvedValue({ data: [] })
    const store = await getStore()
    await store.savePOItems('po-1', [], { corporation_uuid: 'corp-1', project_uuid: 'proj-1' })

    const [, opts] = mockFetch.mock.calls[0]
    expect(opts.body.corporation_uuid).toBe('corp-1')
    expect(opts.body.project_uuid).toBe('proj-1')
  })

  it('returns the saved items from the API response', async () => {
    const savedItem = makePoItem({ uuid: 'saved-1' })
    mockFetch.mockResolvedValue({ data: [savedItem] })
    const store = await getStore()
    const result = await store.savePOItems('po-1', [savedItem], {})
    expect(Array.isArray(result)).toBe(true)
    expect((result as any[])[0].uuid).toBe('saved-1')
  })

  it('throws when the API call fails', async () => {
    mockFetch.mockRejectedValue(new Error('DB error'))
    const store = await getStore()
    await expect(store.savePOItems('po-1', [], {})).rejects.toThrow('DB error')
  })

  it('works correctly with an empty items array (clears all items)', async () => {
    mockFetch.mockResolvedValue({ data: [] })
    const store = await getStore()
    const result = await store.savePOItems('po-1', [], {})
    const [, opts] = mockFetch.mock.calls[0]
    expect(opts.body.items).toEqual([])
    expect(result).toEqual([])
  })
})

describe('usePurchaseOrdersStore – saveLaborPOItems', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('posts to /api/labor-purchase-order-items', async () => {
    mockFetch.mockResolvedValue({ data: [] })
    const store = await getStore()
    await store.saveLaborPOItems('po-1', [], {})

    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toBe('/api/labor-purchase-order-items')
    expect(opts.method).toBe('POST')
  })

  it('includes purchase_order_uuid in the body', async () => {
    mockFetch.mockResolvedValue({ data: [] })
    const store = await getStore()
    await store.saveLaborPOItems('po-labor-1', [], {})

    const [, opts] = mockFetch.mock.calls[0]
    expect(opts.body.purchase_order_uuid).toBe('po-labor-1')
  })

  it('includes labor items in body', async () => {
    mockFetch.mockResolvedValue({ data: [] })
    const store = await getStore()
    const laborItems = [{ cost_code_uuid: 'cc-1', po_amount: 500 }, { cost_code_uuid: 'cc-2', po_amount: 300 }]
    await store.saveLaborPOItems('po-1', laborItems, {})

    const [, opts] = mockFetch.mock.calls[0]
    expect(opts.body.items).toHaveLength(2)
  })

  it('throws when the API call fails', async () => {
    mockFetch.mockRejectedValue(new Error('Labor save failed'))
    const store = await getStore()
    await expect(store.saveLaborPOItems('po-1', [], {})).rejects.toThrow('Labor save failed')
  })
})

describe('usePurchaseOrdersStore – saveLocationWiseMaterial', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('posts to /api/po-location-wise-material', async () => {
    mockFetch.mockResolvedValue({ data: [] })
    const store = await getStore()
    await store.saveLocationWiseMaterial('po-1', [], {})

    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toBe('/api/po-location-wise-material')
    expect(opts.method).toBe('POST')
  })

  it('includes purchase_order_uuid in the body', async () => {
    mockFetch.mockResolvedValue({ data: [] })
    const store = await getStore()
    await store.saveLocationWiseMaterial('po-lw-1', [], {})

    const [, opts] = mockFetch.mock.calls[0]
    expect(opts.body.purchase_order_uuid).toBe('po-lw-1')
  })

  it('includes location_wise_material items in body', async () => {
    mockFetch.mockResolvedValue({ data: [] })
    const store = await getStore()
    const lwItems = [
      { cost_code_uuid: 'cc-1', location_uuid: 'loc-1', po_amount: 100 },
      { cost_code_uuid: 'cc-1', location_uuid: 'loc-2', po_amount: 200 },
    ]
    await store.saveLocationWiseMaterial('po-1', lwItems, {})

    const [, opts] = mockFetch.mock.calls[0]
    expect(opts.body.items).toHaveLength(2)
  })

  it('throws when the API call fails', async () => {
    mockFetch.mockRejectedValue(new Error('LW material save failed'))
    const store = await getStore()
    await expect(store.saveLocationWiseMaterial('po-1', [], {})).rejects.toThrow('LW material save failed')
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// FIX 3 (integration) — all three save helpers called together simulate the
// PurchaseOrdersList.savePurchaseOrder() flow: header first, then items
// ══════════════════════════════════════════════════════════════════════════════
describe('usePurchaseOrdersStore – full save flow (header + all item types)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('saves PO header then all item tables in the correct order', async () => {
    const callOrder: string[] = []

    mockFetch.mockImplementation(async (url: string) => {
      if (url === '/api/purchase-order-forms') {
        callOrder.push('header-create')
        return { data: makePORow({ uuid: 'new-po' }) }
      }
      if (url === '/api/purchase-order-items') {
        callOrder.push('po-items')
        return { data: [] }
      }
      if (url === '/api/labor-purchase-order-items') {
        callOrder.push('labor-items')
        return { data: [] }
      }
      if (url === '/api/po-location-wise-material') {
        callOrder.push('lw-material')
        return { data: [] }
      }
      return { data: null }
    })

    const store = await getStore()

    // Step 1: create PO header (as savePurchaseOrder does)
    const result = await store.createPurchaseOrder({ corporation_uuid: 'corp-1', entry_date: '2026-05-01' })
    expect(result?.uuid).toBe('new-po')

    // Step 2: save all item types in parallel (as savePurchaseOrder does after our fix)
    await Promise.all([
      store.savePOItems(result!.uuid!, [makePoItem()], { corporation_uuid: 'corp-1', project_uuid: 'proj-1' }),
      store.saveLaborPOItems(result!.uuid!, [{ cost_code_uuid: 'cc-1', po_amount: 100 }], {}),
      store.saveLocationWiseMaterial(result!.uuid!, [{ cost_code_uuid: 'cc-1', location_uuid: 'loc-1', po_amount: 50 }], {}),
    ])

    expect(callOrder[0]).toBe('header-create')
    expect(callOrder).toContain('po-items')
    expect(callOrder).toContain('labor-items')
    expect(callOrder).toContain('lw-material')
    expect(callOrder).toHaveLength(4)
  })

  it('each item-save call receives the UUID returned by the header save', async () => {
    const capturedBodies: Record<string, any> = {}

    mockFetch.mockImplementation(async (url: string, opts: any) => {
      if (url === '/api/purchase-order-forms') return { data: makePORow({ uuid: 'confirmed-uuid' }) }
      capturedBodies[url] = opts.body
      return { data: [] }
    })

    const store = await getStore()
    const po = await store.createPurchaseOrder({ corporation_uuid: 'corp-1', entry_date: '2026-05-01' })

    await Promise.all([
      store.savePOItems(po!.uuid!, [], {}),
      store.saveLaborPOItems(po!.uuid!, [], {}),
      store.saveLocationWiseMaterial(po!.uuid!, [], {}),
    ])

    expect(capturedBodies['/api/purchase-order-items']?.purchase_order_uuid).toBe('confirmed-uuid')
    expect(capturedBodies['/api/labor-purchase-order-items']?.purchase_order_uuid).toBe('confirmed-uuid')
    expect(capturedBodies['/api/po-location-wise-material']?.purchase_order_uuid).toBe('confirmed-uuid')
  })

  it('update flow: captures items before overwrite and saves them', async () => {
    const capturedPoItems: any[] = []

    mockFetch.mockImplementation(async (url: string, opts: any) => {
      if (String(url).includes('/api/purchase-order-forms/')) return { data: makePORow() }
      if (url === '/api/purchase-order-items') {
        capturedPoItems.push(...(opts.body.items ?? []))
        return { data: opts.body.items }
      }
      return { data: [] }
    })

    const store = await getStore()

    // Simulate the update path: capture items before updatePurchaseOrder overwrites po_items:[]
    const itemsBeforeSave = [makePoItem({ uuid: 'item-from-estimate' })]
    const po = await store.updatePurchaseOrder({ uuid: 'existing-po', corporation_uuid: 'corp-1', project_uuid: 'proj-1' })
    await store.savePOItems(po!.uuid!, itemsBeforeSave, { corporation_uuid: 'corp-1', project_uuid: 'proj-1' })

    expect(capturedPoItems).toHaveLength(1)
    expect(capturedPoItems[0].uuid).toBe('item-from-estimate')
  })

  it('empty items array still calls the API (to clear previously saved items)', async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url === '/api/purchase-order-forms') return { data: makePORow({ uuid: 'po-clear' }) }
      return { data: [] }
    })

    const store = await getStore()
    const po = await store.createPurchaseOrder({ corporation_uuid: 'corp-1', entry_date: '2026-05-01' })

    await store.savePOItems(po!.uuid!, [], {})

    const poItemCalls = mockFetch.mock.calls.filter(([url]: [string]) => url === '/api/purchase-order-items')
    expect(poItemCalls).toHaveLength(1)
    expect(poItemCalls[0][1].body.items).toEqual([])
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// createPurchaseOrder / updatePurchaseOrder — basic contract
// ══════════════════════════════════════════════════════════════════════════════
describe('usePurchaseOrdersStore – createPurchaseOrder', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('posts to /api/purchase-order-forms and returns the PO', async () => {
    mockFetch.mockResolvedValue({ data: makePORow({ uuid: 'created-po' }) })
    const store = await getStore()
    const result = await store.createPurchaseOrder({ corporation_uuid: 'corp-1', entry_date: '2026-05-01' })
    expect(result?.uuid).toBe('created-po')
    expect(mockFetch).toHaveBeenCalledWith('/api/purchase-order-forms', expect.objectContaining({ method: 'POST' }))
  })

  it('adds the new PO to the store', async () => {
    mockFetch.mockResolvedValue({ data: makePORow({ uuid: 'new-po', corporation_uuid: 'corp-1' }) })
    const store = await getStore()
    await store.createPurchaseOrder({ corporation_uuid: 'corp-1', entry_date: '2026-05-01' })
    expect(store.purchaseOrders.some(p => p.uuid === 'new-po')).toBe(true)
  })

  it('throws when corporation_uuid is missing', async () => {
    const store = await getStore()
    await expect(store.createPurchaseOrder({ entry_date: '2026-05-01' } as any)).rejects.toThrow('corporation_uuid is required')
  })

  it('throws and sets error when the API fails', async () => {
    mockFetch.mockRejectedValue({ message: 'Server error' })
    const store = await getStore()
    await expect(store.createPurchaseOrder({ corporation_uuid: 'corp-1', entry_date: '2026-05-01' })).rejects.toThrow()
  })
})

describe('usePurchaseOrdersStore – updatePurchaseOrder', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('puts to /api/purchase-order-forms/:uuid and returns the updated PO', async () => {
    mockFetch.mockResolvedValue({ data: makePORow({ uuid: 'upd-po', status: 'Ready' }) })
    const store = await getStore()
    const result = await store.updatePurchaseOrder({ uuid: 'upd-po', corporation_uuid: 'corp-1', status: 'Ready' })
    expect(result?.status).toBe('Ready')
    expect(mockFetch).toHaveBeenCalledWith('/api/purchase-order-forms/upd-po', expect.objectContaining({ method: 'PUT' }))
  })

  it('throws when uuid is missing', async () => {
    const store = await getStore()
    await expect(store.updatePurchaseOrder({ corporation_uuid: 'corp-1' } as any)).rejects.toThrow('uuid is required')
  })

  it('updates the PO in the store', async () => {
    const original = makePORow({ uuid: 'edit-po', status: 'Draft', corporation_uuid: 'corp-1' })
    mockFetch.mockResolvedValueOnce({ data: original }) // create
    const store = await getStore()
    await store.createPurchaseOrder({ corporation_uuid: 'corp-1', entry_date: '2026-05-01' })

    mockFetch.mockResolvedValueOnce({ data: { ...original, status: 'Ready' } }) // update
    await store.updatePurchaseOrder({ uuid: 'edit-po', corporation_uuid: 'corp-1', status: 'Ready' })

    const inStore = store.purchaseOrders.find(p => p.uuid === 'edit-po')
    expect(inStore?.status).toBe('Ready')
  })
})
