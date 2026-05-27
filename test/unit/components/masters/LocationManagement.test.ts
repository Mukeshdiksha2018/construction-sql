import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

const mockStore = {
  loading: false,
  error: null as string | null,
  getAll: [] as Array<{
    id: number
    uuid: string
    location_name: string
    location_code: string | null
    description: string | null
    active: boolean
    created_at: string
    updated_at: string
  }>,
  fetchLocations: vi.fn(),
  createLocation: vi.fn(),
  updateLocation: vi.fn(),
  deleteLocation: vi.fn(),
}

const toastAdd = vi.fn()

vi.mock('~/stores/locations', () => ({
  useLocationsStore: () => mockStore,
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
const USwitchStub = {
  name: 'USwitch',
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: '<input type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />',
}
const UModalStub = {
  name: 'UModal',
  props: ['open', 'title'],
  emits: ['update:open'],
  template: '<div><slot name="body" /><slot name="footer" /></div>',
}
const UTableStub = { name: 'UTable', template: '<div data-testid="table" />' }
const UPaginationStub = { name: 'UPagination', template: '<div />' }
const USelectStub = { name: 'USelect', template: '<div />' }
const USkeletonStub = { name: 'USkeleton', template: '<div />' }
const UBadgeStub = { name: 'UBadge', template: '<div><slot /></div>' }
const UTooltipStub = { name: 'UTooltip', template: '<div><slot /></div>' }

describe('LocationManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStore.loading = false
    mockStore.error = null
    mockStore.getAll = []
    vi.stubGlobal('useToast', () => ({ add: toastAdd }))
  })

  async function mountComponent() {
    const mod = await import('~/components/masters/LocationManagement.vue')
    return mount(mod.default, {
      global: {
        stubs: {
          UButton: UButtonStub,
          UInput: UInputStub,
          UTextarea: UTextareaStub,
          USwitch: USwitchStub,
          UModal: UModalStub,
          UTable: UTableStub,
          UPagination: UPaginationStub,
          USelect: USelectStub,
          USkeleton: USkeletonStub,
          UBadge: UBadgeStub,
          UTooltip: UTooltipStub,
        },
      },
    })
  }

  it('fetches locations on mount', async () => {
    await mountComponent()
    expect(mockStore.fetchLocations).toHaveBeenCalledTimes(1)
  })

  it('shows validation error when required field is empty', async () => {
    const wrapper = await mountComponent()
    const saveButton = wrapper.findAll('button').find(b => b.text().includes('Save Location'))
    expect(saveButton).toBeTruthy()

    await saveButton!.trigger('click')
    expect(saveButton!.attributes('disabled')).toBeDefined()
    expect(mockStore.createLocation).not.toHaveBeenCalled()
  })

  it('creates location with expected payload', async () => {
    mockStore.createLocation.mockResolvedValue({ uuid: 'uuid-1' })
    const wrapper = await mountComponent()

    await wrapper.get('input[placeholder="e.g., Main Warehouse"]').setValue('Main Warehouse')
    await wrapper.get('input[placeholder="e.g., WH-01"]').setValue('WH-01')
    await wrapper.get('textarea[placeholder="Optional description"]').setValue('Primary location')
    await nextTick()

    const saveButton = wrapper.findAll('button').find(b => b.text().includes('Save Location'))
    await saveButton!.trigger('click')

    expect(mockStore.createLocation).toHaveBeenCalledWith({
      location_name: 'Main Warehouse',
      location_code: 'WH-01',
      description: 'Primary location',
      active: true,
    })
    expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({ title: 'Success' }))
  })
})
