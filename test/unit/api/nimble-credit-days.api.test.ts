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

function makeCreditDaysDto(overrides: Record<string, unknown> = {}) {
  return { id: 'cd-uuid-001', name: 'Net 30', creditDays: 30, status: 0, ...overrides }
}

function makeNimbleResponse(items = [makeCreditDaysDto()]) {
  return { listInfo: items }
}

describe('GET /api/credit-days', () => {
  const mockEvent = { path: '/api/credit-days' }

  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuthSession.mockReturnValue({ token: 'test-bearer-token' })
    mockUseRuntimeConfig.mockReturnValue({ nimbleApi3Url: 'https://qa-api3.nimbleproperty.net' })
    mockFetch.mockResolvedValue(makeNimbleResponse())
  })

  async function loadHandler() {
    const mod = await import('../../../server/api/credit-days/index.get')
    return (mod as any).default ?? mod
  }

  it('calls Nimble /v1/GetCreditDaysList with Bearer token', async () => {
    const handler = await loadHandler()
    await handler(mockEvent)

    expect(mockFetch).toHaveBeenCalledWith(
      'https://qa-api3.nimbleproperty.net/v1/GetCreditDaysList',
      { headers: { Authorization: 'Bearer test-bearer-token' } },
    )
  })

  it('maps listInfo to { id, label, value, days }', async () => {
    mockFetch.mockResolvedValue(makeNimbleResponse([
      makeCreditDaysDto({ id: 'ID-ABC', name: 'Net 30', creditDays: 30 }),
    ]))

    const handler = await loadHandler()
    const result = await handler(mockEvent) as { data: any[] }

    expect(result.data).toHaveLength(1)
    expect(result.data[0]).toMatchObject({
      id: 'id-abc',
      label: 'Net 30',
      value: 'NET_30',
      days: 30,
    })
  })

  it('lowercases the id', async () => {
    mockFetch.mockResolvedValue(makeNimbleResponse([
      makeCreditDaysDto({ id: 'UPPER-ID-001' }),
    ]))
    const handler = await loadHandler()
    const result = await handler(mockEvent) as { data: any[] }
    expect(result.data[0].id).toBe('upper-id-001')
  })

  it('converts name to uppercase_underscore value', async () => {
    mockFetch.mockResolvedValue(makeNimbleResponse([
      makeCreditDaysDto({ name: 'Net 15', creditDays: 15 }),
      makeCreditDaysDto({ id: 'id2', name: '50% DEPOSIT BAL', creditDays: 80 }),
    ]))
    const handler = await loadHandler()
    const result = await handler(mockEvent) as { data: any[] }
    expect(result.data[0].value).toBe('NET_15')
    expect(result.data[1].value).toBe('50%_DEPOSIT_BAL')
  })

  it('sets days to null when creditDays is null', async () => {
    mockFetch.mockResolvedValue(makeNimbleResponse([
      makeCreditDaysDto({ creditDays: null }),
    ]))
    const handler = await loadHandler()
    const result = await handler(mockEvent) as { data: any[] }
    expect(result.data[0].days).toBeNull()
  })

  it('returns empty data array when listInfo is empty', async () => {
    mockFetch.mockResolvedValue({ listInfo: [] })
    const handler = await loadHandler()
    const result = await handler(mockEvent) as { data: any[] }
    expect(result.data).toEqual([])
  })

  it('handles missing listInfo key gracefully', async () => {
    mockFetch.mockResolvedValue({})
    const handler = await loadHandler()
    const result = await handler(mockEvent) as { data: any[] }
    expect(result.data).toEqual([])
  })

  it('returns multiple credit-days options', async () => {
    mockFetch.mockResolvedValue(makeNimbleResponse([
      makeCreditDaysDto({ id: 'id1', name: 'Net 15', creditDays: 15 }),
      makeCreditDaysDto({ id: 'id2', name: 'Net 30', creditDays: 30 }),
      makeCreditDaysDto({ id: 'id3', name: 'Net 45', creditDays: 45 }),
    ]))
    const handler = await loadHandler()
    const result = await handler(mockEvent) as { data: any[] }
    expect(result.data).toHaveLength(3)
    expect(result.data.map((d: any) => d.days)).toEqual([15, 30, 45])
  })

  it('throws 500 when NIMBLE_API3_URL is not configured', async () => {
    mockUseRuntimeConfig.mockReturnValue({ nimbleApi3Url: '' })
    const handler = await loadHandler()
    await expect(handler(mockEvent)).rejects.toMatchObject({
      statusCode: 500,
      statusMessage: 'NIMBLE_API3_URL is not configured',
    })
  })

  it('uses the session token for auth', async () => {
    mockRequireAuthSession.mockReturnValue({ token: 'api3-token-xyz' })
    const handler = await loadHandler()
    await handler(mockEvent)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      { headers: { Authorization: 'Bearer api3-token-xyz' } },
    )
  })

  it('throws 502 when Nimble API call fails without statusCode', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))
    const handler = await loadHandler()
    await expect(handler(mockEvent)).rejects.toMatchObject({
      statusCode: 502,
      statusMessage: 'Failed to fetch Credit Days list from Nimble',
    })
  })

  it('preserves upstream statusCode on Nimble error', async () => {
    mockFetch.mockRejectedValue({ statusCode: 403, message: 'Forbidden' })
    const handler = await loadHandler()
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 403 })
  })
})
