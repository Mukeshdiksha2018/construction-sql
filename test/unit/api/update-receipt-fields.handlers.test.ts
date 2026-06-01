import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockPoUpdate = vi.fn()
const mockCoUpdate = vi.fn()

vi.mock('../../../server/utils/receiptNoteReceiptLinePersistence', () => ({
  applyPurchaseOrderReceiptFieldsUpdate: (...a: unknown[]) => mockPoUpdate(...a),
  applyChangeOrderReceiptFieldsUpdate: (...a: unknown[]) => mockCoUpdate(...a),
}))

const makeEvent = () => ({ node: { req: { method: 'POST' } } }) as any

function stubNuxtGlobals() {
  vi.stubGlobal('defineEventHandler', (handler: any) => handler)
  vi.stubGlobal(
    'createError',
    (opts: { statusCode: number, statusMessage: string }) => {
      const err = new Error(opts.statusMessage) as Error & { statusCode: number }
      err.statusCode = opts.statusCode
      return err
    },
  )
}

describe('update-receipt-fields API handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    stubNuxtGlobals()
    mockPoUpdate.mockResolvedValue({ success: true, updated: 1, receipt_note_items_created: 1 })
    mockCoUpdate.mockResolvedValue({ success: true, updated: 1, receipt_note_items_created: 1 })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('POST purchase-order-items/update-receipt-fields delegates to PO persistence', async () => {
    vi.stubGlobal('readBody', async () => ({
      receipt_note_uuid: 'rn-1',
      corporation_uuid: 'corp-1',
      items: [{ uuid: 'poi-1' }],
    }))

    const handler = (await import(
      '../../../server/api/purchase-order-items/update-receipt-fields.post'
    )).default
    const result = await handler(makeEvent())

    expect(mockPoUpdate).toHaveBeenCalled()
    expect(result.success).toBe(true)
  })

  it('POST change-order-items/update-receipt-fields delegates to CO persistence', async () => {
    vi.stubGlobal('readBody', async () => ({
      receipt_note_uuid: 'rn-co',
      corporation_uuid: 'corp-1',
      items: [{ uuid: 'coi-1' }],
    }))

    const handler = (await import(
      '../../../server/api/change-order-items/update-receipt-fields.post'
    )).default
    const result = await handler(makeEvent())

    expect(mockCoUpdate).toHaveBeenCalled()
    expect(result.success).toBe(true)
  })

  it('rejects missing body on PO route', async () => {
    vi.stubGlobal('readBody', async () => null)
    const handler = (await import(
      '../../../server/api/purchase-order-items/update-receipt-fields.post'
    )).default
    await expect(handler(makeEvent())).rejects.toMatchObject({ statusCode: 400 })
  })
})
