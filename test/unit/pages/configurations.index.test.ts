import { reactive, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const runtimeConfig = { public: { nimbleIntegrations: 'false' } }
const route = reactive({ query: {} as Record<string, unknown>, params: {} as Record<string, unknown> })
const currentTab = ref('project-types')
const navigateToTab = vi.fn()
const initializeUrl = vi.fn()
const refreshTabState = vi.fn()

vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('useRuntimeConfig', () => runtimeConfig)
vi.stubGlobal('useRoute', () => route)

vi.mock('~/composables/useTabRouting', () => ({
  CONFIGURATIONS_TABS: [
    { name: 'project-types', label: 'Project Types', icon: '', value: 'project-types' },
    { name: 'service-types', label: 'Service Types', icon: '', value: 'service-types' },
    { name: 'terms-and-conditions', label: 'Terms and Conditions', icon: '', value: 'terms-and-conditions' },
  ],
  useTabRouting: () => ({
    currentTab,
    navigateToTab,
    initializeUrl,
    refreshTabState,
    tabs: [
      { name: 'project-types', label: 'Project Types', icon: '', value: 'project-types' },
      { name: 'service-types', label: 'Service Types', icon: '', value: 'service-types' },
      { name: 'terms-and-conditions', label: 'Terms and Conditions', icon: '', value: 'terms-and-conditions' },
    ],
  }),
}))

const stubs = {
  ClientOnly: { template: '<div><slot /></div>' },
  ConfigurationsProjectTypes: { template: '<div data-testid="config-project-types" />' },
  ConfigurationsServiceTypes: { template: '<div data-testid="config-service-types" />' },
  ConfigurationsTermsAndConditions: { template: '<div data-testid="config-terms" />' },
}

describe('configurations index page', () => {
  beforeEach(() => {
    route.query = {}
    currentTab.value = 'project-types'
    navigateToTab.mockClear()
    initializeUrl.mockClear()
    refreshTabState.mockClear()
  })

  it('renders screen directly from nimble menuId and does not render tabs', async () => {
    runtimeConfig.public.nimbleIntegrations = 'true'
    route.query = { menuId: '0x010000000000000000000000000000011150' } // service-types
    const component = (await import('../../../app/pages/configurations/index.vue')).default
    const wrapper = mount(component, { global: { stubs } })
    await flushPromises()

    expect(wrapper.find('[data-testid="config-service-types"]').exists()).toBe(true)
    expect(wrapper.find('u-tabs-stub').exists()).toBe(false)
  })

  it('renders current tab when Nimble integration is disabled', async () => {
    runtimeConfig.public.nimbleIntegrations = 'false'
    currentTab.value = 'terms-and-conditions'
    const component = (await import('../../../app/pages/configurations/index.vue')).default
    const wrapper = mount(component, { global: { stubs } })
    await flushPromises()

    expect(wrapper.find('[data-testid="config-terms"]').exists()).toBe(true)
    expect(wrapper.find('u-tabs-stub').exists()).toBe(false)
  })
})
