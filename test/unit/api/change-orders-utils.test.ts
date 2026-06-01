import { describe, expect, it } from 'vitest'
import {
  sanitizeChangeOrderItem,
  decorateChangeOrderRecord,
  buildLaborCOFinancialBreakdown,
} from '../../../server/api/change-orders/utils'

describe('change-orders API utils', () => {
  it('sanitizeChangeOrderItem maps co quantities and approval_checks', () => {
    const row = sanitizeChangeOrderItem({
      co_quantity: 3,
      co_unit_price: 12.5,
      co_total: 37.5,
      approval_checks: ['uuid-a'],
      name: 'Bolt',
    }, 0)

    expect(row.co_quantity).toBe(3)
    expect(row.co_unit_price).toBe(12.5)
    expect(row.item_name).toBe('Bolt')
    expect(row.approval_checks_uuids).toEqual(['uuid-a'])
    expect(row.is_active).toBe(true)
  })

  it('decorateChangeOrderRecord unpacks financial_breakdown charges and taxes', () => {
    const record = decorateChangeOrderRecord({
      financial_breakdown: {
        charges: {
          freight: { percentage: 5, amount: 10, taxable: true },
          packing: { percentage: 0, amount: 0, taxable: false },
          custom_duties: { percentage: 0, amount: 0, taxable: false },
          other: { percentage: 0, amount: 0, taxable: false },
        },
        sales_taxes: {
          sales_tax_1: { percentage: 8, amount: 8 },
          sales_tax_2: { percentage: 0, amount: 0 },
        },
        totals: {
          item_total: 100,
          charges_total: 10,
          tax_total: 8,
          total_co_amount: 118,
        },
      },
    } as any)

    expect(record.freight_charges_percentage).toBe(5)
    expect(record.freight_charges_taxable).toBe(true)
    expect(record.sales_tax_1_amount).toBe(8)
    expect(record.total_co_amount).toBe(118)
    expect(Array.isArray(record.attachments)).toBe(true)
  })

  it('buildLaborCOFinancialBreakdown uses labor total and preserves tax from payload', () => {
    const breakdown = buildLaborCOFinancialBreakdown(500, {
      tax_total: 40,
      total_co_amount: 540,
      sales_tax_1_percentage: 8,
      sales_tax_1_amount: 40,
    })

    expect(breakdown.totals.item_total).toBe(500)
    expect(breakdown.totals.tax_total).toBe(40)
    expect(breakdown.totals.total_co_amount).toBe(540)
  })
})
