import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockFetchPurchaseOrderItems = vi.fn()

vi.mock('~/stores/purchaseOrderResources', () => ({
  usePurchaseOrderResourcesStore: () => ({
    fetchPurchaseOrderItems: mockFetchPurchaseOrderItems,
  }),
}))

vi.mock('~/composables/useCurrencyFormat', () => ({
  useCurrencyFormat: () => ({
    formatCurrency: (n: number) => `$${Number(n).toFixed(2)}`,
    currencySymbol: 'USD',
  }),
}))

vi.mock('~/stores/locations', () => ({
  useLocationsStore: () => ({
    getAll: [],
    fetchLocations: vi.fn(),
  }),
}))

vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({ data: [] }))

describe('POBreakdown', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchPurchaseOrderItems.mockResolvedValue([
      {
        uuid: 'poi-1',
        item_name: 'Widget',
        unit_label: 'EA',
        po_quantity: 2,
        po_unit_price: 25,
        po_total: 50,
      },
    ])
  })

  it('loads line items via purchaseOrderResourcesStore.fetchPurchaseOrderItems', async () => {
    const POBreakdown = (await import('~/components/purchaseOrders/POBreakdown.vue')).default
    mount(POBreakdown, {
      props: {
        poUuid: 'po-uuid-1',
        poData: { uuid: 'po-uuid-1', po_type: 'MATERIAL' },
      },
      global: {
        stubs: { UIcon: true },
      },
    })
    await flushPromises()

    expect(mockFetchPurchaseOrderItems).toHaveBeenCalledWith('po-uuid-1')
  })
})
