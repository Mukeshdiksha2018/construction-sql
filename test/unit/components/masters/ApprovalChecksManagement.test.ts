import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

const mockStore = {
  loading: false,
  error: null as string | null,
  getAllApprovalChecks: [] as Array<{
    id: number
    uuid: string
    approval_check: string
    description: string | null
    active: boolean
    created_at: string
    updated_at: string
  }>,
  fetchApprovalChecks: vi.fn(),
  createApprovalCheck: vi.fn(),
  updateApprovalCheck: vi.fn(),
  deleteApprovalCheck: vi.fn(),
}

const toastAdd = vi.fn()

vi.mock('~/stores/approvalChecks', () => ({
  useApprovalChecksStore: () => mockStore,
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

describe('ApprovalChecksManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStore.loading = false
    mockStore.error = null
    mockStore.getAllApprovalChecks = []
    vi.stubGlobal('useToast', () => ({ add: toastAdd }))
  })

  async function mountComponent() {
    const mod = await import('~/components/masters/ApprovalChecksManagement.vue')
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

  it('fetches approval checks on mount', async () => {
    await mountComponent()
    expect(mockStore.fetchApprovalChecks).toHaveBeenCalledTimes(1)
  })

  it('shows validation error when required field is empty', async () => {
    const wrapper = await mountComponent()
    const saveButton = wrapper.findAll('button').find(b => b.text().includes('Save Approval Check'))
    expect(saveButton).toBeTruthy()

    await saveButton!.trigger('click')
    expect(saveButton!.attributes('disabled')).toBeDefined()
    expect(mockStore.createApprovalCheck).not.toHaveBeenCalled()
  })

  it('creates approval check with expected payload', async () => {
    mockStore.createApprovalCheck.mockResolvedValue({ uuid: 'uuid-1' })
    const wrapper = await mountComponent()

    await wrapper.get('input[placeholder="Enter approval check name"]').setValue('Manager Review')
    await wrapper.get('textarea[placeholder="Enter description"]').setValue('Needs manager approval')
    await nextTick()

    const saveButton = wrapper.findAll('button').find(b => b.text().includes('Save Approval Check'))
    await saveButton!.trigger('click')

    expect(mockStore.createApprovalCheck).toHaveBeenCalledWith({
      approval_check: 'Manager Review',
      description: 'Needs manager approval',
      active: true,
    })
    expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({ title: 'Success' }))
  })
})
