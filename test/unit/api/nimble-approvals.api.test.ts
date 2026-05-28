import { createError } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.stubGlobal('defineEventHandler', (handler: (event: unknown) => unknown) => handler)
vi.stubGlobal('createError', createError)

const mockRequireAuthSession = vi.fn()
const mockUseRuntimeConfig = vi.fn()
const mockFetch = vi.fn()
const mockReadBody = vi.fn()

vi.stubGlobal('useRuntimeConfig', mockUseRuntimeConfig)
vi.stubGlobal('$fetch', mockFetch)
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

describe('POST /api/nimble/approvals', () => {
  const mockEvent = { path: '/api/nimble/approvals' }
  const API3_URL = 'https://qa-api3.nimbleproperty.net'

  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuthSession.mockReturnValue({ token: 'test-token' })
    mockUseRuntimeConfig.mockReturnValue({ nimbleApi3Url: API3_URL })
    mockReadBody.mockResolvedValue([CORP_ID_1, CORP_ID_2])
    mockFetch.mockResolvedValue([makeApprovalEntry()])
  })

  async function loadHandler() {
    vi.resetModules()
    const mod = await import('../../../server/api/nimble/approvals.post')
    return (mod as any).default ?? mod
  }

  // ── Correct Nimble endpoint & method ──────────────────────────────────────

  it('calls Nimble /v1/GetUserApprovalDetails with POST and Bearer token', async () => {
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

  it('always uses screenType=21 (Bill/PO/Estimate workflow)', async () => {
    const handler = await loadHandler()
    await handler(mockEvent)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ query: { screenType: 21 } }),
    )
  })

  it('never accepts a different screenType — always hardcoded to 21', async () => {
    // Even if the client sends something in query, the server ignores it
    const handler = await loadHandler()
    await handler(mockEvent)

    const call = mockFetch.mock.calls[0]
    expect(call[1].query.screenType).toBe(21)
  })

  // ── Corporation IDs ────────────────────────────────────────────────────────

  it('passes corporation IDs as the Nimble request body', async () => {
    const handler = await loadHandler()
    await handler(mockEvent)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ body: [CORP_ID_1, CORP_ID_2] }),
    )
  })

  it('accepts array body directly', async () => {
    mockReadBody.mockResolvedValue([CORP_ID_1])
    const handler = await loadHandler()
    await handler(mockEvent)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ body: [CORP_ID_1] }),
    )
  })

  it('accepts { corporationIds: [...] } body shape', async () => {
    mockReadBody.mockResolvedValue({ corporationIds: [CORP_ID_1] })
    const handler = await loadHandler()
    await handler(mockEvent)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ body: [CORP_ID_1] }),
    )
  })

  // ── Response mapping ──────────────────────────────────────────────────────

  it('maps Nimble response to normalized approval entries', async () => {
    mockFetch.mockResolvedValue([
      makeApprovalEntry({
        corporationID: CORP_ID_1.toUpperCase(),
        userID: '0E557AC7108390BC4599830AA53AF0240000',
        approvalType: 2,
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

  it('maps approvalType values correctly (1=Entry, 2=Verify, 3=Approve)', async () => {
    mockFetch.mockResolvedValue([
      makeApprovalEntry({ approvalType: 1, name: 'Entry User' }),
      makeApprovalEntry({ approvalType: 2, name: 'Verify User' }),
      makeApprovalEntry({ approvalType: 3, name: 'Approve User' }),
    ])
    const handler = await loadHandler()
    const result = await handler(mockEvent) as { approvals: any[] }

    const types = result.approvals.map((a: any) => a.approvalType)
    expect(types).toEqual([1, 2, 3])
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

  it('isCurrentUser is correctly cast to boolean', async () => {
    mockFetch.mockResolvedValue([
      makeApprovalEntry({ isCurrentUser: true }),
      makeApprovalEntry({ isCurrentUser: false }),
    ])
    const handler = await loadHandler()
    const result = await handler(mockEvent) as { approvals: any[] }

    expect(result.approvals[0].isCurrentUser).toBe(true)
    expect(result.approvals[1].isCurrentUser).toBe(false)
  })

  // ── Empty / edge cases ────────────────────────────────────────────────────

  it('returns empty approvals when corporation IDs array is empty', async () => {
    mockReadBody.mockResolvedValue([])
    const handler = await loadHandler()
    const result = await handler(mockEvent) as { approvals: any[] }

    expect(result.approvals).toEqual([])
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('returns empty approvals when body is null', async () => {
    mockReadBody.mockResolvedValue(null)
    const handler = await loadHandler()
    const result = await handler(mockEvent) as { approvals: any[] }
    expect(result.approvals).toEqual([])
  })

  it('handles Nimble returning an empty array', async () => {
    mockFetch.mockResolvedValue([])
    const handler = await loadHandler()
    const result = await handler(mockEvent) as { approvals: any[] }
    expect(result.approvals).toEqual([])
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
    const corp1 = result.approvals.filter((a: any) => a.corporationId === CORP_ID_1.toLowerCase())
    expect(corp1).toHaveLength(2)
  })

  // ── Error handling ────────────────────────────────────────────────────────

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
})
