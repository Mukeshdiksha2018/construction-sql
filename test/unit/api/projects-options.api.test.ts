import { createError } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockListProjects = vi.fn()
const mockGetQuery = vi.fn()

vi.stubGlobal('defineEventHandler', (handler: (event: unknown) => unknown) => handler)
vi.stubGlobal('createError', createError)
vi.stubGlobal('getQuery', mockGetQuery)

vi.mock('../../../server/utils/projects', () => ({
  listProjects: (...args: unknown[]) => mockListProjects(...args),
}))

function makeProject(overrides: Record<string, unknown> = {}) {
  return {
    uuid: 'proj-uuid-1',
    project_name: 'Test Project',
    project_id: 'PRO-100001',
    corporation_uuid: 'corp-uuid-1',
    enable_location_wise: false,
    enable_labor: true,
    enable_material: true,
    project_status: 'Active',
    is_active: true,
    ...overrides,
  }
}

describe('GET /api/projects/options', () => {
  const mockEvent = {}

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetQuery.mockReturnValue({ corporation_uuid: 'corp-uuid-1' })
    mockListProjects.mockResolvedValue([makeProject()])
  })

  async function loadHandler() {
    const mod = await import('../../../server/api/projects/options/index.get')
    return (mod as any).default ?? mod
  }

  it('calls listProjects with the corporation_uuid from query', async () => {
    const handler = await loadHandler()
    await handler(mockEvent)
    expect(mockListProjects).toHaveBeenCalledWith('corp-uuid-1')
  })

  it('returns mapped project options with is_active: true', async () => {
    const handler = await loadHandler()
    const result = await handler(mockEvent) as { data: any[] }

    expect(result.data).toHaveLength(1)
    expect(result.data[0]).toMatchObject({
      uuid: 'proj-uuid-1',
      project_name: 'Test Project',
      project_id: 'PRO-100001',
      corporation_uuid: 'corp-uuid-1',
      is_active: true,
    })
  })

  it('includes enable_location_wise and enable_labor fields', async () => {
    mockListProjects.mockResolvedValue([
      makeProject({ enable_location_wise: true, enable_labor: false }),
    ])
    const handler = await loadHandler()
    const result = await handler(mockEvent) as { data: any[] }

    expect(result.data[0].enable_location_wise).toBe(true)
    expect(result.data[0].enable_labor).toBe(false)
  })

  it('filters out projects where is_active is explicitly false', async () => {
    mockListProjects.mockResolvedValue([
      makeProject({ uuid: 'active-1', is_active: true }),
      makeProject({ uuid: 'inactive-1', is_active: false }),
      makeProject({ uuid: 'active-2', is_active: true }),
    ])
    const handler = await loadHandler()
    const result = await handler(mockEvent) as { data: any[] }

    expect(result.data).toHaveLength(2)
    expect(result.data.map((p: any) => p.uuid)).toEqual(['active-1', 'active-2'])
  })

  it('includes projects where is_active is undefined (treated as active)', async () => {
    mockListProjects.mockResolvedValue([
      makeProject({ uuid: 'no-flag', is_active: undefined }),
    ])
    const handler = await loadHandler()
    const result = await handler(mockEvent) as { data: any[] }
    expect(result.data).toHaveLength(1)
  })

  it('returns empty array when no projects exist', async () => {
    mockListProjects.mockResolvedValue([])
    const handler = await loadHandler()
    const result = await handler(mockEvent) as { data: any[] }
    expect(result.data).toEqual([])
  })

  it('throws 400 when corporation_uuid is missing', async () => {
    mockGetQuery.mockReturnValue({})
    const handler = await loadHandler()
    await expect(handler(mockEvent)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'corporation_uuid is required',
    })
  })

  it('throws 400 when corporation_uuid is empty string', async () => {
    mockGetQuery.mockReturnValue({ corporation_uuid: '' })
    const handler = await loadHandler()
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 500 when listProjects throws an unexpected error', async () => {
    mockListProjects.mockRejectedValue(new Error('DB connection failed'))
    const handler = await loadHandler()
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 500 })
  })

  it('preserves statusCode from listProjects error', async () => {
    mockListProjects.mockRejectedValue({ statusCode: 503, statusMessage: 'DB unavailable' })
    const handler = await loadHandler()
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 503 })
  })
})
