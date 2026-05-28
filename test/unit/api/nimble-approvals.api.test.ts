import { createError } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.stubGlobal('defineEventHandler', (handler: (event: unknown) => unknown) => handler)
vi.stubGlobal('createError', createError)

const mockRequireAuthSession = vi.fn()
const mockUseRuntimeConfig = vi.fn()
const mockFetch = vi.fn()
const mockGetQuery = vi.fn()
const mockReadBody = vi.fn()

vi.stubGlobal('useRuntimeConfig', mockUseRuntimeConfig)
vi.stubGlobal('$fetch', mockFetch)
vi.stubGlobal('getQuery', mockGetQuery)
vi.stubGlobal('readBody', mockReadBody)

vi.mock('../../../server/utils/auth-session', () => ({
  requireAuthSession: (event: unknown) => mockRequireAuthSession(event),
}))

const CORP_ID_1 = 'A610047122DB6DA649007E1AE35796FD0000'
const CORP_ID_2 = '900EFA7F4B6F129445B270016309E4C10000'

function makeApprovalEntry(overrides: Record<string, unknown> = {}) {
  return {
    corporationID: CORP_ID_1,
    name: 'Test User',
    userName: 'test@example.com',
    userID: '0E557AC7108390BC4599830AA53AF0240000',
    approvalOrder: 1,
    approvalType: 2,
    isCurrentUser: false,
    ...overrides,
  }
}

describe('GET /api/nimble/approvals', () => {
  const mockEvent = { path: '/api/nimble/approvals' }
  const API3_URL = 'https://qa-api3.nimbleproperty.net'

  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuthSession.mockReturnValue({ token: 'test-token' })
    mockUseRuntimeConfig.mockReturnValue({ nimbleApi3Url: API3_URL })
    mockGetQuery.mockReturnValue({ screenType: '21' })
    mockReadBody.mockResolvedValue([CORP_ID_1, CORP_ID_2])
    mockFetch.mockResolvedValue([makeApprovalEntry()])
  })

  async function loadHandler() {
    vi.resetModules()
    const mod = await import('../../../server/api/nimble/approvals.get')
    return (mod as any).default ?? mod
  }

  it('calls Nimble /v1/GetUserApprovalDetails with Bearer token', async () => {
    const handler = await loadHandler()
    await handler(mockEvent)

    expect(mockFetch).toHaveBeenCalledWith(
      `${API3_URL}/v1/GetUserApprovalDetails`,
      expect.objectContaining({
        method: 'POST',
        headers: { Authorization: 'Bearer test-token' },
      }),
    )
  })

  it('passes screenType as a query param', async () => {
    mockGetQuery.mockReturnValue({ screenType: '20' })
    const handler = await loadHandler()
    await handler(mockEvent)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ query: { screenType: 20 } }),
    )
  })

  it('defaults screenType to 21 when not provided', async () => {
    mockGetQuery.mockReturnValue({})
    const handler = await loadHandler()
    await handler(mockEvent)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ query: { screenType: 21 } }),
    )
  })

  it('passes corporation IDs as the request body', async () => {
    const handler = await loadHandler()
    await handler(mockEvent)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ body: [CORP_ID_1, CORP_ID_2] }),
    )
  })

  it('maps Nimble response to normalized approval entries', async () => {
    mockFetch.mockResolvedValue([
      makeApprovalEntry({
        corporationID: CORP_ID_1.toUpperCase(),
        userID: '0E557AC7108390BC4599830AA53AF0240000',
        isCurrentUser: true,
      }),
    ])
    const handler = await loadHandler()
    const result = await handler(mockEvent) as { approvals: any[] }

    expect(result.approvals).toHaveLength(1)
    expect(result.approvals[0]).toMatchObject({
      corporationId: CORP_ID_1.toLowerCase(),
      name: 'Test User',
      userName: 'test@example.com',
      userId: '0e557ac7108390bc4599830aa53af0240000',
      approvalOrder: 1,
      approvalType: 2,
      isCurrentUser: true,
    })
  })

  it('lowercases corporationId and userId', async () => {
    mockFetch.mockResolvedValue([
      makeApprovalEntry({ corporationID: 'UPPER-CORP-ID', userID: 'UPPER-USER-ID' }),
    ])
    const handler = await loadHandler()
    const result = await handler(mockEvent) as { approvals: any[] }

    expect(result.approvals[0].corporationId).toBe('upper-corp-id')
    expect(result.approvals[0].userId).toBe('upper-user-id')
  })

  it('returns empty approvals when corporation IDs array is empty', async () => {
    mockReadBody.mockResolvedValue([])
    const handler = await loadHandler()
    const result = await handler(mockEvent) as { approvals: any[] }

    expect(result.approvals).toEqual([])
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('returns empty approvals when body is missing', async () => {
    mockReadBody.mockResolvedValue(null)
    const handler = await loadHandler()
    const result = await handler(mockEvent) as { approvals: any[] }
    expect(result.approvals).toEqual([])
  })

  it('handles { corporationIds: [...] } body shape', async () => {
    mockReadBody.mockResolvedValue({ corporationIds: [CORP_ID_1] })
    const handler = await loadHandler()
    await handler(mockEvent)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ body: [CORP_ID_1] }),
    )
  })

  it('handles Nimble returning empty array', async () => {
    mockFetch.mockResolvedValue([])
    const handler = await loadHandler()
    const result = await handler(mockEvent) as { approvals: any[] }
    expect(result.approvals).toEqual([])
  })

  it('throws 500 when NIMBLE_API3_URL is not configured', async () => {
    mockUseRuntimeConfig.mockReturnValue({ nimbleApi3Url: '' })
    const handler = await loadHandler()
    await expect(handler(mockEvent)).rejects.toMatchObject({
      statusCode: 500,
      statusMessage: 'NIMBLE_API3_URL is not configured',
    })
  })

  it('throws 502 when Nimble API call fails', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))
    const handler = await loadHandler()
    await expect(handler(mockEvent)).rejects.toMatchObject({
      statusCode: 502,
      statusMessage: 'Failed to fetch approval details from Nimble',
    })
  })

  it('preserves upstream status code from Nimble error', async () => {
    mockFetch.mockRejectedValue({ statusCode: 401, message: 'Unauthorized' })
    const handler = await loadHandler()
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('handles multiple approval entries across different corporations', async () => {
    mockFetch.mockResolvedValue([
      makeApprovalEntry({ corporationID: CORP_ID_1, name: 'User One', approvalOrder: 1 }),
      makeApprovalEntry({ corporationID: CORP_ID_2, name: 'User Two', approvalOrder: 2 }),
      makeApprovalEntry({ corporationID: CORP_ID_1, name: 'User Three', approvalOrder: 3 }),
    ])
    const handler = await loadHandler()
    const result = await handler(mockEvent) as { approvals: any[] }

    expect(result.approvals).toHaveLength(3)
    const corp1Entries = result.approvals.filter((a: any) => a.corporationId === CORP_ID_1.toLowerCase())
    expect(corp1Entries).toHaveLength(2)
  })
})
