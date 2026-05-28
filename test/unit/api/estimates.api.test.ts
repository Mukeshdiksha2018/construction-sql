import { createError } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ── Mock h3 globals ────────────────────────────────────────────────────────────
const mockGetQuery = vi.fn()
const mockReadBody = vi.fn()
const mockGetRouterParam = vi.fn()

vi.stubGlobal('defineEventHandler', (handler: (event: unknown) => unknown) => handler)
vi.stubGlobal('createError', createError)
vi.stubGlobal('getQuery', mockGetQuery)
vi.stubGlobal('readBody', mockReadBody)
vi.stubGlobal('getRouterParam', mockGetRouterParam)

// ── Mock estimate server utils ─────────────────────────────────────────────────
const mockListEstimates = vi.fn()
const mockGetEstimate = vi.fn()
const mockCreateEstimate = vi.fn()
const mockUpdateEstimate = vi.fn()
const mockDeleteEstimate = vi.fn()
const mockGetEstimateLineItems = vi.fn()

vi.mock('../../../server/utils/estimates', () => ({
  listEstimates: (...a: unknown[]) => mockListEstimates(...a),
  getEstimate: (...a: unknown[]) => mockGetEstimate(...a),
  createEstimate: (...a: unknown[]) => mockCreateEstimate(...a),
  updateEstimate: (...a: unknown[]) => mockUpdateEstimate(...a),
  deleteEstimate: (...a: unknown[]) => mockDeleteEstimate(...a),
  getEstimateLineItems: (...a: unknown[]) => mockGetEstimateLineItems(...a),
}))

// ── Mock prisma (delete endpoint uses getPrisma directly) ─────────────────────
const mockEstimateFindFirst = vi.fn()
vi.mock('../../../server/utils/prisma', () => ({
  getPrisma: () => ({
    estimate: { findFirst: (...a: unknown[]) => mockEstimateFindFirst(...a) },
  }),
}))

// ── Shared fixtures ────────────────────────────────────────────────────────────
const makeEstimate = (overrides = {}) => ({
  id: '1',
  uuid: 'est-uuid-1',
  corporation_uuid: 'corp-1',
  project_uuid: 'proj-1',
  estimate_number: 'EST-001',
  estimate_date: '2026-05-01',
  valid_until: null,
  status: 'Draft',
  total_amount: 1000,
  tax_amount: 0,
  discount_amount: 0,
  final_amount: 1000,
  notes: null,
  attachments: [],
  removed_cost_code_uuids: [],
  audit_log: [],
  is_active: true,
  created_at: '2026-05-01T00:00:00.000Z',
  updated_at: '2026-05-01T00:00:00.000Z',
  line_items: [],
  project: { uuid: 'proj-1', project_name: 'Test Project', project_id: 'P001' },
  ...overrides,
})

const makeLineItem = (overrides = {}) => ({
  cost_code_uuid: 'cc-uuid-1',
  cost_code_number: '01-100',
  cost_code_name: 'Concrete',
  division_name: 'Division 01',
  description: '',
  estimation_type: 'manual',
  labor_amount: 500,
  material_amount: 500,
  total_amount: 1000,
  material_items: [],
  location_wise_labor: [],
  location_wise_material: [],
  ...overrides,
})

