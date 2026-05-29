import { describe, expect, it } from 'vitest'
import {
  lineItemsShareSingleEstimateVendor,
  transformCreatePoLineItems,
} from '../../../app/utils/transformCreatePoLineItems'

describe('transformCreatePoLineItems', () => {
  it('maps pending_qty to po_quantity and budget_qty to estimate quantity', () => {
    const [line] = transformCreatePoLineItems([
      {
        item_uuid: 'item-1',
        cost_code_uuid: 'cc-1',
        cost_code_label: '03 Concrete',
        item_name: 'Mix',
        pending_qty: 6,
        budget_qty: 10,
        unit_price: 50,
        unit_label: 'EA',
        sequence: '001',
      },
    ])

    expect(line.po_quantity).toBe(6)
    expect(line.quantity).toBe(10)
    expect(line.po_unit_price).toBe(50)
    expect(line.po_total).toBe(300)
    expect(line.uom).toBe('EA')
    expect(line.name).toBe('Mix')
  })

  it('sets po_quantity null when pending_qty is zero', () => {
    const [line] = transformCreatePoLineItems([
      { item_uuid: 'item-1', pending_qty: 0, budget_qty: 5, unit_price: 10 },
    ])
    expect(line.po_quantity).toBeNull()
    expect(line.po_total).toBeNull()
  })
})

describe('lineItemsShareSingleEstimateVendor', () => {
  it('allows zero or one row', () => {
    expect(lineItemsShareSingleEstimateVendor([])).toBe(true)
    expect(
      lineItemsShareSingleEstimateVendor([{ preferred_vendor_uuid: 'v-1' }]),
    ).toBe(true)
  })

  it('rejects rows with different preferred vendors', () => {
    expect(
      lineItemsShareSingleEstimateVendor([
        { preferred_vendor_uuid: 'v-1' },
        { preferred_vendor_uuid: 'v-2' },
      ]),
    ).toBe(false)
  })

  it('allows multiple rows with the same preferred vendor', () => {
    expect(
      lineItemsShareSingleEstimateVendor([
        { preferred_vendor_uuid: 'v-1' },
        { preferred_vendor_uuid: 'v-1' },
      ]),
    ).toBe(true)
  })
})
