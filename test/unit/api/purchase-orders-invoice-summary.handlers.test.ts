import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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
})
