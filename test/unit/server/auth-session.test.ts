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

const { encodeSessionCookie, decodeSessionCookie } = await import('../../../server/utils/auth-session')

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
})
