import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const mockFetchCorporations = vi.fn()

vi.stubGlobal('defineNuxtPlugin', (plugin: unknown) => plugin)
vi.stubGlobal('useRoute', () => ({ path: '/purchase-orders' }))
vi.stubGlobal('watch', vi.fn())

async function getAuthStore() {
  const { useAuthStore } = await import('../../../app/stores/auth')
  return useAuthStore()
}

async function runCorporationsPlugin(routePath = '/purchase-orders') {
  vi.resetModules()
  vi.stubGlobal('useRoute', () => ({ path: routePath }))
  vi.stubGlobal('useAuthStore', (await import('../../../app/stores/auth')).useAuthStore)
  vi.stubGlobal('useCorporationStore', () => ({
    fetchCorporations: mockFetchCorporations,
    clear: vi.fn(),
  }))

  const plugin = (await import('../../../app/plugins/corporations.client')).default as {
    setup: (nuxtApp: unknown) => Promise<void>
  }
  await plugin.setup({})
}

describe('corporations.client plugin', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockFetchCorporations.mockResolvedValue(undefined)
    ;(await getAuthStore()).clear()
  })

  it('skips boot work on print routes', async () => {
    await runCorporationsPlugin('/purchase-orders/print/po-uuid')

    expect(mockFetchCorporations).not.toHaveBeenCalled()
  })

  it('loads corporations when the user is already authenticated', async () => {
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

    await runCorporationsPlugin('/purchase-orders')

    expect(mockFetchCorporations).toHaveBeenCalled()
  })
})
