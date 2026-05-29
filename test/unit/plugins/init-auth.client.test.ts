import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const mockFetchServerSession = vi.fn()
const mockConsumePrintAuthSession = vi.fn()
const mockReadPersistedAuthSession = vi.fn()

vi.mock('../../../app/utils/auth-session', () => ({
  fetchServerSession: (...args: unknown[]) => mockFetchServerSession(...args),
}))

vi.mock('../../../app/utils/printAuthBridge', () => ({
  consumePrintAuthSession: (...args: unknown[]) => mockConsumePrintAuthSession(...args),
  readPersistedAuthSession: (...args: unknown[]) => mockReadPersistedAuthSession(...args),
}))

vi.mock('../../../app/utils/authToken', () => ({
  resolveAuthToken: vi.fn().mockReturnValue(null),
  syncNimbleSessionFromAuth: vi.fn(),
}))

vi.stubGlobal('defineNuxtPlugin', (plugin: unknown) => plugin)

async function runInitAuthPlugin() {
  vi.resetModules()
  vi.stubGlobal('useAuthStore', (await import('../../../app/stores/auth')).useAuthStore)
  const plugin = (await import('../../../app/plugins/init-auth.client')).default as {
    setup: (nuxtApp: { provide: ReturnType<typeof vi.fn> }) => Promise<void>
  }
  const provide = vi.fn()
  await plugin.setup({ provide })
  return provide
}

describe('init-auth.client plugin', () => {
  beforeEach(async () => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockFetchServerSession.mockResolvedValue(null)
    mockConsumePrintAuthSession.mockReturnValue(null)
    mockReadPersistedAuthSession.mockReturnValue(null)
    ;(await import('../../../app/stores/auth')).useAuthStore().clear()
  })

  it('hydrates from print bridge before cookie session', async () => {
    mockConsumePrintAuthSession.mockReturnValue({
      token: 'bridge-token',
      authID: '',
      clientUrl: '',
      clientFullUrl: '',
      userID: '',
      userName: '',
      urlID: 0,
      email: '',
    })

    await runInitAuthPlugin()

    const { useAuthStore } = await import('../../../app/stores/auth')
    expect(useAuthStore().token).toBe('bridge-token')
    expect(mockFetchServerSession).not.toHaveBeenCalled()
  })

  it('hydrates from persisted localStorage when bridge is absent', async () => {
    mockReadPersistedAuthSession.mockReturnValue({
      token: 'persisted-token',
      authID: '',
      clientUrl: '',
      clientFullUrl: '',
      userID: '',
      userName: '',
      urlID: 0,
      email: '',
    })

    await runInitAuthPlugin()

    const { useAuthStore } = await import('../../../app/stores/auth')
    expect(useAuthStore().token).toBe('persisted-token')
  })

  it('falls back to cookie session via fetchServerSession', async () => {
    mockFetchServerSession.mockResolvedValue({
      token: 'cookie-token',
      authID: '',
      clientUrl: '',
      clientFullUrl: '',
      userID: '',
      userName: '',
      urlID: 0,
      email: '',
    })

    await runInitAuthPlugin()

    const { useAuthStore } = await import('../../../app/stores/auth')
    expect(useAuthStore().token).toBe('cookie-token')
  })

  it('provides authReady promise to nuxt app', async () => {
    const provide = await runInitAuthPlugin()
    expect(provide).toHaveBeenCalledWith('authReady', expect.any(Promise))
  })

  it('does not clear an existing persisted token when cookie check fails', async () => {
    const { useAuthStore } = await import('../../../app/stores/auth')
    useAuthStore().setSession({
      token: 'keep-me',
      authID: '',
      clientUrl: '',
      clientFullUrl: '',
      userID: '',
      userName: '',
      urlID: 0,
      email: '',
    })

    await runInitAuthPlugin()

    expect(useAuthStore().token).toBe('keep-me')
  })
})
