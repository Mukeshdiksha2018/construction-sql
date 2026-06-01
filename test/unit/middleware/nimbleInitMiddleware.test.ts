import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { freshSession, makeNimbleSession, staleSession } from '../../helpers/nimbleSessionFixture'

const mockFetchRouteSession = vi.fn()
const mockEnsureAuthHydrated = vi.fn()
const mockNavigateTo = vi.fn()
const mockExchangeNimbleAuthId = vi.fn()
const mockSyncNimbleSessionFromAuth = vi.fn()
const mockLoadPrivileges = vi.fn().mockResolvedValue(undefined)

vi.mock('../../../app/utils/routeAuth', () => ({
  fetchRouteSession: (...args: unknown[]) => mockFetchRouteSession(...args),
  ensureAuthHydrated: (...args: unknown[]) => mockEnsureAuthHydrated(...args),
  hasNimbleLaunchContext: (to: { query: Record<string, unknown> }) =>
    Boolean(
      String(to.query.authId ?? '').trim()
      || String(to.query.corporationId ?? '').trim()
      || String(to.query.menuId ?? '').trim()
      || String(to.query.launcherBridgeToken ?? '').trim(),
    ),
}))

vi.mock('../../../app/utils/nimbleAuthIdExchange', () => ({
  exchangeNimbleAuthId: (...args: unknown[]) => mockExchangeNimbleAuthId(...args),
}))

vi.mock('../../../app/utils/authToken', () => ({
  syncNimbleSessionFromAuth: (...args: unknown[]) => mockSyncNimbleSessionFromAuth(...args),
}))

vi.mock('../../../app/composables/usePrivilegesFetch', () => ({
  usePrivilegesFetch: () => ({
    loadPrivileges: mockLoadPrivileges,
    privilegesStore: { loaded: false },
  }),
}))

vi.stubGlobal('navigateTo', mockNavigateTo)
vi.stubGlobal('defineNuxtRouteMiddleware', (fn: unknown) => fn)
vi.stubGlobal('usePrivilegesFetch', () => ({
  loadPrivileges: mockLoadPrivileges,
  privilegesStore: { loaded: false },
}))

async function getAuthStore() {
  const { useAuthStore } = await import('../../../app/stores/auth')
  return useAuthStore()
}

async function runNimbleInitMiddleware(
  query: Record<string, string> = {},
  path = '/projects',
) {
  vi.resetModules()
  vi.stubGlobal('useAuthStore', (await import('../../../app/stores/auth')).useAuthStore)
  vi.stubGlobal('useCorporationStore', (await import('../../../app/stores/corporations')).useCorporationStore)
  const middleware = (await import('../../../app/middleware/01.nimble-init.global')).default
  return middleware({
    fullPath: path,
    query,
    path,
  } as any)
}

describe('nimble-init global middleware (authId exchange regression)', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockFetchRouteSession.mockResolvedValue(null)
    mockEnsureAuthHydrated.mockResolvedValue(undefined)
    mockNavigateTo.mockReturnValue(undefined)
    mockLoadPrivileges.mockResolvedValue(undefined)
    ;(await getAuthStore()).clear()
  })

  it('does nothing when no Nimble launch query params are present', async () => {
    await runNimbleInitMiddleware()

    expect(mockExchangeNimbleAuthId).not.toHaveBeenCalled()
    expect(mockNavigateTo).not.toHaveBeenCalled()
  })

  it('exchanges authId even when a stale server session cookie exists (regression)', async () => {
    mockExchangeNimbleAuthId.mockResolvedValue(freshSession)

    const store = await getAuthStore()
    store.setSession(makeNimbleSession({ token: 'stale-pinia-token' }))

    await runNimbleInitMiddleware({ authId: 'new-launch-id' })

    expect(mockExchangeNimbleAuthId).toHaveBeenCalledWith('new-launch-id')
    expect(store.token).toBe('fresh-token')
    expect(mockSyncNimbleSessionFromAuth).toHaveBeenCalled()
  })

  it('strips authId from the URL after a successful exchange on the client', async () => {
    mockExchangeNimbleAuthId.mockResolvedValue(freshSession)

    await runNimbleInitMiddleware({ authId: 'strip-me', corporationId: 'corp-1' }, '/purchase-orders')

    if (import.meta.client) {
      expect(mockNavigateTo).toHaveBeenCalledWith(
        { path: '/purchase-orders', query: { corporationId: 'corp-1' } },
        { replace: true },
      )
    }
    else {
      expect(mockNavigateTo).not.toHaveBeenCalled()
    }
  })

  it('syncs cookie session when only corporationId is in the query (no authId)', async () => {
    mockEnsureAuthHydrated.mockImplementation(async () => {
      const store = await getAuthStore()
      store.setSession(staleSession)
    })

    const store = await getAuthStore()
    await runNimbleInitMiddleware({ corporationId: 'corp-1' })

    expect(mockExchangeNimbleAuthId).not.toHaveBeenCalled()
    expect(mockEnsureAuthHydrated).toHaveBeenCalled()
    expect(store.token).toBe('stale-cookie-token')
    expect(mockNavigateTo).not.toHaveBeenCalled()
  })

  it('does not overwrite Pinia when authId exchange fails and no cookie exists', async () => {
    mockExchangeNimbleAuthId.mockResolvedValue(null)

    const store = await getAuthStore()
    await runNimbleInitMiddleware({ authId: 'failed-exchange' })

    expect(store.isAuthenticated).toBe(false)
    expect(mockNavigateTo).not.toHaveBeenCalled()
  })

  it('loads privileges in the background after a fresh authId exchange', async () => {
    mockExchangeNimbleAuthId.mockResolvedValue(freshSession)

    await runNimbleInitMiddleware({ authId: 'fresh-launch' })

    expect(mockLoadPrivileges).toHaveBeenCalled()
  })
})
