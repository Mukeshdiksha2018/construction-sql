import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import VendorAddressForm from '~/components/vendors/VendorAddressForm.vue'

const mockCreateVendorAddress = vi.fn()
const mockUpdateVendorAddress = vi.fn()

vi.mock('~/stores/vendors', () => ({
  useVendorStore: () => ({
    createVendorAddress: mockCreateVendorAddress,
    updateVendorAddress: mockUpdateVendorAddress,
  }),
}))

vi.stubGlobal('useToast', () => ({ add: vi.fn() }))
vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({ countries: [], states: [] }))

describe('VendorAddressForm', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockCreateVendorAddress.mockReset()
    mockUpdateVendorAddress.mockReset()
  })

  it('renders required address fields', async () => {
    const wrapper = mount(VendorAddressForm, {
      props: {
        modelValue: true,
        vendorId: 'vendor-1',
      },
      global: {
        stubs: {
          UModal: { template: '<div><slot name="header" /><slot name="body" /></div>' },
          UInput: { template: '<input />' },
          UTextarea: { template: '<textarea />' },
          USelect: { template: '<select />' },
          UButton: { template: '<button><slot /></button>' },
          UIcon: true,
        },
      },
    })

    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Add Address')
    expect(wrapper.text()).toContain('Name')
    expect(wrapper.text()).toContain('Address')
    expect(wrapper.text()).toContain('City')
    expect(wrapper.text()).toContain('Country')
    expect(wrapper.text()).toContain('State')
    expect(wrapper.text()).toContain('Zipcode')
    expect(wrapper.text()).toContain('Save')
  })
})
