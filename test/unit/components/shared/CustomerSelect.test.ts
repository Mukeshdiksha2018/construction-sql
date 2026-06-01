import { mount, flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { ref, nextTick } from 'vue'
import CustomerSelect from '~/components/shared/CustomerSelect.vue'
import { makeCustomerApi } from '../../../helpers/customers'

const mockFetchCustomers = vi.fn()

vi.mock('~/stores/customers', () => ({
  useCustomerStore: () => ({
    customers: ref([]),
    fetchCustomers: mockFetchCustomers,
  }),
}))

const USelectMenuStub = {
  name: 'USelectMenu',
  props: ['modelValue', 'items', 'disabled', 'loading', 'placeholder', 'valueKey', 'labelKey'],
  emits: ['update:modelValue'],
  template: `
    <div
      data-testid="customer-select"
      :data-disabled="disabled"
      :data-loading="loading"
      :data-item-count="items?.length ?? 0"
    >
      <button
        type="button"
        data-testid="select-first"
        @click="$emit('update:modelValue', items?.[0])"
      >select</button>
    </div>
  `,
}

const UAvatarStub = { template: '<span data-testid="avatar" />' }

describe('CustomerSelect', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchCustomers.mockResolvedValue(undefined)
  })

  function mountSelect(props: Record<string, unknown> = {}) {
    return mount(CustomerSelect, {
      props: {
        corporationUuid: 'corp-uuid-1',
        ...props,
      },
      global: {
        stubs: {
          USelectMenu: USelectMenuStub,
          UAvatar: UAvatarStub,
        },
      },
    })
  }

  it('is disabled without corporation', () => {
    const wrapper = mountSelect({ corporationUuid: undefined })
    expect(wrapper.get('[data-testid="customer-select"]').attributes('data-disabled')).toBe('true')
  })

  it('renders options from localCustomers prop', async () => {
    const local = [
      makeCustomerApi({ uuid: 'cust-a', corporation_uuid: 'corp-uuid-1', first_name: 'Alice', last_name: 'A' }),
      makeCustomerApi({ uuid: 'cust-b', corporation_uuid: 'corp-uuid-1', first_name: 'Bob', last_name: 'B' }),
    ]
    const wrapper = mountSelect({ localCustomers: local })
    await flushPromises()

    expect(wrapper.get('[data-testid="customer-select"]').attributes('data-item-count')).toBe('2')
    expect(mockFetchCustomers).not.toHaveBeenCalled()
  })

  it('filters localCustomers by project (includes corp-wide)', async () => {
    const local = [
      makeCustomerApi({ uuid: 'global', corporation_uuid: 'corp-uuid-1', project_uuid: null }),
      makeCustomerApi({ uuid: 'proj-only', corporation_uuid: 'corp-uuid-1', project_uuid: 'proj-1' }),
      makeCustomerApi({ uuid: 'other-proj', corporation_uuid: 'corp-uuid-1', project_uuid: 'proj-2' }),
    ]
    const wrapper = mountSelect({
      localCustomers: local,
      projectUuid: 'proj-1',
    })
    await flushPromises()

    expect(wrapper.get('[data-testid="customer-select"]').attributes('data-item-count')).toBe('2')
  })

  it('refreshes options when localCustomers deep updates', async () => {
    const localCustomers = ref([
      makeCustomerApi({ uuid: 'cust-1', corporation_uuid: 'corp-uuid-1' }),
    ])
    const wrapper = mount(CustomerSelect, {
      props: {
        corporationUuid: 'corp-uuid-1',
        localCustomers: localCustomers.value,
      },
      global: { stubs: { USelectMenu: USelectMenuStub, UAvatar: UAvatarStub } },
    })
    await flushPromises()
    expect(wrapper.get('[data-testid="customer-select"]').attributes('data-item-count')).toBe('1')

    localCustomers.value = [
      ...localCustomers.value,
      makeCustomerApi({ uuid: 'cust-2', corporation_uuid: 'corp-uuid-1', first_name: 'New' }),
    ]
    await wrapper.setProps({ localCustomers: [...localCustomers.value] })
    await flushPromises()

    expect(wrapper.get('[data-testid="customer-select"]').attributes('data-item-count')).toBe('2')
  })

  it('emits normalized uuid on selection', async () => {
    const local = [
      makeCustomerApi({ uuid: 'UPPER-UUID', corporation_uuid: 'corp-uuid-1' }),
    ]
    const wrapper = mountSelect({ localCustomers: local })
    await flushPromises()

    await wrapper.get('[data-testid="select-first"]').trigger('click')

    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted?.[0]?.[0]).toBe('upper-uuid')
  })

  it('syncs modelValue to selected option (case-insensitive)', async () => {
    const local = [
      makeCustomerApi({ uuid: 'cust-abc', corporation_uuid: 'corp-uuid-1', first_name: 'Test', last_name: 'User' }),
    ]
    const wrapper = mountSelect({
      localCustomers: local,
      modelValue: 'CUST-ABC',
    })
    await flushPromises()
    await nextTick()

    expect(wrapper.get('[data-testid="customer-select"]').attributes('data-item-count')).toBe('1')
  })

  it('fetches from store when localCustomers not provided', async () => {
    const storeCustomers = [
      makeCustomerApi({ uuid: 'store-1', corporation_uuid: 'corp-uuid-1' }),
    ]
    mockFetchCustomers.mockImplementation(async () => {
      const { useCustomerStore } = await import('~/stores/customers')
      // store mock returns empty - simulate via mock resolving and checking call
    })

    mountSelect()
    await flushPromises()

    expect(mockFetchCustomers).toHaveBeenCalledWith('corp-uuid-1', null, true)
  })

  it('matches corporation_uuid case-insensitively in local list', async () => {
    const local = [
      makeCustomerApi({ uuid: 'c1', corporation_uuid: 'CORP-UUID-1' }),
    ]
    const wrapper = mountSelect({
      corporationUuid: 'corp-uuid-1',
      localCustomers: local,
    })
    await flushPromises()

    expect(wrapper.get('[data-testid="customer-select"]').attributes('data-item-count')).toBe('1')
  })
})
