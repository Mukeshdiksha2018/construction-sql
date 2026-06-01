import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, nextTick } from 'vue'
import CustomerForm from '~/components/Customers/CustomerForm.vue'
import { makeCustomerApi } from '../../../helpers/customers'

const mockToast = { add: vi.fn() }

vi.stubGlobal('useToast', () => mockToast)

const mockAddCustomer = vi.fn()
const mockUpdateCustomer = vi.fn()

vi.mock('~/stores/customers', () => ({
  useCustomerStore: () => ({
    addCustomer: mockAddCustomer,
    updateCustomer: mockUpdateCustomer,
    loading: ref(false),
  }),
}))

vi.mock('~/stores/corporations', () => ({
  useCorporationStore: () => ({
    selectedCorporation: { uuid: 'corp-uuid-1', name: 'Test Corp' },
    corporations: [{ uuid: 'corp-uuid-1', name: 'Test Corp' }],
    ensureReady: vi.fn(() => Promise.resolve()),
  }),
}))

vi.mock('~/stores/projects', () => ({
  useProjectsStore: () => ({
    projects: [],
  }),
}))

describe('CustomerForm', () => {
  let wrapper: ReturnType<typeof mount> | null = null

  const mockCustomer = makeCustomerApi({
    uuid: 'customer-uuid-1',
    corporation_uuid: 'corp-uuid-1',
    project_uuid: 'project-uuid-1',
    customer_country: 'US',
  })

  beforeEach(() => {
    setActivePinia(createPinia())
    mockToast.add.mockClear()
    mockAddCustomer.mockClear()
    mockUpdateCustomer.mockClear()
    mockAddCustomer.mockResolvedValue({ data: makeCustomerApi({ uuid: 'new-customer' }) })
    mockUpdateCustomer.mockResolvedValue({ data: mockCustomer })
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    vi.clearAllMocks()
  })

  const stubs = {
    UModal: {
      template: '<div><slot name="header" /><slot name="body" /><slot name="footer" /></div>',
      props: ['open'],
    },
    UInput: {
      template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
      props: ['modelValue'],
    },
    USelect: {
      template: '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option /></select>',
      props: ['modelValue', 'items', 'disabled'],
    },
    UButton: {
      template: '<button type="button" @click="$emit(\'click\')"><slot /></button>',
      props: ['loading', 'color', 'variant'],
    },
    UIcon: { template: '<span />' },
    CorporationSelect: {
      template: '<select :disabled="disabled" :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)" />',
      props: ['modelValue', 'disabled'],
    },
    ProjectSelect: {
      template: '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)" />',
      props: ['modelValue', 'corporationUuid', 'disabled'],
    },
  }

  function createWrapper(props: Record<string, unknown> = {}) {
    return mount(CustomerForm, {
      props: { modelValue: false, customer: null, ...props },
      global: { stubs },
    })
  }

  async function openModal(props: Record<string, unknown> = {}) {
    await wrapper!.setProps({ modelValue: true, customer: null, ...props })
    await flushPromises()
  }

  it('mounts in add mode', () => {
    wrapper = createWrapper()
    expect(wrapper.exists()).toBe(true)
  })

  it('normalizes legacy country name on edit', async () => {
    wrapper = createWrapper({ modelValue: false, customer: null })
    await wrapper.setProps({
      modelValue: true,
      customer: { ...mockCustomer, customer_country: 'United States' },
    })
    await flushPromises()

    expect((wrapper.vm as { form: { customer_country: string } }).form.customer_country).toBe('US')
  })

  it('locks corporation when lockCorporation is true', async () => {
    wrapper = createWrapper({
      lockCorporation: true,
      initialCorporationUuid: 'corp-from-project',
    })
    await openModal()

    const vm = wrapper.vm as {
      form: { corporation_uuid: string }
      handleCorporationChange: (v: string) => void
    }
    expect(vm.form.corporation_uuid).toBe('corp-from-project')
    vm.handleCorporationChange('other-corp')
    expect(vm.form.corporation_uuid).toBe('corp-from-project')
  })

  it('validates corporation before submit', async () => {
    wrapper = createWrapper()
    await openModal()

    const vm = wrapper.vm as {
      form: { corporation_uuid: string, first_name: string, last_name: string }
      submitCustomer: () => Promise<void>
    }
    vm.form.corporation_uuid = ''
    vm.form.first_name = 'John'
    vm.form.last_name = 'Doe'
    await vm.submitCustomer()

    expect(mockToast.add).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Validation Error', description: expect.stringContaining('corporation') }),
    )
    expect(mockAddCustomer).not.toHaveBeenCalled()
  })

  it('validates first and last name', async () => {
    wrapper = createWrapper({ initialCorporationUuid: 'corp-1' })
    await openModal()

    const vm = wrapper.vm as {
      form: { first_name: string, last_name: string }
      submitCustomer: () => Promise<void>
    }
    vm.form.first_name = ''
    vm.form.last_name = 'Doe'
    await vm.submitCustomer()

    expect(mockToast.add).toHaveBeenCalledWith(
      expect.objectContaining({ description: expect.stringContaining('first name') }),
    )
  })

  it('creates customer and emits customer-saved', async () => {
    wrapper = createWrapper({
      initialCorporationUuid: 'corp-uuid-1',
      initialProjectUuid: 'proj-1',
      lockCorporation: true,
    })
    await openModal()

    const vm = wrapper.vm as {
      form: Record<string, string>
      submitCustomer: () => Promise<void>
    }
    vm.form.first_name = 'Jane'
    vm.form.last_name = 'Doe'
    vm.form.customer_email = 'jane@test.com'
    await vm.submitCustomer()
    await flushPromises()

    expect(mockAddCustomer).toHaveBeenCalledWith(
      'corp-uuid-1',
      expect.objectContaining({
        first_name: 'Jane',
        last_name: 'Doe',
        project_uuid: 'proj-1',
      }),
    )
    expect(wrapper.emitted('customer-saved')?.[0]?.[0]).toMatchObject({ uuid: 'new-customer' })
  })

  it('updates existing customer', async () => {
    wrapper = createWrapper({ modelValue: false, customer: mockCustomer })
    await wrapper.setProps({ modelValue: true, customer: mockCustomer })
    await flushPromises()

    const vm = wrapper.vm as {
      form: { first_name: string }
      submitCustomer: () => Promise<void>
    }
    vm.form.first_name = 'Janet'
    await vm.submitCustomer()
    await flushPromises()

    expect(mockUpdateCustomer).toHaveBeenCalled()
    expect(wrapper.emitted('customer-saved')).toBeTruthy()
  })

  it('passes existing profile_image_url in create payload (no Supabase upload)', async () => {
    wrapper = createWrapper({ initialCorporationUuid: 'corp-1', lockCorporation: true })
    await openModal()

    const vm = wrapper.vm as {
      form: { first_name: string, last_name: string, profile_image_url: string }
      submitCustomer: () => Promise<void>
    }
    vm.form.first_name = 'Pic'
    vm.form.last_name = 'User'
    vm.form.profile_image_url = 'data:image/png;base64,abc'
    await vm.submitCustomer()
    await flushPromises()

    expect(mockAddCustomer).toHaveBeenCalledWith(
      'corp-1',
      expect.objectContaining({
        profile_image_url: 'data:image/png;base64,abc',
      }),
    )
  })
})
