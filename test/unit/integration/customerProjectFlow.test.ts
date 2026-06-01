import { createPinia, setActivePinia } from 'pinia'
import { mount, flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import CustomerSelect from '~/components/shared/CustomerSelect.vue'
import { useProjectsStore } from '~/stores/projects'
import { makeCustomerApi } from '../../helpers/customers'

const mockApiFetch = vi.fn()

vi.mock('~/composables/useApiClient', () => ({
  useApiClient: () => ({ apiFetch: mockApiFetch }),
}))

vi.mock('~/stores/customers', () => ({
  useCustomerStore: () => ({
    customers: [],
    fetchCustomers: vi.fn(),
  }),
}))

const USelectMenuStub = {
  props: ['items', 'modelValue', 'disabled'],
  emits: ['update:modelValue'],
  template: `
    <div data-testid="customer-select" :data-item-count="items?.length ?? 0">
      <span data-testid="selected-label">{{ modelValue?.label ?? modelValue?.value ?? '' }}</span>
    </div>
  `,
}

describe('customer project flow integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetchLocalCustomers normalizes ids and CustomerSelect shows new row', async () => {
    const store = useProjectsStore()
    const newCustomer = makeCustomerApi({
      uuid: 'NEW-CUSTOMER-UUID',
      corporation_uuid: 'CORP-1',
    })

    mockApiFetch.mockResolvedValue({
      data: [{
        ...newCustomer,
        uuid: 'NEW-CUSTOMER-UUID',
        corporation_uuid: 'CORP-1',
      }],
    })

    await store.fetchLocalCustomers('corp-1')
    expect(store.localCustomers[0].uuid).toBe('new-customer-uuid')
    expect(store.localCustomers[0].corporation_uuid).toBe('corp-1')

    const wrapper = mount(CustomerSelect, {
      props: {
        corporationUuid: 'corp-1',
        localCustomers: store.localCustomers,
        modelValue: 'new-customer-uuid',
      },
      global: {
        stubs: { USelectMenu: USelectMenuStub, UAvatar: { template: '<span />' } },
      },
    })
    await flushPromises()
    await nextTick()

    expect(wrapper.get('[data-testid="customer-select"]').attributes('data-item-count')).toBe('1')
  })

  it('simulates post-create refresh: localCustomers update adds option', async () => {
    const store = useProjectsStore()
    store.localCustomers = [makeCustomerApi({ uuid: 'existing', corporation_uuid: 'corp-1' })]

    const wrapper = mount(CustomerSelect, {
      props: {
        corporationUuid: 'corp-1',
        localCustomers: [...store.localCustomers],
      },
      global: {
        stubs: { USelectMenu: USelectMenuStub, UAvatar: { template: '<span />' } },
      },
    })
    await flushPromises()
    expect(wrapper.get('[data-testid="customer-select"]').attributes('data-item-count')).toBe('1')

    const saved = makeCustomerApi({ uuid: 'brand-new', corporation_uuid: 'corp-1', first_name: 'Created' })
    store.localCustomers = [...store.localCustomers, saved]
    await wrapper.setProps({ localCustomers: [...store.localCustomers] })
    await flushPromises()

    expect(wrapper.get('[data-testid="customer-select"]').attributes('data-item-count')).toBe('2')
  })
})
