import { describe, expect, it, vi } from 'vitest'
import { createEvent } from 'h3'

const mockGetSession = vi.fn()

vi.mock('../../../server/utils/auth-session', () => ({
  getSessionFromEvent: (event: unknown) => mockGetSession(event),
}))

vi.stubGlobal('useRuntimeConfig', () => ({
  nimbleToken: 'config-fallback-token',
}))

describe('resolveNimbleBearerForEvent', () => {
  it('prefers session token over config fallback', async () => {
    mockGetSession.mockReturnValue({ token: 'user-session-token' })
    const { resolveNimbleBearerForEvent } = await import('../../../server/utils/nimbleBearer')
    const event = createEvent({ method: 'GET', url: '/api/test' })
    expect(resolveNimbleBearerForEvent(event)).toBe('user-session-token')
  })

  it('falls back to nimbleToken when session is missing', async () => {
    mockGetSession.mockReturnValue(null)
    const { resolveNimbleBearerForEvent } = await import('../../../server/utils/nimbleBearer')
    const event = createEvent({ method: 'GET', url: '/api/test' })
    expect(resolveNimbleBearerForEvent(event)).toBe('config-fallback-token')
  })
})
