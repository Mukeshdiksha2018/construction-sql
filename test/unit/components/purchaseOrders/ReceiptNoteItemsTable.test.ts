import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ReceiptNoteItemsTable from '~/components/purchaseOrders/ReceiptNoteItemsTable.vue'

const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

vi.mock('~/composables/useCurrencyFormat', () => ({
  useCurrencyFormat: () => ({
    formatCurrency: (n: number) => `$${Number(n || 0).toFixed(2)}`,
    currencySymbol: { value: '$' },
  }),
}))

vi.mock('~/stores/locations', () => ({
  useLocationsStore: () => ({
    fetchLocations: vi.fn().mockResolvedValue(undefined),
    locations: [],
    getLocationByUuid: vi.fn(),
  }),
}))

vi.mock('~/stores/itemTypes', () => ({
  useItemTypesStore: () => ({
    getItemTypeById: vi.fn(() => null),
    fetchItemTypes: vi.fn(),
  }),
}))

const sampleItems = [
  {
    id: 'line-1',
    uuid: 'poi-1',
    item_name: 'Concrete Mix',
    unit_price: 10,
    ordered_quantity: 100,
    received_quantity: 0,
    cost_code_label: '01-100',
    category: 'material',
  },
  {
    id: 'line-2',
    uuid: 'poi-2',
    item_name: 'Rebar',
    unit_price: 25,
    ordered_quantity: 50,
    received_quantity: 10,
    cost_code_label: '01-200',
    category: 'material',
  },
]

describe('ReceiptNoteItemsTable.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockFetch.mockResolvedValue({ data: [] })
  })

  const mountTable = (props: Record<string, unknown> = {}) =>
    mount(ReceiptNoteItemsTable, {
      props: {
        items: sampleItems,
        corporationUuid: 'corp-1',
        projectUuid: 'proj-1',
        purchaseOrderUuid: 'po-1',
        receiptType: 'purchase_order',
        loading: false,
        ...props,
      },
      global: {
        stubs: {
          UInput: {
            template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
            props: ['modelValue'],
          },
        },
      },
    })

  it('renders item rows when items are provided', async () => {
    const wrapper = mountTable()
    await flushPromises()
    expect(wrapper.text()).toContain('Concrete Mix')
    expect(wrapper.text()).toContain('Rebar')
    expect(wrapper.text()).toContain('GRN Items')
  })

  it('shows empty state when no items', () => {
    const wrapper = mountTable({
      items: [],
      emptyMessage: 'No PO lines available',
    })
    expect(wrapper.text()).toContain('No PO lines available')
  })

  it('shows loading message when loading', () => {
    const wrapper = mountTable({
      items: [],
      loading: true,
      loadingMessage: 'Loading PO items…',
    })
    expect(wrapper.text()).toContain('Loading PO items…')
  })

  it('computes row total from unit price and received quantity', async () => {
    const wrapper = mountTable()
    await flushPromises()
    const vm = wrapper.vm as { computeRowTotal: (item: unknown, index: number) => number }
    const total = vm.computeRowTotal(sampleItems[1], 1)
    expect(total).toBe(250)
  })

  it('emits received-quantity-change with computed total', async () => {
    const wrapper = mountTable()
    await flushPromises()
    const vm = wrapper.vm as {
      emitReceivedQuantityChange: (index: number, value: string) => void
    }
    vm.emitReceivedQuantityChange(0, '5')
    await wrapper.vm.$nextTick()
    const events = wrapper.emitted('received-quantity-change')
    expect(events).toBeTruthy()
    expect(events![0][0]).toMatchObject({
      index: 0,
      numericValue: 5,
      computedTotal: 50,
    })
  })

  it('uses CO Qty column label for change order receipt type', () => {
    const wrapper = mountTable({
      receiptType: 'change_order',
      changeOrderUuid: 'co-1',
      purchaseOrderUuid: undefined,
    })
    expect(wrapper.text()).toContain('CO Qty')
  })

  it('fetches receipt notes for leftover calculation on mount', async () => {
    mountTable()
    await flushPromises()
    expect(mockFetch).toHaveBeenCalledWith('/api/stock-receipt-notes', expect.objectContaining({
      method: 'GET',
      query: expect.objectContaining({
        corporation_uuid: 'corp-1',
        purchase_order_uuid: 'po-1',
      }),
    }))
  })

  it('displays error message when error prop is set', () => {
    const wrapper = mountTable({ error: 'Failed to load items' })
    expect(wrapper.text()).toContain('Failed to load items')
  })
})
