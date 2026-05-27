import { createError } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockListProjects = vi.fn()
const mockGetProjectByUuid = vi.fn()
const mockCreateProject = vi.fn()
const mockUpdateProject = vi.fn()
const mockSoftDeleteProject = vi.fn()
const mockReadBody = vi.fn()
const mockGetQuery = vi.fn()
const mockGetRouterParam = vi.fn()

vi.stubGlobal('defineEventHandler', (handler: (event: unknown) => unknown) => handler)
vi.stubGlobal('createError', createError)
vi.stubGlobal('readBody', mockReadBody)
vi.stubGlobal('getQuery', mockGetQuery)
vi.stubGlobal('getRouterParam', mockGetRouterParam)

vi.mock('../../../server/utils/projects', () => ({
  listProjects: (...args: unknown[]) => mockListProjects(...args),
  getProjectByUuid: (...args: unknown[]) => mockGetProjectByUuid(...args),
  createProject: (...args: unknown[]) => mockCreateProject(...args),
  updateProject: (...args: unknown[]) => mockUpdateProject(...args),
  softDeleteProject: (...args: unknown[]) => mockSoftDeleteProject(...args),
}))

const makeProject = (overrides = {}) => ({
  id: 1,
  uuid: 'proj-uuid-1',
  corporation_uuid: 'corp-1',
  project_name: 'Test Project',
  project_id: 'PRO-100001',
  project_type_uuid: 'pt-uuid',
  service_type_uuid: 'st-uuid',
  project_description: null,
  estimated_amount: 10000,
  area_sq_ft: null,
  no_of_rooms: null,
  contingency_percentage: null,
  customer_name: null,
  customer_uuid: null,
  project_status: 'Pending',
  project_start_date: '2026-05-01T00:00:00.000Z',
  project_estimated_completion_date: null,
  only_total: false,
  enable_labor: true,
  enable_material: true,
  attachments: [],
  enable_location_wise: false,
  location_basis_area: false,
  location_basis_no_of_rooms: false,
  is_active: true,
  ...overrides,
})

