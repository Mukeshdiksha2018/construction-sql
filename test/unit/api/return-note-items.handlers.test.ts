import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetItems = vi.fn()
const mockListItems = vi.fn()
const mockReplaceItems = vi.fn()

vi.mock('../../../server/utils/stockReturnNotes', () => ({
  getReturnNoteItems: (...a: unknown[]) => mockGetItems(...a),
  listReturnNoteItems: (...a: unknown[]) => mockListItems(...a),
  replaceReturnNoteItems: (...a: unknown[]) => mockReplaceItems(...a),
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

describe('return-note-items API handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    stubNuxtGlobals()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('index.get', () => {
    it('returns items for return note uuid', async () => {
      vi.stubGlobal('getQuery', () => ({ return_note_uuid: 'rtn-1' }))
      mockGetItems.mockResolvedValue([{ uuid: 'rni-1', return_quantity: 2 }])

      const handler = (await import('../../../server/api/return-note-items/index.get')).default
      const result = await handler(makeEvent())

      expect(mockGetItems).toHaveBeenCalledWith('rtn-1')
      expect(result.data).toHaveLength(1)
    })

    it('lists items by purchase_order_uuid filter', async () => {
      vi.stubGlobal('getQuery', () => ({
        purchase_order_uuid: 'po-1',
        corporation_uuid: 'corp-1',
      }))
      mockListItems.mockResolvedValue([{ uuid: 'rni-1' }])

      const handler = (await import('../../../server/api/return-note-items/index.get')).default
      const result = await handler(makeEvent())

      expect(mockListItems).toHaveBeenCalledWith({
        corporationUuid: 'corp-1',
        projectUuid: undefined,
        itemType: undefined,
        purchaseOrderUuid: 'po-1',
        changeOrderUuid: undefined,
      })
      expect(result.data).toHaveLength(1)
    })

    it('requires at least one filter', async () => {
      vi.stubGlobal('getQuery', () => ({}))
      const handler = (await import('../../../server/api/return-note-items/index.get')).default
      await expect(handler(makeEvent())).rejects.toMatchObject({ statusCode: 400 })
    })
  })

  describe('index.post', () => {
    it('replaces all line items', async () => {
      vi.stubGlobal('readBody', async () => ({
        return_note_uuid: 'rtn-1',
        corporation_uuid: 'corp-1',
        project_uuid: 'proj-1',
        items: [{ uuid: 'poi-1', return_quantity: 3 }],
      }))
      mockReplaceItems.mockResolvedValue([{ uuid: 'rni-1' }])

      const handler = (await import('../../../server/api/return-note-items/index.post')).default
      const result = await handler(makeEvent())

      expect(mockReplaceItems).toHaveBeenCalledWith(
        'rtn-1',
        'corp-1',
        'proj-1',
        expect.any(Array),
      )
      expect(result.data).toHaveLength(1)
    })

    it('requires return_note_uuid', async () => {
      vi.stubGlobal('readBody', async () => ({}))
      const handler = (await import('../../../server/api/return-note-items/index.post')).default
      await expect(handler(makeEvent())).rejects.toMatchObject({ statusCode: 400 })
    })
  })
})
