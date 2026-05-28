import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_AUTHENTICATED_ROUTE } from '../../../app/utils/safe-redirect'
import { useAuthStore, type NimbleSession } from '../../../app/stores/auth'

const mockPush = vi.fn()
const mockFetch = vi.fn()
const mockLoadPrivileges = vi.fn().mockResolvedValue(undefined)
const mockRoute = { query: {} as Record<string, unknown> }

vi.stubGlobal('useRouter', () => ({ push: mockPush }))
vi.stubGlobal('useRoute', () => mockRoute)
vi.stubGlobal('$fetch', mockFetch)

// Prevent usePrivilegesFetch from pulling in useCorporationStore / useRuntimeConfig
vi.mock('../../../app/composables/usePrivilegesFetch', () => ({
  usePrivilegesFetch: () => ({
    loadPrivileges: mockLoadPrivileges,
    privilegesStore: {},
  }),
}))

const { useLoginForm } = await import('../../../app/composables/useLoginForm')

const sampleSession: NimbleSession = {
  token: 'jwt-token',
  authID: 'auth-id',
  clientUrl: 'qa22',
  clientFullUrl: 'https://qa22.nimbleproperty.net',
  userID: 'user-123',
  userName: 'ajay@nimbleaccounting.com',
  urlID: 70029,
  email: 'ajay@nimbleaccounting.com',
}

describe('useLoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRoute.query = {}
    mockFetch.mockReset()
    mockLoadPrivileges.mockResolvedValue(undefined)
  })

  it('submits credentials to login API and stores session', async () => {
    mockFetch.mockResolvedValue({ session: sampleSession })

    const { email, password, submit } = useLoginForm()
    email.value = 'ajay@nimbleaccounting.com'
    password.value = 'Ajay@123'

    await submit()

    expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'ajay@nimbleaccounting.com',
        password: 'Ajay@123',
      },
    })

    const authStore = useAuthStore()
    expect(authStore.isAuthenticated).toBe(true)
    expect(mockPush).toHaveBeenCalledWith(DEFAULT_AUTHENTICATED_ROUTE)
  })

  it('redirects to safe query redirect when present', async () => {
    mockFetch.mockResolvedValue({ session: sampleSession })
    mockRoute.query = { redirect: '/projects' }

    const { email, password, submit } = useLoginForm()
    email.value = 'ajay@nimbleaccounting.com'
    password.value = 'Ajay@123'

    await submit()

    expect(mockPush).toHaveBeenCalledWith('/projects')
  })

  it('triggers background privileges fetch after successful login', async () => {
    mockFetch.mockResolvedValue({ session: sampleSession })

    const { email, password, submit } = useLoginForm()
    email.value = 'ajay@nimbleaccounting.com'
    password.value = 'Ajay@123'

    await submit()

    expect(mockLoadPrivileges).toHaveBeenCalledTimes(1)
  })

  it('does not call privileges fetch when login API fails', async () => {
    mockFetch.mockRejectedValue({ data: { statusMessage: 'Invalid email or password' } })

    const { email, password, submit } = useLoginForm()
    email.value = 'bad@test.com'
    password.value = 'wrong'

    await submit()

    expect(mockLoadPrivileges).not.toHaveBeenCalled()
  })

  it('still navigates after login even if privileges fetch fails', async () => {
    mockFetch.mockResolvedValue({ session: sampleSession })
    mockLoadPrivileges.mockRejectedValue(new Error('Privileges API down'))

    const { email, password, submit } = useLoginForm()
    email.value = 'ajay@nimbleaccounting.com'
    password.value = 'Ajay@123'

    await submit()

    // router.push should still be called despite privileges failure
    expect(mockPush).toHaveBeenCalledWith(DEFAULT_AUTHENTICATED_ROUTE)
  })

  it('surfaces API error message on failure', async () => {
    mockFetch.mockRejectedValue({
      data: { statusMessage: 'Invalid email or password' },
    })

    const { email, password, submit, errMessage, isLoading } = useLoginForm()
    email.value = 'bad@test.com'
    password.value = 'wrong'

    await submit()

    expect(errMessage.value).toBe('Invalid email or password')
    expect(isLoading.value).toBe(false)
    expect(useAuthStore().isAuthenticated).toBe(false)
  })

  it('sets isLoading to true during submit and resets after', async () => {
    let capturedLoadingState = false
    mockFetch.mockImplementation(async () => {
      capturedLoadingState = true
      return { session: sampleSession }
    })

    const { email, password, submit, isLoading } = useLoginForm()
    email.value = 'ajay@nimbleaccounting.com'
    password.value = 'Ajay@123'

    const p = submit()
    // isLoading is true while the fetch is in flight
    expect(isLoading.value).toBe(true)
    await p
    expect(isLoading.value).toBe(false)
  })

  it('clears errMessage before each submit attempt', async () => {
    // First call fails
    mockFetch.mockRejectedValueOnce({ data: { statusMessage: 'Bad credentials' } })
    const { email, password, submit, errMessage } = useLoginForm()
    email.value = 'a@b.com'
    password.value = 'x'
    await submit()
    expect(errMessage.value).toBe('Bad credentials')

    // Second call succeeds — errMessage should be cleared
    mockFetch.mockResolvedValueOnce({ session: sampleSession })
    await submit()
    expect(errMessage.value).toBeNull()
  })
})
