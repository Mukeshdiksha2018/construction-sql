import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockFetch = vi.fn()

vi.stubGlobal('$fetch', mockFetch)

describe('exchangeNimbleAuthId', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns session when exchange succeeds', async () => {
    const session = {
      token: 'fresh-token',
      authID: 'auth-1',
      clientUrl: 'qa22',
      clientFullUrl: '',
      userID: 'user-1',
      userName: 'Test User',
      urlID: 1,
      email: 'test@example.com',
    }
    mockFetch.mockResolvedValue({ session })

    const { exchangeNimbleAuthId } = await import('../../../app/utils/nimbleAuthIdExchange')
    const result = await exchangeNimbleAuthId('auth-guid-123')

    expect(result).toEqual(session)
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/exchange-oauth', {
      method: 'POST',
      body: { authId: 'auth-guid-123' },
      credentials: 'include',
    })
  })

  it('returns null for empty authId', async () => {
    const { exchangeNimbleAuthId } = await import('../../../app/utils/nimbleAuthIdExchange')
    expect(await exchangeNimbleAuthId('')).toBeNull()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('returns null when exchange fails', async () => {
    mockFetch.mockRejectedValue(new Error('Invalid authId'))

    const { exchangeNimbleAuthId } = await import('../../../app/utils/nimbleAuthIdExchange')
    expect(await exchangeNimbleAuthId('bad-id')).toBeNull()
  })
})
