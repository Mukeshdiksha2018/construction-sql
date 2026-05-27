import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createError } from 'h3'
import type { NimbleSessionPayload } from '../../../server/utils/nimble-auth'

const mockReadBody = vi.fn()
const mockSetSessionCookie = vi.fn()
const mockNimbleExchangeOAuth = vi.fn()
const mockResolveNimbleOAuthConfig = vi.fn()
const mockUseRuntimeConfig = vi.fn()
const mockFetch = vi.fn()

vi.stubGlobal('defineEventHandler', (handler: (event: unknown) => unknown) => handler)
vi.stubGlobal('readBody', mockReadBody)
vi.stubGlobal('createError', createError)
vi.stubGlobal('useRuntimeConfig', mockUseRuntimeConfig)
vi.stubGlobal('$fetch', mockFetch)

vi.mock('../../../server/utils/auth-session', () => ({
  setSessionCookie: (event: unknown, session: NimbleSessionPayload) => mockSetSessionCookie(event, session),
}))

vi.mock('../../../server/utils/nimble-auth', async () => {
  const actual = await vi.importActual<typeof import('../../../server/utils/nimble-auth')>(
    '../../../server/utils/nimble-auth',
  )
  return {
    ...actual,
    nimbleExchangeOAuth: (authId: string, config: { baseUrl: string }, fetchFn: unknown) =>
      mockNimbleExchangeOAuth(authId, config, fetchFn),
    resolveNimbleOAuthConfig: (publicConfig: { nimbleOauthExchangeUrl?: string }) =>
      mockResolveNimbleOAuthConfig(publicConfig),
  }
})

describe('POST /api/auth/exchange-oauth', () => {
  const mockEvent = { path: '/api/auth/exchange-oauth' }
  const session: NimbleSessionPayload = {
    token: 'jwt-token',
    authID: 'auth-id',
    clientUrl: 'qa11.nimbleproperty.net',
    clientFullUrl: '',
    userID: 'user-id',
    userName: 'Ajay Babu',
    urlID: 17,
    email: 'ajay@nimbleaccounting.com',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockReadBody.mockResolvedValue({ authId: 'auth-guid-123' })
    mockUseRuntimeConfig.mockReturnValue({
      public: { nimbleOauthExchangeUrl: 'https://qa-api-usermgmt.nimbleproperty.net' },
    })
    mockResolveNimbleOAuthConfig.mockReturnValue({
      baseUrl: 'https://qa-api-usermgmt.nimbleproperty.net',
    })
    mockNimbleExchangeOAuth.mockResolvedValue({ session })
  })

  async function loadHandler() {
    const { default: handler } = await import('../../../server/api/auth/exchange-oauth.post')
    return handler
  }

  it('exchanges authId, sets cookie, and returns session payload', async () => {
    const handler = await loadHandler()
    const result = await handler(mockEvent)

    expect(mockReadBody).toHaveBeenCalledWith(mockEvent)
    expect(mockResolveNimbleOAuthConfig).toHaveBeenCalledWith({
      nimbleOauthExchangeUrl: 'https://qa-api-usermgmt.nimbleproperty.net',
    })
    expect(mockNimbleExchangeOAuth).toHaveBeenCalledWith(
      'auth-guid-123',
      { baseUrl: 'https://qa-api-usermgmt.nimbleproperty.net' },
      expect.any(Function),
    )
    expect(mockSetSessionCookie).toHaveBeenCalledWith(mockEvent, session)
    expect(result).toEqual({ session })
  })

  it('accepts token property when authId is missing', async () => {
    mockReadBody.mockResolvedValue({ token: 'auth-token-xyz' })

    const handler = await loadHandler()
    await handler(mockEvent)

    expect(mockNimbleExchangeOAuth).toHaveBeenCalledWith(
      'auth-token-xyz',
      expect.any(Object),
      expect.any(Function),
    )
  })

  it('returns 400 when authId/token is missing', async () => {
    mockReadBody.mockResolvedValue({})

    const handler = await loadHandler()
    await expect(handler(mockEvent)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'authId is required',
    })
  })

  it('maps AuthError to HTTP error shape', async () => {
    const { AuthError } = await import('../../../server/utils/nimble-auth')
    mockNimbleExchangeOAuth.mockRejectedValue(new AuthError(401, 'Invalid authId'))

    const handler = await loadHandler()
    await expect(handler(mockEvent)).rejects.toMatchObject({
      statusCode: 401,
      statusMessage: 'Invalid authId',
    })
  })
})
