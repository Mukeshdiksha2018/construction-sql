import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

const runtimeConfig = { public: { nimbleIntegrations: 'false' } }

vi.stubGlobal('useRuntimeConfig', () => runtimeConfig)

const stubs = {
  LayoutSideMenu: { template: '<div data-testid="side-menu" />' },
  LayoutTopBar: { template: '<div data-testid="top-bar" />' },
  LayoutMobileBottomNav: { template: '<div data-testid="mobile-nav" />' },
}

describe('main-layout', () => {
  it('shows side menu and top bar when Nimble integration is disabled', async () => {
    runtimeConfig.public.nimbleIntegrations = 'false'
    const component = (await import('../../../app/layouts/main-layout.vue')).default

    const wrapper = mount(component, {
      slots: { default: '<div data-testid="page-content">content</div>' },
      global: { stubs },
    })

    expect(wrapper.find('[data-testid="side-menu"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="top-bar"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="mobile-nav"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="page-content"]').exists()).toBe(true)
  })

  it('hides side menu and top bar when Nimble integration is enabled', async () => {
    runtimeConfig.public.nimbleIntegrations = 'true'
    const component = (await import('../../../app/layouts/main-layout.vue')).default

    const wrapper = mount(component, {
      slots: { default: '<div data-testid="page-content">content</div>' },
      global: { stubs },
    })

    expect(wrapper.find('[data-testid="side-menu"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="top-bar"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="mobile-nav"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="page-content"]').exists()).toBe(true)
  })
})
