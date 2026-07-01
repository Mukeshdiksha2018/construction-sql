import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

const mockStore = {
  loading: false,
  error: null as string | null,
  items: [] as Array<{
    credit_days_id: string
    name: string
    interval_days: number
    status: 0 | 1 | 3
    status_label: 'active' | 'inactive' | 'deleted'
    client_id: string | null
    is_default: boolean | null
  }>,
  get getAll() {
    return this.items
  },
  fetchCreditDays: vi.fn(),
  createCreditDays: vi.fn(),
  updateCreditDays: vi.fn(),
  deleteCreditDays: vi.fn(),
}

const mockRefreshCreditDaysOptions = vi.fn()
const toastAdd = vi.fn()

vi.mock('~/stores/creditDays', () => ({
  useCreditDaysStore: () => mockStore,
}))

vi.mock('~/composables/useCreditDaysOptions', () => ({
  useCreditDaysOptions: () => ({
    refreshCreditDaysOptions: mockRefreshCreditDaysOptions,
  }),
}))

const UButtonStub = {
  name: 'UButton',
  props: ['disabled'],
  emits: ['click'],
  template: '<button type="button" :disabled="disabled" @click="$emit(\'click\', $event)"><slot /></button>',
}
const UInputStub = {
  name: 'UInput',
  props: ['modelValue', 'placeholder', 'type'],
  emits: ['update:modelValue'],
  template: '<input :type="type || \'text\'" :placeholder="placeholder" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
}
const USwitchStub = {
  name: 'USwitch',
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: '<input type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />',
}
const UModalStub = {
  name: 'UModal',
  props: ['open'],
  emits: ['update:open'],
  watch: {
    open: {
      immediate: true,
      handler(this: { $emit: (event: string, value: boolean) => void }, value: boolean) {
        this.$emit('update:open', value)
      },
    },
  },
  template: '<div v-if="open"><slot name="body" /><slot name="footer" /></div>',
}
const UTableStub = { name: 'UTable', template: '<div data-testid="table" />' }
const UPaginationStub = { name: 'UPagination', template: '<div />' }
const USelectStub = { name: 'USelect', template: '<div />' }
const UBadgeStub = { name: 'UBadge', template: '<div><slot /></div>' }
const UTooltipStub = { name: 'UTooltip', template: '<div><slot /></div>' }
const UAlertStub = { name: 'UAlert', props: ['title'], template: '<div>{{ title }}</div>' }
const UIconStub = { name: 'UIcon', template: '<span />' }

describe('CreditDaysManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStore.loading = false
    mockStore.error = null
    mockStore.items = []
    mockRefreshCreditDaysOptions.mockResolvedValue(undefined)
    vi.stubGlobal('useToast', () => ({ add: toastAdd }))
  })

  async function mountComponent() {
    const mod = await import('~/components/masters/CreditDaysManagement.vue')
    return mount(mod.default, {
      global: {
        stubs: {
          UButton: UButtonStub,
          UInput: UInputStub,
          USwitch: USwitchStub,
          UModal: UModalStub,
          UTable: UTableStub,
          UPagination: UPaginationStub,
          USelect: USelectStub,
          UBadge: UBadgeStub,
          UTooltip: UTooltipStub,
          UAlert: UAlertStub,
          UIcon: UIconStub,
        },
      },
    })
  }

  it('fetches credit days on mount', async () => {
    await mountComponent()
    expect(mockStore.fetchCreditDays).toHaveBeenCalledWith(true)
  })

  it('shows add credit days button', async () => {
    const wrapper = await mountComponent()
    expect(wrapper.text()).toContain('Add Credit Days')
  })

  it('creates credit days with expected payload', async () => {
    mockStore.createCreditDays.mockResolvedValue({
      credit_days_id: 'new-1',
      name: 'Net 15',
      interval_days: 15,
      status: 1,
      status_label: 'active',
      client_id: null,
      is_default: null,
    })

    const wrapper = await mountComponent()
    const addButton = wrapper.findAll('button').find(btn => btn.text().includes('Add Credit Days'))
    await addButton!.trigger('click')
    await nextTick()

    await wrapper.get('input[placeholder="e.g. Net 30"]').setValue('Net 15')
    await wrapper.get('input[placeholder="Days"]').setValue('15')
    await nextTick()

    const saveButton = wrapper.findAll('button').find(btn => btn.text().includes('Save Credit Days'))
    await saveButton!.trigger('click')
    await nextTick()

    expect(mockStore.createCreditDays).toHaveBeenCalledWith({
      name: 'Net 15',
      interval_days: 15,
      active: true,
    })
    expect(mockRefreshCreditDaysOptions).toHaveBeenCalled()
    expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({ title: 'Success' }))
  })
})