describe('Estimates API handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetQuery.mockReturnValue({ corporation_uuid: 'corp-1' })
    mockReadBody.mockResolvedValue({})
    mockGetRouterParam.mockReturnValue('est-uuid-1')
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // GET /api/estimates
  // ─────────────────────────────────────────────────────────────────────────────
  describe('GET /api/estimates', () => {
    it('returns estimates list for corporation', async () => {
      const paginatedResult = { data: [makeEstimate()], pagination: { page: 1, pageSize: 100, totalRecords: 1, totalPages: 1, hasMore: false } }
      mockListEstimates.mockResolvedValue(paginatedResult)
      const { default: handler } = await import('../../../server/api/estimates/index.get')

      const result = await handler({})
      expect(result).toEqual(paginatedResult)
      expect(mockListEstimates).toHaveBeenCalledWith('corp-1', undefined, 1, 100)
    })

    it('passes project_uuid when provided', async () => {
      mockGetQuery.mockReturnValue({ corporation_uuid: 'corp-1', project_uuid: 'proj-1' })
      mockListEstimates.mockResolvedValue({ data: [], pagination: {} })
      const { default: handler } = await import('../../../server/api/estimates/index.get')

      await handler({})
      expect(mockListEstimates).toHaveBeenCalledWith('corp-1', 'proj-1', 1, 100)
    })

    it('respects page and page_size query params', async () => {
      mockGetQuery.mockReturnValue({ corporation_uuid: 'corp-1', page: '2', page_size: '25' })
      mockListEstimates.mockResolvedValue({ data: [], pagination: {} })
      const { default: handler } = await import('../../../server/api/estimates/index.get')

      await handler({})
      expect(mockListEstimates).toHaveBeenCalledWith('corp-1', undefined, 2, 25)
    })

    it('throws 400 when corporation_uuid is missing', async () => {
      mockGetQuery.mockReturnValue({})
      const { default: handler } = await import('../../../server/api/estimates/index.get')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 400, statusMessage: 'corporation_uuid is required' })
    })

    it('throws 500 on unexpected server error', async () => {
      mockListEstimates.mockRejectedValue(new Error('DB connection lost'))
      const { default: handler } = await import('../../../server/api/estimates/index.get')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 500 })
    })

    it('re-throws h3 errors with their original status code', async () => {
      mockListEstimates.mockRejectedValue(createError({ statusCode: 503, statusMessage: 'Service unavailable' }))
      const { default: handler } = await import('../../../server/api/estimates/index.get')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 503 })
    })
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // POST /api/estimates
  // ─────────────────────────────────────────────────────────────────────────────
  describe('POST /api/estimates', () => {
    const validBody = {
      corporation_uuid: 'corp-1',
      project_uuid: 'proj-1',
      estimate_date: '2026-05-01',
      total_amount: 1000,
      final_amount: 1000,
    }

    it('creates an estimate and returns it', async () => {
      mockReadBody.mockResolvedValue(validBody)
      mockCreateEstimate.mockResolvedValue(makeEstimate())
      const { default: handler } = await import('../../../server/api/estimates/index.post')

      const result = await handler({}) as any
      expect(result.data).toMatchObject({ uuid: 'est-uuid-1', estimate_number: 'EST-001' })
      expect(mockCreateEstimate).toHaveBeenCalledWith(
        expect.objectContaining({
          corporation_uuid: 'corp-1',
          project_uuid: 'proj-1',
          total_amount: 1000,
          final_amount: 1000,
        }),
      )
    })

    it('passes optional fields through when provided', async () => {
      mockReadBody.mockResolvedValue({
        ...validBody,
        estimate_number: 'EST-CUSTOM-001',
        status: 'Ready',
        tax_amount: 100,
        discount_amount: 50,
        notes: 'Test notes',
        line_items: [makeLineItem()],
        removed_cost_code_uuids: ['cc-removed-1'],
        user_id: 'u-1',
        user_name: 'Alice',
        user_email: 'alice@test.com',
      })
      mockCreateEstimate.mockResolvedValue(makeEstimate())
      const { default: handler } = await import('../../../server/api/estimates/index.post')

      await handler({})
      expect(mockCreateEstimate).toHaveBeenCalledWith(
        expect.objectContaining({
          estimate_number: 'EST-CUSTOM-001',
          status: 'Ready',
          tax_amount: 100,
          discount_amount: 50,
          notes: 'Test notes',
          user_id: 'u-1',
          user_name: 'Alice',
        }),
      )
    })

    it.each(['corporation_uuid', 'project_uuid', 'estimate_date', 'total_amount', 'final_amount'])(
      'throws 400 when %s is missing',
      async (field) => {
        const body = { ...validBody, [field]: undefined }
        mockReadBody.mockResolvedValue(body)
        const { default: handler } = await import('../../../server/api/estimates/index.post')

        await expect(handler({})).rejects.toMatchObject({ statusCode: 400 })
      },
    )

    it('throws 400 when body is null', async () => {
      mockReadBody.mockResolvedValue(null)
      const { default: handler } = await import('../../../server/api/estimates/index.post')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 400 })
    })

    it('throws 500 on DB error', async () => {
      mockReadBody.mockResolvedValue(validBody)
      mockCreateEstimate.mockRejectedValue(new Error('Insert failed'))
      const { default: handler } = await import('../../../server/api/estimates/index.post')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 500 })
    })
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // GET /api/estimates/:uuid
  // ─────────────────────────────────────────────────────────────────────────────
  describe('GET /api/estimates/:uuid', () => {
    it('returns estimate when found', async () => {
      mockGetEstimate.mockResolvedValue(makeEstimate())
      const { default: handler } = await import('../../../server/api/estimates/[uuid].get')

      const result = await handler({}) as any
      expect(result.data.uuid).toBe('est-uuid-1')
      expect(mockGetEstimate).toHaveBeenCalledWith('est-uuid-1')
    })

    it('throws 404 when estimate not found', async () => {
      mockGetEstimate.mockResolvedValue(null)
      const { default: handler } = await import('../../../server/api/estimates/[uuid].get')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 404 })
    })

    it('throws 400 when uuid param is missing', async () => {
      mockGetRouterParam.mockReturnValue('')
      const { default: handler } = await import('../../../server/api/estimates/[uuid].get')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 400 })
    })

    it('throws 500 on unexpected error', async () => {
      mockGetEstimate.mockRejectedValue(new Error('Query timeout'))
      const { default: handler } = await import('../../../server/api/estimates/[uuid].get')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 500 })
    })
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // PUT /api/estimates/:uuid
  // ─────────────────────────────────────────────────────────────────────────────
  describe('PUT /api/estimates/:uuid', () => {
    it('updates an estimate and returns it', async () => {
      mockReadBody.mockResolvedValue({ status: 'Ready', total_amount: 1500, final_amount: 1500 })
      mockUpdateEstimate.mockResolvedValue(makeEstimate({ status: 'Ready', total_amount: 1500 }))
      const { default: handler } = await import('../../../server/api/estimates/[uuid].put')

      const result = await handler({}) as any
      expect(result.data.uuid).toBe('est-uuid-1')
      expect(mockUpdateEstimate).toHaveBeenCalledWith(
        expect.objectContaining({ uuid: 'est-uuid-1', status: 'Ready' }),
      )
    })

    it('throws 404 when updateEstimate returns null', async () => {
      mockReadBody.mockResolvedValue({ status: 'Approved' })
      mockUpdateEstimate.mockResolvedValue(null)
      const { default: handler } = await import('../../../server/api/estimates/[uuid].put')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 404 })
    })

    it('throws 400 when uuid is missing', async () => {
      mockGetRouterParam.mockReturnValue('')
      const { default: handler } = await import('../../../server/api/estimates/[uuid].put')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 400 })
    })

    it('throws 400 when body is null', async () => {
      mockReadBody.mockResolvedValue(null)
      const { default: handler } = await import('../../../server/api/estimates/[uuid].put')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 400 })
    })

    it('passes numeric fields parsed as floats', async () => {
      mockReadBody.mockResolvedValue({ total_amount: '1500.5', final_amount: '1450.25', tax_amount: '50.25' })
      mockUpdateEstimate.mockResolvedValue(makeEstimate())
      const { default: handler } = await import('../../../server/api/estimates/[uuid].put')

      await handler({})
      expect(mockUpdateEstimate).toHaveBeenCalledWith(
        expect.objectContaining({ total_amount: 1500.5, final_amount: 1450.25, tax_amount: 50.25 }),
      )
    })
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // DELETE /api/estimates/:uuid
  // ─────────────────────────────────────────────────────────────────────────────
  describe('DELETE /api/estimates/:uuid', () => {
    it('deletes estimate and returns success', async () => {
      mockEstimateFindFirst.mockResolvedValue({ uuid: 'est-uuid-1', project_uuid: 'proj-1', estimate_number: 'EST-001' })
      mockDeleteEstimate.mockResolvedValue(makeEstimate({ is_active: false }))
      const { default: handler } = await import('../../../server/api/estimates/[uuid].delete')

      const result = await handler({}) as any
      expect(result.message).toMatch(/deleted/i)
      expect(mockDeleteEstimate).toHaveBeenCalledWith('est-uuid-1')
    })

    it('throws 400 when uuid is missing', async () => {
      mockGetRouterParam.mockReturnValue('')
      const { default: handler } = await import('../../../server/api/estimates/[uuid].delete')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 400 })
    })

    it('throws 404 when estimate not found via prisma lookup', async () => {
      mockEstimateFindFirst.mockResolvedValue(null)
      const { default: handler } = await import('../../../server/api/estimates/[uuid].delete')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 404 })
    })

    it('throws 500 on unexpected error', async () => {
      mockEstimateFindFirst.mockResolvedValue({ uuid: 'est-uuid-1', project_uuid: 'proj-1', estimate_number: 'EST-001' })
      mockDeleteEstimate.mockRejectedValue(new Error('Lock timeout'))
      const { default: handler } = await import('../../../server/api/estimates/[uuid].delete')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 500 })
    })
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // GET /api/estimate-line-items
  // ─────────────────────────────────────────────────────────────────────────────
  describe('GET /api/estimate-line-items', () => {
    beforeEach(() => {
      mockGetQuery.mockReturnValue({
        project_uuid: 'proj-1',
        estimate_uuid: 'est-uuid-1',
        corporation_uuid: 'corp-1',
      })
    })

    it('returns line items for estimate', async () => {
      mockGetEstimateLineItems.mockResolvedValue({ data: [makeLineItem()] })
      const { default: handler } = await import('../../../server/api/estimate-line-items/index.get')

      const result = await handler({}) as any
      expect(result.data).toHaveLength(1)
      expect(mockGetEstimateLineItems).toHaveBeenCalledWith('est-uuid-1', 'proj-1', 'corp-1')
    })

    it('throws 400 when project_uuid is missing', async () => {
      mockGetQuery.mockReturnValue({ estimate_uuid: 'est-uuid-1', corporation_uuid: 'corp-1' })
      const { default: handler } = await import('../../../server/api/estimate-line-items/index.get')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 400 })
    })

    it('throws 400 when estimate_uuid is missing', async () => {
      mockGetQuery.mockReturnValue({ project_uuid: 'proj-1', corporation_uuid: 'corp-1' })
      const { default: handler } = await import('../../../server/api/estimate-line-items/index.get')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 400 })
    })

    it('throws 400 when corporation_uuid is missing', async () => {
      mockGetQuery.mockReturnValue({ project_uuid: 'proj-1', estimate_uuid: 'est-uuid-1' })
      const { default: handler } = await import('../../../server/api/estimate-line-items/index.get')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 400 })
    })

    it('throws 500 on DB error', async () => {
      mockGetEstimateLineItems.mockRejectedValue(new Error('Timeout'))
      const { default: handler } = await import('../../../server/api/estimate-line-items/index.get')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 500 })
    })
  })
})
