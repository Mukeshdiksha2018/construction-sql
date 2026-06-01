/**
 * Nitro API handlers for /api/change-orders (thin wrappers over server/utils/changeOrders.ts).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetChangeOrder = vi.fn()
const mockListChangeOrders = vi.fn()
const mockCreateChangeOrder = vi.fn()
const mockUpdateChangeOrder = vi.fn()
const mockDeleteChangeOrder = vi.fn()
const mockGenerateNextCoNumber = vi.fn()
const mockGetChangeOrderInvoiceSummary = vi.fn()
const mockUploadAttachments = vi.fn()
const mockRemoveAttachment = vi.fn()
const mockGetChangeOrderItems = vi.fn()
const mockGetLaborChangeOrderItems = vi.fn()

vi.mock('../../../server/utils/changeOrders', () => ({
  getChangeOrder: (...a: unknown[]) => mockGetChangeOrder(...a),
  listChangeOrders: (...a: unknown[]) => mockListChangeOrders(...a),
  createChangeOrder: (...a: unknown[]) => mockCreateChangeOrder(...a),
  updateChangeOrder: (...a: unknown[]) => mockUpdateChangeOrder(...a),
  deleteChangeOrder: (...a: unknown[]) => mockDeleteChangeOrder(...a),
  generateNextCoNumber: (...a: unknown[]) => mockGenerateNextCoNumber(...a),
  uploadChangeOrderAttachments: (...a: unknown[]) => mockUploadAttachments(...a),
  removeChangeOrderAttachment: (...a: unknown[]) => mockRemoveAttachment(...a),
  getChangeOrderItems: (...a: unknown[]) => mockGetChangeOrderItems(...a),
  getLaborChangeOrderItems: (...a: unknown[]) => mockGetLaborChangeOrderItems(...a),
}))

vi.mock('../../../server/utils/vendorInvoiceSummary', () => ({
  getChangeOrderInvoiceSummary: (...a: unknown[]) => mockGetChangeOrderInvoiceSummary(...a),
}))

const makeEvent = () =>
  ({
    node: { req: { method: 'GET' } },
  }) as any

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

describe('change-orders API handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    stubNuxtGlobals()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('index.get', () => {
    it('returns single CO by uuid', async () => {
      vi.stubGlobal('getQuery', () => ({ uuid: 'co-1' }))
      mockGetChangeOrder.mockResolvedValue({ uuid: 'co-1', co_number: 'CO-1' })

      const handler = (await import('../../../server/api/change-orders/index.get')).default
      const result = await handler(makeEvent())

      expect(mockGetChangeOrder).toHaveBeenCalledWith('co-1')
      expect(result).toEqual({ data: { uuid: 'co-1', co_number: 'CO-1' } })
    })

    it('returns 404 when CO not found', async () => {
      vi.stubGlobal('getQuery', () => ({ uuid: 'missing' }))
      mockGetChangeOrder.mockResolvedValue(null)

      const handler = (await import('../../../server/api/change-orders/index.get')).default
      await expect(handler(makeEvent())).rejects.toMatchObject({
        statusCode: 404,
        message: 'Change order not found',
      })
    })

    it('lists by corporation_uuid', async () => {
      vi.stubGlobal('getQuery', () => ({ corporation_uuid: 'corp-1' }))
      mockListChangeOrders.mockResolvedValue({
        data: [],
        pagination: { page: 1, pageSize: 100, totalRecords: 0, totalPages: 0, hasMore: false },
      })

      const handler = (await import('../../../server/api/change-orders/index.get')).default
      await handler(makeEvent())

      expect(mockListChangeOrders).toHaveBeenCalledWith('corp-1', expect.any(Object))
    })

    it('returns next CO number when next_co_number flag set', async () => {
      vi.stubGlobal('getQuery', () => ({
        corporation_uuid: 'corp-1',
        next_co_number: 'true',
        project_id: 'PRJ',
      }))
      mockGenerateNextCoNumber.mockResolvedValue('PRJ-CO-5')

      const handler = (await import('../../../server/api/change-orders/index.get')).default
      const result = await handler(makeEvent())

      expect(mockGenerateNextCoNumber).toHaveBeenCalledWith('corp-1', 'PRJ')
      expect(result).toEqual({ data: 'PRJ-CO-5' })
    })
  })

  describe('index.post / put / delete', () => {
    it('POST creates change order', async () => {
      vi.stubGlobal('readBody', async () => ({ corporation_uuid: 'corp-1', co_type: 'MATERIAL' }))
      mockCreateChangeOrder.mockResolvedValue({ uuid: 'co-new' })

      const handler = (await import('../../../server/api/change-orders/index.post')).default
      const result = await handler(makeEvent())

      expect(mockCreateChangeOrder).toHaveBeenCalled()
      expect(result.data.uuid).toBe('co-new')
    })

    it('PUT updates by uuid in body', async () => {
      vi.stubGlobal('readBody', async () => ({ uuid: 'co-1', status: 'Ready' }))
      mockUpdateChangeOrder.mockResolvedValue({ uuid: 'co-1', status: 'Ready' })

      const handler = (await import('../../../server/api/change-orders/index.put')).default
      const result = await handler(makeEvent())

      expect(mockUpdateChangeOrder).toHaveBeenCalledWith('co-1', expect.objectContaining({ status: 'Ready' }))
      expect(result.data.status).toBe('Ready')
    })

    it('DELETE soft-deletes by query uuid', async () => {
      vi.stubGlobal('getQuery', () => ({ uuid: 'co-1' }))
      mockDeleteChangeOrder.mockResolvedValue({ uuid: 'co-1', is_active: false })

      const handler = (await import('../../../server/api/change-orders/index.delete')).default
      const result = await handler(makeEvent())

      expect(mockDeleteChangeOrder).toHaveBeenCalledWith('co-1')
      expect(result.data.uuid).toBe('co-1')
    })
  })

  describe('invoice-summary.get', () => {
    it('wraps summary in data envelope', async () => {
      vi.stubGlobal('getQuery', () => ({ change_order_uuid: 'co-1' }))
      mockGetChangeOrderInvoiceSummary.mockResolvedValue({
        change_order_uuid: 'co-1',
        balance_to_be_invoiced: 100,
      })

      const handler = (await import('../../../server/api/change-orders/invoice-summary.get')).default
      const result = await handler(makeEvent())

      expect(result.data.balance_to_be_invoiced).toBe(100)
    })
  })

  describe('change-order-items.get', () => {
    it('returns material items for change order', async () => {
      vi.stubGlobal('getQuery', () => ({ change_order_uuid: 'co-1' }))
      mockGetChangeOrderItems.mockResolvedValue([{ uuid: 'item-1' }])

      const handler = (await import('../../../server/api/change-order-items/index.get')).default
      const result = await handler(makeEvent())

      expect(result.data).toHaveLength(1)
    })
  })

  describe('labor-change-order-items.get', () => {
    it('returns labor items for change order', async () => {
      vi.stubGlobal('getQuery', () => ({ change_order_uuid: 'co-1' }))
      mockGetLaborChangeOrderItems.mockResolvedValue([{ uuid: 'labor-1', co_amount: 50 }])

      const handler = (await import('../../../server/api/labor-change-order-items/index.get')).default
      const result = await handler(makeEvent())

      expect(result.data[0].co_amount).toBe(50)
    })
  })

  describe('[uuid].get', () => {
    it('returns single change order by path param', async () => {
      vi.stubGlobal('getRouterParam', () => 'co-1')
      mockGetChangeOrder.mockResolvedValue({ uuid: 'co-1', co_number: 'CO-1' })

      const handler = (await import('../../../server/api/change-orders/[uuid].get')).default
      const result = await handler(makeEvent())

      expect(mockGetChangeOrder).toHaveBeenCalledWith('co-1')
      expect(result.data.co_number).toBe('CO-1')
    })
  })

  describe('documents upload/remove', () => {
    it('POST upload delegates to uploadChangeOrderAttachments', async () => {
      vi.stubGlobal('readBody', async () => ({
        change_order_uuid: 'co-1',
        files: [{ name: 'a.pdf', fileData: 'data:application/pdf;base64,AA==' }],
      }))
      mockUploadAttachments.mockResolvedValue({ attachments: [{ uuid: 'att-1' }] })

      const handler = (await import('../../../server/api/change-orders/documents/upload.post')).default
      const result = await handler(makeEvent())

      expect(mockUploadAttachments).toHaveBeenCalledWith('co-1', expect.any(Array))
      expect(result.attachments).toHaveLength(1)
    })

    it('POST remove delegates to removeChangeOrderAttachment', async () => {
      vi.stubGlobal('readBody', async () => ({
        change_order_uuid: 'co-1',
        attachment_uuid: 'att-1',
      }))
      mockRemoveAttachment.mockResolvedValue({ attachments: [] })

      const handler = (await import('../../../server/api/change-orders/documents/remove.post')).default
      await handler(makeEvent())

      expect(mockRemoveAttachment).toHaveBeenCalledWith('co-1', 'att-1')
    })
  })
})
