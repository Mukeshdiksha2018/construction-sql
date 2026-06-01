/**
 * Nitro API handlers for /api/stock-return-notes
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockList = vi.fn()
const mockGet = vi.fn()
const mockCreate = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockGenerateNext = vi.fn()

vi.mock('../../../server/utils/stockReturnNotes', () => ({
  listStockReturnNotes: (...a: unknown[]) => mockList(...a),
  getStockReturnNote: (...a: unknown[]) => mockGet(...a),
  createStockReturnNote: (...a: unknown[]) => mockCreate(...a),
  updateStockReturnNote: (...a: unknown[]) => mockUpdate(...a),
  deleteStockReturnNote: (...a: unknown[]) => mockDelete(...a),
  generateNextReturnNumber: (...a: unknown[]) => mockGenerateNext(...a),
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

describe('stock-return-notes API handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    stubNuxtGlobals()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('index.get', () => {
    it('returns next return number when next_return_number flag is set', async () => {
      vi.stubGlobal('getQuery', () => ({
        corporation_uuid: 'corp-1',
        next_return_number: 'true',
      }))
      mockGenerateNext.mockResolvedValue('RTN-42')

      const handler = (await import('../../../server/api/stock-return-notes/index.get')).default
      const result = await handler(makeEvent())

      expect(mockGenerateNext).toHaveBeenCalledWith('corp-1')
      expect(result).toEqual({ data: { return_number: 'RTN-42' } })
    })

    it('returns single note by uuid', async () => {
      vi.stubGlobal('getQuery', () => ({ uuid: 'rtn-1' }))
      mockGet.mockResolvedValue({ uuid: 'rtn-1', return_number: 'RTN-1' })

      const handler = (await import('../../../server/api/stock-return-notes/index.get')).default
      const result = await handler(makeEvent())

      expect(mockGet).toHaveBeenCalledWith('rtn-1')
      expect(result.data.return_number).toBe('RTN-1')
    })

    it('lists by corporation with filters', async () => {
      vi.stubGlobal('getQuery', () => ({
        corporation_uuid: 'corp-1',
        change_order_uuid: 'co-1',
      }))
      mockList.mockResolvedValue([{ uuid: 'rtn-1' }])

      const handler = (await import('../../../server/api/stock-return-notes/index.get')).default
      const result = await handler(makeEvent())

      expect(mockList).toHaveBeenCalledWith('corp-1', {
        projectUuid: undefined,
        vendorUuid: undefined,
        purchaseOrderUuid: undefined,
        changeOrderUuid: 'co-1',
        entryDateFrom: undefined,
        entryDateTo: undefined,
      })
      expect(result.data).toHaveLength(1)
    })
  })

  describe('index.post', () => {
    it('creates return note with return_items in body', async () => {
      vi.stubGlobal('readBody', async () => ({
        corporation_uuid: 'corp-1',
        return_type: 'purchase_order',
        purchase_order_uuid: 'po-1',
        return_items: [{ uuid: 'line-1', return_quantity: 1 }],
      }))
      mockCreate.mockResolvedValue({ uuid: 'rtn-new', return_number: 'RTN-1' })

      const handler = (await import('../../../server/api/stock-return-notes/index.post')).default
      const result = await handler(makeEvent())

      expect(mockCreate).toHaveBeenCalled()
      expect(result.data.uuid).toBe('rtn-new')
    })
  })

  describe('index.put', () => {
    it('updates by uuid in body', async () => {
      vi.stubGlobal('readBody', async () => ({
        uuid: 'rtn-1',
        status: 'Returned',
        return_items: [{ uuid: 'line-1', return_quantity: 2 }],
      }))
      mockUpdate.mockResolvedValue({ uuid: 'rtn-1', status: 'Returned' })

      const handler = (await import('../../../server/api/stock-return-notes/index.put')).default
      const result = await handler(makeEvent())

      expect(mockUpdate).toHaveBeenCalledWith('rtn-1', expect.objectContaining({ status: 'Returned' }))
      expect(result.data.status).toBe('Returned')
    })
  })

  describe('index.delete', () => {
    it('soft-deletes by query uuid', async () => {
      vi.stubGlobal('getQuery', () => ({ uuid: 'rtn-1' }))
      mockDelete.mockResolvedValue({ uuid: 'rtn-1', is_active: false })

      const handler = (await import('../../../server/api/stock-return-notes/index.delete')).default
      const result = await handler(makeEvent())

      expect(mockDelete).toHaveBeenCalledWith('rtn-1')
      expect(result.data.uuid).toBe('rtn-1')
    })
  })
})
