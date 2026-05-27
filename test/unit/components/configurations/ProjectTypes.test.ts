import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

const mockStore = {
  projectTypes: [] as Array<{
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
  fetchProjectTypes: vi.fn(),
  createProjectType: vi.fn(),
  updateProjectType: vi.fn(),
  deleteProjectType: vi.fn(),
}

const toastAdd = vi.fn()

vi.mock('~/stores/projectTypes', () => ({
  useProjectTypesStore: () => mockStore,
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

describe('Configurations ProjectTypes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStore.projectTypes = []
    mockStore.loading = false
    mockStore.error = null
    vi.stubGlobal('useToast', () => ({ add: toastAdd }))
  })

  async function mountComponent() {
    const mod = await import('~/components/configurations/ProjectTypes.vue')
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

  it('fetches project types on mount', async () => {
    await mountComponent()
    expect(mockStore.fetchProjectTypes).toHaveBeenCalledTimes(1)
  })

  it('disables save when required name field is empty', async () => {
    const wrapper = await mountComponent()
    const saveButton = wrapper.findAll('button').find(b => b.text().includes('Save Project Type'))
    expect(saveButton).toBeTruthy()
    expect(saveButton!.attributes('disabled')).toBeDefined()
  })

  it('creates project type with expected payload', async () => {
    mockStore.createProjectType.mockResolvedValue({ id: 1, name: 'Residential' })
    const wrapper = await mountComponent()

    await wrapper.get('input[placeholder="e.g., Residential Construction"]').setValue('Residential')
    await wrapper.get('textarea[placeholder="Describe the project type..."]').setValue('Residential projects')
    await wrapper.get('input[type="color"]').setValue('#10B981')
    await nextTick()

    const saveButton = wrapper.findAll('button').find(b => b.text().includes('Save Project Type'))
    await saveButton!.trigger('click')

    expect(mockStore.createProjectType).toHaveBeenCalledWith({
      name: 'Residential',
      description: 'Residential projects',
      color: '#10b981',
      isActive: true,
    })
    expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({ title: 'Success' }))
  })

  it('shows empty-state text when there are no project types', async () => {
    mockStore.projectTypes = []
    const emptyWrapper = await mountComponent()

    expect(emptyWrapper.text()).toContain('No project types found')
  })
})
