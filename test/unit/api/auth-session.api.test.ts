import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetSessionFromEvent = vi.fn()

vi.stubGlobal('defineEventHandler', (handler: (event: unknown) => unknown) => handler)
vi.mock('../../../server/utils/auth-session', () => ({
  getSessionFromEvent: (...args: unknown[]) => mockGetSessionFromEvent(...args),
}))

describe('GET /api/auth/session handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSessionFromEvent.mockReturnValue(null)
  })

  it('returns { session: null } with HTTP 200 semantics when logged out (no throw)', async () => {
    const handler = (await import('../../../server/api/auth/session.get')).default
    const result = handler({} as never)

    expect(result).toEqual({ session: null })
  })

  it('returns the session when a valid cookie or bearer is present', async () => {
    const session = {
      token: 'jwt-token',
      authID: 'auth-1',
      clientUrl: '',
      clientFullUrl: '',
      userID: 'user-1',
      userName: 'Test',
      urlID: 1,
      email: 'test@example.com',
    }
    mockGetSessionFromEvent.mockReturnValue(session)

    const handler = (await import('../../../server/api/auth/session.get')).default
    const result = handler({} as never)

    expect(result).toEqual({ session })
  })

  it('returns null session when token is empty', async () => {
    mockGetSessionFromEvent.mockReturnValue({ token: '', authID: '', clientUrl: '', clientFullUrl: '', userID: '', userName: '', urlID: 0, email: '' })

    const handler = (await import('../../../server/api/auth/session.get')).default
    const result = handler({} as never)

    expect(result).toEqual({ session: null })
  })
})