describe('projects API handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockReadBody.mockResolvedValue({})
    mockGetQuery.mockReturnValue({})
    mockGetRouterParam.mockReturnValue(undefined)
  })

  // ── GET /api/projects ────────────────────────────────────────────────────
  describe('GET /api/projects', () => {
    it('returns projects list for a corporation', async () => {
      mockGetQuery.mockReturnValue({ corporation_uuid: 'corp-1' })
      mockListProjects.mockResolvedValue([makeProject()])
      const { default: handler } = await import('../../../server/api/projects/index.get')

      const result = await handler({})
      expect(mockListProjects).toHaveBeenCalledWith('corp-1')
      expect(result).toEqual({ data: [makeProject()] })
    })

    it('returns 400 when corporation_uuid is missing', async () => {
      mockGetQuery.mockReturnValue({})
      const { default: handler } = await import('../../../server/api/projects/index.get')

      await expect(handler({})).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'corporation_uuid is required',
      })
    })

    it('propagates DB errors as 500', async () => {
      mockGetQuery.mockReturnValue({ corporation_uuid: 'corp-1' })
      mockListProjects.mockRejectedValue(new Error('DB error'))
      const { default: handler } = await import('../../../server/api/projects/index.get')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 500 })
    })
  })

  // ── GET /api/projects/:uuid ──────────────────────────────────────────────
  describe('GET /api/projects/:uuid', () => {
    it('returns a single project', async () => {
      mockGetRouterParam.mockReturnValue('proj-uuid-1')
      mockGetProjectByUuid.mockResolvedValue(makeProject())
      const { default: handler } = await import('../../../server/api/projects/[uuid].get')

      const result = await handler({})
      expect(result).toEqual({ data: makeProject() })
    })

    it('returns 404 when project not found', async () => {
      mockGetRouterParam.mockReturnValue('missing-uuid')
      mockGetProjectByUuid.mockResolvedValue(null)
      const { default: handler } = await import('../../../server/api/projects/[uuid].get')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 404 })
    })

    it('returns 400 when uuid is missing', async () => {
      mockGetRouterParam.mockReturnValue(undefined)
      const { default: handler } = await import('../../../server/api/projects/[uuid].get')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 400 })
    })
  })

  // ── POST /api/projects ───────────────────────────────────────────────────
  describe('POST /api/projects', () => {
    it('creates a project with all fields', async () => {
      const body = {
        corporation_uuid: 'corp-1',
        project_name: 'New Project',
        project_type_uuid: 'pt-uuid',
        service_type_uuid: 'st-uuid',
        only_total: false,
        enable_labor: true,
        enable_material: true,
        enable_location_wise: true,
        location_basis_area: true,
        location_basis_no_of_rooms: false,
        contingency_percentage: 10,
        estimated_amount: 50000,
      }
      mockReadBody.mockResolvedValue(body)
      mockCreateProject.mockResolvedValue(makeProject({ project_name: 'New Project' }))
      const { default: handler } = await import('../../../server/api/projects/index.post')

      const result = await handler({})
      expect(mockCreateProject).toHaveBeenCalledWith(expect.objectContaining({
        corporation_uuid: 'corp-1',
        project_name: 'New Project',
        project_type_uuid: 'pt-uuid',
        service_type_uuid: 'st-uuid',
      }))
      expect(result).toHaveProperty('data')
    })

    it('returns 400 when corporation_uuid is missing', async () => {
      mockReadBody.mockResolvedValue({ project_name: 'Test' })
      const { default: handler } = await import('../../../server/api/projects/index.post')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 400, statusMessage: 'corporation_uuid is required' })
    })

    it('returns 400 when project_name is missing', async () => {
      mockReadBody.mockResolvedValue({ corporation_uuid: 'corp-1' })
      const { default: handler } = await import('../../../server/api/projects/index.post')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 400, statusMessage: 'project_name is required' })
    })
  })

  // ── PUT /api/projects ────────────────────────────────────────────────────
  describe('PUT /api/projects', () => {
    it('updates a project with new fields', async () => {
      const body = {
        uuid: 'proj-uuid-1',
        project_name: 'Updated Name',
        project_type_uuid: 'new-pt-uuid',
        service_type_uuid: 'new-st-uuid',
        contingency_percentage: 15,
      }
      mockReadBody.mockResolvedValue(body)
      mockUpdateProject.mockResolvedValue(makeProject({ project_name: 'Updated Name' }))
      const { default: handler } = await import('../../../server/api/projects/index.put')

      const result = await handler({})
      expect(mockUpdateProject).toHaveBeenCalledWith(
        'proj-uuid-1',
        expect.objectContaining({ project_type_uuid: 'new-pt-uuid', service_type_uuid: 'new-st-uuid' }),
      )
      expect(result).toHaveProperty('data')
    })

    it('returns 400 when uuid is missing', async () => {
      mockReadBody.mockResolvedValue({ project_name: 'Test' })
      const { default: handler } = await import('../../../server/api/projects/index.put')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 400 })
    })

    it('returns 404 when project does not exist', async () => {
      mockReadBody.mockResolvedValue({ uuid: 'missing' })
      mockUpdateProject.mockResolvedValue(null)
      const { default: handler } = await import('../../../server/api/projects/index.put')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 404 })
    })
  })

  // ── DELETE /api/projects ─────────────────────────────────────────────────
  describe('DELETE /api/projects', () => {
    it('soft-deletes a project', async () => {
      mockGetQuery.mockReturnValue({ uuid: 'proj-uuid-1' })
      const deleted = makeProject({ is_active: false })
      mockSoftDeleteProject.mockResolvedValue(deleted)
      const { default: handler } = await import('../../../server/api/projects/index.delete')

      const result = await handler({})
      expect(mockSoftDeleteProject).toHaveBeenCalledWith('proj-uuid-1')
      expect(result).toEqual({ data: deleted })
    })

    it('returns 400 when uuid is missing', async () => {
      mockGetQuery.mockReturnValue({})
      const { default: handler } = await import('../../../server/api/projects/index.delete')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 400 })
    })
  })
})
