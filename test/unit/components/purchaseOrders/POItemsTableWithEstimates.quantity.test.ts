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
    const POItemsTableWithEstimates = (
      await import('~/components/purchaseOrders/POItemsTableWithEstimates.vue')
    ).default

    const wrapper = mount(POItemsTableWithEstimates, {
      props: {
        items: poItems,
        estimateItems,
        usedQuantitiesByItem: { 'item-1-cc-1': 4 },
        showEstimateValues: true,
        readonly: false,
        corporationUuid: 'corp-1',
      },
      global: { stubs },
    })

    expect(wrapper.text()).toContain('Remaining: 2')
  })

  it('shows over-by when PO qty exceeds available', async () => {
    const POItemsTableWithEstimates = (
      await import('~/components/purchaseOrders/POItemsTableWithEstimates.vue')
    ).default

    const wrapper = mount(POItemsTableWithEstimates, {
      props: {
        items: [{ ...poItems[0], po_quantity: 8 }],
        estimateItems,
        usedQuantitiesByItem: { 'item-1-cc-1': 4 },
        showEstimateValues: true,
        readonly: false,
        corporationUuid: 'corp-1',
      },
      global: { stubs },
    })

    expect(wrapper.text()).toContain('Over by: 2')
  })
})
