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
const mockListCostCodeConfigurations = vi.fn()
const mockCreateCostCodeConfiguration = vi.fn()
const mockUpdateCostCodeConfiguration = vi.fn()
const mockDeleteCostCodeConfiguration = vi.fn()

vi.mock('../../../server/utils/costCodeConfigurations', () => ({
  listCostCodeConfigurations: (...a: unknown[]) => mockListCostCodeConfigurations(...a),
  createCostCodeConfiguration: (...a: unknown[]) => mockCreateCostCodeConfiguration(...a),
  updateCostCodeConfiguration: (...a: unknown[]) => mockUpdateCostCodeConfiguration(...a),
  deleteCostCodeConfiguration: (...a: unknown[]) => mockDeleteCostCodeConfiguration(...a),
}))

const makeConfig = (overrides = {}) => ({
  id: 1,
  uuid: 'cfg-uuid-1',
  corporation_uuid: 'corp-1',
  division_uuid: null,
  cost_code_number: '01-100',
  cost_code_name: 'General Conditions',
  parent_cost_code_uuid: null,
  order_number: 1,
  gl_account_uuid: null,
  effective_from: null,
  description: null,
  update_previous_transactions: false,
  is_active: true,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  ...overrides,
})

describe('cost-code-configurations API handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetQuery.mockReturnValue({ corporation_uuid: 'corp-1' })
    mockReadBody.mockResolvedValue({})
    mockGetRouterParam.mockReturnValue('cfg-uuid-1')
  })

  // ── GET /api/cost-code-configurations ───────────────────────────────────
  describe('GET /api/cost-code-configurations', () => {
    it('returns list of configurations', async () => {
      mockListCostCodeConfigurations.mockResolvedValue([makeConfig()])
      const { default: handler } = await import('../../../server/api/cost-code-configurations/index.get')

      const result = await handler({})
      expect(result).toEqual({ success: true, data: [makeConfig()] })
      expect(mockListCostCodeConfigurations).toHaveBeenCalledWith('corp-1')
    })

    it('throws 400 when corporation_uuid is missing', async () => {
      mockGetQuery.mockReturnValue({})
      const { default: handler } = await import('../../../server/api/cost-code-configurations/index.get')

      await expect(handler({})).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'corporation_uuid is required',
      })
    })

    it('propagates errors from utility function', async () => {
      mockListCostCodeConfigurations.mockRejectedValue(
        createError({ statusCode: 500, statusMessage: 'DB connection error' }),
      )
      const { default: handler } = await import('../../../server/api/cost-code-configurations/index.get')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 500 })
    })
  })

  // ── POST /api/cost-code-configurations ──────────────────────────────────
  describe('POST /api/cost-code-configurations', () => {
    it('creates a configuration with valid body', async () => {
      mockReadBody.mockResolvedValue({
        corporation_uuid: 'corp-1',
        cost_code_number: '01-100',
        cost_code_name: 'General Conditions',
        division_uuid: 'div-1',
      })
      mockCreateCostCodeConfiguration.mockResolvedValue(makeConfig())
      const { default: handler } = await import('../../../server/api/cost-code-configurations/index.post')

      const result = await handler({})
      expect(result).toMatchObject({ success: true, message: 'Cost code configuration created successfully' })
      expect(mockCreateCostCodeConfiguration).toHaveBeenCalledWith(
        expect.objectContaining({
          corporation_uuid: 'corp-1',
          cost_code_number: '01-100',
          cost_code_name: 'General Conditions',
        }),
      )
    })

    it('throws 400 when corporation_uuid is missing', async () => {
      mockReadBody.mockResolvedValue({ cost_code_number: '01-100', cost_code_name: 'General Conditions' })
      const { default: handler } = await import('../../../server/api/cost-code-configurations/index.post')

      await expect(handler({})).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'corporation_uuid is required',
      })
    })

    it('throws 400 when cost_code_number is missing', async () => {
      mockReadBody.mockResolvedValue({ corporation_uuid: 'corp-1', cost_code_name: 'General Conditions' })
      const { default: handler } = await import('../../../server/api/cost-code-configurations/index.post')

      await expect(handler({})).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'cost_code_number is required',
      })
    })

    it('throws 400 when cost_code_name is missing', async () => {
      mockReadBody.mockResolvedValue({ corporation_uuid: 'corp-1', cost_code_number: '01-100' })
      const { default: handler } = await import('../../../server/api/cost-code-configurations/index.post')

      await expect(handler({})).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'cost_code_name is required',
      })
    })

    it('passes is_active=true by default', async () => {
      mockReadBody.mockResolvedValue({
        corporation_uuid: 'corp-1',
        cost_code_number: '01-100',
        cost_code_name: 'General Conditions',
      })
      mockCreateCostCodeConfiguration.mockResolvedValue(makeConfig())
      const { default: handler } = await import('../../../server/api/cost-code-configurations/index.post')

      await handler({})
      expect(mockCreateCostCodeConfiguration).toHaveBeenCalledWith(
        expect.objectContaining({ is_active: true }),
      )
    })

    it('passes optional fields when provided', async () => {
      mockReadBody.mockResolvedValue({
        corporation_uuid: 'corp-1',
        cost_code_number: '01-100',
        cost_code_name: 'General Conditions',
        division_uuid: 'div-uuid-1',
        description: 'A description',
        order_number: 5,
        is_active: false,
      })
      mockCreateCostCodeConfiguration.mockResolvedValue(makeConfig())
      const { default: handler } = await import('../../../server/api/cost-code-configurations/index.post')

      await handler({})
      expect(mockCreateCostCodeConfiguration).toHaveBeenCalledWith(
        expect.objectContaining({
          division_uuid: 'div-uuid-1',
          description: 'A description',
          order_number: 5,
          is_active: false,
        }),
      )
    })

    it('propagates 400 for duplicate cost code', async () => {
      mockReadBody.mockResolvedValue({
        corporation_uuid: 'corp-1',
        cost_code_number: '01-100',
        cost_code_name: 'Duplicate',
      })
      mockCreateCostCodeConfiguration.mockRejectedValue(
        createError({ statusCode: 400, statusMessage: 'A cost code with this number already exists for the corporation' }),
      )
      const { default: handler } = await import('../../../server/api/cost-code-configurations/index.post')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 400 })
    })
  })

  // ── PUT /api/cost-code-configurations/:uuid ──────────────────────────────
  describe('PUT /api/cost-code-configurations/:uuid', () => {
    it('updates a configuration', async () => {
      mockReadBody.mockResolvedValue({ cost_code_name: 'Updated Name', is_active: false })
      mockUpdateCostCodeConfiguration.mockResolvedValue(makeConfig({ cost_code_name: 'Updated Name' }))
      const { default: handler } = await import('../../../server/api/cost-code-configurations/[uuid].put')

      const result = await handler({})
      expect(result).toMatchObject({ success: true, message: 'Cost code configuration updated successfully' })
      expect(mockUpdateCostCodeConfiguration).toHaveBeenCalledWith('cfg-uuid-1', expect.any(Object))
    })

    it('throws 400 when uuid is missing', async () => {
      mockGetRouterParam.mockReturnValue('')
      const { default: handler } = await import('../../../server/api/cost-code-configurations/[uuid].put')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 400 })
    })

    it('propagates 404 when configuration not found', async () => {
      mockUpdateCostCodeConfiguration.mockRejectedValue(
        createError({ statusCode: 404, statusMessage: 'Cost code configuration not found' }),
      )
      const { default: handler } = await import('../../../server/api/cost-code-configurations/[uuid].put')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 404 })
    })
  })

  // ── DELETE /api/cost-code-configurations/:uuid ───────────────────────────
  describe('DELETE /api/cost-code-configurations/:uuid', () => {
    it('deletes a configuration', async () => {
      mockDeleteCostCodeConfiguration.mockResolvedValue(undefined)
      const { default: handler } = await import('../../../server/api/cost-code-configurations/[uuid].delete')

      const result = await handler({})
      expect(result).toEqual({ success: true, message: 'Cost code configuration deleted successfully' })
      expect(mockDeleteCostCodeConfiguration).toHaveBeenCalledWith('cfg-uuid-1')
    })

    it('throws 400 when uuid is missing', async () => {
      mockGetRouterParam.mockReturnValue('')
      const { default: handler } = await import('../../../server/api/cost-code-configurations/[uuid].delete')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 400 })
    })

    it('propagates 404 from utility', async () => {
      mockDeleteCostCodeConfiguration.mockRejectedValue(
        createError({ statusCode: 404, statusMessage: 'Cost code configuration not found' }),
      )
      const { default: handler } = await import('../../../server/api/cost-code-configurations/[uuid].delete')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 404 })
    })
  })
})
