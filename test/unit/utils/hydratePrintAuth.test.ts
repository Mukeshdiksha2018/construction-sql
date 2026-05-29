import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockFetchServerSession = vi.fn()
const mockConsumePrintAuthSession = vi.fn()
const mockReadPersistedAuthSession = vi.fn()

vi.mock('../../../app/utils/auth-session', () => ({
  fetchServerSession: () => mockFetchServerSession(),
}))

vi.mock('../../../app/utils/printAuthBridge', () => ({
  consumePrintAuthSession: () => mockConsumePrintAuthSession(),
  readPersistedAuthSession: () => mockReadPersistedAuthSession(),
  AUTH_PINIA_STORAGE_KEY: 'auth',
}))

const session = {
  token: 'bridge-token',
  authID: '',
  clientUrl: '',
  clientFullUrl: '',
  userID: '',
  userName: '',
  urlID: 0,
  email: '',
}

describe('hydratePrintAuth', () => {
  beforeEach(async () => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.clearAllMocks()
    const { useAuthStore } = await import('../../../app/stores/auth')
    vi.stubGlobal('useAuthStore', useAuthStore)
    vi.stubGlobal('useNimbleSessionStore', () => ({
      token: null,
      syncFromAuthStore: vi.fn(),
    }))
    vi.stubGlobal('useNuxtApp', () => ({ $authReady: Promise.resolve() }))
    mockConsumePrintAuthSession.mockReturnValue(null)
    mockReadPersistedAuthSession.mockReturnValue(null)
    mockFetchServerSession.mockResolvedValue(null)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns existing auth store token without extra hydration', async () => {
    const { useAuthStore } = await import('../../../app/stores/auth')
    useAuthStore().setSession({ ...session, token: 'store-token' })

    const { hydratePrintAuth } = await import('../../../app/utils/authToken')
    expect(await hydratePrintAuth()).toBe('store-token')
    expect(mockConsumePrintAuthSession).not.toHaveBeenCalled()
  })

  it('hydrates from print auth bridge', async () => {
    mockConsumePrintAuthSession.mockReturnValue({ ...session, token: 'bridge-token' })

    const { hydratePrintAuth } = await import('../../../app/utils/authToken')
    const { useAuthStore } = await import('../../../app/stores/auth')

    expect(await hydratePrintAuth()).toBe('bridge-token')
    expect(useAuthStore().token).toBe('bridge-token')
  })

  it('hydrates from persisted localStorage', async () => {
    mockReadPersistedAuthSession.mockReturnValue({ ...session, token: 'persisted-token' })

    const { hydratePrintAuth } = await import('../../../app/utils/authToken')
    expect(await hydratePrintAuth()).toBe('persisted-token')
  })

  it('hydrates from server session cookie endpoint', async () => {
    mockFetchServerSession.mockResolvedValue({ ...session, token: 'cookie-token' })

    const { hydratePrintAuth } = await import('../../../app/utils/authToken')
    expect(await hydratePrintAuth()).toBe('cookie-token')
  })

  it('nimbleAuthFetchOptions includes Authorization when token is available', async () => {
    const { useAuthStore } = await import('../../../app/stores/auth')
    useAuthStore().setSession({ ...session, token: 'opts-token' })

    const { nimbleAuthFetchOptions } = await import('../../../app/utils/authToken')
    const opts = nimbleAuthFetchOptions()
    expect(opts.credentials).toBe('include')
    expect(opts.headers?.Authorization).toBe('Bearer opts-token')
  })
})
