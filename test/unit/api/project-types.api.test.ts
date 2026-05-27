import { createError } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockListProjectTypes = vi.fn()
const mockListProjectTypeOptions = vi.fn()
const mockCreateProjectType = vi.fn()
const mockUpdateProjectType = vi.fn()
const mockDeleteProjectType = vi.fn()
const mockParseProjectTypeBody = vi.fn()
const mockParseProjectTypeUpdateBody = vi.fn()
const mockUseAuth = vi.fn()
const mockReadBody = vi.fn()
const mockGetRouterParam = vi.fn()

vi.stubGlobal('defineEventHandler', (handler: (event: unknown) => unknown) => handler)
vi.stubGlobal('createError', createError)
vi.stubGlobal('readBody', mockReadBody)
vi.stubGlobal('getRouterParam', mockGetRouterParam)

vi.mock('../../../server/utils/project-types', () => ({
  listProjectTypes: (...args: unknown[]) => mockListProjectTypes(...args),
  listProjectTypeOptions: (...args: unknown[]) => mockListProjectTypeOptions(...args),
  createProjectType: (...args: unknown[]) => mockCreateProjectType(...args),
  updateProjectType: (...args: unknown[]) => mockUpdateProjectType(...args),
  deleteProjectType: (...args: unknown[]) => mockDeleteProjectType(...args),
  parseProjectTypeBody: (...args: unknown[]) => mockParseProjectTypeBody(...args),
  parseProjectTypeUpdateBody: (...args: unknown[]) => mockParseProjectTypeUpdateBody(...args),
}))

vi.mock('../../../server/utils/use-auth', () => ({
  useAuth: (...args: unknown[]) => mockUseAuth(...args),
}))

describe('project-types API handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ session: { userID: 'user-1' } })
    mockReadBody.mockResolvedValue({})
    mockGetRouterParam.mockReturnValue('1')
  })

  it('GET /api/project-types returns data', async () => {
    mockListProjectTypes.mockResolvedValue([{ id: 1, name: 'Residential' }])
    const { default: handler } = await import('../../../server/api/project-types/index.get')

    const result = await handler({})
    expect(result).toEqual({ success: true, data: [{ id: 1, name: 'Residential' }] })
  })

  it('GET /api/project-types/options returns active options', async () => {
    mockListProjectTypeOptions.mockResolvedValue([{ uuid: 'u1', name: 'Residential' }])
    const { default: handler } = await import('../../../server/api/project-types/options.get')

    const result = await handler({})
    expect(result).toEqual({ success: true, data: [{ uuid: 'u1', name: 'Residential' }] })
  })

  it('POST /api/project-types parses body and creates', async () => {
    mockReadBody.mockResolvedValue({ name: 'Residential' })
    mockParseProjectTypeBody.mockReturnValue({ name: 'Residential', isActive: true })
    mockCreateProjectType.mockResolvedValue({ id: 1, name: 'Residential' })
    const { default: handler } = await import('../../../server/api/project-types/index.post')

    const result = await handler({})
    expect(mockCreateProjectType).toHaveBeenCalledWith({ name: 'Residential', isActive: true }, 'user-1')
    expect(result).toEqual({ success: true, data: { id: 1, name: 'Residential' } })
  })

  it('PUT /api/project-types/:id updates record', async () => {
    mockReadBody.mockResolvedValue({ name: 'Commercial' })
    mockParseProjectTypeUpdateBody.mockReturnValue({ name: 'Commercial' })
    mockUpdateProjectType.mockResolvedValue({ id: 1, name: 'Commercial' })
    const { default: handler } = await import('../../../server/api/project-types/[id].put')

    const result = await handler({})
    expect(mockUpdateProjectType).toHaveBeenCalledWith('1', { name: 'Commercial' }, 'user-1')
    expect(result).toEqual({ success: true, data: { id: 1, name: 'Commercial' } })
  })

  it('PUT /api/project-types/:id returns 400 when id missing', async () => {
    mockGetRouterParam.mockReturnValue(undefined)
    const { default: handler } = await import('../../../server/api/project-types/[id].put')

    await expect(handler({})).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Project type ID is required',
    })
  })

  it('DELETE /api/project-types/:id deletes record', async () => {
    mockDeleteProjectType.mockResolvedValue(undefined)
    const { default: handler } = await import('../../../server/api/project-types/[id].delete')

    const result = await handler({})
    expect(mockDeleteProjectType).toHaveBeenCalledWith('1')
    expect(result).toEqual({ success: true, message: 'Project type deleted successfully' })
  })
})
