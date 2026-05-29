import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../app/utils/printAuthBridge', () => ({
  readPersistedAuthSession: vi.fn(),
}))

async function getAuthStore() {
  const { useAuthStore } = await import('../../../app/stores/auth')
  return useAuthStore()
}

describe('resolveAuthToken', () => {
  beforeEach(async () => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.stubGlobal('useAuthStore', (await import('../../../app/stores/auth')).useAuthStore)
    vi.stubGlobal('useNimbleSessionStore', () => ({
      token: null,
      syncFromAuthStore: vi.fn(),
    }))
    const { readPersistedAuthSession } = await import('../../../app/utils/printAuthBridge')
    vi.mocked(readPersistedAuthSession).mockReturnValue(null)
  })

  it('returns token from auth store when present', async () => {
    const store = await getAuthStore()
    store.setSession({
      token: 'store-token',
      authID: '',
      clientUrl: '',
      clientFullUrl: '',
      userID: '',
      userName: '',
      urlID: 0,
      email: '',
    })

    const { resolveAuthToken } = await import('../../../app/utils/authToken')
    expect(resolveAuthToken()).toBe('store-token')
  })

  it('returns token from nimbleSession store when auth store is empty', async () => {
    vi.stubGlobal('useNimbleSessionStore', () => ({
      token: 'nimble-token',
      syncFromAuthStore: vi.fn(),
    }))

    const { resolveAuthToken } = await import('../../../app/utils/authToken')
    expect(resolveAuthToken()).toBe('nimble-token')
  })

  it('hydrates auth store from persisted localStorage when stores are empty', async () => {
    const { readPersistedAuthSession } = await import('../../../app/utils/printAuthBridge')
    vi.mocked(readPersistedAuthSession).mockReturnValue({
      token: 'persisted-token',
      authID: '',
      clientUrl: '',
      clientFullUrl: '',
      userID: '',
      userName: '',
      urlID: 0,
      email: '',
    })

    const { resolveAuthToken } = await import('../../../app/utils/authToken')
    expect(resolveAuthToken()).toBe('persisted-token')
    expect((await getAuthStore()).token).toBe('persisted-token')
  })

  it('returns null when no token is available anywhere', async () => {
    const { resolveAuthToken } = await import('../../../app/utils/authToken')
    expect(resolveAuthToken()).toBeNull()
  })
})
