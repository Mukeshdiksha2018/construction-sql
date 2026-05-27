import { defineComponent, h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { MASTERS_TABS, PROJECTS_TABS, useTabRouting } from '~/composables/useTabRouting'

const Harness = defineComponent({
  setup() {
    const routing = useTabRouting(PROJECTS_TABS, 'project-details')
    return { routing }
  },
  render() {
    return h('div')
  },
})

describe('useTabRouting', () => {
  let router: ReturnType<typeof createRouter>

  beforeEach(async () => {
    router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/projects', component: { template: '<div />' } }],
    })
    await router.push('/projects')
    await router.isReady()
  })

  async function mountHarness(query: Record<string, string> = {}) {
    await router.replace({ path: '/projects', query })
    return mount(Harness, {
      global: {
        plugins: [router],
      },
    })
  }

  it('defaults to project-details when tab query is missing', async () => {
    const wrapper = await mountHarness()
    expect(wrapper.vm.routing.currentTab.value).toBe('project-details')
  })

  it('reads tab from URL query', async () => {
    const wrapper = await mountHarness({ tab: 'estimates' })
    expect(wrapper.vm.routing.currentTab.value).toBe('estimates')
    expect(wrapper.vm.routing.isTabActive('estimates')).toBe(true)
  })

  it('falls back to default for invalid tab query', async () => {
    const wrapper = await mountHarness({ tab: 'not-a-tab' })
    expect(wrapper.vm.routing.currentTab.value).toBe('project-details')
  })

  it('navigateToTab updates the URL query', async () => {
    const wrapper = await mountHarness()
    wrapper.vm.routing.navigateToTab('items')
    await flushPromises()
    expect(router.currentRoute.value.query.tab).toBe('items')
  })

  it('initializeUrl sets default tab in query', async () => {
    const wrapper = await mountHarness()
    wrapper.vm.routing.initializeUrl()
    await flushPromises()
    expect(router.currentRoute.value.query.tab).toBe('project-details')
  })

  it('exposes all project tabs in order', () => {
    expect(PROJECTS_TABS.map(t => t.name)).toEqual([
      'project-details',
      'cost-codes',
      'items',
      'estimates',
    ])
  })

  it('exposes all masters tabs in order', () => {
    expect(MASTERS_TABS.map(t => t.name)).toEqual([
      'freight',
      'approval-checks',
      'po-instruction',
      'location',
      'reason',
    ])
  })
})
