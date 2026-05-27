import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

const mockStore = {
  serviceTypes: [] as Array<{
    id: number
    uuid: string
    name: string
    description: string | null
    color: string
    isActive: boolean
    created_at: string
    updated_at: string
  }>,
  loading: false,
  error: null as string | null,
  fetchServiceTypes: vi.fn(),
  createServiceType: vi.fn(),
  updateServiceType: vi.fn(),
  deleteServiceType: vi.fn(),
}

const toastAdd = vi.fn()

vi.mock('~/stores/serviceTypes', () => ({
  useServiceTypesStore: () => mockStore,
}))

const UButtonStub = {
  name: 'UButton',
  props: ['disabled'],
  emits: ['click'],
  template: '<button type="button" :disabled="disabled" @click="!disabled && $emit(\'click\', $event)"><slot /></button>',
}
const UInputStub = {
  name: 'UInput',
  props: ['modelValue', 'placeholder'],
  emits: ['update:modelValue'],
  template: '<input :placeholder="placeholder" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
}
const UTextareaStub = {
  name: 'UTextarea',
  props: ['modelValue', 'placeholder'],
  emits: ['update:modelValue'],
  template: '<textarea :placeholder="placeholder" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
}
const USelectStub = {
  name: 'USelect',
  props: ['modelValue', 'items'],
  emits: ['update:modelValue'],
  template: '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option v-for="item in items" :key="item" :value="item">{{ item }}</option></select>',
}
const UColorPickerStub = {
  name: 'UColorPicker',
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: '<input type="color" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
}
const UModalStub = {
  name: 'UModal',
  props: ['open', 'title'],
  emits: ['update:open'],
  template: '<div><slot name="body" /><slot name="footer" /></div>',
}
const UTableStub = { name: 'UTable', template: '<div data-testid="table" />' }
const UBadgeStub = { name: 'UBadge', template: '<div><slot /></div>' }
const UTooltipStub = { name: 'UTooltip', template: '<div><slot /></div>' }
const UIconStub = { name: 'UIcon', template: '<i />' }

describe('Configurations ServiceTypes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStore.serviceTypes = []
    mockStore.loading = false
    mockStore.error = null
    vi.stubGlobal('useToast', () => ({ add: toastAdd }))
  })

  async function mountComponent() {
    const mod = await import('~/components/configurations/ServiceTypes.vue')
    return mount(mod.default, {
      global: {
        stubs: {
          UButton: UButtonStub,
          UInput: UInputStub,
          UTextarea: UTextareaStub,
          USelect: USelectStub,
          UColorPicker: UColorPickerStub,
          UModal: UModalStub,
          UTable: UTableStub,
          UBadge: UBadgeStub,
          UTooltip: UTooltipStub,
          UIcon: UIconStub,
        },
      },
    })
  }

  it('fetches service types on mount', async () => {
    await mountComponent()
    expect(mockStore.fetchServiceTypes).toHaveBeenCalledTimes(1)
  })

  it('disables save when required name field is empty', async () => {
    const wrapper = await mountComponent()
    const saveButton = wrapper.findAll('button').find(b => b.text().includes('Save Service Type'))
    expect(saveButton).toBeTruthy()
    expect(saveButton!.attributes('disabled')).toBeDefined()
  })

  it('creates service type with expected payload', async () => {
    mockStore.createServiceType.mockResolvedValue({ id: 1, name: 'Electrical' })
    const wrapper = await mountComponent()

    await wrapper.get('input[placeholder="e.g., General Construction, Electrical Services"]').setValue('Electrical')
    await wrapper.get('textarea[placeholder="Describe the service type and what it includes..."]').setValue('Electrical services')
    await wrapper.get('input[type="color"]').setValue('#10B981')
    await nextTick()

    const saveButton = wrapper.findAll('button').find(b => b.text().includes('Save Service Type'))
    await saveButton!.trigger('click')

    expect(mockStore.createServiceType).toHaveBeenCalledWith({
      name: 'Electrical',
      description: 'Electrical services',
      color: '#10b981',
      isActive: true,
    })
    expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({ title: 'Success' }))
  })

  it('shows empty-state text when there are no service types', async () => {
    mockStore.serviceTypes = []
    const wrapper = await mountComponent()
    expect(wrapper.text()).toContain('No service types found')
  })
})
