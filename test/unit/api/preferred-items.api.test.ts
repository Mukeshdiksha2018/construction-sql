import { createError } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ── Mock h3 globals ──────────────────────────────────────────────────────────
const mockGetQuery = vi.fn()
const mockReadBody = vi.fn()
const mockGetRouterParam = vi.fn()

vi.stubGlobal('defineEventHandler', (handler: (event: unknown) => unknown) => handler)
vi.stubGlobal('createError', createError)
vi.stubGlobal('getQuery', mockGetQuery)
vi.stubGlobal('readBody', mockReadBody)
vi.stubGlobal('getRouterParam', mockGetRouterParam)

// ── Mock utils ───────────────────────────────────────────────────────────────
const mockListPreferredItems = vi.fn()
const mockGetPreferredItemsByProjectAndItemType = vi.fn()
const mockCreatePreferredItem = vi.fn()
const mockUpdatePreferredItem = vi.fn()
const mockDeletePreferredItem = vi.fn()
const mockGetPreferredItemByUuid = vi.fn()

vi.mock('../../../server/utils/preferredItems', () => ({
  listPreferredItems: (...a: unknown[]) => mockListPreferredItems(...a),
  getPreferredItemsByProjectAndItemType: (...a: unknown[]) => mockGetPreferredItemsByProjectAndItemType(...a),
  getPreferredItemByUuid: (...a: unknown[]) => mockGetPreferredItemByUuid(...a),
  createPreferredItem: (...a: unknown[]) => mockCreatePreferredItem(...a),
  updatePreferredItem: (...a: unknown[]) => mockUpdatePreferredItem(...a),
  deletePreferredItem: (...a: unknown[]) => mockDeletePreferredItem(...a),
}))

const makeItem = (overrides = {}) => ({
  id: 1,
  uuid: 'item-uuid-1',
  corporation_uuid: 'corp-1',
  project_uuid: 'proj-1',
  cost_code_configuration_uuid: null,
  item_type_uuid: 'it-1',
  category: 'construction',
  item_name: 'Steel Beam 10ft',
  item_sequence: 'SB-001',
  model_number: null,
  unit_price: 49.99,
  uom_uuid: 'uom-uuid-kg',
  location_uuid: null,
  preferred_vendor_uuid: null,
  initial_quantity: null,
  as_of_date: null,
  reorder_point: null,
  maximum_limit: null,
  description: null,
  status: 'Active',
  is_active: true,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  ...overrides,
})

