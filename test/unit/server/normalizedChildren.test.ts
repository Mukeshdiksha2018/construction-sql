import { describe, expect, it } from 'vitest'
import {
  assembleFinancialBreakdownFromRows,
  attachmentRowsFromJson,
  resolveFinancialBreakdown,
} from '../../../server/utils/normalizedChildren'

describe('normalizedChildren helpers', () => {
  it('assembleFinancialBreakdownFromRows maps charge/tax rows and totals', () => {
    const breakdown = assembleFinancialBreakdownFromRows(
      [
        { charge_key: 'freight', percentage: 5, amount: 10, taxable: true },
        { charge_key: 'packing', percentage: null, amount: 2.5, taxable: false },
      ],
      [
        { tax_key: 'sales_tax_1', percentage: 8, amount: 12 },
      ],
      {
        item_total: 100,
        charges_total: 12.5,
        tax_total: 12,
        total_co_amount: 124.5,
      },
    )

    expect(breakdown.charges.freight).toEqual({
      percentage: 5,
      amount: 10,
      taxable: true,
    })
    expect(breakdown.charges.packing).toEqual({
      percentage: null,
      amount: 2.5,
      taxable: false,
    })
    expect(breakdown.charges.custom_duties.taxable).toBe(false)
    expect(breakdown.sales_taxes.sales_tax_1).toEqual({ percentage: 8, amount: 12 })
    expect(breakdown.sales_taxes.sales_tax_2).toEqual({ percentage: null, amount: null })
    expect(breakdown.totals.item_total).toBe(100)
    expect(breakdown.totals.total_co_amount).toBe(124.5)
    expect(breakdown.totals.total_po_amount).toBe(124.5)
  })

  it('resolveFinancialBreakdown prefers child rows over legacy JSON', () => {
    const legacy = {
      charges: {
        freight: { percentage: 99, amount: 99, taxable: false },
        packing: { percentage: null, amount: null, taxable: false },
        custom_duties: { percentage: null, amount: null, taxable: false },
        other: { percentage: null, amount: null, taxable: false },
      },
      sales_taxes: {
        sales_tax_1: { percentage: 99, amount: 99 },
        sales_tax_2: { percentage: null, amount: null },
      },
      totals: { item_total: 1 },
    }

    const preferred = resolveFinancialBreakdown({
      chargeRows: [
        { charge_key: 'freight', percentage: 1, amount: 2, taxable: true },
      ],
      taxRows: [],
      legacyJson: legacy,
      headerTotals: { item_total: 50 },
    })

    expect(preferred.charges.freight).toEqual({
      percentage: 1,
      amount: 2,
      taxable: true,
    })
    expect(preferred.totals.item_total).toBe(50)

    const fallback = resolveFinancialBreakdown({
      chargeRows: [],
      taxRows: [],
      legacyJson: legacy,
    })
    expect(fallback).toBe(legacy)
  })

  it('attachmentRowsFromJson normalizes attachment payloads', () => {
    const rows = attachmentRowsFromJson(
      [
        {
          uuid: 'att-1',
          document_name: 'Quote.pdf',
          mime_type: 'application/pdf',
          file_size: '2048',
          file_url: 'data:application/pdf;base64,aaa',
          uploaded_at: '2026-01-02T00:00:00.000Z',
          uploaded_by: 'user-1',
        },
        {
          name: 'Other.pdf',
          file_size: 100,
        },
      ],
      'corp-1',
    )

    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      corporation_uuid: 'corp-1',
      document_name: 'Quote.pdf',
      mime_type: 'application/pdf',
      file_size: 2048,
      source_uuid: 'att-1',
      sort_order: 0,
      uploaded_by: 'user-1',
    })
    expect(rows[0].uploaded_at).toBeInstanceOf(Date)
    expect(rows[1]).toMatchObject({
      document_name: 'Other.pdf',
      file_size: 100,
      sort_order: 1,
      source_uuid: null,
    })
  })
})
