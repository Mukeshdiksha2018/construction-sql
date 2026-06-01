import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { useChangeOrdersStore } from '~/stores/changeOrders'
import type { ChangeOrder } from '~/stores/changeOrders'

const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

vi.mock('~/stores/nimbleSession', () => ({
  useNimbleSessionStore: () => ({
    userName: 'Nimble User',
    userFullName: '',
    email: 'nimble@test.com',
  }),
}))

vi.mock('~/utils/indexedDb', () => ({
  dbHelpers: {
    getChangeOrders: vi.fn(),
    saveChangeOrders: vi.fn(),
    addChangeOrder: vi.fn(),
    updateChangeOrder: vi.fn(),
    deleteChangeOrder: vi.fn(),
    clearChangeOrders: vi.fn(),
  },
}))

const mockCorporationStore = {
  selectedCorporationId: 'corp-1',
  selectedCorporation: { uuid: 'corp-1', corporation_name: 'Test Corp' },
}

vi.mock('~/stores/corporations', () => ({
  useCorporationStore: () => mockCorporationStore,
}))

vi.mock('~/stores/auth', () => ({
  useAuthStore: () => ({
    user: {
      id: 'user-1',
      email: 'test@example.com',
      user_metadata: { full_name: 'Test User' },
    },
  }),
}))

