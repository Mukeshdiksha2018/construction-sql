import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetItems = vi.fn()
const mockReplaceItems = vi.fn()

vi.mock('../../../server/utils/stockReceiptNotes', () => ({
  getReceiptNoteItems: (...a: unknown[]) => mockGetItems(...a),
  replaceReceiptNoteItems: (...a: unknown[]) => mockReplaceItems(...a),
}))

const makeEvent = () => ({ node: { req: { method: 'GET' } } }) as any

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

describe('receipt-note-items API handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    stubNuxtGlobals()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('GET returns items for receipt note', async () => {
    vi.stubGlobal('getQuery', () => ({ receipt_note_uuid: 'rn-1' }))
    mockGetItems.mockResolvedValue([{ uuid: 'rni-1', received_quantity: 2 }])

    const handler = (await import('../../../server/api/receipt-note-items/index.get')).default
    const result = await handler(makeEvent())

    expect(mockGetItems).toHaveBeenCalledWith('rn-1')
    expect(result.data).toHaveLength(1)
  })

  it('GET requires receipt_note_uuid', async () => {
    vi.stubGlobal('getQuery', () => ({}))
    const handler = (await import('../../../server/api/receipt-note-items/index.get')).default
    await expect(handler(makeEvent())).rejects.toMatchObject({ statusCode: 400 })
  })

  it('POST replaces all line items', async () => {
    vi.stubGlobal('readBody', async () => ({
      receipt_note_uuid: 'rn-1',
      corporation_uuid: 'corp-1',
      project_uuid: 'proj-1',
      items: [{ item_uuid: 'poi-1', received_quantity: 3 }],
    }))
    mockReplaceItems.mockResolvedValue([{ uuid: 'rni-1' }])

    const handler = (await import('../../../server/api/receipt-note-items/index.post')).default
    const result = await handler(makeEvent())

    expect(mockReplaceItems).toHaveBeenCalledWith(
      'rn-1',
      'corp-1',
      'proj-1',
      expect.any(Array),
    )
    expect(result.data).toHaveLength(1)
  })
})
