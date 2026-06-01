import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockListPoAdvance = vi.fn()
const mockListCoAdvance = vi.fn()
const mockListAdjusted = vi.fn()

vi.mock('../../../server/utils/vendorInvoiceAdvancePayments', () => ({
  listAdvancePaymentsForPurchaseOrder: (...a: unknown[]) => mockListPoAdvance(...a),
  listAdvancePaymentsForChangeOrder: (...a: unknown[]) => mockListCoAdvance(...a),
  listAdjustedAdvancePaymentCostCodes: (...a: unknown[]) => mockListAdjusted(...a),
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

describe('vendor invoice advance payment API handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    stubNuxtGlobals()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('GET purchase-orders/[uuid]/advance-payments returns data', async () => {
    vi.stubGlobal('getRouterParam', () => 'po-1')
    mockListPoAdvance.mockResolvedValue([{ uuid: 'ap-1', costCodes: [] }])

    const handler = (
      await import('../../../server/api/purchase-orders/[uuid]/advance-payments.get')
    ).default
    const result = await handler(makeEvent())

    expect(mockListPoAdvance).toHaveBeenCalledWith('po-1')
    expect(result.data).toHaveLength(1)
  })

  it('GET change-orders/[uuid]/advance-payments returns data', async () => {
    vi.stubGlobal('getRouterParam', () => 'co-1')
    mockListCoAdvance.mockResolvedValue([])

    const handler = (
      await import('../../../server/api/change-orders/[uuid]/advance-payments.get')
    ).default
    const result = await handler(makeEvent())

    expect(mockListCoAdvance).toHaveBeenCalledWith('co-1')
    expect(result.data).toEqual([])
  })

  it('GET adjusted-advance-payment-cost-codes requires PO/CO or invoice uuid', async () => {
    vi.stubGlobal('getQuery', () => ({}))

    const handler = (
      await import('../../../server/api/adjusted-advance-payment-cost-codes.get')
    ).default

    await expect(handler(makeEvent())).rejects.toMatchObject({
      statusCode: 400,
    })
  })

  it('GET adjusted-advance-payment-cost-codes by purchase_order_uuid', async () => {
    vi.stubGlobal('getQuery', () => ({
      purchase_order_uuid: 'po-1',
      exclude_current_invoice: 'true',
      vendor_invoice_uuid: 'inv-1',
    }))
    mockListAdjusted.mockResolvedValue([{ adjusted_amount: 100 }])

    const handler = (
      await import('../../../server/api/adjusted-advance-payment-cost-codes.get')
    ).default
    const result = await handler(makeEvent())

    expect(mockListAdjusted).toHaveBeenCalledWith({
      vendor_invoice_uuid: 'inv-1',
      purchase_order_uuid: 'po-1',
      change_order_uuid: undefined,
      exclude_current_invoice: true,
    })
    expect(result.data[0].adjusted_amount).toBe(100)
  })
})