describe('preferred-items API handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetQuery.mockReturnValue({ corporation_uuid: 'corp-1' })
    mockReadBody.mockResolvedValue({})
    mockGetRouterParam.mockReturnValue('item-uuid-1')
  })

  // ── GET /api/preferred-items ─────────────────────────────────────────────
  describe('GET /api/preferred-items', () => {
    it('returns all items for corporation', async () => {
      mockListPreferredItems.mockResolvedValue([makeItem()])
      const { default: handler } = await import('../../../server/api/preferred-items/index.get')

      const result = await handler({})
      expect(result).toEqual({ success: true, data: [makeItem()] })
      expect(mockListPreferredItems).toHaveBeenCalledWith('corp-1', undefined)
    })

    it('filters by project_uuid when provided', async () => {
      mockGetQuery.mockReturnValue({ corporation_uuid: 'corp-1', project_uuid: 'proj-1' })
      mockListPreferredItems.mockResolvedValue([makeItem()])
      const { default: handler } = await import('../../../server/api/preferred-items/index.get')

      await handler({})
      expect(mockListPreferredItems).toHaveBeenCalledWith('corp-1', 'proj-1')
    })

    it('uses getPreferredItemsByProjectAndItemType when both project and item_type are provided', async () => {
      mockGetQuery.mockReturnValue({
        corporation_uuid: 'corp-1',
        project_uuid: 'proj-1',
        item_type_uuid: 'it-1',
      })
      mockGetPreferredItemsByProjectAndItemType.mockResolvedValue([makeItem()])
      const { default: handler } = await import('../../../server/api/preferred-items/index.get')

      await handler({})
      expect(mockGetPreferredItemsByProjectAndItemType).toHaveBeenCalledWith(
        'corp-1',
        'proj-1',
        'it-1',
        undefined,
      )
      expect(mockListPreferredItems).not.toHaveBeenCalled()
    })

    it('passes cost_code_configuration_uuid to getPreferredItemsByProjectAndItemType when provided', async () => {
      mockGetQuery.mockReturnValue({
        corporation_uuid: 'corp-1',
        project_uuid: 'proj-1',
        item_type_uuid: 'it-1',
        cost_code_configuration_uuid: 'CFG-UUID-1',
      })
      mockGetPreferredItemsByProjectAndItemType.mockResolvedValue([makeItem()])
      const { default: handler } = await import('../../../server/api/preferred-items/index.get')

      await handler({})
      expect(mockGetPreferredItemsByProjectAndItemType).toHaveBeenCalledWith(
        'corp-1',
        'proj-1',
        'it-1',
        'CFG-UUID-1',
      )
    })

    it('throws 400 when corporation_uuid is missing', async () => {
      mockGetQuery.mockReturnValue({})
      const { default: handler } = await import('../../../server/api/preferred-items/index.get')

      await expect(handler({})).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'corporation_uuid is required',
      })
    })

    it('propagates errors from list function', async () => {
      mockListPreferredItems.mockRejectedValue(
        createError({ statusCode: 500, statusMessage: 'DB error' }),
      )
      const { default: handler } = await import('../../../server/api/preferred-items/index.get')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 500 })
    })
  })

  // ── POST /api/preferred-items ────────────────────────────────────────────
  describe('POST /api/preferred-items', () => {
    it('creates an item with valid body', async () => {
      mockReadBody.mockResolvedValue({
        corporation_uuid: 'corp-1',
        project_uuid: 'proj-1',
        item_type_uuid: 'it-1',
        item_name: 'Steel Beam 10ft',
        unit_price: 49.99,
        uom_uuid: 'uom-uuid-kg',
        status: 'Active',
      })
      mockCreatePreferredItem.mockResolvedValue(makeItem())
      const { default: handler } = await import('../../../server/api/preferred-items/index.post')

      const result = await handler({})
      expect(result).toMatchObject({ success: true, message: 'Item created successfully' })
      expect(mockCreatePreferredItem).toHaveBeenCalledWith(
        expect.objectContaining({
          corporation_uuid: 'corp-1',
          item_name: 'Steel Beam 10ft',
          unit_price: 49.99,
        }),
      )
    })

    it('throws 400 when corporation_uuid is missing', async () => {
      mockReadBody.mockResolvedValue({ item_name: 'Steel Beam' })
      const { default: handler } = await import('../../../server/api/preferred-items/index.post')

      await expect(handler({})).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'corporation_uuid is required',
      })
    })

    it('throws 400 when item_name is missing', async () => {
      mockReadBody.mockResolvedValue({ corporation_uuid: 'corp-1' })
      const { default: handler } = await import('../../../server/api/preferred-items/index.post')

      await expect(handler({})).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'item_name is required',
      })
    })

    it('passes optional fields correctly', async () => {
      mockReadBody.mockResolvedValue({
        corporation_uuid: 'corp-1',
        item_name: 'Bolt',
        item_sequence: 'B-001',
        model_number: 'M12-001',
        unit_price: 0.5,
        uom_uuid: 'uom-uuid-box',
        initial_quantity: 100,
        reorder_point: 20,
        maximum_limit: 500,
        status: 'Inactive',
        is_active: false,
      })
      mockCreatePreferredItem.mockResolvedValue(makeItem())
      const { default: handler } = await import('../../../server/api/preferred-items/index.post')

      await handler({})
      expect(mockCreatePreferredItem).toHaveBeenCalledWith(
        expect.objectContaining({
          item_sequence: 'B-001',
          model_number: 'M12-001',
          unit_price: 0.5,
          initial_quantity: 100,
          reorder_point: 20,
          maximum_limit: 500,
          status: 'Inactive',
          is_active: false,
        }),
      )
    })

    it('defaults status to Active when not provided', async () => {
      mockReadBody.mockResolvedValue({ corporation_uuid: 'corp-1', item_name: 'Bolt' })
      mockCreatePreferredItem.mockResolvedValue(makeItem())
      const { default: handler } = await import('../../../server/api/preferred-items/index.post')

      await handler({})
      expect(mockCreatePreferredItem).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'Active' }),
      )
    })
  })

  // ── DELETE /api/preferred-items/:uuid ────────────────────────────────────
  describe('DELETE /api/preferred-items/:uuid', () => {
    it('deletes an item', async () => {
      mockDeletePreferredItem.mockResolvedValue(undefined)
      const { default: handler } = await import('../../../server/api/preferred-items/[uuid].delete')

      const result = await handler({})
      expect(result).toEqual({ success: true, message: 'Item deleted successfully' })
      expect(mockDeletePreferredItem).toHaveBeenCalledWith('item-uuid-1')
    })

    it('throws 400 when uuid is missing', async () => {
      mockGetRouterParam.mockReturnValue('')
      const { default: handler } = await import('../../../server/api/preferred-items/[uuid].delete')

      await expect(handler({})).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'UUID is required',
      })
    })

    it('propagates 404 when item not found', async () => {
      mockDeletePreferredItem.mockRejectedValue(
        createError({ statusCode: 404, statusMessage: 'Item not found' }),
      )
      const { default: handler } = await import('../../../server/api/preferred-items/[uuid].delete')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 404 })
    })
  })

  // ── POST /api/preferred-items/bulk ───────────────────────────────────────
  describe('POST /api/preferred-items/bulk', () => {
    const bulkBase = {
      corporation_uuid: 'corp-1',
      project_uuid: 'proj-1',
      item_type_uuid: 'it-1',
    }

    it('creates new rows and returns saved items', async () => {
      const newRow = { item_name: 'Steel Beam', item_sequence: 'SB-001', status: 'Active' }
      mockReadBody.mockResolvedValue({ ...bulkBase, rows: [newRow] })
      mockGetPreferredItemsByProjectAndItemType.mockResolvedValue([])
      mockCreatePreferredItem.mockResolvedValue(makeItem())
      const { default: handler } = await import('../../../server/api/preferred-items/bulk.post')

      const result = await handler({})
      expect(result).toMatchObject({ success: true, message: 'Items saved successfully' })
      expect(mockCreatePreferredItem).toHaveBeenCalledTimes(1)
    })

    it('updates existing rows when uuid matches', async () => {
      const existing = makeItem({ uuid: 'item-uuid-1' })
      const incomingRow = { uuid: 'item-uuid-1', item_name: 'Updated Beam', status: 'Active' }
      mockReadBody.mockResolvedValue({ ...bulkBase, rows: [incomingRow] })
      mockGetPreferredItemsByProjectAndItemType.mockResolvedValue([existing])
      mockUpdatePreferredItem.mockResolvedValue({ ...existing, item_name: 'Updated Beam' })
      const { default: handler } = await import('../../../server/api/preferred-items/bulk.post')

      const result = await handler({})
      expect(result).toMatchObject({ success: true })
      expect(mockUpdatePreferredItem).toHaveBeenCalledWith('item-uuid-1', expect.any(Object))
      expect(mockCreatePreferredItem).not.toHaveBeenCalled()
    })

    it('deletes rows not in the incoming list', async () => {
      const existing = makeItem({ uuid: 'item-uuid-1' })
      mockReadBody.mockResolvedValue({ ...bulkBase, rows: [] })
      mockGetPreferredItemsByProjectAndItemType.mockResolvedValue([existing])
      mockDeletePreferredItem.mockResolvedValue(undefined)
      const { default: handler } = await import('../../../server/api/preferred-items/bulk.post')

      await handler({})
      expect(mockDeletePreferredItem).toHaveBeenCalledWith('item-uuid-1')
    })

    it('handles mix of create, update, and delete in one call', async () => {
      const existingToKeep = makeItem({ uuid: 'keep-uuid' })
      const existingToDelete = makeItem({ uuid: 'delete-uuid', item_name: 'Old Item' })
      mockReadBody.mockResolvedValue({
        ...bulkBase,
        rows: [
          { uuid: 'keep-uuid', item_name: 'Kept Item', status: 'Active' },
          { item_name: 'Brand New Item', status: 'Active' },
        ],
      })
      mockGetPreferredItemsByProjectAndItemType.mockResolvedValue([existingToKeep, existingToDelete])
      mockUpdatePreferredItem.mockResolvedValue({ ...existingToKeep, item_name: 'Kept Item' })
      mockCreatePreferredItem.mockResolvedValue(makeItem({ uuid: 'new-uuid', item_name: 'Brand New Item' }))
      mockDeletePreferredItem.mockResolvedValue(undefined)
      const { default: handler } = await import('../../../server/api/preferred-items/bulk.post')

      const result = await handler({}) as { success: boolean; data: unknown[] }
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(mockDeletePreferredItem).toHaveBeenCalledWith('delete-uuid')
      expect(mockUpdatePreferredItem).toHaveBeenCalledTimes(1)
      expect(mockCreatePreferredItem).toHaveBeenCalledTimes(1)
    })

    it('throws 400 when corporation_uuid is missing', async () => {
      mockReadBody.mockResolvedValue({ project_uuid: 'proj-1', item_type_uuid: 'it-1', rows: [] })
      const { default: handler } = await import('../../../server/api/preferred-items/bulk.post')

      await expect(handler({})).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'corporation_uuid is required',
      })
    })

    it('throws 400 when project_uuid is missing', async () => {
      mockReadBody.mockResolvedValue({ corporation_uuid: 'corp-1', item_type_uuid: 'it-1', rows: [] })
      const { default: handler } = await import('../../../server/api/preferred-items/bulk.post')

      await expect(handler({})).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'project_uuid is required',
      })
    })

    it('throws 400 when item_type_uuid is missing', async () => {
      mockReadBody.mockResolvedValue({ corporation_uuid: 'corp-1', project_uuid: 'proj-1', rows: [] })
      const { default: handler } = await import('../../../server/api/preferred-items/bulk.post')

      await expect(handler({})).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'item_type_uuid is required',
      })
    })

    it('throws 400 when rows is not an array', async () => {
      mockReadBody.mockResolvedValue({ ...bulkBase, rows: 'not-an-array' })
      const { default: handler } = await import('../../../server/api/preferred-items/bulk.post')

      await expect(handler({})).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'rows must be an array',
      })
    })

    it('succeeds with empty rows array (deletes all existing)', async () => {
      const existing = makeItem()
      mockReadBody.mockResolvedValue({ ...bulkBase, rows: [] })
      mockGetPreferredItemsByProjectAndItemType.mockResolvedValue([existing])
      mockDeletePreferredItem.mockResolvedValue(undefined)
      const { default: handler } = await import('../../../server/api/preferred-items/bulk.post')

      const result = await handler({}) as { success: boolean; data: unknown[] }
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(0)
      expect(mockDeletePreferredItem).toHaveBeenCalledTimes(1)
    })
  })
})
