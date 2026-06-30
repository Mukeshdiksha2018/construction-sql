import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

vi.stubGlobal('definePageMeta', vi.fn())

const stubs = {
  ClientOnly: { template: '<div data-testid="client-only"><slot /></div>' },
  VendorsVendorManagement: {
    name: 'VendorsVendorManagement',
    template: '<div data-testid="vendor-management" />',
  },
  USkeleton: { template: '<div class="skeleton" />' },
}

describe('vendors index page', () => {
  it('renders vendor management inside ClientOnly with loading fallback support', async () => {
    const component = (await import('../../../app/pages/vendors/index.vue')).default
    const wrapper = mount(component, { global: { stubs } })

    expect(wrapper.find('[data-testid="client-only"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="vendor-management"]').exists()).toBe(true)
  })
})
