import { createError } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeCorporation } from '../../helpers/corporations'

const mockGetQuery = vi.fn()
const mockUseRuntimeConfig = vi.fn()
const mockRequireAuthSession = vi.fn()
const mockFetchNimbleCorporations = vi.fn()

vi.stubGlobal('defineEventHandler', (handler: (event: unknown) => unknown) => handler)
vi.stubGlobal('getQuery', mockGetQuery)
vi.stubGlobal('useRuntimeConfig', mockUseRuntimeConfig)
vi.stubGlobal('createError', createError)

vi.mock('../../../server/utils/auth-session', () => ({
  requireAuthSession: (event: unknown) => mockRequireAuthSession(event),
}))

vi.mock('../../../server/utils/nimble-corporations', () => ({
  fetchNimbleCorporations: (
    baseUrl: string,
    token: string,
    isShowAll: boolean,
  ) => mockFetchNimbleCorporations(baseUrl, token, isShowAll),
}))

describe('GET /api/nimble/corporations', () => {
  const mockEvent = { path: '/api/nimble/corporations' }
  const session = { token: 'nimble-jwt-token' }

  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuthSession.mockReturnValue(session)
    mockUseRuntimeConfig.mockReturnValue({
      nimbleApiBaseUrl: 'https://qa-api5.nimbleproperty.net',
    })
    mockGetQuery.mockReturnValue({ IsShowAll: 'false' })
    mockFetchNimbleCorporations.mockResolvedValue([makeCorporation()])
  })

  async function loadHandler() {
    const { default: handler } = await import('../../../server/api/nimble/corporations.get')
    return handler
  }

  it('requires a valid auth session', async () => {
    mockRequireAuthSession.mockImplementation(() => {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    })

    const handler = await loadHandler()
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('returns 500 when NIMBLE_API_BASE_URL is not configured', async () => {
    mockUseRuntimeConfig.mockReturnValue({ nimbleApiBaseUrl: '' })

    const handler = await loadHandler()
    await expect(handler(mockEvent)).rejects.toMatchObject({
      statusCode: 500,
      statusMessage: 'NIMBLE_API_BASE_URL is not configured',
    })
  })

  it('proxies to Nimble with user token and IsShowAll=false by default', async () => {
    const handler = await loadHandler()
    const result = await handler(mockEvent)

    expect(mockRequireAuthSession).toHaveBeenCalledWith(mockEvent)
    expect(mockFetchNimbleCorporations).toHaveBeenCalledWith(
      'https://qa-api5.nimbleproperty.net',
      'nimble-jwt-token',
      false,
    )
    expect(result).toEqual({ corporations: [makeCorporation()] })
  })

  it('passes IsShowAll=true when query requests all client corporations', async () => {
    mockGetQuery.mockReturnValue({ IsShowAll: 'true' })
    mockFetchNimbleCorporations.mockResolvedValue([
      makeCorporation({ id: 'all-1', name: 'All Corp' }),
    ])

    const handler = await loadHandler()
    const result = await handler(mockEvent)

    expect(mockFetchNimbleCorporations).toHaveBeenCalledWith(
      'https://qa-api5.nimbleproperty.net',
      'nimble-jwt-token',
      true,
    )
    expect(result.corporations).toHaveLength(1)
    expect(result.corporations[0]?.id).toBe('all-1')
  })

  it('treats boolean IsShowAll query as true', async () => {
    mockGetQuery.mockReturnValue({ IsShowAll: true })

    const handler = await loadHandler()
    await handler(mockEvent)

    expect(mockFetchNimbleCorporations).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      true,
    )
  })

  it('maps upstream status when Nimble fetch fails', async () => {
    mockFetchNimbleCorporations.mockRejectedValue(
      Object.assign(new Error('upstream'), { statusCode: 401 }),
    )

    const handler = await loadHandler()
    await expect(handler(mockEvent)).rejects.toMatchObject({
      statusCode: 401,
      statusMessage: 'Failed to fetch corporations from Nimble',
    })
  })

  it('defaults to 502 when upstream error has no statusCode', async () => {
    mockFetchNimbleCorporations.mockRejectedValue(new Error('network'))

    const handler = await loadHandler()
    await expect(handler(mockEvent)).rejects.toMatchObject({
      statusCode: 502,
      statusMessage: 'Failed to fetch corporations from Nimble',
    })
  })
})
