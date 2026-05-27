import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

const mockCorporationStore = {
  selectedCorporationId: 'corp-1',
  selectedCorporation: { id: 'corp-1', name: 'Nimble HQ' },
}

const mockPOStore = {
  loading: false,
  error: null as string | null,
  getPOInstructionsByCorporation: vi.fn(),
  fetchPOInstructions: vi.fn(),
  createPOInstruction: vi.fn(),
  updatePOInstruction: vi.fn(),
  deletePOInstruction: vi.fn(),
}

const toastAdd = vi.fn()

vi.mock('~/stores/corporations', () => ({
  useCorporationStore: () => mockCorporationStore,
}))

vi.mock('~/stores/poInstructions', () => ({
  usePOInstructionsStore: () => mockPOStore,
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
  emits: ['update:modelValue', 'change'],
  template: '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value); $emit(\'change\', $event.target.value)"><option v-for="item in items" :key="item.value" :value="item.value">{{ item.label }}</option></select>',
}
const UModalStub = {
  name: 'UModal',
  props: ['open', 'title'],
  emits: ['update:open'],
  template: '<div><slot name="body" /><slot name="footer" /></div>',
}
const UTableStub = { name: 'UTable', template: '<div data-testid="table" />' }
const UPaginationStub = { name: 'UPagination', template: '<div />' }
const USkeletonStub = { name: 'USkeleton', template: '<div />' }
const UBadgeStub = { name: 'UBadge', template: '<div><slot /></div>' }
const UTooltipStub = { name: 'UTooltip', template: '<div><slot /></div>' }
const UIconStub = { name: 'UIcon', template: '<i />' }

describe('POInstructionManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCorporationStore.selectedCorporationId = 'corp-1'
    mockCorporationStore.selectedCorporation = { id: 'corp-1', name: 'Nimble HQ' }
    mockPOStore.loading = false
    mockPOStore.error = null
    mockPOStore.getPOInstructionsByCorporation.mockReturnValue([])
    vi.stubGlobal('useToast', () => ({ add: toastAdd }))
  })

  async function mountComponent() {
    const mod = await import('~/components/masters/POInstructionManagement.vue')
    return mount(mod.default, {
      global: {
        stubs: {
          UButton: UButtonStub,
          UInput: UInputStub,
          UTextarea: UTextareaStub,
          USelect: USelectStub,
          UModal: UModalStub,
          UTable: UTableStub,
          UPagination: UPaginationStub,
          USkeleton: USkeletonStub,
          UBadge: UBadgeStub,
          UTooltip: UTooltipStub,
          UIcon: UIconStub,
        },
      },
    })
  }

  it('fetches PO instructions on mount for selected corporation', async () => {
    await mountComponent()
    expect(mockPOStore.fetchPOInstructions).toHaveBeenCalledWith('corp-1')
  })

  it('shows corporation warning when trying to add without selected corporation', async () => {
    mockCorporationStore.selectedCorporationId = null
    mockCorporationStore.selectedCorporation = undefined as unknown as { id: string, name: string }

    const wrapper = await mountComponent()
    const addButton = wrapper.findAll('button').find(b => b.text().includes('Add PO Instruction'))
    expect(addButton).toBeTruthy()

    await addButton!.trigger('click')
    expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({
      title: 'No Corporation Selected',
    }))
  })

  it('prevents save when required fields are missing', async () => {
    const wrapper = await mountComponent()
    const saveButton = wrapper.findAll('button').find(b => b.text().includes('Save PO Instruction'))
    expect(saveButton).toBeTruthy()

    await saveButton!.trigger('click')
    expect(saveButton!.attributes('disabled')).toBeDefined()
    expect(mockPOStore.createPOInstruction).not.toHaveBeenCalled()
  })

  it('creates PO instruction with expected payload', async () => {
    mockPOStore.createPOInstruction.mockResolvedValue({ uuid: 'uuid-1' })
    const wrapper = await mountComponent()

    await wrapper.get('input[placeholder="Enter PO instruction name"]').setValue('Invoice Copy')
    await wrapper.get('textarea[placeholder="Enter detailed instruction"]').setValue('Attach invoice copy in PDF.')
    await nextTick()

    const saveButton = wrapper.findAll('button').find(b => b.text().includes('Save PO Instruction'))
    await saveButton!.trigger('click')

    expect(mockPOStore.createPOInstruction).toHaveBeenCalledWith('corp-1', {
      corporation_uuid: 'corp-1',
      po_instruction_name: 'Invoice Copy',
      instruction: 'Attach invoice copy in PDF.',
      status: 'ACTIVE',
    })
    expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({ title: 'Success' }))
  })
})
