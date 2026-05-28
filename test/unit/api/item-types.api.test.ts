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
const mockListItemTypes = vi.fn()
const mockGetItemTypeByUuid = vi.fn()
const mockCreateItemType = vi.fn()
const mockUpdateItemType = vi.fn()
const mockDeleteItemType = vi.fn()

vi.mock('../../../server/utils/itemTypes', () => ({
  listItemTypes: (...a: unknown[]) => mockListItemTypes(...a),
  getItemTypeByUuid: (...a: unknown[]) => mockGetItemTypeByUuid(...a),
  createItemType: (...a: unknown[]) => mockCreateItemType(...a),
  updateItemType: (...a: unknown[]) => mockUpdateItemType(...a),
  deleteItemType: (...a: unknown[]) => mockDeleteItemType(...a),
}))

const makeItemType = (overrides = {}) => ({
  id: 1,
  uuid: 'it-uuid-1',
  corporation_uuid: 'corp-1',
  category: 'construction',
  spec_type: 'Structural',
  item_division_uuid: null,
  item_type: 'Steel Beam',
  description: null,
  is_active: true,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  ...overrides,
})

describe('item-types API handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetQuery.mockReturnValue({})
    mockReadBody.mockResolvedValue({})
    mockGetRouterParam.mockReturnValue('it-uuid-1')
  })

  // ── GET /api/item-types ──────────────────────────────────────────────────
  describe('GET /api/item-types', () => {
    it('returns all item types when no corporation_uuid given', async () => {
      mockListItemTypes.mockResolvedValue([makeItemType()])
      const { default: handler } = await import('../../../server/api/item-types/index.get')

      const result = await handler({})
      expect(result).toEqual({ success: true, data: [makeItemType()] })
      expect(mockListItemTypes).toHaveBeenCalledWith(undefined)
    })

    it('passes corporation_uuid to listItemTypes', async () => {
      mockGetQuery.mockReturnValue({ corporation_uuid: 'corp-1' })
      mockListItemTypes.mockResolvedValue([makeItemType()])
      const { default: handler } = await import('../../../server/api/item-types/index.get')

      await handler({})
      expect(mockListItemTypes).toHaveBeenCalledWith('corp-1')
    })

    it('propagates errors from listItemTypes', async () => {
      mockListItemTypes.mockRejectedValue(createError({ statusCode: 500, statusMessage: 'DB error' }))
      const { default: handler } = await import('../../../server/api/item-types/index.get')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 500 })
    })
  })

  // ── POST /api/item-types ─────────────────────────────────────────────────
  describe('POST /api/item-types', () => {
    it('creates an item type with valid body', async () => {
      mockReadBody.mockResolvedValue({
        corporation_uuid: 'corp-1',
        category: 'construction',
        spec_type: 'Structural',
        item_type: 'Steel Beam',
      })
      mockCreateItemType.mockResolvedValue(makeItemType())
      const { default: handler } = await import('../../../server/api/item-types/index.post')

      const result = await handler({})
      expect(result).toMatchObject({ success: true, message: 'Item type created successfully' })
      expect(mockCreateItemType).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'construction',
          spec_type: 'Structural',
          item_type: 'Steel Beam',
        }),
      )
    })

    it('throws 400 when category is missing', async () => {
      mockReadBody.mockResolvedValue({ spec_type: 'Structural', item_type: 'Steel Beam' })
      const { default: handler } = await import('../../../server/api/item-types/index.post')

      await expect(handler({})).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Category is required',
      })
    })

    it('throws 400 when spec_type is missing', async () => {
      mockReadBody.mockResolvedValue({ category: 'construction', item_type: 'Steel Beam' })
      const { default: handler } = await import('../../../server/api/item-types/index.post')

      await expect(handler({})).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Spec Type is required',
      })
    })

    it('throws 400 when item_type is missing', async () => {
      mockReadBody.mockResolvedValue({ category: 'construction', spec_type: 'Structural' })
      const { default: handler } = await import('../../../server/api/item-types/index.post')

      await expect(handler({})).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Item Type is required',
      })
    })

    it('passes corporation_uuid when provided', async () => {
      mockReadBody.mockResolvedValue({
        corporation_uuid: 'corp-1',
        category: 'procurement',
        spec_type: 'Plumbing',
        item_type: 'PVC Pipe',
      })
      mockCreateItemType.mockResolvedValue(makeItemType({ category: 'procurement' }))
      const { default: handler } = await import('../../../server/api/item-types/index.post')

      await handler({})
      expect(mockCreateItemType).toHaveBeenCalledWith(
        expect.objectContaining({ corporation_uuid: 'corp-1' }),
      )
    })

    it('defaults is_active to true when not provided', async () => {
      mockReadBody.mockResolvedValue({
        category: 'construction',
        spec_type: 'Structural',
        item_type: 'Bolt',
      })
      mockCreateItemType.mockResolvedValue(makeItemType())
      const { default: handler } = await import('../../../server/api/item-types/index.post')

      await handler({})
      expect(mockCreateItemType).toHaveBeenCalledWith(
        expect.objectContaining({ is_active: true }),
      )
    })

    it('propagates 409 from util for duplicate item type', async () => {
      mockReadBody.mockResolvedValue({ category: 'construction', spec_type: 'S', item_type: 'Beam' })
      mockCreateItemType.mockRejectedValue(
        createError({ statusCode: 409, statusMessage: 'Item type with this name already exists for this category, spec type, and division' }),
      )
      const { default: handler } = await import('../../../server/api/item-types/index.post')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 409 })
    })
  })

  // ── GET /api/item-types/:uuid ────────────────────────────────────────────
  describe('GET /api/item-types/:uuid', () => {
    it('returns a single item type by uuid', async () => {
      mockGetItemTypeByUuid.mockResolvedValue(makeItemType())
      const { default: handler } = await import('../../../server/api/item-types/[uuid].get')

      const result = await handler({})
      expect(result).toEqual({ success: true, data: makeItemType() })
      expect(mockGetItemTypeByUuid).toHaveBeenCalledWith('it-uuid-1')
    })

    it('throws 400 when uuid is missing', async () => {
      mockGetRouterParam.mockReturnValue('')
      const { default: handler } = await import('../../../server/api/item-types/[uuid].get')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 400 })
    })

    it('throws 404 when item type not found', async () => {
      mockGetItemTypeByUuid.mockResolvedValue(null)
      const { default: handler } = await import('../../../server/api/item-types/[uuid].get')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 404 })
    })
  })

  // ── PUT /api/item-types/:uuid ────────────────────────────────────────────
  describe('PUT /api/item-types/:uuid', () => {
    it('updates an item type', async () => {
      mockReadBody.mockResolvedValue({ item_type: 'Updated Beam' })
      mockUpdateItemType.mockResolvedValue(makeItemType({ item_type: 'Updated Beam' }))
      const { default: handler } = await import('../../../server/api/item-types/[uuid].put')

      const result = await handler({})
      expect(result).toMatchObject({ success: true, message: 'Item type updated successfully' })
      expect(mockUpdateItemType).toHaveBeenCalledWith(
        'it-uuid-1',
        expect.objectContaining({ item_type: 'Updated Beam' }),
      )
    })

    it('throws 400 when uuid is missing', async () => {
      mockGetRouterParam.mockReturnValue('')
      const { default: handler } = await import('../../../server/api/item-types/[uuid].put')

      await expect(handler({})).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'UUID is required',
      })
    })

    it('propagates 404 when item type not found', async () => {
      mockUpdateItemType.mockRejectedValue(
        createError({ statusCode: 404, statusMessage: 'Item type not found' }),
      )
      const { default: handler } = await import('../../../server/api/item-types/[uuid].put')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 404 })
    })

    it('propagates 409 for duplicate on update', async () => {
      mockUpdateItemType.mockRejectedValue(
        createError({ statusCode: 409, statusMessage: 'Item type with this name already exists for this category, spec type, and division' }),
      )
      const { default: handler } = await import('../../../server/api/item-types/[uuid].put')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 409 })
    })
  })

  // ── DELETE /api/item-types/:uuid ─────────────────────────────────────────
  describe('DELETE /api/item-types/:uuid', () => {
    it('deletes an item type', async () => {
      mockDeleteItemType.mockResolvedValue(undefined)
      const { default: handler } = await import('../../../server/api/item-types/[uuid].delete')

      const result = await handler({})
      expect(result).toEqual({ success: true, message: 'Item type deleted successfully' })
      expect(mockDeleteItemType).toHaveBeenCalledWith('it-uuid-1')
    })

    it('throws 400 when uuid is missing', async () => {
      mockGetRouterParam.mockReturnValue('')
      const { default: handler } = await import('../../../server/api/item-types/[uuid].delete')

      await expect(handler({})).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'UUID is required',
      })
    })

    it('propagates 404 when item type not found', async () => {
      mockDeleteItemType.mockRejectedValue(
        createError({ statusCode: 404, statusMessage: 'Item type not found' }),
      )
      const { default: handler } = await import('../../../server/api/item-types/[uuid].delete')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 404 })
    })
  })
})
