import { describe, expect, it } from 'vitest'
import {
  CREATE_PO_QTY_COLUMN_IDS,
  createPoQtyColumnsAreGrouped,
} from '../../../app/utils/createPoItemsTableColumns'

describe('createPoItemsTableColumns', () => {
  it('defines qty column ids in display order', () => {
    expect(CREATE_PO_QTY_COLUMN_IDS).toEqual(['budget_qty', 'po_qty', 'pending_qty'])
  })

  it('detects when qty columns are consecutive', () => {
    const columns = [
      { id: 'select' },
      { id: 'location' },
      { id: 'budget_qty' },
      { id: 'po_qty' },
      { id: 'pending_qty' },
      { id: 'status' },
    ]
    expect(createPoQtyColumnsAreGrouped(columns)).toBe(true)
  })

  it('detects when qty columns are split apart', () => {
    const columns = [
      { id: 'budget_qty' },
      { id: 'status' },
      { id: 'po_qty' },
      { id: 'pending_qty' },
    ]
    expect(createPoQtyColumnsAreGrouped(columns)).toBe(false)
  })
})
