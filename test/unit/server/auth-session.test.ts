import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NimbleSessionPayload } from '../../../server/utils/nimble-auth'

vi.stubGlobal('useRuntimeConfig', () => ({
  authSessionSecret: 'test-secret-key',
}))

vi.stubGlobal('createError', (opts: { statusCode: number, statusMessage: string }) => {
  const error = new Error(opts.statusMessage) as Error & { statusCode: number }
  error.statusCode = opts.statusCode
  return error
})

const mockGetCookie = vi.fn()
const mockGetHeader = vi.fn()
vi.stubGlobal('getCookie', mockGetCookie)
vi.stubGlobal('getHeader', mockGetHeader)

const {
  encodeSessionCookie,
  decodeSessionCookie,
  getSessionFromEvent,
} = await import('../../../server/utils/auth-session')

const sampleSession: NimbleSessionPayload = {
  token: 'jwt-token',
  authID: 'auth-id',
  clientUrl: 'qa22',
  clientFullUrl: 'https://qa22.nimbleproperty.net',
  userID: 'user-123',
  userName: 'user@test.com',
  urlID: 70029,
  email: 'user@test.com',
}

describe('auth-session cookie', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetCookie.mockReturnValue(undefined)
    mockGetHeader.mockReturnValue(undefined)
  })

  it('encodes and decodes a session payload', () => {
    const encoded = encodeSessionCookie(sampleSession)
    expect(decodeSessionCookie(encoded)).toEqual(sampleSession)
  })

  it('rejects tampered cookies', () => {
    const encoded = encodeSessionCookie(sampleSession)
    const tampered = `${encoded}x`
    expect(decodeSessionCookie(tampered)).toBeNull()
  })

  it('rejects invalid cookie format', () => {
    expect(decodeSessionCookie('not-valid')).toBeNull()
  })

  it('reads session from signed cookie when present', () => {
    const encoded = encodeSessionCookie(sampleSession)
    mockGetCookie.mockReturnValue(encoded)

    const session = getSessionFromEvent({} as never)

    expect(mockGetCookie).toHaveBeenCalled()
    expect(session).toEqual(sampleSession)
  })

  it('falls back to bearer token when cookie is missing', () => {
    mockGetCookie.mockReturnValue(undefined)
    mockGetHeader.mockReturnValue('Bearer jwt-fallback-token')

    const session = getSessionFromEvent({} as never)

    expect(session).toEqual({
      token: 'jwt-fallback-token',
      authID: '',
      clientUrl: '',
      clientFullUrl: '',
      userID: '',
      userName: '',
      urlID: 0,
      email: '',
    })
  })

  it('returns null when no cookie and invalid bearer header', () => {
    mockGetCookie.mockReturnValue(undefined)
    mockGetHeader.mockReturnValue('Basic abc123')

    const session = getSessionFromEvent({} as never)
    expect(session).toBeNull()
  })
})
