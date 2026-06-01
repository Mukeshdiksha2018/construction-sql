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

async function runAuthMiddleware(
  fullPath = '/purchase-orders/print/po-uuid',
  query: Record<string, string> = {},
) {
  vi.resetModules()
  vi.stubGlobal('useAuthStore', (await import('../../../app/stores/auth')).useAuthStore)
  const middleware = (await import('../../../app/middleware/auth')).default
  return middleware({
    fullPath,
    query,
    path: fullPath.split('?')[0],
  } as any)
}

describe('auth middleware', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    nimbleIntegrations = 'true'
    mockFetchServerSession.mockResolvedValue(null)
    mockNavigateTo.mockReturnValue(undefined)
    ;(await getAuthStore()).clear()
  })

  it('allows navigation when a persisted client session exists without a cookie', async () => {
    ;(await getAuthStore()).setSession({
      token: 'persisted-token',
      authID: '',
      clientUrl: '',
      clientFullUrl: '',
      userID: '',
      userName: '',
      urlID: 0,
      email: '',
    })

    const result = await runAuthMiddleware()

    expect(result).toBeUndefined()
    expect(mockNavigateTo).not.toHaveBeenCalled()
  })

  it('redirects to login when neither cookie nor client session is available', async () => {
    await runAuthMiddleware('/purchase-orders/print/po-uuid')

    expect(mockNavigateTo).toHaveBeenCalledWith({
      path: '/',
      query: { redirect: '/purchase-orders/print/po-uuid' },
    })
  })

  it('exchanges authId before using an existing cookie session', async () => {
    mockFetchServerSession.mockResolvedValue(staleSession)
    mockExchangeNimbleAuthId.mockResolvedValue(freshSession)

    const store = await getAuthStore()
    store.setSession(makeNimbleSession({ token: 'stale-pinia-token' }))

    await runAuthMiddleware('/projects', { authId: 'new-auth-guid' })

    expect(mockExchangeNimbleAuthId).toHaveBeenCalledWith('new-auth-guid')
    expect(mockFetchServerSession).not.toHaveBeenCalled()
    expect(store.token).toBe('fresh-token')
    expect(mockSyncNimbleSessionFromAuth).toHaveBeenCalled()
    expect(mockNavigateTo).not.toHaveBeenCalled()
  })

  it('does not exchange authId when nimbleIntegrations is false (password login mode)', async () => {
    nimbleIntegrations = 'false'
    mockFetchServerSession.mockResolvedValue(staleSession)

    const store = await getAuthStore()
    await runAuthMiddleware('/projects', { authId: 'should-be-ignored' })

    expect(mockExchangeNimbleAuthId).not.toHaveBeenCalled()
    expect(store.token).toBe('stale-cookie-token')
    expect(mockNavigateTo).not.toHaveBeenCalled()
  })

  it('falls back to cookie session when authId exchange fails', async () => {
    mockExchangeNimbleAuthId.mockResolvedValue(null)
    mockFetchServerSession.mockResolvedValue(staleSession)

    const store = await getAuthStore()
    await runAuthMiddleware('/projects', { authId: 'invalid-auth-id' })

    expect(mockExchangeNimbleAuthId).toHaveBeenCalledWith('invalid-auth-id')
    expect(store.token).toBe('stale-cookie-token')
    expect(mockNavigateTo).not.toHaveBeenCalled()
  })

  it('syncs server cookie into Pinia when no authId is present', async () => {
    mockFetchServerSession.mockResolvedValue(freshSession)

    const store = await getAuthStore()
    await runAuthMiddleware('/projects')

    expect(mockExchangeNimbleAuthId).not.toHaveBeenCalled()
    expect(store.token).toBe('fresh-token')
    expect(mockSyncNimbleSessionFromAuth).toHaveBeenCalled()
  })

  it('does not clear a persisted session when cookie check fails', async () => {
    const store = await getAuthStore()
    store.setSession({
      token: 'keep-me',
      authID: '',
      clientUrl: '',
      clientFullUrl: '',
      userID: '',
      userName: '',
      urlID: 0,
      email: '',
    })

    await runAuthMiddleware()

    expect(store.token).toBe('keep-me')
  })
})
