import { createError } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockListProjectLocationBreakdowns = vi.fn()
const mockCreateLocationBreakdown = vi.fn()
const mockUpdateLocationBreakdown = vi.fn()
const mockSoftDeleteLocationBreakdown = vi.fn()
const mockReadBody = vi.fn()
const mockGetQuery = vi.fn()

vi.stubGlobal('defineEventHandler', (handler: (event: unknown) => unknown) => handler)
vi.stubGlobal('createError', createError)
vi.stubGlobal('readBody', mockReadBody)
vi.stubGlobal('getQuery', mockGetQuery)

vi.mock('../../../server/utils/projectLocationBreakdowns', () => ({
  listProjectLocationBreakdowns: (...args: unknown[]) => mockListProjectLocationBreakdowns(...args),
  createLocationBreakdown: (...args: unknown[]) => mockCreateLocationBreakdown(...args),
  updateLocationBreakdown: (...args: unknown[]) => mockUpdateLocationBreakdown(...args),
  softDeleteLocationBreakdown: (...args: unknown[]) => mockSoftDeleteLocationBreakdown(...args),
}))

const makeBreakdown = (overrides = {}) => ({
  id: 1,
  uuid: 'lb-uuid-1',
  project_uuid: 'proj-uuid-1',
  location_uuid: 'loc-uuid-1',
  area_sq_ft: 100,
  no_of_rooms: null,
  is_active: true,
  created_at: '2026-05-08T09:16:38.000Z',
  updated_at: '2026-05-08T09:16:38.000Z',
  ...overrides,
})

describe('project location-breakdowns API handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockReadBody.mockResolvedValue({})
    mockGetQuery.mockReturnValue({})
  })

  describe('GET /api/projects/location-breakdowns', () => {
    it('returns breakdowns for a project', async () => {
      mockGetQuery.mockReturnValue({ project_uuid: 'proj-uuid-1' })
      mockListProjectLocationBreakdowns.mockResolvedValue([makeBreakdown()])
      const { default: handler } = await import('../../../server/api/projects/location-breakdowns/index.get')

      const result = await handler({})
      expect(mockListProjectLocationBreakdowns).toHaveBeenCalledWith('proj-uuid-1')
      expect(result).toEqual({ data: [makeBreakdown()] })
    })

    it('returns 400 when project_uuid missing', async () => {
      mockGetQuery.mockReturnValue({})
      const { default: handler } = await import('../../../server/api/projects/location-breakdowns/index.get')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 400 })
    })
  })

  describe('POST /api/projects/location-breakdowns', () => {
    it('creates a location breakdown', async () => {
      mockReadBody.mockResolvedValue({
        project_uuid: 'proj-uuid-1',
        location_uuid: 'loc-uuid-1',
        area_sq_ft: 100,
      })
      mockCreateLocationBreakdown.mockResolvedValue(makeBreakdown())
      const { default: handler } = await import('../../../server/api/projects/location-breakdowns/index.post')

      const result = await handler({})
      expect(mockCreateLocationBreakdown).toHaveBeenCalledWith(expect.objectContaining({
        project_uuid: 'proj-uuid-1',
        location_uuid: 'loc-uuid-1',
      }))
      expect(result).toHaveProperty('data')
    })

    it('returns 400 when project_uuid missing', async () => {
      mockReadBody.mockResolvedValue({ location_uuid: 'loc-1' })
      const { default: handler } = await import('../../../server/api/projects/location-breakdowns/index.post')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 400, statusMessage: 'project_uuid is required' })
    })

    it('returns 400 when location_uuid missing', async () => {
      mockReadBody.mockResolvedValue({ project_uuid: 'proj-1' })
      const { default: handler } = await import('../../../server/api/projects/location-breakdowns/index.post')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 400, statusMessage: 'location_uuid is required' })
    })
  })

  describe('PUT /api/projects/location-breakdowns', () => {
    it('updates a location breakdown', async () => {
      mockReadBody.mockResolvedValue({ uuid: 'lb-uuid-1', area_sq_ft: 200 })
      mockUpdateLocationBreakdown.mockResolvedValue(makeBreakdown({ area_sq_ft: 200 }))
      const { default: handler } = await import('../../../server/api/projects/location-breakdowns/index.put')

      const result = await handler({})
      expect(mockUpdateLocationBreakdown).toHaveBeenCalledWith('lb-uuid-1', expect.objectContaining({ area_sq_ft: 200 }))
      expect(result).toHaveProperty('data')
    })

    it('returns 400 when uuid missing', async () => {
      mockReadBody.mockResolvedValue({ area_sq_ft: 100 })
      const { default: handler } = await import('../../../server/api/projects/location-breakdowns/index.put')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 400 })
    })

    it('returns 404 when breakdown not found', async () => {
      mockReadBody.mockResolvedValue({ uuid: 'missing' })
      mockUpdateLocationBreakdown.mockResolvedValue(null)
      const { default: handler } = await import('../../../server/api/projects/location-breakdowns/index.put')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 404 })
    })
  })

  describe('DELETE /api/projects/location-breakdowns', () => {
    it('soft-deletes a breakdown', async () => {
      mockGetQuery.mockReturnValue({ uuid: 'lb-uuid-1' })
      mockSoftDeleteLocationBreakdown.mockResolvedValue(true)
      const { default: handler } = await import('../../../server/api/projects/location-breakdowns/index.delete')

      const result = await handler({})
      expect(mockSoftDeleteLocationBreakdown).toHaveBeenCalledWith('lb-uuid-1')
      expect(result).toEqual({ success: true })
    })

    it('returns 400 when uuid missing', async () => {
      mockGetQuery.mockReturnValue({})
      const { default: handler } = await import('../../../server/api/projects/location-breakdowns/index.delete')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 400 })
    })
  })
})
