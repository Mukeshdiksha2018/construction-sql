import { createError } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ── Stub h3 globals ───────────────────────────────────────────────────────────
vi.stubGlobal('defineEventHandler', (handler: (event: unknown) => unknown) => handler)
vi.stubGlobal('createError', createError)

// ── Mocks ─────────────────────────────────────────────────────────────────────
const mockRequireAuthSession = vi.fn()
const mockUseRuntimeConfig = vi.fn()
const mockFetch = vi.fn()
const mockGetQuery = vi.fn()

vi.stubGlobal('useRuntimeConfig', mockUseRuntimeConfig)
vi.stubGlobal('$fetch', mockFetch)
vi.stubGlobal('getQuery', mockGetQuery)

vi.mock('../../../server/utils/auth-session', () => ({
  requireAuthSession: (event: unknown) => mockRequireAuthSession(event),
}))

// ── Factories ─────────────────────────────────────────────────────────────────

const CORP_UUID = 'corp-test-uuid-1'
const BASE_URL = 'https://core-api.nimbleproperty.net'
const BEARER_TOKEN = 'bearer-token-xyz'

function makeAccountDTO(overrides: Record<string, unknown> = {}) {
  return {
    ID: 'acct-uuid-1',
    Number: '10000.000',
    Name: '10000.000. Cash',
    AccountTypeName: 'Bank',
    AccountTypeID: 'type-uuid-bank',
    AccountTypeOrder: 2,
    CorporationID: undefined,
    AccountStatus: 1,
    IsAllow: 1,
    IsAllowAccount: true,
    ...overrides,
  }
}

