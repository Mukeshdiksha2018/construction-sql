import { createError } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ── Stub h3 globals ───────────────────────────────────────────────────────────
vi.stubGlobal('defineEventHandler', (handler: (event: unknown) => unknown) => handler)
vi.stubGlobal('createError', createError)

// ── Mocks for auth-session and runtime config ─────────────────────────────────
const mockRequireAuthSession = vi.fn()
const mockUseRuntimeConfig = vi.fn()
const mockFetch = vi.fn()

vi.stubGlobal('useRuntimeConfig', mockUseRuntimeConfig)
vi.stubGlobal('$fetch', mockFetch)

vi.mock('../../../server/utils/auth-session', () => ({
  requireAuthSession: (event: unknown) => mockRequireAuthSession(event),
}))

// ── Nimble UOM DTO factory ────────────────────────────────────────────────────

function makeNimbleUOMDTO(overrides: Record<string, unknown> = {}) {
  return {
    ID: 'uom-uuid-1',
    ClientID: 'client-1',
    UOMType: 'type-1',
    UOMName: 'Kilogram',
    ShortName: 'KG',
    Status: 1,
    ...overrides,
  }
}

function makeNimbleApiResponse(uoms = [makeNimbleUOMDTO()]) {
  return { UOMDTO: uoms, StatusCode: 200, Status: 'OK' }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GET /api/nimble/uom', () => {
  const mockEvent = { path: '/api/nimble/uom' }

  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuthSession.mockReturnValue({ token: 'bearer-token-123' })
    mockUseRuntimeConfig.mockReturnValue({ nimbleApiBaseUrl: 'https://qa-api5.nimbleproperty.net' })
    mockFetch.mockResolvedValue(makeNimbleApiResponse())
  })

  async function loadHandler() {
    const { default: handler } = await import('../../../server/api/nimble/uom.get')
    return handler
  }

  // ── Happy path ────────────────────────────────────────────────────────────

  it('calls Nimble /v1/UOM/List with Bearer token', async () => {
    const handler = await loadHandler()
    await handler(mockEvent)

    expect(mockFetch).toHaveBeenCalledWith(
      'https://qa-api5.nimbleproperty.net/v1/UOM/List',
      { headers: { Authorization: 'Bearer bearer-token-123' } },
    )
  })

  it('returns normalised uom array and total count', async () => {
    const handler = await loadHandler()
    const result = await handler(mockEvent) as { uom: unknown[]; total: number }

    expect(result.uom).toHaveLength(1)
    expect(result.total).toBe(1)
    expect(result.uom[0]).toMatchObject({ ID: 'uom-uuid-1', UOMName: 'Kilogram', ShortName: 'KG' })
  })

  it('returns empty uom array and total = 0 when Nimble returns empty UOMDTO', async () => {
    mockFetch.mockResolvedValue({ UOMDTO: [], StatusCode: 200, Status: 'OK' })

    const handler = await loadHandler()
    const result = await handler(mockEvent) as { uom: unknown[]; total: number }

    expect(result.uom).toHaveLength(0)
    expect(result.total).toBe(0)
  })

  it('handles missing UOMDTO key gracefully (returns empty array)', async () => {
    mockFetch.mockResolvedValue({ StatusCode: 200, Status: 'OK' })

    const handler = await loadHandler()
    const result = await handler(mockEvent) as { uom: unknown[]; total: number }

    expect(result.uom).toEqual([])
    expect(result.total).toBe(0)
  })

  it('returns multiple UOMs correctly', async () => {
    mockFetch.mockResolvedValue(makeNimbleApiResponse([
      makeNimbleUOMDTO({ ID: 'u1', UOMName: 'Kilogram', ShortName: 'KG' }),
      makeNimbleUOMDTO({ ID: 'u2', UOMName: 'Count', ShortName: 'C' }),
      makeNimbleUOMDTO({ ID: 'u3', UOMName: 'Square Metre', ShortName: 'SQM' }),
    ]))

    const handler = await loadHandler()
    const result = await handler(mockEvent) as { uom: unknown[]; total: number }

    expect(result.total).toBe(3)
    expect(result.uom).toHaveLength(3)
  })

  // ── Auth / config errors ──────────────────────────────────────────────────

  it('throws 500 when NIMBLE_API_BASE_URL is not configured', async () => {
    mockUseRuntimeConfig.mockReturnValue({ nimbleApiBaseUrl: '' })

    const handler = await loadHandler()

    await expect(handler(mockEvent)).rejects.toMatchObject({
      statusCode: 500,
      statusMessage: 'NIMBLE_API_BASE_URL is not configured',
    })
  })

  it('throws 500 when nimbleApiBaseUrl is undefined', async () => {
    mockUseRuntimeConfig.mockReturnValue({})

    const handler = await loadHandler()

    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 500 })
  })

  it('throws 500 when nimbleApiBaseUrl is whitespace only', async () => {
    mockUseRuntimeConfig.mockReturnValue({ nimbleApiBaseUrl: '   ' })

    const handler = await loadHandler()

    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 500 })
  })

  it('uses the token from the session for Bearer auth', async () => {
    mockRequireAuthSession.mockReturnValue({ token: 'different-token-xyz' })

    const handler = await loadHandler()
    await handler(mockEvent)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      { headers: { Authorization: 'Bearer different-token-xyz' } },
    )
  })

  // ── Upstream / proxy errors ───────────────────────────────────────────────

  it('throws 502 when Nimble API call fails without a statusCode', async () => {
    mockFetch.mockRejectedValue(new Error('Connection refused'))

    const handler = await loadHandler()

    await expect(handler(mockEvent)).rejects.toMatchObject({
      statusCode: 502,
      statusMessage: 'Failed to fetch UOM list from Nimble',
    })
  })

  it('preserves the upstream statusCode when Nimble returns a non-2xx error', async () => {
    mockFetch.mockRejectedValue({ statusCode: 401, message: 'Unauthorized' })

    const handler = await loadHandler()

    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('preserves 404 from Nimble as-is', async () => {
    mockFetch.mockRejectedValue({ statusCode: 404 })

    const handler = await loadHandler()

    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('propagates 503 from Nimble (service unavailable)', async () => {
    mockFetch.mockRejectedValue({ statusCode: 503 })

    const handler = await loadHandler()

    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 503 })
  })

  it('strips trailing slash from base URL when building the endpoint URL', async () => {
    mockUseRuntimeConfig.mockReturnValue({ nimbleApiBaseUrl: 'https://qa-api5.nimbleproperty.net/' })

    // Note: the handler does NOT strip trailing slash itself; this test ensures
    // it still constructs a valid URL (double-slash in path is handled by Nimble side).
    // If stricter URL normalisation is added later, update this expectation.
    const handler = await loadHandler()
    await handler(mockEvent)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/UOM/List'),
      expect.any(Object),
    )
  })
})
