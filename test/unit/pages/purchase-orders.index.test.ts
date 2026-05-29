import { reactive, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const runtimeConfig = { public: { nimbleIntegrations: 'false' } }
const route = reactive({
  query: {} as Record<string, unknown>,
  params: {} as Record<string, unknown>,
})
const replace = vi.fn()
const currentTab = ref('purchase-orders')
const navigateToTab = vi.fn()
const initializeUrl = vi.fn()
const refreshTabState = vi.fn()
const setFromRoute = vi.fn()

vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('useRuntimeConfig', () => runtimeConfig)
vi.stubGlobal('useRoute', () => route)
vi.stubGlobal('useRouter', () => ({ replace, push: vi.fn() }))
vi.stubGlobal('useNimbleContext', () => ({ setFromRoute }))
vi.stubGlobal('useHead', vi.fn())

vi.mock('~/composables/useTabRouting', () => ({
  PURCHASE_ORDERS_TABS: [
    { name: 'purchase-orders', label: 'Purchase Orders', icon: '', value: 'purchase-orders' },
    { name: 'stock-receipt-note', label: 'Stock Receipt Note', icon: '', value: 'stock-receipt-note' },
  ],
  useTabRouting: () => ({
    currentTab,
    navigateToTab,
    isTabActive: vi.fn(),
    initializeUrl,
    getAvailableTabs: vi.fn(() => []),
    refreshTabState,
    tabs: [
      { name: 'purchase-orders', label: 'Purchase Orders', icon: '', value: 'purchase-orders' },
      { name: 'stock-receipt-note', label: 'Stock Receipt Note', icon: '', value: 'stock-receipt-note' },
    ],
  }),
}))

const stubs = {
  ClientOnly: { template: '<div><slot /></div>' },
  PurchaseOrdersList: { template: '<div data-testid="po-list" />' },
  ReceiptNoteList: { template: '<div data-testid="receipt-note-list" />' },
  StockReturnsList: { template: '<div data-testid="stock-returns-list" />' },
}

describe('purchase-orders index page', () => {
  beforeEach(() => {
    runtimeConfig.public.nimbleIntegrations = 'false'
    route.query = {}
    route.params = {}
    currentTab.value = 'purchase-orders'
    replace.mockClear()
    setFromRoute.mockClear()
    initializeUrl.mockClear()
    refreshTabState.mockClear()
    navigateToTab.mockClear()
  })

  it('renders stock receipt note directly from nimble menuId and does not render tabs', async () => {
    runtimeConfig.public.nimbleIntegrations = 'true'
    route.query = { menuId: '0x010000000000000000000000000000011134' }
    const component = (await import('../../../app/pages/purchase-orders/index.vue')).default
    const wrapper = mount(component, { global: { stubs } })
    await flushPromises()

    expect(wrapper.find('[data-testid="receipt-note-list"]').exists()).toBe(true)
    expect(wrapper.find('u-tabs-stub').exists()).toBe(false)
  })

  it('defaults query tab when nimble mode is enabled and tab is missing', async () => {
    runtimeConfig.public.nimbleIntegrations = 'true'
    route.query = { menuId: '0x010000000000000000000000000000011132' }
    const component = (await import('../../../app/pages/purchase-orders/index.vue')).default
    mount(component, { global: { stubs } })
    await flushPromises()

    expect(replace).toHaveBeenCalledWith({
      query: expect.objectContaining({
        tab: 'purchase-orders',
        menuId: '0x010000000000000000000000000000011131',
      }),
    })
  })

  it('renders stock returns when non-nimble route requests stock-returns tab', async () => {
    runtimeConfig.public.nimbleIntegrations = 'false'
    route.query = { tab: 'stock-returns' }
    const component = (await import('../../../app/pages/purchase-orders/index.vue')).default
    const wrapper = mount(component, { global: { stubs } })
    await flushPromises()

    expect(wrapper.find('[data-testid="stock-returns-list"]').exists()).toBe(true)
  })
})
