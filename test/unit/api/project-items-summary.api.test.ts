import { createError } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.stubGlobal('defineEventHandler', (handler: (event: unknown) => unknown) => handler)
vi.stubGlobal('createError', createError)

const mockBuild = vi.fn()
const mockGetQuery = vi.fn()

vi.stubGlobal('getQuery', mockGetQuery)

vi.mock('../../../server/utils/projectItemsSummary', () => ({
  buildProjectItemsSummary: (...args: unknown[]) => mockBuild(...args),
}))

describe('GET /api/project-items-summary', () => {
  const mockEvent = { path: '/api/project-items-summary' }

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetQuery.mockReturnValue({
      corporation_uuid: 'corp-1',
      project_uuid: 'proj-1',
    })
    mockBuild.mockResolvedValue([{ item_uuid: 'item-1', budget_qty: 10, po_qty: 0, pending_qty: 10 }])
  })

  async function loadHandler() {
    vi.resetModules()
    const { default: handler } = await import('../../../server/api/project-items-summary/index.get')
    return handler as (event: unknown) => Promise<{ data: unknown[] }>
  }

  it('requires corporation and project uuids', async () => {
    mockGetQuery.mockReturnValue({ corporation_uuid: '', project_uuid: '' })
    const handler = await loadHandler()
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('returns summary rows from builder', async () => {
    const handler = await loadHandler()
    const result = await handler(mockEvent)

    expect(mockBuild).toHaveBeenCalledWith({
      corporationUuid: 'corp-1',
      projectUuid: 'proj-1',
      vendorUuid: undefined,
      location: undefined,
    })
    expect(result.data).toHaveLength(1)
    expect(result.data[0]).toMatchObject({ pending_qty: 10 })
  })
})
