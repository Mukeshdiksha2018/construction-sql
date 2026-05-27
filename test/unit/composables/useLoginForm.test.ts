import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_AUTHENTICATED_ROUTE } from '../../../app/utils/safe-redirect'
import { useAuthStore, type NimbleSession } from '../../../app/stores/auth'

const mockPush = vi.fn()
const mockFetch = vi.fn()
const mockRoute = { query: {} as Record<string, unknown> }

vi.stubGlobal('useRouter', () => ({ push: mockPush }))
vi.stubGlobal('useRoute', () => mockRoute)
vi.stubGlobal('$fetch', mockFetch)

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
})
