import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockList = vi.fn()

vi.mock('../../../server/utils/laborInvoiceItems', () => ({
  listLaborInvoiceItems: (...a: unknown[]) => mockList(...a),
}))

function stubGlobals() {
  vi.stubGlobal('defineEventHandler', (handler: any) => handler)
  vi.stubGlobal(
    'createError',
    (opts: { statusCode: number; statusMessage: string }) => {
      const err = new Error(opts.statusMessage) as Error & { statusCode: number }
      err.statusCode = opts.statusCode
      return err
    },
  )
}

describe('GET /api/labor-invoice-items', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    stubGlobals()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns labor schedule templates for a purchase order', async () => {
    vi.stubGlobal('getQuery', () => ({ purchase_order_uuid: 'po-1' }))
    mockList.mockResolvedValue([
      {
        uuid: 'lpo-1',
        labor_po_item_uuid: 'lpo-1',
        cost_code_uuid: 'cc-1',
        invoice_amount: 0,
        po_amount: 1000,
      },
    ])

    const handler = (
      await import('../../../server/api/labor-invoice-items/index.get')
    ).default
    const result = await handler({ node: { req: { method: 'GET' } } } as any)

    expect(mockList).toHaveBeenCalledWith(
      expect.objectContaining({
        purchase_order_uuid: 'po-1',
        aggregate_invoiced: false,
      }),
    )
    expect(result.data).toHaveLength(1)
  })

  it('passes aggregate_invoiced and exclude flags', async () => {
    vi.stubGlobal('getQuery', () => ({
      change_order_uuid: 'co-1',
      aggregate_invoiced: 'true',
      exclude_vendor_invoice_uuid: 'inv-edit',
    }))
    mockList.mockResolvedValue([
      {
        labor_co_item_uuid: 'lco-1',
        total_invoiced_amount: 250,
      },
    ])

    const handler = (
      await import('../../../server/api/labor-invoice-items/index.get')
    ).default
    const result = await handler({ node: { req: { method: 'GET' } } } as any)

    expect(mockList).toHaveBeenCalledWith(
      expect.objectContaining({
        change_order_uuid: 'co-1',
        aggregate_invoiced: true,
        exclude_vendor_invoice_uuid: 'inv-edit',
      }),
    )
    expect(result.data[0].total_invoiced_amount).toBe(250)
  })
})
