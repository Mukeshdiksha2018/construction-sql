import { reactive, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const runtimeConfig = { public: { nimbleIntegrations: 'false' } }
const route = reactive({ query: {} as Record<string, unknown>, params: {} as Record<string, unknown> })
const currentTab = ref('project-details')
const navigateToTab = vi.fn()
const initializeUrl = vi.fn()
const refreshTabState = vi.fn()

vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('useRuntimeConfig', () => runtimeConfig)
vi.stubGlobal('useRoute', () => route)
vi.stubGlobal('useRouter', () => ({ push: vi.fn(), replace: vi.fn() }))

vi.mock('~/composables/useTabRouting', () => ({
  PROJECTS_TABS: [
    { name: 'project-details', label: 'Project Details', icon: '', value: 'project-details' },
    { name: 'items', label: 'Items', icon: '', value: 'items' },
    { name: 'estimates', label: 'Estimates', icon: '', value: 'estimates' },
    { name: 'cost-codes', label: 'Cost Codes', icon: '', value: 'cost-codes' },
  ],
  useTabRouting: () => ({
    currentTab,
    navigateToTab,
    isTabActive: vi.fn(),
    initializeUrl,
    refreshTabState,
    tabs: [
      { name: 'project-details', label: 'Project Details', icon: '', value: 'project-details' },
      { name: 'items', label: 'Items', icon: '', value: 'items' },
      { name: 'estimates', label: 'Estimates', icon: '', value: 'estimates' },
      { name: 'cost-codes', label: 'Cost Codes', icon: '', value: 'cost-codes' },
    ],
  }),
}))

const stubs = {
  ClientOnly: { template: '<div><slot /></div>' },
  ProjectsProjectDetails: { template: '<div data-testid="projects-project-details" />' },
  ProjectsItems: { template: '<div data-testid="projects-items" />' },
  ProjectsEstimates: { template: '<div data-testid="projects-estimates" />' },
  ProjectsCostCodes: { template: '<div data-testid="projects-cost-codes" />' },
}

describe('projects index page', () => {
  beforeEach(() => {
    route.query = {}
    currentTab.value = 'project-details'
    navigateToTab.mockClear()
    initializeUrl.mockClear()
    refreshTabState.mockClear()
  })

  it('renders screen directly from nimble menuId and does not render tabs', async () => {
    runtimeConfig.public.nimbleIntegrations = 'true'
    route.query = { menuId: '0x010000000000000000000000000000011140' } // estimates
    const component = (await import('../../../app/pages/projects/index.vue')).default
    const wrapper = mount(component, { global: { stubs } })
    await flushPromises()

    expect(wrapper.find('[data-testid="projects-estimates"]').exists()).toBe(true)
    expect(wrapper.find('u-tabs-stub').exists()).toBe(false)
  })

  it('renders current tab when Nimble integration is disabled', async () => {
    runtimeConfig.public.nimbleIntegrations = 'false'
    currentTab.value = 'cost-codes'
    const component = (await import('../../../app/pages/projects/index.vue')).default
    const wrapper = mount(component, { global: { stubs } })
    await flushPromises()

    expect(wrapper.find('[data-testid="projects-cost-codes"]').exists()).toBe(true)
    expect(wrapper.find('u-tabs-stub').exists()).toBe(false)
  })
})
