import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

vi.mock('~/composables/useCurrencyFormat', () => ({
  useCurrencyFormat: () => ({
    formatCurrency: (n: number) => `$${n}`,
    currencySymbol: 'USD',
  }),
}))

vi.mock('~/components/shared/UOMSelect.vue', () => ({
  default: { template: '<div />', props: ['modelValue'] },
}))

const stubs = {
  UInput: {
    props: ['modelValue', 'disabled'],
    template: '<input :value="modelValue" />',
  },
  UButton: { template: '<button><slot /></button>' },
  UIcon: { template: '<span />' },
  UPopover: { template: '<div><slot /></div>' },
  UBadge: { template: '<span><slot /></span>' },
}

async function mountTable(props: Record<string, unknown>) {
  const POItemsTableWithEstimates = (
    await import('~/components/purchaseOrders/POItemsTableWithEstimates.vue')
  ).default
  return mount(POItemsTableWithEstimates, {
    props: {
      showEstimateValues: true,
      readonly: false,
      corporationUuid: 'corp-1',
      ...props,
    },
    global: { stubs },
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
      item_uuid: 'item-1',
      cost_code_uuid: 'cc-1',
      quantity: 10,
      po_quantity: 4,
      name: 'Widget',
      unit_label: 'EA',
    },
  ]

  it('shows remaining as estimate minus used minus current PO qty', async () => {
    const wrapper = await mountTable({
      items: poItems,
      estimateItems,
      usedQuantitiesByItem: { 'item-1-cc-1': 4 },
    })

    expect(wrapper.text()).toContain('Remaining: 2')
  })

  it('shows over-by when PO qty exceeds available', async () => {
    const wrapper = await mountTable({
      items: [{ ...poItems[0], po_quantity: 8 }],
      estimateItems,
      usedQuantitiesByItem: { 'item-1-cc-1': 4 },
    })

    expect(wrapper.text()).toContain('Over by: 2')
  })

  it('shows full estimate qty as remaining when no other POs have used quantity', async () => {
    const wrapper = await mountTable({
      items: [{ ...poItems[0], po_quantity: 3 }],
      estimateItems,
      usedQuantitiesByItem: {},
    })

    expect(wrapper.text()).toContain('Remaining: 7')
  })

  it('shows zero remaining when current PO consumes all available qty', async () => {
    const wrapper = await mountTable({
      items: [{ ...poItems[0], po_quantity: 6 }],
      estimateItems,
      usedQuantitiesByItem: { 'item-1-cc-1': 4 },
    })

    expect(wrapper.text()).toContain('Remaining: 0')
  })

  it('treats lines missing from estimate items as over when PO qty is entered', async () => {
    const wrapper = await mountTable({
      items: [
        {
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
  it('reflects only estimate-scoped used qty (not full project PO total)', async () => {
    const wrapper = await mountTable({
      items: [
        {
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
      // API returns 6 used on other estimate-import POs for this estimate line (not 16 from all project POs)
      usedQuantitiesByItem: { 'item-1-cc-1': 6 },
    })

    expect(wrapper.text()).toContain('Remaining: 9')
    expect(wrapper.text()).not.toContain('Remaining: -1')
  })
})
