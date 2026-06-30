import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computeMaterialBalanceToBeInvoicedFromItems } from '~/utils/materialBalanceToBeInvoiced'

const mockSummary = vi.fn()

vi.mock('../../../server/utils/vendorInvoiceSummary', () => ({
  getPurchaseOrderInvoiceSummary: (...a: unknown[]) => mockSummary(...a),
}))

const makeEvent = () => ({ node: { req: { method: 'GET' } } }) as any

function stubNuxtGlobals() {
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

describe('purchase-orders invoice-summary.get', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    stubNuxtGlobals()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('requires purchase_order_uuid', async () => {
    vi.stubGlobal('getQuery', () => ({}))
    const handler = (await import('../../../server/api/purchase-orders/invoice-summary.get')).default
    await expect(handler(makeEvent())).rejects.toMatchObject({ statusCode: 400 })
  })

  it('returns summary data', async () => {
    vi.stubGlobal('getQuery', () => ({ purchase_order_uuid: 'po-1' }))
    mockSummary.mockResolvedValue({ purchase_order_uuid: 'po-1', total_po_value: 1000 })

    const handler = (await import('../../../server/api/purchase-orders/invoice-summary.get')).default
    const result = await handler(makeEvent())

    expect(mockSummary).toHaveBeenCalledWith('po-1', undefined)
    expect(result.data.total_po_value).toBe(1000)
  })

  describe('material balance to be invoiced (shared util)', () => {
    it('computes balance from remaining qty * unit price for material PO line items', () => {
      expect(
        computeMaterialBalanceToBeInvoicedFromItems({
          lineItems: [
            { uuid: 'poItem-1', po_quantity: 10, po_unit_price: 100 },
            { uuid: 'poItem-2', po_quantity: 5, po_unit_price: 200 },
          ],
          invoiceLineItems: [
            { po_item_uuid: 'poItem-1', invoice_quantity: 3 },
            { po_item_uuid: 'poItem-2', invoice_quantity: 2 },
          ],
        }),
      ).toBe(1300)
    })

    it('returns null when unit prices are unavailable (legacy labor balance path)', () => {
      expect(
        computeMaterialBalanceToBeInvoicedFromItems({
          lineItems: [{ uuid: 'poItem-1', po_quantity: 10 }],
        }),
      ).toBeNull()
    })
  })
})