function makeNimbleResponse(accounts = [makeAccountDTO()]) {
  return { Accounts: accounts, TotalCount: accounts.length }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GET /api/nimble/chart-of-accounts', () => {
  const mockEvent = { path: '/api/nimble/chart-of-accounts' }

  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuthSession.mockReturnValue({ token: BEARER_TOKEN })
    mockUseRuntimeConfig.mockReturnValue({
      public: { nimbleCoreApiUrl: BASE_URL },
    })
    mockGetQuery.mockReturnValue({ corporation_uuid: CORP_UUID })
    mockFetch.mockResolvedValue(makeNimbleResponse())
  })

  async function loadHandler() {
    vi.resetModules()
    const { default: handler } = await import('../../../server/api/nimble/chart-of-accounts.get')
    return handler as (event: unknown) => Promise<unknown>
  }

  // ── Happy path ────────────────────────────────────────────────────────────

  it('calls Nimble Core API /v1/accounts with correct query parameters', async () => {
    const handler = await loadHandler()
    await handler(mockEvent)

    expect(mockFetch).toHaveBeenCalledWith(
      `${BASE_URL}/v1/accounts`,
      expect.objectContaining({
        query: expect.objectContaining({
          AccountTypeID: '000000000000000000000000000000000000',
          IsInactive: false,
          CorpID: CORP_UUID,
        }),
      }),
    )
  })

  it('sends Bearer token in the Authorization header', async () => {
    const handler = await loadHandler()
    await handler(mockEvent)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: { Authorization: `Bearer ${BEARER_TOKEN}` },
      }),
    )
  })

  it('uses a different token when session provides one', async () => {
    mockRequireAuthSession.mockReturnValue({ token: 'another-token' })

    const handler = await loadHandler()
    await handler(mockEvent)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: { Authorization: 'Bearer another-token' },
      }),
    )
  })

  it('returns accounts array and total count', async () => {
    const handler = await loadHandler()
    const result = await handler(mockEvent) as { accounts: unknown[]; total: number }

    expect(result.accounts).toHaveLength(1)
    expect(result.total).toBe(1)
    expect(result.accounts[0]).toMatchObject({ ID: 'acct-uuid-1' })
  })

  it('returns multiple accounts correctly', async () => {
    mockFetch.mockResolvedValue(makeNimbleResponse([
      makeAccountDTO({ ID: 'a1', Number: '10000.000' }),
      makeAccountDTO({ ID: 'a2', Number: '20000.000' }),
      makeAccountDTO({ ID: 'a3', Number: '30000.000' }),
    ]))

    const handler = await loadHandler()
    const result = await handler(mockEvent) as { accounts: unknown[]; total: number }

    expect(result.total).toBe(3)
    expect(result.accounts).toHaveLength(3)
  })

  it('returns empty accounts array when Nimble returns empty Accounts', async () => {
    mockFetch.mockResolvedValue({ Accounts: [], TotalCount: 0 })

    const handler = await loadHandler()
    const result = await handler(mockEvent) as { accounts: unknown[]; total: number }

    expect(result.accounts).toHaveLength(0)
    expect(result.total).toBe(0)
  })

  it('handles missing Accounts key gracefully (returns empty array)', async () => {
    mockFetch.mockResolvedValue({ TotalCount: 0 })

    const handler = await loadHandler()
    const result = await handler(mockEvent) as { accounts: unknown[]; total: number }

    expect(result.accounts).toEqual([])
    expect(result.total).toBe(0)
  })

  it('strips a trailing slash from the base URL so the path has no double-slash', async () => {
    mockUseRuntimeConfig.mockReturnValue({
      public: { nimbleCoreApiUrl: `${BASE_URL}/` },
    })

    const handler = await loadHandler()
    await handler(mockEvent)

    const calledUrl = mockFetch.mock.calls[0]?.[0] as string
    // The protocol "https://" is expected; verify there is no double-slash in the path
    const pathPart = calledUrl.replace(/^https?:\/\//, '')
    expect(pathPart).not.toContain('//')
    expect(calledUrl).toContain('/v1/accounts')
  })

  // ── Configuration errors ──────────────────────────────────────────────────

  it('throws 500 when NUXT_PUBLIC_NIMBLE_CORE_API_URL is not configured (empty string)', async () => {
    mockUseRuntimeConfig.mockReturnValue({ public: { nimbleCoreApiUrl: '' } })

    const handler = await loadHandler()

    await expect(handler(mockEvent)).rejects.toMatchObject({
      statusCode: 500,
      statusMessage: 'NUXT_PUBLIC_NIMBLE_CORE_API_URL is not configured',
    })
  })

  it('throws 500 when nimbleCoreApiUrl is undefined', async () => {
    mockUseRuntimeConfig.mockReturnValue({ public: {} })

    const handler = await loadHandler()

    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 500 })
  })

  it('throws 500 when nimbleCoreApiUrl is whitespace only', async () => {
    mockUseRuntimeConfig.mockReturnValue({ public: { nimbleCoreApiUrl: '   ' } })

    const handler = await loadHandler()

    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 500 })
  })

  it('throws when public config is absent entirely (no nimbleCoreApiUrl)', async () => {
    // When config.public is completely absent, accessing .nimbleCoreApiUrl throws.
    // The handler is expected to reject for any reason in this misconfiguration case.
    mockUseRuntimeConfig.mockReturnValue({})

    const handler = await loadHandler()

    await expect(handler(mockEvent)).rejects.toThrow()
  })

  // ── Query parameter validation ────────────────────────────────────────────

  it('throws 400 when corporation_uuid query param is missing', async () => {
    mockGetQuery.mockReturnValue({})

    const handler = await loadHandler()

    await expect(handler(mockEvent)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'corporation_uuid query parameter is required',
    })
  })

  it('throws 400 when corporation_uuid is an empty string', async () => {
    mockGetQuery.mockReturnValue({ corporation_uuid: '' })

    const handler = await loadHandler()

    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('passes corporation_uuid directly to CorpID', async () => {
    mockGetQuery.mockReturnValue({ corporation_uuid: 'UPPER-CORP-UUID' })

    const handler = await loadHandler()
    await handler(mockEvent)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        query: expect.objectContaining({ CorpID: 'UPPER-CORP-UUID' }),
      }),
    )
  })

  // ── Upstream / proxy errors ───────────────────────────────────────────────

  it('throws 502 when Nimble API fails without a statusCode', async () => {
    mockFetch.mockRejectedValue(new Error('Connection refused'))

    const handler = await loadHandler()

    await expect(handler(mockEvent)).rejects.toMatchObject({
      statusCode: 502,
      statusMessage: 'Failed to fetch chart of accounts from Nimble',
    })
  })

  it('preserves upstream statusCode when Nimble returns a 401', async () => {
    mockFetch.mockRejectedValue({ statusCode: 401, message: 'Unauthorized' })

    const handler = await loadHandler()

    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('preserves upstream 404 from Nimble', async () => {
    mockFetch.mockRejectedValue({ statusCode: 404 })

    const handler = await loadHandler()

    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('preserves upstream 503 from Nimble', async () => {
    mockFetch.mockRejectedValue({ statusCode: 503 })

    const handler = await loadHandler()

    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 503 })
  })

  it('includes error details in the thrown error data', async () => {
    mockFetch.mockRejectedValue(new Error('Timeout'))

    const handler = await loadHandler()

    await expect(handler(mockEvent)).rejects.toMatchObject({
      data: { details: expect.stringContaining('Timeout') },
    })
  })

  // ── Auth session ──────────────────────────────────────────────────────────

  it('calls requireAuthSession with the event object', async () => {
    const handler = await loadHandler()
    await handler(mockEvent)

    expect(mockRequireAuthSession).toHaveBeenCalledWith(mockEvent)
  })

  it('throws when requireAuthSession throws (unauthenticated request)', async () => {
    mockRequireAuthSession.mockImplementation(() => {
      throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })
    })

    const handler = await loadHandler()

    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 401 })
  })
})
