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
const BASE_URL = 'https://qa-api3.nimbleproperty.net'
const BEARER_TOKEN = 'bearer-token-abc'

function makeVendorDTO(overrides: Record<string, unknown> = {}) {
  return {
    vendorID: 'vendor-uuid-1',
    vendorName: 'Acme Supplies',
    corporationID: CORP_UUID,
    corporationName: 'Test Corp',
    clientName: 'qa22',
    federalID: '12-3456789',
    creditDays: 30,
    paymentMethodID: 'pm-uuid-1',
    paymentMethodName: 'CHECK',
    status: 1,
    addressDetails: [],
    contractDetails: [],
    ...overrides,
  }
}

function makeNimbleResponse(vendors = [makeVendorDTO()]) {
  return { vendorContractMasterList: vendors, statusCode: 200, status: 'Success' }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GET /api/nimble/vendors', () => {
  const mockEvent = { path: '/api/nimble/vendors' }

  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuthSession.mockReturnValue({ token: BEARER_TOKEN })
    mockUseRuntimeConfig.mockReturnValue({ nimbleApi3Url: BASE_URL })
    mockGetQuery.mockReturnValue({ corporation_uuid: CORP_UUID })
    mockFetch.mockResolvedValue(makeNimbleResponse())
  })

  async function loadHandler() {
    vi.resetModules()
    const { default: handler } = await import('../../../server/api/nimble/vendors.get')
    return handler as (event: unknown) => Promise<unknown>
  }

  // ── Happy path ────────────────────────────────────────────────────────────

  it('calls Nimble API3 /v1/VendorContractMaster/List with CorpID', async () => {
    const handler = await loadHandler()
    await handler(mockEvent)

    expect(mockFetch).toHaveBeenCalledWith(
      `${BASE_URL}/v1/VendorContractMaster/List`,
      expect.objectContaining({
        query: { CorpID: 'corptestuuid1' },
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
    mockRequireAuthSession.mockReturnValue({ token: 'other-token-xyz' })

    const handler = await loadHandler()
    await handler(mockEvent)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ headers: { Authorization: 'Bearer other-token-xyz' } }),
    )
  })

  it('returns vendors array and total count', async () => {
    const handler = await loadHandler()
    const result = await handler(mockEvent) as { vendors: unknown[]; total: number }

    expect(result.vendors).toHaveLength(1)
    expect(result.total).toBe(1)
    expect(result.vendors[0]).toMatchObject({ vendorID: 'vendor-uuid-1' })
  })

  it('returns multiple vendors correctly', async () => {
    mockFetch.mockResolvedValue(makeNimbleResponse([
      makeVendorDTO({ vendorID: 'v1', vendorName: 'Vendor A' }),
      makeVendorDTO({ vendorID: 'v2', vendorName: 'Vendor B' }),
      makeVendorDTO({ vendorID: 'v3', vendorName: 'Vendor C' }),
    ]))

    const handler = await loadHandler()
    const result = await handler(mockEvent) as { vendors: unknown[]; total: number }

    expect(result.total).toBe(3)
    expect(result.vendors).toHaveLength(3)
  })

  it('returns empty vendors array when Nimble returns empty list', async () => {
    mockFetch.mockResolvedValue({ vendorContractMasterList: [], statusCode: 200, status: 'Success' })

    const handler = await loadHandler()
    const result = await handler(mockEvent) as { vendors: unknown[]; total: number }

    expect(result.vendors).toHaveLength(0)
    expect(result.total).toBe(0)
  })

  it('handles missing vendorContractMasterList key gracefully', async () => {
    mockFetch.mockResolvedValue({ statusCode: 200, status: 'Success' })

    const handler = await loadHandler()
    const result = await handler(mockEvent) as { vendors: unknown[]; total: number }

    expect(result.vendors).toEqual([])
    expect(result.total).toBe(0)
  })

  it('strips trailing slash from the base URL', async () => {
    mockUseRuntimeConfig.mockReturnValue({ nimbleApi3Url: `${BASE_URL}/` })

    const handler = await loadHandler()
    await handler(mockEvent)

    const calledUrl = mockFetch.mock.calls[0]?.[0] as string
    const pathPart = calledUrl.replace(/^https?:\/\//, '')
    expect(pathPart).not.toContain('//')
    expect(calledUrl).toContain('/v1/VendorContractMaster/List')
  })

  // ── Configuration errors ──────────────────────────────────────────────────

  it('throws 500 when NIMBLE_API3_URL is not configured (empty string)', async () => {
    mockUseRuntimeConfig.mockReturnValue({ nimbleApi3Url: '' })

    const handler = await loadHandler()

    await expect(handler(mockEvent)).rejects.toMatchObject({
      statusCode: 500,
      statusMessage: 'NIMBLE_API3_URL is not configured',
    })
  })

  it('throws 500 when nimbleApi3Url is undefined', async () => {
    mockUseRuntimeConfig.mockReturnValue({})

    const handler = await loadHandler()

    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 500 })
  })

  it('throws 500 when nimbleApi3Url is whitespace only', async () => {
    mockUseRuntimeConfig.mockReturnValue({ nimbleApi3Url: '   ' })

    const handler = await loadHandler()

    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 500 })
  })

  // ── Query parameter validation ────────────────────────────────────────────

  it('throws 400 when corporation_uuid is missing', async () => {
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

  it('passes corporation_uuid directly to CorpID query param', async () => {
    mockGetQuery.mockReturnValue({ corporation_uuid: 'UPPER-CORP-ID' })

    const handler = await loadHandler()
    await handler(mockEvent)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ query: { CorpID: 'UPPERCORPID' } }),
    )
  })

  // ── Upstream / proxy errors ───────────────────────────────────────────────

  it('throws 502 when Nimble API fails without a statusCode', async () => {
    mockFetch.mockRejectedValue(new Error('Connection refused'))

    const handler = await loadHandler()

    await expect(handler(mockEvent)).rejects.toMatchObject({
      statusCode: 502,
      statusMessage: 'Failed to fetch vendors from Nimble',
    })
  })

  it('preserves upstream 401 from Nimble', async () => {
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
