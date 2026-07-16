import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockList = vi.fn()

vi.mock('../../../server/utils/holdbackReleases', () => ({
  listHoldbackReleases: (...a: unknown[]) => mockList(...a),
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

describe('GET /api/holdback-releases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    stubGlobals()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns release rows for a vendor invoice', async () => {
    vi.stubGlobal('getQuery', () => ({ vendor_invoice_uuid: 'inv-1' }))
    mockList.mockResolvedValue([
      {
        uuid: 'hb-1',
        vendor_invoice_uuid: 'inv-1',
        cost_code_uuid: 'cc-1',
        release_amount: 100,
      },
    ])

    const handler = (await import('../../../server/api/holdback-releases/index.get'))
      .default
    const result = await handler({ node: { req: { method: 'GET' } } } as any)

    expect(mockList).toHaveBeenCalledWith({
      vendor_invoice_uuid: 'inv-1',
      purchase_order_uuid: undefined,
      change_order_uuid: undefined,
      holdback_invoice_uuid: undefined,
      exclude_current_invoice: false,
    })
    expect(result).toEqual({
      data: [
        expect.objectContaining({
          uuid: 'hb-1',
          release_amount: 100,
        }),
      ],
    })
  })

  it('passes PO filter and exclude_current_invoice', async () => {
    vi.stubGlobal('getQuery', () => ({
      purchase_order_uuid: 'po-1',
      holdback_invoice_uuid: 'hb-inv',
      vendor_invoice_uuid: 'inv-current',
      exclude_current_invoice: 'true',
    }))
    mockList.mockResolvedValue([])

    const handler = (await import('../../../server/api/holdback-releases/index.get'))
      .default
    await handler({ node: { req: { method: 'GET' } } } as any)

    expect(mockList).toHaveBeenCalledWith({
      vendor_invoice_uuid: 'inv-current',
      purchase_order_uuid: 'po-1',
      change_order_uuid: undefined,
      holdback_invoice_uuid: 'hb-inv',
      exclude_current_invoice: true,
    })
  })
})
