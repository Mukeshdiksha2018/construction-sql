import { describe, expect, it } from 'vitest'
import { enrichPoItemForPrint } from '../../../app/utils/poPrintItems'

describe('enrichPoItemForPrint', () => {
  it('uses unit_label from purchase_order_items_list row', () => {
    const row = enrichPoItemForPrint({
      item_name: 'Widget',
      unit_uuid: 'uom-1',
      unit_label: 'Each',
      po_quantity: 2,
    })
    expect(row.uom).toBe('Each')
    expect(row.unit_label).toBe('Each')
  })

  it('falls back to metadata unit_label when column is empty', () => {
    const row = enrichPoItemForPrint({
      item_name: 'Widget',
      unit_uuid: 'uom-1',
      metadata: { unit_label: 'BOX' },
    })
    expect(row.uom).toBe('BOX')
  })
})
