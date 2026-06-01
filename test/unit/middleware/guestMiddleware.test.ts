import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { makeNimbleSession } from '../../helpers/nimbleSessionFixture'

const mockNavigateTo = vi.fn()
const mockEnsureAuthHydrated = vi.fn()
const mockSyncNimbleSessionFromAuth = vi.fn()

vi.mock('../../../app/utils/routeAuth', () => ({
  ensureAuthHydrated: (...args: unknown[]) => mockEnsureAuthHydrated(...args),
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

describe('guest middleware', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockEnsureAuthHydrated.mockResolvedValue(undefined)
    mockNavigateTo.mockReturnValue(undefined)
    ;(await getAuthStore()).clear()
  })

  it('hydrates auth on Nimble launch before redirecting away from login', async () => {
    const store = await getAuthStore()
    mockEnsureAuthHydrated.mockImplementation(async () => {
      store.setSession(makeNimbleSession({ token: 'fresh-token' }))
    })

    await runGuestMiddleware({ authId: 'launch-auth-guid', redirect: '/payables' })

    expect(mockEnsureAuthHydrated).toHaveBeenCalled()
    expect(mockNavigateTo).toHaveBeenCalled()
  })

  it('leaves unauthenticated users on login when no session exists', async () => {
    await runGuestMiddleware()

    expect(mockNavigateTo).not.toHaveBeenCalled()
  })

  it('redirects authenticated users with persisted Pinia session', async () => {
    const store = await getAuthStore()
    store.setSession(makeNimbleSession({ token: 'persisted-only' }))

    await runGuestMiddleware()

    expect(mockNavigateTo).toHaveBeenCalled()
    expect(store.token).toBe('persisted-only')
  })
})
