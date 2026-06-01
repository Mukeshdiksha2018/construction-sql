/**
 * Nitro API handlers for /api/stock-receipt-notes
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockList = vi.fn()
const mockGet = vi.fn()
const mockCreate = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockGenerateNextGrn = vi.fn()

vi.mock('../../../server/utils/stockReceiptNotes', () => ({
  listStockReceiptNotes: (...a: unknown[]) => mockList(...a),
  getStockReceiptNote: (...a: unknown[]) => mockGet(...a),
  createStockReceiptNote: (...a: unknown[]) => mockCreate(...a),
  updateStockReceiptNote: (...a: unknown[]) => mockUpdate(...a),
  deleteStockReceiptNote: (...a: unknown[]) => mockDelete(...a),
  generateNextGrnNumber: (...a: unknown[]) => mockGenerateNextGrn(...a),
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

describe('stock-receipt-notes API handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    stubNuxtGlobals()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('index.get', () => {
    it('returns next GRN number when next_grn_number flag is set', async () => {
      vi.stubGlobal('getQuery', () => ({
        corporation_uuid: 'corp-1',
        next_grn_number: 'true',
      }))
      mockGenerateNextGrn.mockResolvedValue('GRN-42')

      const handler = (await import('../../../server/api/stock-receipt-notes/index.get')).default
      const result = await handler(makeEvent())

      expect(mockGenerateNextGrn).toHaveBeenCalledWith('corp-1')
      expect(result).toEqual({ data: 'GRN-42' })
    })

    it('returns single note by uuid', async () => {
      vi.stubGlobal('getQuery', () => ({ uuid: 'rn-1' }))
      mockGet.mockResolvedValue({ uuid: 'rn-1', grn_number: 'GRN-1' })

      const handler = (await import('../../../server/api/stock-receipt-notes/index.get')).default
      const result = await handler(makeEvent())

      expect(mockGet).toHaveBeenCalledWith('rn-1')
      expect(result.data.grn_number).toBe('GRN-1')
    })

    it('returns 404 when note not found', async () => {
      vi.stubGlobal('getQuery', () => ({ uuid: 'missing' }))
      mockGet.mockResolvedValue(null)

      const handler = (await import('../../../server/api/stock-receipt-notes/index.get')).default
      await expect(handler(makeEvent())).rejects.toMatchObject({
        statusCode: 404,
        message: 'Receipt note not found',
      })
    })

    it('lists by corporation with filters', async () => {
      vi.stubGlobal('getQuery', () => ({
        corporation_uuid: 'corp-1',
        project_uuid: 'proj-1',
        vendor_uuid: 'v-1',
        change_order_uuid: 'co-1',
      }))
      mockList.mockResolvedValue([{ uuid: 'rn-1' }])

      const handler = (await import('../../../server/api/stock-receipt-notes/index.get')).default
      const result = await handler(makeEvent())

      expect(mockList).toHaveBeenCalledWith('corp-1', {
        projectUuid: 'proj-1',
        vendorUuid: 'v-1',
        purchaseOrderUuid: undefined,
        changeOrderUuid: 'co-1',
        entryDateFrom: undefined,
        entryDateTo: undefined,
      })
      expect(result.data).toHaveLength(1)
    })
  })

  describe('index.post', () => {
    it('creates receipt note with receipt_items in body', async () => {
      vi.stubGlobal('readBody', async () => ({
        corporation_uuid: 'corp-1',
        receipt_type: 'purchase_order',
        purchase_order_uuid: 'po-1',
        receipt_items: [{ uuid: 'line-1', received_quantity: 2 }],
      }))
      mockCreate.mockResolvedValue({ uuid: 'rn-new', grn_number: 'GRN-1' })

      const handler = (await import('../../../server/api/stock-receipt-notes/index.post')).default
      const result = await handler(makeEvent())

      expect(mockCreate).toHaveBeenCalled()
      expect(result.data.uuid).toBe('rn-new')
    })
  })

  describe('index.put', () => {
    it('updates by uuid in body', async () => {
      vi.stubGlobal('readBody', async () => ({
        uuid: 'rn-1',
        status: 'Received',
        save_as_open_po: true,
      }))
      mockUpdate.mockResolvedValue({ uuid: 'rn-1', status: 'Received' })

      const handler = (await import('../../../server/api/stock-receipt-notes/index.put')).default
      const result = await handler(makeEvent())

      expect(mockUpdate).toHaveBeenCalledWith('rn-1', expect.objectContaining({ status: 'Received' }))
      expect(result.data.status).toBe('Received')
    })
  })

  describe('index.delete', () => {
    it('soft-deletes by query uuid', async () => {
      vi.stubGlobal('getQuery', () => ({ uuid: 'rn-1' }))
      mockDelete.mockResolvedValue({ uuid: 'rn-1', is_active: false })

      const handler = (await import('../../../server/api/stock-receipt-notes/index.delete')).default
      const result = await handler(makeEvent())

      expect(mockDelete).toHaveBeenCalledWith('rn-1')
      expect(result.data.uuid).toBe('rn-1')
    })
  })
})
