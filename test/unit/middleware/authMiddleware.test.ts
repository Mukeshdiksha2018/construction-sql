import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const mockFetchServerSession = vi.fn()
const mockNavigateTo = vi.fn()
const mockExchangeNimbleAuthId = vi.fn()

vi.mock('../../../app/utils/auth-session', () => ({
  fetchServerSession: (...args: unknown[]) => mockFetchServerSession(...args),
}))

vi.mock('../../../app/utils/nimbleAuthIdExchange', () => ({
  exchangeNimbleAuthId: (...args: unknown[]) => mockExchangeNimbleAuthId(...args),
}))

vi.mock('../../../app/utils/authToken', () => ({
  syncNimbleSessionFromAuth: vi.fn(),
}))

vi.stubGlobal('navigateTo', mockNavigateTo)
vi.stubGlobal('defineNuxtRouteMiddleware', (fn: unknown) => fn)
vi.stubGlobal('useRuntimeConfig', () => ({
  public: { nimbleIntegrations: 'true' },
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
    mockFetchServerSession.mockResolvedValue({
      token: 'stale-cookie-token',
      authID: '',
      clientUrl: '',
      clientFullUrl: '',
      userID: '',
      userName: '',
      urlID: 0,
      email: '',
    })
    mockExchangeNimbleAuthId.mockResolvedValue({
      token: 'fresh-token',
      authID: 'auth-1',
      clientUrl: 'qa22',
      clientFullUrl: '',
      userID: 'user-1',
      userName: 'Test',
      urlID: 1,
      email: 'test@example.com',
    })

    const store = await getAuthStore()
    store.setSession({
      token: 'stale-pinia-token',
      authID: '',
      clientUrl: '',
      clientFullUrl: '',
      userID: '',
      userName: '',
      urlID: 0,
      email: '',
    })

    await runAuthMiddleware('/projects', { authId: 'new-auth-guid' })

    expect(mockExchangeNimbleAuthId).toHaveBeenCalledWith('new-auth-guid')
    expect(store.token).toBe('fresh-token')
    expect(mockNavigateTo).not.toHaveBeenCalled()
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
