import { describe, it, expect } from 'vitest'
import {
  advancePaidDeductionForBalance,
  computeMaterialBalanceToBeInvoicedFromItems,
  isMaterialOrderType,
} from '~/utils/materialBalanceToBeInvoiced'

describe('materialBalanceToBeInvoiced', () => {
  it('identifies material order type', () => {
    expect(isMaterialOrderType('MATERIAL')).toBe(true)
    expect(isMaterialOrderType('material')).toBe(true)
    expect(isMaterialOrderType('LABOR')).toBe(false)
  })

  it('applies advance paid deduction only for non-material (labor) orders', () => {
    expect(advancePaidDeductionForBalance('MATERIAL', 500)).toBe(0)
    expect(advancePaidDeductionForBalance('LABOR', 500)).toBe(500)
    expect(advancePaidDeductionForBalance(undefined, 500)).toBe(500)
  })

  it('sums remaining qty * unit price without subtracting advance paid', () => {
    expect(
      computeMaterialBalanceToBeInvoicedFromItems({
        lineItems: [
          { uuid: 'item-1', po_quantity: 10, po_unit_price: 100 },
          { uuid: 'item-2', po_quantity: 5, po_unit_price: 200 },
        ],
        invoiceLineItems: [
          { po_item_uuid: 'item-1', invoice_quantity: 3 },
          { po_item_uuid: 'item-2', invoice_quantity: 2 },
        ],
      }),
    ).toBe(1300)
  })

  it('treats missing invoice lines as zero invoiced qty per item', () => {
    expect(
      computeMaterialBalanceToBeInvoicedFromItems({
        lineItems: [{ uuid: 'item-1', po_quantity: 4, po_unit_price: 250 }],
      }),
    ).toBe(1000)
  })

  it('returns null when line items have no unit prices', () => {
    expect(
      computeMaterialBalanceToBeInvoicedFromItems({
        lineItems: [{ uuid: 'item-1', po_quantity: 4 }],
      }),
    ).toBeNull()
  })
})
