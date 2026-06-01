import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ReturnNoteItemsTable from '~/components/purchaseOrders/ReturnNoteItemsTable.vue'

vi.mock('~/composables/useCurrencyFormat', () => ({
  useCurrencyFormat: () => ({
    formatCurrency: (n: number) => `$${Number(n || 0).toFixed(2)}`,
    formatCurrencyInput: (n: number) => String(Number(n || 0).toFixed(2)),
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
    item_name: 'Steel Beam',
    unit_price: 20,
    ordered_quantity: 40,
    return_quantity: 0,
    cost_code_label: '02-100',
    category: 'material',
  },
  {
    id: 'line-2',
    uuid: 'poi-2',
    item_name: 'Bolts',
    unit_price: 5,
    ordered_quantity: 100,
    return_quantity: 10,
    cost_code_label: '02-200',
    category: 'material',
  },
]

describe('ReturnNoteItemsTable.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  const mountTable = (props: Record<string, unknown> = {}) =>
    mount(ReturnNoteItemsTable, {
      props: {
        items: sampleItems,
        corporationUuid: 'corp-1',
        projectUuid: 'proj-1',
        purchaseOrderUuid: 'po-1',
        returnType: 'purchase_order',
        loading: false,
        ...props,
      },
      global: {
        stubs: {
          UInput: {
            template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
            props: ['modelValue'],
          },
          UButton: { template: '<button><slot /></button>' },
          UModal: { template: '<div><slot name="body" /></div>' },
        },
      },
    })

  it('renders item rows when items are provided', async () => {
    const wrapper = mountTable()
    await flushPromises()
    expect(wrapper.text()).toContain('Steel Beam')
    expect(wrapper.text()).toContain('Bolts')
    expect(wrapper.text()).toContain('Return Items')
  })

  it('shows empty state when no items', () => {
    const wrapper = mountTable({
      items: [],
      emptyMessage: 'No lines to return',
    })
    expect(wrapper.text()).toContain('No lines to return')
  })

  it('shows loading message when loading', () => {
    const wrapper = mountTable({
      items: [],
      loading: true,
      loadingMessage: 'Loading return lines…',
    })
    expect(wrapper.text()).toContain('Loading return lines…')
  })

  it('displays row total from unit price and return quantity', async () => {
    const wrapper = mountTable()
    await flushPromises()
    expect(wrapper.text()).toContain('50.00')
  })

  it('emits return-quantity-change when quantity input changes', async () => {
    const wrapper = mountTable()
    await flushPromises()
    const inputs = wrapper.findAll('input')
    expect(inputs.length).toBeGreaterThan(0)
    await inputs[0].setValue('3')
    await wrapper.vm.$nextTick()
    const events = wrapper.emitted('return-quantity-change')
    expect(events).toBeTruthy()
    expect(events![0][0]).toMatchObject({
      index: 0,
      numericValue: 3,
      computedTotal: 60,
    })
  })

  it('uses CO Qty column label for change order return type', () => {
    const wrapper = mountTable({
      returnType: 'change_order',
      changeOrderUuid: 'co-1',
      purchaseOrderUuid: undefined,
    })
    expect(wrapper.text()).toContain('CO Qty')
  })

  it('hides zero-qty lines when editing existing return note', async () => {
    const wrapper = mountTable({
      editingReturnNote: true,
      items: [
        { ...sampleItems[0], return_quantity: 0 },
        sampleItems[1],
      ],
    })
    await flushPromises()
    expect(wrapper.text()).toContain('Bolts')
    expect(wrapper.text()).not.toContain('Steel Beam')
  })

  it('displays error message when error prop is set', () => {
    const wrapper = mountTable({ error: 'Failed to load return items' })
    expect(wrapper.text()).toContain('Failed to load return items')
  })
})
