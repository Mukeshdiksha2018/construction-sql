import { reactive, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const runtimeConfig = { public: { nimbleIntegrations: 'false' } }
const route = reactive({ query: {} as Record<string, unknown>, params: {} as Record<string, unknown> })
const currentTab = ref('freight')
const navigateToTab = vi.fn()
const initializeUrl = vi.fn()
const refreshTabState = vi.fn()

vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('useRuntimeConfig', () => runtimeConfig)
vi.stubGlobal('useRoute', () => route)
vi.stubGlobal('useRouter', () => ({ push: vi.fn(), replace: vi.fn() }))

vi.mock('~/composables/useTabRouting', () => ({
  MASTERS_TABS: [
    { name: 'freight', label: 'Freight', icon: '', value: 'freight' },
    { name: 'approval-checks', label: 'Approval Checks', icon: '', value: 'approval-checks' },
    { name: 'po-instruction', label: 'PO Instruction', icon: '', value: 'po-instruction' },
    { name: 'location', label: 'Location', icon: '', value: 'location' },
    { name: 'reason', label: 'Reason', icon: '', value: 'reason' },
    { name: 'credit-days', label: 'Credit Days', icon: '', value: 'credit-days' },
  ],
  useTabRouting: () => ({
    currentTab,
    navigateToTab,
    isTabActive: vi.fn(),
    initializeUrl,
    refreshTabState,
    tabs: [
      { name: 'freight', label: 'Freight', icon: '', value: 'freight' },
      { name: 'approval-checks', label: 'Approval Checks', icon: '', value: 'approval-checks' },
      { name: 'po-instruction', label: 'PO Instruction', icon: '', value: 'po-instruction' },
      { name: 'location', label: 'Location', icon: '', value: 'location' },
      { name: 'reason', label: 'Reason', icon: '', value: 'reason' },
      { name: 'credit-days', label: 'Credit Days', icon: '', value: 'credit-days' },
    ],
  }),
}))

const stubs = {
  ClientOnly: { template: '<div><slot /></div>' },
  UTabs: {
    props: ['modelValue', 'items'],
    template: '<div data-testid="masters-tabs"><slot name="content" :item="{ value: modelValue, label: \'\' }" /></div>',
  },
  MastersTabContent: {
    props: ['tab'],
    template: '<div :data-testid="`masters-tab-${tab}`" />',
  },
}

describe('masters index page', () => {
  beforeEach(() => {
    route.query = {}
    currentTab.value = 'freight'
    navigateToTab.mockClear()
    initializeUrl.mockClear()
    refreshTabState.mockClear()
  })

  it('renders screen directly from nimble menuId and does not render tabs', async () => {
    runtimeConfig.public.nimbleIntegrations = 'true'
    route.query = { menuId: '0x010000000000000000000000000000011160' } // approval-checks
    const component = (await import('../../../app/pages/masters/index.vue')).default
    const wrapper = mount(component, { global: { stubs } })
    await flushPromises()

    expect(wrapper.find('[data-testid="masters-tab-approval-checks"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="masters-tabs"]').exists()).toBe(false)
  })

  it('renders tab bar when Nimble integration is disabled', async () => {
    runtimeConfig.public.nimbleIntegrations = 'false'
    currentTab.value = 'location'
    const component = (await import('../../../app/pages/masters/index.vue')).default
    const wrapper = mount(component, { global: { stubs } })
    await flushPromises()

    expect(wrapper.find('[data-testid="masters-tabs"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="masters-tab-location"]').exists()).toBe(true)
  })

  it('renders credit days tab when selected', async () => {
    runtimeConfig.public.nimbleIntegrations = 'false'
    currentTab.value = 'credit-days'
    const component = (await import('../../../app/pages/masters/index.vue')).default
    const wrapper = mount(component, { global: { stubs } })
    await flushPromises()

    expect(wrapper.find('[data-testid="masters-tab-credit-days"]').exists()).toBe(true)
  })
})
