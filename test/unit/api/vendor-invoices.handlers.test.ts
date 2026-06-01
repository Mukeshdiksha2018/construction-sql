import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockList = vi.fn()
const mockGet = vi.fn()
const mockCreate = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockHasPo = vi.fn()
const mockHasCo = vi.fn()
const mockPreviouslyInvoiced = vi.fn()

vi.mock('../../../server/utils/vendorInvoices', () => ({
  listVendorInvoices: (...a: unknown[]) => mockList(...a),
  getVendorInvoice: (...a: unknown[]) => mockGet(...a),
  createVendorInvoice: (...a: unknown[]) => mockCreate(...a),
  updateVendorInvoice: (...a: unknown[]) => mockUpdate(...a),
  deleteVendorInvoice: (...a: unknown[]) => mockDelete(...a),
  hasVendorInvoicesForPurchaseOrder: (...a: unknown[]) => mockHasPo(...a),
  hasVendorInvoicesForChangeOrder: (...a: unknown[]) => mockHasCo(...a),
  getPreviouslyInvoicedForOrder: (...a: unknown[]) => mockPreviouslyInvoiced(...a),
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

describe('vendor-invoices API handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    stubNuxtGlobals()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('check-purchase-order returns hasVendorInvoices flag', async () => {
    vi.stubGlobal('getQuery', () => ({ purchase_order_uuid: 'po-1' }))
    mockHasPo.mockResolvedValue(true)

    const handler = (await import('../../../server/api/vendor-invoices/check-purchase-order.get')).default
    const result = await handler(makeEvent())

    expect(mockHasPo).toHaveBeenCalledWith('po-1')
    expect(result).toEqual({ data: { hasVendorInvoices: true } })
  })

  it('check-change-order returns hasVendorInvoices flag', async () => {
    vi.stubGlobal('getQuery', () => ({ change_order_uuid: 'co-1' }))
    mockHasCo.mockResolvedValue(false)

    const handler = (await import('../../../server/api/vendor-invoices/check-change-order.get')).default
    const result = await handler(makeEvent())

    expect(result).toEqual({ data: { hasVendorInvoices: false } })
  })

  it('[uuid].get returns invoice', async () => {
    vi.stubGlobal('getRouterParam', () => 'inv-1')
    mockGet.mockResolvedValue({ uuid: 'inv-1', number: 'INV-1' })

    const handler = (await import('../../../server/api/vendor-invoices/[uuid].get')).default
    const result = await handler(makeEvent())

    expect(result.data.number).toBe('INV-1')
  })

  it('index.post creates invoice', async () => {
    vi.stubGlobal('readBody', async () => ({ corporation_uuid: 'corp-1', invoice_type: 'AGAINST_PO' }))
    mockCreate.mockResolvedValue({ uuid: 'inv-new' })

    const handler = (await import('../../../server/api/vendor-invoices/index.post')).default
    const result = await handler(makeEvent())

    expect(mockCreate).toHaveBeenCalled()
    expect(result.data.uuid).toBe('inv-new')
  })

  it('previously-invoiced-for-order delegates to util', async () => {
    vi.stubGlobal('getQuery', () => ({
      corporation_uuid: 'corp-1',
      purchase_order_uuid: 'po-1',
    }))
    mockPreviouslyInvoiced.mockResolvedValue({
      data: { lineQuantities: {}, lwmAmounts: {} },
    })

    const handler = (await import('../../../server/api/vendor-invoices/previously-invoiced-for-order.get')).default
    const result = await handler(makeEvent())

    expect(mockPreviouslyInvoiced).toHaveBeenCalled()
    expect(result.data.lineQuantities).toEqual({})
  })
})
