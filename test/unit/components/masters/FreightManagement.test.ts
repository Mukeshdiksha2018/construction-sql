import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

const mockStore = {
  loading: false,
  error: null as string | null,
  getAllFreight: [] as Array<{
    id: number
    uuid: string
    freight_name: string
    description: string | null
    active: boolean
    created_at: string
    updated_at: string
  }>,
  fetchFreight: vi.fn(),
  createFreight: vi.fn(),
  updateFreight: vi.fn(),
  deleteFreight: vi.fn(),
}

const toastAdd = vi.fn()

vi.mock('~/stores/freight', () => ({
  useFreightStore: () => mockStore,
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

const UTableStub = {
  name: 'UTable',
  template: '<div data-testid="table" />',
}

const UPaginationStub = { name: 'UPagination', template: '<div />' }
const USelectStub = { name: 'USelect', template: '<div />' }
const USkeletonStub = { name: 'USkeleton', template: '<div />' }
const UBadgeStub = { name: 'UBadge', template: '<div><slot /></div>' }
const UTooltipStub = { name: 'UTooltip', template: '<div><slot /></div>' }

describe('FreightManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStore.loading = false
    mockStore.error = null
    mockStore.getAllFreight = []
    vi.stubGlobal('useToast', () => ({ add: toastAdd }))
  })

  async function mountComponent() {
    const mod = await import('~/components/masters/FreightManagement.vue')
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

  it('fetches freight on mount', async () => {
    await mountComponent()
    expect(mockStore.fetchFreight).toHaveBeenCalledTimes(1)
  })

  it('shows validation error when required field is empty', async () => {
    const wrapper = await mountComponent()
    const saveButton = wrapper.findAll('button').find(b => b.text().includes('Save Freight'))
    expect(saveButton).toBeTruthy()

    await saveButton!.trigger('click')
    expect(saveButton!.attributes('disabled')).toBeDefined()
    expect(mockStore.createFreight).not.toHaveBeenCalled()
  })

  it('creates freight with expected payload', async () => {
    mockStore.createFreight.mockResolvedValue({ uuid: 'uuid-1' })
    const wrapper = await mountComponent()

    await wrapper.get('input[placeholder="Enter freight name (e.g., FedEx, UPS, DHL)"]').setValue('FedEx')
    await wrapper.get('textarea[placeholder="Enter description"]').setValue('Express')
    await nextTick()

    const saveButton = wrapper.findAll('button').find(b => b.text().includes('Save Freight'))
    await saveButton!.trigger('click')

    expect(mockStore.createFreight).toHaveBeenCalledWith({
      freight_name: 'FedEx',
      description: 'Express',
      active: true,
    })
    expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({ title: 'Success' }))
  })
})
