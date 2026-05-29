import { createError } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.stubGlobal('defineEventHandler', (handler: (event: unknown) => unknown) => handler)
vi.stubGlobal('createError', createError)

const mockBuild = vi.fn()
const mockGetQuery = vi.fn()

vi.stubGlobal('getQuery', mockGetQuery)

vi.mock('../../../server/utils/estimateQuantityAvailability', () => ({
  buildUsedQuantitiesByItem: (...args: unknown[]) => mockBuild(...args),
}))

describe('GET /api/estimate-quantity-availability', () => {
  const mockEvent = { path: '/api/estimate-quantity-availability' }

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetQuery.mockReturnValue({
      corporation_uuid: 'corp-1',
      project_uuid: 'proj-1',
      estimate_uuid: 'est-1',
    })
    mockBuild.mockResolvedValue({ 'item-1-cc-1': 5 })
  })

  async function loadHandler() {
    vi.resetModules()
    const { default: handler } = await import(
      '../../../server/api/estimate-quantity-availability/index.get'
    )
    return handler as (event: unknown) => Promise<{ data: Record<string, number> }>
  }

  it('requires corporation, project, and estimate uuids', async () => {
    mockGetQuery.mockReturnValue({ corporation_uuid: '', project_uuid: '', estimate_uuid: '' })
    const handler = await loadHandler()
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('returns used quantities map from builder', async () => {
    const handler = await loadHandler()
    const result = await handler(mockEvent)

    expect(mockBuild).toHaveBeenCalledWith({
      corporationUuid: 'corp-1',
      projectUuid: 'proj-1',
      estimateUuid: 'est-1',
      excludePoUuid: undefined,
    })
    expect(result.data).toEqual({ 'item-1-cc-1': 5 })
  })

  it('passes exclude_po_uuid when editing an existing PO', async () => {
    mockGetQuery.mockReturnValue({
      corporation_uuid: 'corp-1',
      project_uuid: 'proj-1',
      estimate_uuid: 'est-1',
      exclude_po_uuid: 'po-current',
    })
    const handler = await loadHandler()
    await handler(mockEvent)

    expect(mockBuild).toHaveBeenCalledWith(
      expect.objectContaining({ excludePoUuid: 'po-current' }),
    )
  })
})
