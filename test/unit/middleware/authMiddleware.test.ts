import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { freshSession, makeNimbleSession } from '../../helpers/nimbleSessionFixture'

const mockNavigateTo = vi.fn()
const mockEnsureAuthHydrated = vi.fn()
const mockFetchRouteSession = vi.fn()
const mockSyncNimbleSessionFromAuth = vi.fn()

vi.mock('../../../app/utils/routeAuth', () => ({
  ensureAuthHydrated: (...args: unknown[]) => mockEnsureAuthHydrated(...args),
  fetchRouteSession: (...args: unknown[]) => mockFetchRouteSession(...args),
  hasNimbleLaunchContext: (to: { query: Record<string, unknown> }) =>
    Boolean(
      String(to.query.authId ?? '').trim()
      || String(to.query.corporationId ?? '').trim()
      || String(to.query.menuId ?? '').trim()
      || String(to.query.launcherBridgeToken ?? '').trim(),
    ),
}))

vi.mock('../../../app/utils/authToken', () => ({
  syncNimbleSessionFromAuth: (...args: unknown[]) => mockSyncNimbleSessionFromAuth(...args),
}))

vi.stubGlobal('navigateTo', mockNavigateTo)
vi.stubGlobal('defineNuxtRouteMiddleware', (fn: unknown) => fn)

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
    mockFetchRouteSession.mockResolvedValue(null)
    mockEnsureAuthHydrated.mockResolvedValue(undefined)
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

  it('does not redirect to login while authId is still in the URL (nimble-init in progress)', async () => {
    await runAuthMiddleware('/payables', { authId: 'launch-auth-id' })

    expect(mockNavigateTo).not.toHaveBeenCalled()
  })

  it('hydrates Nimble launch routes before checking session', async () => {
    await runAuthMiddleware('/payables', { corporationId: 'corp-1', menuId: 'menu-1' })

    expect(mockEnsureAuthHydrated).toHaveBeenCalled()
  })

  it('syncs route session into Pinia when hydration left store empty', async () => {
    mockFetchRouteSession.mockResolvedValue(freshSession)

    const store = await getAuthStore()
    await runAuthMiddleware('/projects')

    expect(store.token).toBe('fresh-token')
    expect(mockSyncNimbleSessionFromAuth).toHaveBeenCalled()
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
