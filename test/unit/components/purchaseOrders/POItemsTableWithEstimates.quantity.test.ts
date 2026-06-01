import { mount } from '@vue/test-utils'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import type { Component } from 'vue'

const mockEditorInstance = {
  chain: vi.fn(() => ({
    focus: vi.fn(() => ({
      toggleBold: vi.fn(() => ({ run: vi.fn() })),
      run: vi.fn(),
    })),
  })),
  commands: { setContent: vi.fn() },
  getHTML: vi.fn(() => ''),
  destroy: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  isActive: vi.fn(() => false),
}

vi.mock('@tiptap/vue-3', () => ({
  useEditor: vi.fn(() => ref(mockEditorInstance)),
  EditorContent: { name: 'EditorContent', template: '<div class="tiptap-stub" />' },
}))

vi.mock('@tiptap/starter-kit', () => ({ default: {} }))

vi.mock('~/composables/useCurrencyFormat', () => ({
  useCurrencyFormat: () => ({
    formatCurrency: (n: number) => `$${n}`,
    currencySymbol: 'USD',
  }),
}))

vi.mock('~/stores/approvalChecks', () => ({
  useApprovalChecksStore: () => ({
    approvalChecks: [],
    loading: false,
    fetchApprovalChecks: vi.fn().mockResolvedValue(undefined),
    createApprovalCheck: vi.fn().mockResolvedValue({ uuid: 'ac-1' }),
  }),
}))

const childStub = { template: '<div class="child-stub" />' }

vi.mock('~/components/shared/CostCodeSelect.vue', () => ({ default: childStub }))
vi.mock('~/components/shared/ItemTypeSelect.vue', () => ({ default: childStub }))
vi.mock('~/components/shared/ItemSelect.vue', () => ({ default: childStub }))
vi.mock('~/components/shared/SequenceSelect.vue', () => ({ default: childStub }))
vi.mock('~/components/shared/ItemCategorySelect.vue', () => ({ default: childStub }))
vi.mock('~/components/shared/LocationSelect.vue', () => ({ default: childStub }))
vi.mock('~/components/shared/UOMSelect.vue', () => ({
  default: { template: '<div />', props: ['modelValue'] },
}))
vi.mock('~/components/shared/ApprovalChecksSelect.vue', () => ({ default: childStub }))

const globalStubs = {
  UInput: {
    props: ['modelValue', 'disabled'],
    template: '<input :value="modelValue" />',
  },
  UInputNumber: {
    props: ['modelValue', 'disabled'],
    template: '<input type="number" :value="modelValue" />',
  },
  UTextarea: {
    props: ['modelValue'],
    template: '<textarea :value="modelValue" />',
  },
  UButton: { template: '<button><slot /></button>' },
  UIcon: { template: '<span />' },
  UPopover: { template: '<div><slot /><slot name="content" /></div>' },
  UBadge: { template: '<span><slot /></span>' },
  UCheckbox: { template: '<input type="checkbox" />' },
  UModal: { template: '<div><slot /><slot name="body" /></div>' },
  USelectMenu: { template: '<select />' },
}

let POItemsTableWithEstimates: Component

beforeAll(async () => {
  POItemsTableWithEstimates = (
    await import('~/components/purchaseOrders/POItemsTableWithEstimates.vue')
  ).default
})

function mountTable(props: Record<string, unknown>) {
  return mount(POItemsTableWithEstimates, {
    props: {
      showEstimateValues: true,
      readonly: false,
      corporationUuid: 'corp-1',
      loading: false,
      ...props,
    },
    global: { stubs: globalStubs },
  })
}

describe('POItemsTableWithEstimates remaining quantity', () => {
  const estimateItems = [
    {
      item_uuid: 'item-1',
      cost_code_uuid: 'cc-1',
      quantity: 10,
      name: 'Widget',
    },
  ]

  const poItems = [
    {
      id: 'line-1',
      item_uuid: 'item-1',
      cost_code_uuid: 'cc-1',
      quantity: 10,
      po_quantity: 4,
      name: 'Widget',
      unit_label: 'EA',
    },
  ]

  it('shows remaining as estimate minus used minus current PO qty', () => {
    const wrapper = mountTable({
      items: poItems,
      estimateItems,
      usedQuantitiesByItem: { 'item-1-cc-1': 4 },
    })

    expect(wrapper.text()).toContain('Remaining: 2')
  })

  it('shows over-by when PO qty exceeds available', () => {
    const wrapper = mountTable({
      items: [{ ...poItems[0], po_quantity: 8 }],
      estimateItems,
      usedQuantitiesByItem: { 'item-1-cc-1': 4 },
    })

    expect(wrapper.text()).toContain('Over by: 2')
  })

  it('shows full estimate qty as remaining when no other POs have used quantity', () => {
    const wrapper = mountTable({
      items: [{ ...poItems[0], po_quantity: 3 }],
      estimateItems,
      usedQuantitiesByItem: {},
    })

    expect(wrapper.text()).toContain('Remaining: 7')
  })

  it('shows zero remaining when current PO consumes all available qty', () => {
    const wrapper = mountTable({
      items: [{ ...poItems[0], po_quantity: 6 }],
      estimateItems,
      usedQuantitiesByItem: { 'item-1-cc-1': 4 },
    })

    expect(wrapper.text()).toContain('Remaining: 0')
  })

  it('treats lines missing from estimate items as over when PO qty is entered', () => {
    const wrapper = mountTable({
      items: [
        {
          id: 'line-orphan',
          item_uuid: 'item-orphan',
          cost_code_uuid: 'cc-orphan',
          quantity: 5,
          po_quantity: 1,
          name: 'Orphan',
          unit_label: 'EA',
        },
      ],
      estimateItems: [],
      usedQuantitiesByItem: { 'item-orphan-cc-orphan': 99 },
    })

    expect(wrapper.text()).toContain('Over by: 1')
  })
})

describe('POItemsTableWithEstimates remaining qty — estimate-scoped used data', () => {
  it('reflects only estimate-scoped used qty (not full project PO total)', () => {
    const wrapper = mountTable({
      items: [
        {
          id: 'line-1',
          item_uuid: 'item-1',
          cost_code_uuid: 'cc-1',
          quantity: 20,
          po_quantity: 5,
          name: 'Beam',
          unit_label: 'EA',
        },
      ],
      estimateItems: [
        { item_uuid: 'item-1', cost_code_uuid: 'cc-1', quantity: 20, name: 'Beam' },
      ],
      usedQuantitiesByItem: { 'item-1-cc-1': 6 },
    })

    expect(wrapper.text()).toContain('Remaining: 9')
    expect(wrapper.text()).not.toContain('Remaining: -1')
  })
})
