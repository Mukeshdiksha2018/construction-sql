import { createError } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.stubGlobal('defineEventHandler', (handler: (event: unknown) => unknown) => handler)
vi.stubGlobal('createError', createError)

const mockRequireAuthSession = vi.fn()
const mockUseRuntimeConfig = vi.fn()
const mockFetch = vi.fn()

vi.stubGlobal('useRuntimeConfig', mockUseRuntimeConfig)
vi.stubGlobal('$fetch', mockFetch)

vi.mock('../../../server/utils/auth-session', () => ({
  requireAuthSession: (event: unknown) => mockRequireAuthSession(event),
}))

function makeShipViaDto(overrides: Record<string, unknown> = {}) {
  return { ID: 'SV-UUID-001', ShipViaName: 'BlueDart', Description: null, Status: 1, ...overrides }
}

function makeNimbleResponse(items = [makeShipViaDto()]) {
  return { ShipViaDto: items, StatusCode: 200, Status: 'Success' }
}

describe('GET /api/ship-via', () => {
  const mockEvent = { path: '/api/ship-via' }

  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuthSession.mockReturnValue({ token: 'test-bearer-token' })
    mockUseRuntimeConfig.mockReturnValue({ nimbleApiBaseUrl: 'https://qa-api5.nimbleproperty.net' })
    mockFetch.mockResolvedValue(makeNimbleResponse())
  })

  async function loadHandler() {
    const mod = await import('../../../server/api/ship-via/index.get')
    return (mod as any).default ?? mod
  }

  it('calls Nimble /v1/ShipVia/List with Bearer token', async () => {
    const handler = await loadHandler()
    await handler(mockEvent)

    expect(mockFetch).toHaveBeenCalledWith(
      'https://qa-api5.nimbleproperty.net/v1/ShipVia/List',
      { headers: { Authorization: 'Bearer test-bearer-token' } },
    )
  })

  it('maps ShipViaDto to { uuid, ship_via, description, active }', async () => {
    mockFetch.mockResolvedValue(makeNimbleResponse([
      makeShipViaDto({ ID: 'ABCD1234', ShipViaName: 'BlueDart', Description: 'Fast courier', Status: 1 }),
    ]))

    const handler = await loadHandler()
    const result = await handler(mockEvent) as { data: any[] }

    expect(result.data).toHaveLength(1)
    expect(result.data[0]).toMatchObject({
      uuid: 'abcd1234',
      ship_via: 'BlueDart',
      description: 'Fast courier',
      active: true,
    })
  })

  it('lowercases the uuid', async () => {
    mockFetch.mockResolvedValue(makeNimbleResponse([
      makeShipViaDto({ ID: 'UPPER-CASE-ID-123' }),
    ]))
    const handler = await loadHandler()
    const result = await handler(mockEvent) as { data: any[] }
    expect(result.data[0].uuid).toBe('upper-case-id-123')
  })

  it('sets active=false for Status !== 1', async () => {
    mockFetch.mockResolvedValue(makeNimbleResponse([
      makeShipViaDto({ Status: 0 }),
      makeShipViaDto({ ID: 'SV2', Status: 2 }),
    ]))
    const handler = await loadHandler()
    const result = await handler(mockEvent) as { data: any[] }

    expect(result.data[0].active).toBe(false)
    expect(result.data[1].active).toBe(false)
  })

  it('handles null Description gracefully', async () => {
    mockFetch.mockResolvedValue(makeNimbleResponse([makeShipViaDto({ Description: null })]))
    const handler = await loadHandler()
    const result = await handler(mockEvent) as { data: any[] }
    expect(result.data[0].description).toBeNull()
  })

  it('returns empty data array when ShipViaDto is empty', async () => {
    mockFetch.mockResolvedValue({ ShipViaDto: [], StatusCode: 200, Status: 'Success' })
    const handler = await loadHandler()
    const result = await handler(mockEvent) as { data: any[] }
    expect(result.data).toEqual([])
  })

  it('handles missing ShipViaDto key (returns empty array)', async () => {
    mockFetch.mockResolvedValue({ StatusCode: 200, Status: 'Success' })
    const handler = await loadHandler()
    const result = await handler(mockEvent) as { data: any[] }
    expect(result.data).toEqual([])
  })

  it('returns multiple ship-via items', async () => {
    mockFetch.mockResolvedValue(makeNimbleResponse([
      makeShipViaDto({ ID: 'sv1', ShipViaName: 'BlueDart' }),
      makeShipViaDto({ ID: 'sv2', ShipViaName: 'FedEx' }),
      makeShipViaDto({ ID: 'sv3', ShipViaName: 'DHL' }),
    ]))
    const handler = await loadHandler()
    const result = await handler(mockEvent) as { data: any[] }
    expect(result.data).toHaveLength(3)
    expect(result.data.map((d: any) => d.ship_via)).toEqual(['BlueDart', 'FedEx', 'DHL'])
  })

  it('throws 500 when NIMBLE_API_BASE_URL is not configured', async () => {
    mockUseRuntimeConfig.mockReturnValue({ nimbleApiBaseUrl: '' })
    const handler = await loadHandler()
    await expect(handler(mockEvent)).rejects.toMatchObject({
      statusCode: 500,
      statusMessage: 'NIMBLE_API_BASE_URL is not configured',
    })
  })

  it('throws 500 when nimbleApiBaseUrl is whitespace only', async () => {
    mockUseRuntimeConfig.mockReturnValue({ nimbleApiBaseUrl: '   ' })
    const handler = await loadHandler()
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 500 })
  })

  it('uses the session token for auth', async () => {
    mockRequireAuthSession.mockReturnValue({ token: 'another-token-abc' })
    const handler = await loadHandler()
    await handler(mockEvent)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      { headers: { Authorization: 'Bearer another-token-abc' } },
    )
  })

  it('throws 502 when Nimble API call fails without statusCode', async () => {
    mockFetch.mockRejectedValue(new Error('Connection refused'))
    const handler = await loadHandler()
    await expect(handler(mockEvent)).rejects.toMatchObject({
      statusCode: 502,
      statusMessage: 'Failed to fetch ShipVia list from Nimble',
    })
  })

  it('preserves upstream statusCode on Nimble error', async () => {
    mockFetch.mockRejectedValue({ statusCode: 401, message: 'Unauthorized' })
    const handler = await loadHandler()
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 401 })
  })
})
