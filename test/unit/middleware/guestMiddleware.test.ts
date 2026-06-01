import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { freshSession, makeNimbleSession, staleSession } from '../../helpers/nimbleSessionFixture'

const mockFetchServerSession = vi.fn()
const mockNavigateTo = vi.fn()
const mockExchangeNimbleAuthId = vi.fn()
const mockSyncNimbleSessionFromAuth = vi.fn()

let nimbleIntegrations = 'true'

vi.mock('../../../app/utils/auth-session', () => ({
  fetchServerSession: (...args: unknown[]) => mockFetchServerSession(...args),
}))

vi.mock('../../../app/utils/nimbleAuthIdExchange', () => ({
  exchangeNimbleAuthId: (...args: unknown[]) => mockExchangeNimbleAuthId(...args),
}))

vi.mock('../../../app/utils/authToken', () => ({
  syncNimbleSessionFromAuth: (...args: unknown[]) => mockSyncNimbleSessionFromAuth(...args),
}))

vi.stubGlobal('navigateTo', mockNavigateTo)
vi.stubGlobal('defineNuxtRouteMiddleware', (fn: unknown) => fn)
vi.stubGlobal('useRuntimeConfig', () => ({
  public: { nimbleIntegrations },
}))

async function getAuthStore() {
  const { useAuthStore } = await import('../../../app/stores/auth')
  return useAuthStore()
}

async function runGuestMiddleware(query: Record<string, string> = {}) {
  vi.resetModules()
  vi.stubGlobal('useAuthStore', (await import('../../../app/stores/auth')).useAuthStore)
  const middleware = (await import('../../../app/middleware/guest')).default
  return middleware({
    fullPath: '/',
    query,
    path: '/',
  } as any)
}

describe('guest middleware (Nimble authId exchange)', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    nimbleIntegrations = 'true'
    mockFetchServerSession.mockResolvedValue(null)
    mockNavigateTo.mockReturnValue(undefined)
    ;(await getAuthStore()).clear()
  })

  it('exchanges authId before redirecting when a stale cookie session exists', async () => {
    mockFetchServerSession.mockResolvedValue(staleSession)
    mockExchangeNimbleAuthId.mockResolvedValue(freshSession)

    const store = await getAuthStore()
    store.setSession(makeNimbleSession({ token: 'stale-pinia-token' }))

    await runGuestMiddleware({ authId: 'launch-auth-guid' })

    expect(mockExchangeNimbleAuthId).toHaveBeenCalledWith('launch-auth-guid')
    expect(store.token).toBe('fresh-token')
    expect(mockSyncNimbleSessionFromAuth).toHaveBeenCalled()
    expect(mockNavigateTo).toHaveBeenCalled()
  })

  it('does not call exchange when nimbleIntegrations is false', async () => {
    nimbleIntegrations = 'false'
    mockFetchServerSession.mockResolvedValue(staleSession)

    await runGuestMiddleware({ authId: 'launch-auth-guid' })

    expect(mockExchangeNimbleAuthId).not.toHaveBeenCalled()
    expect(mockNavigateTo).toHaveBeenCalled()
  })

  it('falls back to cookie session when authId exchange fails', async () => {
    mockExchangeNimbleAuthId.mockResolvedValue(null)
    mockFetchServerSession.mockResolvedValue(staleSession)

    const store = await getAuthStore()
    await runGuestMiddleware({ authId: 'bad-auth-guid' })

    expect(mockExchangeNimbleAuthId).toHaveBeenCalledWith('bad-auth-guid')
    expect(store.token).toBe('stale-cookie-token')
    expect(mockNavigateTo).toHaveBeenCalled()
  })

  it('leaves unauthenticated users on login when no session exists', async () => {
    await runGuestMiddleware()

    expect(mockExchangeNimbleAuthId).not.toHaveBeenCalled()
    expect(mockNavigateTo).not.toHaveBeenCalled()
  })

  it('redirects authenticated users with persisted Pinia session and no cookie', async () => {
    const store = await getAuthStore()
    store.setSession(makeNimbleSession({ token: 'persisted-only' }))

    await runGuestMiddleware()

    expect(mockNavigateTo).toHaveBeenCalled()
    expect(store.token).toBe('persisted-only')
  })
})
