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
const mockListCostCodeDivisions = vi.fn()
const mockCreateCostCodeDivision = vi.fn()
const mockUpdateCostCodeDivision = vi.fn()
const mockDeleteCostCodeDivision = vi.fn()

vi.mock('../../../server/utils/costCodeDivisions', () => ({
  listCostCodeDivisions: (...a: unknown[]) => mockListCostCodeDivisions(...a),
  createCostCodeDivision: (...a: unknown[]) => mockCreateCostCodeDivision(...a),
  updateCostCodeDivision: (...a: unknown[]) => mockUpdateCostCodeDivision(...a),
  deleteCostCodeDivision: (...a: unknown[]) => mockDeleteCostCodeDivision(...a),
}))

const makeDivision = (overrides = {}) => ({
  id: 1,
  uuid: 'div-uuid-1',
  corporation_uuid: 'corp-1',
  division_number: '01',
  division_name: 'Site Work',
  division_order: 1,
  description: null,
  is_active: true,
  exclude_in_estimates_and_reports: false,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  ...overrides,
})

describe('cost-code-divisions API handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetQuery.mockReturnValue({ corporation_uuid: 'corp-1' })
    mockReadBody.mockResolvedValue({})
    mockGetRouterParam.mockReturnValue('div-uuid-1')
  })

  // ── GET /api/cost-code-divisions ─────────────────────────────────────────
  describe('GET /api/cost-code-divisions', () => {
    it('returns list of divisions', async () => {
      mockListCostCodeDivisions.mockResolvedValue([makeDivision()])
      const { default: handler } = await import('../../../server/api/cost-code-divisions/index.get')

      const result = await handler({})
      expect(result).toEqual({ success: true, data: [makeDivision()] })
      expect(mockListCostCodeDivisions).toHaveBeenCalledWith('corp-1')
    })

    it('throws 400 when corporation_uuid is missing', async () => {
      mockGetQuery.mockReturnValue({})
      const { default: handler } = await import('../../../server/api/cost-code-divisions/index.get')

      await expect(handler({})).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'corporation_uuid is required',
      })
    })

    it('throws 400 when corporation_uuid is empty string', async () => {
      mockGetQuery.mockReturnValue({ corporation_uuid: '' })
      const { default: handler } = await import('../../../server/api/cost-code-divisions/index.get')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 400 })
    })

    it('propagates errors from listCostCodeDivisions', async () => {
      mockListCostCodeDivisions.mockRejectedValue(
        createError({ statusCode: 500, statusMessage: 'DB error' }),
      )
      const { default: handler } = await import('../../../server/api/cost-code-divisions/index.get')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 500, statusMessage: 'DB error' })
    })
  })

  // ── POST /api/cost-code-divisions ────────────────────────────────────────
  describe('POST /api/cost-code-divisions', () => {
    it('creates a division with valid body', async () => {
      mockReadBody.mockResolvedValue({
        corporation_uuid: 'corp-1',
        division_number: '01',
        division_name: 'Site Work',
      })
      mockCreateCostCodeDivision.mockResolvedValue(makeDivision())
      const { default: handler } = await import('../../../server/api/cost-code-divisions/index.post')

      const result = await handler({})
      expect(result).toMatchObject({ success: true, message: 'Cost code division created successfully' })
      expect(mockCreateCostCodeDivision).toHaveBeenCalledWith(
        expect.objectContaining({
          corporation_uuid: 'corp-1',
          division_number: '01',
          division_name: 'Site Work',
        }),
      )
    })

    it('throws 400 when corporation_uuid is missing', async () => {
      mockReadBody.mockResolvedValue({ division_number: '01', division_name: 'Site Work' })
      const { default: handler } = await import('../../../server/api/cost-code-divisions/index.post')

      await expect(handler({})).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'corporation_uuid is required',
      })
    })

    it('throws 400 when division_number is missing', async () => {
      mockReadBody.mockResolvedValue({ corporation_uuid: 'corp-1', division_name: 'Site Work' })
      const { default: handler } = await import('../../../server/api/cost-code-divisions/index.post')

      await expect(handler({})).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'division_number is required',
      })
    })

    it('throws 400 when division_name is missing', async () => {
      mockReadBody.mockResolvedValue({ corporation_uuid: 'corp-1', division_number: '01' })
      const { default: handler } = await import('../../../server/api/cost-code-divisions/index.post')

      await expect(handler({})).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'division_name is required',
      })
    })

    it('passes is_active=true by default', async () => {
      mockReadBody.mockResolvedValue({
        corporation_uuid: 'corp-1',
        division_number: '01',
        division_name: 'Site Work',
      })
      mockCreateCostCodeDivision.mockResolvedValue(makeDivision())
      const { default: handler } = await import('../../../server/api/cost-code-divisions/index.post')

      await handler({})
      expect(mockCreateCostCodeDivision).toHaveBeenCalledWith(
        expect.objectContaining({ is_active: true }),
      )
    })

    it('propagates 400 from util for duplicate division', async () => {
      mockReadBody.mockResolvedValue({
        corporation_uuid: 'corp-1',
        division_number: '01',
        division_name: 'Site Work',
      })
      mockCreateCostCodeDivision.mockRejectedValue(
        createError({ statusCode: 400, statusMessage: 'A division with this number already exists for the corporation' }),
      )
      const { default: handler } = await import('../../../server/api/cost-code-divisions/index.post')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 400 })
    })
  })

  // ── PUT /api/cost-code-divisions/:uuid ───────────────────────────────────
  describe('PUT /api/cost-code-divisions/:uuid', () => {
    it('updates a division', async () => {
      mockReadBody.mockResolvedValue({ division_name: 'Updated Name' })
      mockUpdateCostCodeDivision.mockResolvedValue(makeDivision({ division_name: 'Updated Name' }))
      const { default: handler } = await import('../../../server/api/cost-code-divisions/[uuid].put')

      const result = await handler({})
      expect(result).toMatchObject({ success: true, message: 'Cost code division updated successfully' })
      expect(mockUpdateCostCodeDivision).toHaveBeenCalledWith(
        'div-uuid-1',
        expect.objectContaining({ division_name: 'Updated Name' }),
      )
    })

    it('throws 400 when uuid is missing', async () => {
      mockGetRouterParam.mockReturnValue('')
      const { default: handler } = await import('../../../server/api/cost-code-divisions/[uuid].put')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 400, statusMessage: 'uuid is required' })
    })

    it('propagates 404 from util when not found', async () => {
      mockUpdateCostCodeDivision.mockRejectedValue(
        createError({ statusCode: 404, statusMessage: 'Cost code division not found' }),
      )
      const { default: handler } = await import('../../../server/api/cost-code-divisions/[uuid].put')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 404 })
    })
  })

  // ── DELETE /api/cost-code-divisions/:uuid ────────────────────────────────
  describe('DELETE /api/cost-code-divisions/:uuid', () => {
    it('deletes a division', async () => {
      mockDeleteCostCodeDivision.mockResolvedValue(undefined)
      const { default: handler } = await import('../../../server/api/cost-code-divisions/[uuid].delete')

      const result = await handler({})
      expect(result).toEqual({ success: true, message: 'Cost code division deleted successfully' })
      expect(mockDeleteCostCodeDivision).toHaveBeenCalledWith('div-uuid-1')
    })

    it('throws 400 when uuid is missing', async () => {
      mockGetRouterParam.mockReturnValue('')
      const { default: handler } = await import('../../../server/api/cost-code-divisions/[uuid].delete')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 400, statusMessage: 'uuid is required' })
    })

    it('propagates 404 from util when not found', async () => {
      mockDeleteCostCodeDivision.mockRejectedValue(
        createError({ statusCode: 404, statusMessage: 'Cost code division not found' }),
      )
      const { default: handler } = await import('../../../server/api/cost-code-divisions/[uuid].delete')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 404 })
    })
  })
})