describe('useChangeOrdersStore', () => {
  let store: ReturnType<typeof useChangeOrdersStore>

  beforeEach(async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ public: { nimbleIntegrations: false } }))
    setActivePinia(createPinia())
    store = useChangeOrdersStore()
    mockFetch.mockReset()
    const { dbHelpers } = await import('~/utils/indexedDb')
    vi.mocked(dbHelpers.getChangeOrders).mockResolvedValue([])
    vi.mocked(dbHelpers.saveChangeOrders).mockResolvedValue(undefined)
    vi.mocked(dbHelpers.addChangeOrder).mockResolvedValue(undefined)
    vi.mocked(dbHelpers.updateChangeOrder).mockResolvedValue(undefined)
    vi.mocked(dbHelpers.deleteChangeOrder).mockResolvedValue(undefined)
    vi.mocked(dbHelpers.clearChangeOrders).mockResolvedValue(undefined)
    mockCorporationStore.selectedCorporationId = 'corp-1'
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('$fetch', mockFetch)
  })

  const sampleCO: ChangeOrder = {
    uuid: 'co-1',
    corporation_uuid: 'corp-1',
    project_uuid: 'proj-1',
    vendor_uuid: 'vendor-1',
    co_number: 'CO-000001',
    created_date: '2024-01-01',
    status: 'Draft',
    co_type: 'MATERIAL',
    total_co_amount: 1000,
    item_total: 800,
    charges_total: 100,
    tax_total: 100,
    co_items: [],
  }

  describe('fetchChangeOrders', () => {
    it('fetches from API and caches results', async () => {
      mockFetch.mockResolvedValue({
        data: [sampleCO],
        pagination: {
          page: 1,
          pageSize: 100,
          totalRecords: 1,
          totalPages: 1,
          hasMore: false,
        },
      })
      const { dbHelpers } = await import('~/utils/indexedDb')

      await store.fetchChangeOrders('corp-1')
      await flushPromises()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/change-orders?'),
      )
      expect(mockFetch.mock.calls[0][0]).toContain('corporation_uuid=corp-1')
      expect(store.changeOrders).toHaveLength(1)
      expect(vi.mocked(dbHelpers.saveChangeOrders)).toHaveBeenCalled()
    })

    it('normalizes financial_breakdown totals onto records', async () => {
      mockFetch.mockResolvedValue({
        data: [{
          ...sampleCO,
          financial_breakdown: {
            totals: {
              item_total: 500,
              charges_total: 50,
              tax_total: 50,
              total_co_amount: 600,
            },
          },
        }],
        pagination: {
          page: 1,
          pageSize: 100,
          totalRecords: 1,
          totalPages: 1,
          hasMore: false,
        },
      })

      await store.fetchChangeOrders('corp-1', true)

      expect(store.changeOrders[0].item_total).toBe(500)
      expect(store.changeOrders[0].total_co_amount).toBe(600)
    })
  })

  describe('fetchChangeOrder', () => {
    it('loads CO header and material line items', async () => {
      mockFetch
        .mockResolvedValueOnce({ data: { ...sampleCO, removed_co_items: [] } })
        .mockResolvedValueOnce({
          data: [
            { uuid: 'item-1', item_uuid: 'it-1', co_quantity: 2, co_unit_price: 50, approval_checks_uuids: ['ac-1'] },
            { uuid: 'item-2', item_uuid: 'it-2', co_quantity: 1, co_unit_price: 100 },
          ],
        })

      const result = await store.fetchChangeOrder('co-1')

      expect(mockFetch).toHaveBeenCalledWith('/api/change-orders/co-1')
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/change-order-items?change_order_uuid=co-1',
      )
      expect(result?.co_items).toHaveLength(2)
      expect(result?.co_items?.[0].approval_checks).toEqual(['ac-1'])
    })

    it('filters removed_co_items from line items', async () => {
      mockFetch
        .mockResolvedValueOnce({
          data: {
            ...sampleCO,
            removed_co_items: [{ item_uuid: 'it-1' }],
          },
        })
        .mockResolvedValueOnce({
          data: [
            { uuid: 'item-1', item_uuid: 'it-1' },
            { uuid: 'item-2', item_uuid: 'it-2' },
          ],
        })

      const result = await store.fetchChangeOrder('co-1')

      expect(result?.co_items).toHaveLength(1)
      expect(result?.co_items?.[0].item_uuid).toBe('it-2')
    })

    it('loads labor items for LABOR change orders', async () => {
      mockFetch
        .mockResolvedValueOnce({
          data: { ...sampleCO, co_type: 'LABOR', removed_co_items: [] },
        })
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({
          data: [{ uuid: 'labor-1', co_amount: 250 }],
        })

      const result = await store.fetchChangeOrder('co-1')

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/labor-change-order-items?change_order_uuid=co-1',
      )
      expect(result?.labor_co_items).toHaveLength(1)
    })
  })

  describe('createChangeOrder', () => {
    it('POSTs to API and adds to store when corporation matches', async () => {
      mockFetch.mockResolvedValue({ data: { ...sampleCO, uuid: 'co-new' } })

      const result = await store.createChangeOrder({
        ...sampleCO,
        uuid: undefined,
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/change-orders', expect.objectContaining({
        method: 'POST',
      }))
      expect(result?.uuid).toBe('co-new')
      expect(store.changeOrders.some((c) => c.uuid === 'co-new')).toBe(true)
    })

    it('uploads pending attachments after create', async () => {
      mockFetch
        .mockResolvedValueOnce({ data: { ...sampleCO, uuid: 'co-new' } })
        .mockResolvedValueOnce({
          attachments: [{ uuid: 'att-1', document_name: 'doc.pdf' }],
        })

      await store.createChangeOrder({
        ...sampleCO,
        attachments: [{
          name: 'doc.pdf',
          type: 'application/pdf',
          size: 100,
          fileData: 'data:application/pdf;base64,abc',
        }],
      })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/change-orders/documents/upload',
        expect.objectContaining({
          method: 'POST',
          body: expect.objectContaining({ change_order_uuid: 'co-new' }),
        }),
      )
    })
  })

  describe('updateChangeOrder', () => {
    it('PUTs to API with uuid in body', async () => {
      store.$patch({ changeOrders: [{ ...sampleCO }] })
      mockFetch.mockResolvedValue({
        data: { ...sampleCO, status: 'Ready' },
      })

      const result = await store.updateChangeOrder({
        ...sampleCO,
        status: 'Ready',
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/change-orders', expect.objectContaining({
        method: 'PUT',
        body: expect.objectContaining({ uuid: 'co-1', status: 'Ready' }),
      }))
      expect(result?.status).toBe('Ready')
    })
  })

  describe('deleteChangeOrder', () => {
    it('DELETEs by query uuid and removes from store', async () => {
      store.$patch({ changeOrders: [{ ...sampleCO }] })
      mockFetch.mockResolvedValue({ data: sampleCO })

      const ok = await store.deleteChangeOrder('co-1')

      expect(ok).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith('/api/change-orders', expect.objectContaining({
        method: 'DELETE',
        query: { uuid: 'co-1' },
      }))
      expect(store.changeOrders.find((c) => c.uuid === 'co-1')).toBeUndefined()
    })

    it('surfaces API statusMessage on failure', async () => {
      mockFetch.mockRejectedValue({
        data: { statusMessage: 'Cannot delete linked change order' },
        message: 'Request failed',
      })

      const ok = await store.deleteChangeOrder('co-1')

      expect(ok).toBe(false)
      expect(store.error).toBe('Cannot delete linked change order')
    })
  })

  describe('pagination', () => {
    it('exposes pagination info per corporation', async () => {
      mockFetch.mockResolvedValue({
        data: [sampleCO],
        pagination: {
          page: 1,
          pageSize: 100,
          totalRecords: 1,
          totalPages: 1,
          hasMore: false,
        },
      })

      await store.fetchChangeOrders('corp-1', true)

      expect(store.getPaginationInfo('corp-1')).toMatchObject({
        totalRecords: 1,
        hasMore: false,
      })
    })
  })
})
