import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('laborInvoiceLineAggregationKey', () => {
  it('prefers labor line UUIDs over cost+location', async () => {
    const { laborInvoiceLineAggregationKey, aggregationBucketToRow } =
      await import('../../../server/utils/laborInvoiceItems')

    expect(
      laborInvoiceLineAggregationKey({
        labor_co_item_uuid: 'lco-9',
        labor_po_item_uuid: 'lpo-1',
        cost_code_uuid: 'cc',
        location_uuid: 'loc',
      }),
    ).toBe('lco:lco-9')

    expect(
      laborInvoiceLineAggregationKey({
        labor_po_item_uuid: 'lpo-1',
        cost_code_uuid: 'cc',
        location_uuid: 'loc',
      }),
    ).toBe('lpo:lpo-1')

    expect(
      laborInvoiceLineAggregationKey({
        cost_code_uuid: 'cc-1',
        location_uuid: 'loc-1',
      }),
    ).toBe('cc-1|loc-1')

    expect(aggregationBucketToRow('lco:abc', 10)).toEqual({
      labor_co_item_uuid: 'abc',
      labor_po_item_uuid: null,
      cost_code_uuid: null,
      location_uuid: null,
      total_invoiced_amount: 10,
    })
  })
})

describe('listLaborInvoiceItems util', () => {
  const mockLaborInvoiceFindMany = vi.fn()
  const mockLaborPoFindMany = vi.fn()
  const mockLaborCoFindMany = vi.fn()
  const mockVendorInvoiceFindMany = vi.fn()

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    vi.doMock('../../../server/utils/prisma', () => ({
      getPrisma: () => ({
        laborInvoiceItem: { findMany: mockLaborInvoiceFindMany },
        laborPurchaseOrderItem: { findMany: mockLaborPoFindMany },
        laborChangeOrderItem: { findMany: mockLaborCoFindMany },
        vendorInvoice: { findMany: mockVendorInvoiceFindMany },
      }),
    }))
    vi.stubGlobal(
      'createError',
      (opts: { statusCode: number; statusMessage: string }) => {
        const err = new Error(opts.statusMessage) as Error & { statusCode: number }
        err.statusCode = opts.statusCode
        return err
      },
    )
  })

  it('throws when no entity filter is provided', async () => {
    const { listLaborInvoiceItems } = await import(
      '../../../server/utils/laborInvoiceItems'
    )

    await expect(listLaborInvoiceItems({})).rejects.toMatchObject({
      statusCode: 400,
    })
  })

  it('returns PO labor schedule templates', async () => {
    mockLaborPoFindMany.mockResolvedValue([
      {
        uuid: 'lpo-1',
        cost_code_uuid: 'cc-1',
        cost_code_label: '01 - Labor',
        cost_code_number: '01',
        cost_code_name: 'Labor',
        location_uuid: 'loc-1',
        location_label: 'Site A',
        description: 'Frame',
        po_amount: 500,
        labor_budgeted_amount: 600,
        order_index: 0,
        metadata: null,
      },
    ])

    const { listLaborInvoiceItems } = await import(
      '../../../server/utils/laborInvoiceItems'
    )
    const rows = await listLaborInvoiceItems({ purchase_order_uuid: 'po-1' })

    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      labor_po_item_uuid: 'lpo-1',
      invoice_amount: 0,
      po_amount: 500,
      location_uuid: 'loc-1',
    })
  })

  it('aggregates previously invoiced amounts excluding drafts and current invoice', async () => {
    mockVendorInvoiceFindMany.mockResolvedValue([
      { uuid: 'inv-paid' },
      { uuid: 'inv-edit' },
    ])
    mockLaborInvoiceFindMany.mockResolvedValue([
      {
        labor_po_item_uuid: 'lpo-1',
        labor_co_item_uuid: null,
        cost_code_uuid: 'cc-1',
        invoice_amount: 100,
        metadata: null,
      },
      {
        labor_po_item_uuid: 'lpo-1',
        labor_co_item_uuid: null,
        cost_code_uuid: 'cc-1',
        invoice_amount: 50,
        metadata: null,
      },
    ])

    const { listLaborInvoiceItems } = await import(
      '../../../server/utils/laborInvoiceItems'
    )
    const rows = await listLaborInvoiceItems({
      purchase_order_uuid: 'po-1',
      aggregate_invoiced: true,
      exclude_vendor_invoice_uuid: 'inv-edit',
    })

    expect(mockVendorInvoiceFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          purchase_order_uuid: 'po-1',
          is_active: true,
          status: { not: 'Draft' },
        }),
      }),
    )
    expect(mockLaborInvoiceFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          vendor_invoice_uuid: { in: ['inv-paid'] },
        }),
      }),
    )
    expect(rows).toEqual([
      {
        labor_co_item_uuid: null,
        labor_po_item_uuid: 'lpo-1',
        cost_code_uuid: null,
        location_uuid: null,
        total_invoiced_amount: 150,
      },
    ])
  })

  it('enriches saved invoice lines with PO original amounts', async () => {
    mockLaborInvoiceFindMany.mockResolvedValue([
      {
        id: 1n,
        uuid: 'lii-1',
        vendor_invoice_uuid: 'inv-1',
        labor_po_item_uuid: 'lpo-1',
        labor_co_item_uuid: null,
        cost_code_uuid: 'cc-1',
        invoice_amount: 200,
        metadata: '{}',
      },
    ])
    mockLaborPoFindMany.mockResolvedValue([
      {
        uuid: 'lpo-1',
        po_amount: 1000,
        labor_budgeted_amount: 1200,
        location_uuid: 'loc-1',
        location_label: 'Site',
        description: 'Work',
      },
    ])
    mockLaborCoFindMany.mockResolvedValue([])

    const { listLaborInvoiceItems } = await import(
      '../../../server/utils/laborInvoiceItems'
    )
    const rows = await listLaborInvoiceItems({ vendor_invoice_uuid: 'inv-1' })

    expect(rows[0]).toMatchObject({
      uuid: 'lii-1',
      po_amount: 1000,
      original_amount: 1000,
      labor_budgeted_amount: 1200,
      location_uuid: 'loc-1',
    })
  })
})
