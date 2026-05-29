import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

vi.mock('../../../app/utils/auth-session', () => ({
  fetchServerSession: vi.fn(),
}))

vi.mock('../../../app/utils/printAuthBridge', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../app/utils/printAuthBridge')>()
  return {
    ...actual,
    consumePrintAuthSession: vi.fn(),
    readPersistedAuthSession: vi.fn(),
  }
})

async function getAuthStore() {
  const { useAuthStore } = await import('../../../app/stores/auth')
  return useAuthStore()
}

describe('authenticatedFetch', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({ data: { ok: true } })
    const { fetchServerSession } = await import('../../../app/utils/auth-session')
    vi.mocked(fetchServerSession).mockResolvedValue(null)
    const { consumePrintAuthSession, readPersistedAuthSession } = await import('../../../app/utils/printAuthBridge')
    vi.mocked(consumePrintAuthSession).mockReturnValue(null)
    vi.mocked(readPersistedAuthSession).mockReturnValue(null)
  })

  it('sends credentials: include on every request', async () => {
    const store = await getAuthStore()
    store.setSession({
      token: 'test-token',
      authID: '',
      clientUrl: '',
      clientFullUrl: '',
      userID: '',
      userName: '',
      urlID: 0,
      email: '',
    })

    const { authenticatedFetch } = await import('../../../app/utils/authenticatedFetch')
    await authenticatedFetch('/api/purchase-order-forms/po-1')

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/purchase-order-forms/po-1',
      expect.objectContaining({ credentials: 'include' }),
    )
  })

  it('adds Authorization Bearer header when token is in auth store', async () => {
    const store = await getAuthStore()
    store.setSession({
      token: 'my-bearer-token',
      authID: '',
      clientUrl: '',
      clientFullUrl: '',
      userID: '',
      userName: '',
      urlID: 0,
      email: '',
    })

    const { authenticatedFetch } = await import('../../../app/utils/authenticatedFetch')
    await authenticatedFetch('/api/purchase-order-forms/po-1')

    const callOpts = mockFetch.mock.calls[0][1]
    const headers = callOpts.headers as Headers
    expect(headers.get('Authorization')).toBe('Bearer my-bearer-token')
  })

  it('hydrates auth store from session cookie when store is empty', async () => {
    const { fetchServerSession } = await import('../../../app/utils/auth-session')
    vi.mocked(fetchServerSession).mockResolvedValue({
      token: 'cookie-token',
      authID: '',
      clientUrl: '',
      clientFullUrl: '',
      userID: '',
      userName: '',
      urlID: 0,
      email: '',
    })

    const { authenticatedFetch } = await import('../../../app/utils/authenticatedFetch')
    await authenticatedFetch('/api/purchase-order-forms/po-1')

    const store = await getAuthStore()
    expect(store.token).toBe('cookie-token')

    const callOpts = mockFetch.mock.calls[0][1]
    const headers = callOpts.headers as Headers
    expect(headers.get('Authorization')).toBe('Bearer cookie-token')
  })

  it('hydrates auth store from the print bridge when the store is empty', async () => {
    const { consumePrintAuthSession } = await import('../../../app/utils/printAuthBridge')
    vi.mocked(consumePrintAuthSession).mockReturnValue({
      token: 'bridge-token',
      authID: '',
      clientUrl: '',
      clientFullUrl: '',
      userID: '',
      userName: '',
      urlID: 0,
      email: '',
    })

    const { authenticatedFetch } = await import('../../../app/utils/authenticatedFetch')
    await authenticatedFetch('/api/purchase-order-forms/po-1')

    const store = await getAuthStore()
    expect(store.token).toBe('bridge-token')

    const callOpts = mockFetch.mock.calls[0][1]
    const headers = callOpts.headers as Headers
    expect(headers.get('Authorization')).toBe('Bearer bridge-token')
  })

  it('does not overwrite an existing Authorization header', async () => {
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

    const { authenticatedFetch } = await import('../../../app/utils/authenticatedFetch')
    await authenticatedFetch('/api/test', {
      headers: { Authorization: 'Bearer custom-token' },
    })

    const callOpts = mockFetch.mock.calls[0][1]
    const headers = callOpts.headers as Headers
    expect(headers.get('Authorization')).toBe('Bearer custom-token')
  })
})
