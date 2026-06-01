import type { NimbleSession } from '../../app/stores/auth'

/** Minimal Nimble session for auth / middleware tests. */
export function makeNimbleSession(overrides: Partial<NimbleSession> = {}): NimbleSession {
  return {
    token: 'test-token',
    authID: '',
    clientUrl: 'qa22',
    clientFullUrl: '',
    userID: 'user-1',
    userName: 'Test User',
    urlID: 1,
    email: 'test@example.com',
    ...overrides,
  }
}

export const staleSession = makeNimbleSession({ token: 'stale-cookie-token' })
export const freshSession = makeNimbleSession({
  token: 'fresh-token',
  authID: 'auth-1',
  userID: 'user-1',
})
