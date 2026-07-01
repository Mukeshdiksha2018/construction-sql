import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import VendorManagement from '~/components/vendors/VendorManagement.vue'
import {
  createUTableStub,
  makeNimbleDbVendor,
  UAlertStub,
  UBadgeStub,
  UButtonStub,
  UInputStub,
  UModalStub,
  USelectStub,
  UTooltipStub,
} from './vendorTestUtils'

const mockState = vi.hoisted(() => ({
  nimbleLoading: false,
  nimbleError: null as string | null,
  selectedCorporation: { id: 'corp-1', name: 'Test Corp' } as { id: string, name: string } | null,
  vendors: [
    {
      vendor_id: 'v1',
      name: 'Acme Supplies',
      company_name: 'Acme LLC',
      corporation_id: 'corp-1',
      account_id: null,
      status: 1,
      status_label: 'active',
      tax_id: '12-3456789',
      federal_id: '12-3456789',
      ssn: null,
      mobile_num: '555-0100',
      email: 'billing@acme.test',
      address: '100 Main St',
      business_type: 'Supplier',
      account_number: 'ACC-100',
      payment_method: 'Check',
      total_due: 1250.5,
      is_1099: false,
      credit_days_id: null,
      print_check_as: null,
      type: 1,
      bid: '1',
    },
  ] as Array<Record<string, unknown>>,
}))

const mockFetchNimble = vi.fn()
const mockRefresh = vi.fn()
const mockDeleteNimbleVendor = vi.fn()
const mockFetchAccounts = vi.fn()
const mockRefreshCreditDaysOptions = vi.fn()
const toastAdd = vi.fn()

vi.mock('~/stores/vendors', () => ({
  useVendorStore: () => ({
    nimbleLoading: mockState.nimbleLoading,
    nimbleError: mockState.nimbleError,
    getNimbleVendorsForCorporation: (_corpId: string) => mockState.vendors,
    fetchNimbleDbVendors: mockFetchNimble,
    refresh: mockRefresh,
    deleteNimbleVendor: mockDeleteNimbleVendor,
  }),
}))

vi.mock('~/stores/corporations', () => ({
  useCorporationStore: () => ({
    selectedCorporation: mockState.selectedCorporation,
    corporations: [{ id: 'corp-1', name: 'Test Corp' }],
  }),
}))

vi.mock('~/stores/chartOfAccounts', () => ({
  useChartOfAccountsStore: () => ({
    accounts: [],
    getAccountLabel: (id: string) => id,
    fetchAccounts: mockFetchAccounts,
  }),
}))

vi.stubGlobal('useToast', () => ({ add: toastAdd }))

vi.mock('~/composables/useCreditDaysOptions', () => ({
  useCreditDaysOptions: () => ({
    refreshCreditDaysOptions: mockRefreshCreditDaysOptions,
  }),
}))

function mountVendorManagement() {
  return mount(VendorManagement, {
    global: {
      stubs: {
        UInput: UInputStub,
        UButton: UButtonStub,
        UTable: createUTableStub(),
        UPagination: true,
        USelect: USelectStub,
        UModal: UModalStub,
        UBadge: UBadgeStub,
        UTooltip: UTooltipStub,
        UAlert: UAlertStub,
        UIcon: { template: '<span class="icon" />' },
        VendorsVendorForm: {
          name: 'VendorsVendorForm',
          props: ['modelValue', 'vendor'],
          emits: ['update:modelValue', 'saved'],
          template: `
            <div
              data-testid="vendor-form"
              :data-open="String(modelValue)"
              :data-vendor-id="vendor?.vendor_id || ''"
            />
          `,
        },
      },
    },
  })
}

describe('VendorManagement', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockState.nimbleLoading = false
    mockState.nimbleError = null
    mockState.selectedCorporation = { id: 'corp-1', name: 'Test Corp' }
    mockState.vendors = [makeNimbleDbVendor()]
    mockFetchNimble.mockReset().mockResolvedValue(undefined)
    mockRefresh.mockReset().mockResolvedValue(undefined)
    mockDeleteNimbleVendor.mockReset().mockResolvedValue(undefined)
    mockFetchAccounts.mockReset().mockResolvedValue(undefined)
    mockRefreshCreditDaysOptions.mockReset().mockResolvedValue(undefined)
    toastAdd.mockReset()
  })

  it('loads vendors and chart of accounts for selected corporation on mount', async () => {
    await mountVendorManagement()

    expect(mockFetchNimble).toHaveBeenCalledWith('corp-1', true)
    expect(mockFetchAccounts).toHaveBeenCalledWith('corp-1')
    expect(mockRefreshCreditDaysOptions).toHaveBeenCalled()
  })

  it('shows add vendor controls when corporation is selected', async () => {
    const wrapper = await mountVendorManagement()

    expect(wrapper.text()).toContain('Add Vendor')
    expect(wrapper.find('input[placeholder="Search vendors..."]').exists()).toBe(true)
  })

  it('prompts to select a corporation when none is selected', async () => {
    mockState.selectedCorporation = null
    const wrapper = await mountVendorManagement()

    expect(wrapper.text()).toContain('Select a corporation in the top bar to manage vendors.')
    expect(wrapper.text()).not.toContain('Add Vendor')
  })

  it('shows loading spinner while nimbleLoading', async () => {
    mockState.nimbleLoading = true
    const wrapper = await mountVendorManagement()

    expect(wrapper.text()).toContain('Loading vendors...')
    expect(wrapper.find('.icon').exists()).toBe(true)
  })

  it('shows error alert when fetch fails and no vendors are visible', async () => {
    mockState.nimbleError = 'Failed to load vendors'
    mockState.vendors = []
    const wrapper = await mountVendorManagement()

    const alert = wrapper.find('.alert')
    expect(alert.exists()).toBe(true)
    expect(alert.attributes('data-title')).toBe('Failed to load vendors')
  })

  it('excludes deleted vendors from the table data', async () => {
    mockState.vendors = [
      makeNimbleDbVendor({ vendor_id: 'active', name: 'Active Co', status: 1 }),
      makeNimbleDbVendor({ vendor_id: 'deleted', name: 'Deleted Co', status: 3 }),
    ]

    const wrapper = await mountVendorManagement()
    await nextTick()

    expect(wrapper.find('[data-testid="vendor-table"]').attributes('data-row-count')).toBe('1')
    expect(wrapper.text()).toContain('Active Co')
    expect(wrapper.text()).not.toContain('Deleted Co')
  })

  it('defaults status filter to active vendors only', async () => {
    mockState.vendors = [
      makeNimbleDbVendor({ vendor_id: 'active', name: 'Active Co', status: 1 }),
      makeNimbleDbVendor({ vendor_id: 'inactive', name: 'Inactive Co', status: 0 }),
    ]

    const wrapper = await mountVendorManagement()
    await nextTick()

    expect(wrapper.find('[data-testid="vendor-table"]').attributes('data-row-count')).toBe('1')
    expect(wrapper.text()).toContain('Active Co')
    expect(wrapper.text()).not.toContain('Inactive Co')
  })

  it('shows inactive vendors when status filter is changed', async () => {
    mockState.vendors = [
      makeNimbleDbVendor({ vendor_id: 'active', name: 'Active Co', status: 1 }),
      makeNimbleDbVendor({ vendor_id: 'inactive', name: 'Inactive Co', status: 0 }),
    ]

    const wrapper = await mountVendorManagement()
    const statusSelect = wrapper.find('select')
    await statusSelect.setValue('inactive')
    await nextTick()

    expect(wrapper.find('[data-testid="vendor-table"]').attributes('data-row-count')).toBe('1')
    expect(wrapper.text()).toContain('Inactive Co')
    expect(wrapper.text()).not.toContain('Active Co')
  })

  it('filters vendors by global search across profile fields', async () => {
    mockState.vendors = [
      makeNimbleDbVendor({ vendor_id: 'v1', name: 'Alpha Plumbing', email: 'alpha@test.com' }),
      makeNimbleDbVendor({ vendor_id: 'v2', name: 'Beta Electric', email: 'beta@test.com' }),
    ]

    const wrapper = await mountVendorManagement()
    await wrapper.find('input[placeholder="Search vendors..."]').setValue('beta@test.com')
    await nextTick()

    expect(wrapper.find('[data-testid="vendor-table"]').attributes('data-row-count')).toBe('1')
    expect(wrapper.text()).toContain('Beta Electric')
    expect(wrapper.text()).not.toContain('Alpha Plumbing')
  })

  it('shows empty state when corporation has no vendors', async () => {
    mockState.vendors = []
    const wrapper = await mountVendorManagement()

    expect(wrapper.text()).toContain('No vendors found')
    expect(wrapper.text()).toContain('Create your first vendor to get started')
  })

  it('opens create modal when add vendor is clicked', async () => {
    const wrapper = await mountVendorManagement()
    const addButtons = wrapper.findAll('button').filter(btn => btn.text().includes('Add Vendor'))
    await addButtons[0]!.trigger('click')
    await nextTick()

    const form = wrapper.find('[data-testid="vendor-form"]')
    expect(form.attributes('data-open')).toBe('true')
    expect(form.attributes('data-vendor-id')).toBe('')
  })

  it('opens edit modal with selected vendor when edit action is clicked', async () => {
    const wrapper = await mountVendorManagement()
    const rowActions = wrapper.find('.vendor-row').findAll('button')
    await rowActions[0]!.trigger('click')
    await nextTick()

    const form = wrapper.find('[data-testid="vendor-form"]')
    expect(form.attributes('data-open')).toBe('true')
    expect(form.attributes('data-vendor-id')).toBe('v1')
  })

  it('deletes vendor after confirmation and shows success toast', async () => {
    const wrapper = await mountVendorManagement()
    const rowActions = wrapper.find('.vendor-row').findAll('button')
    const deleteBtn = rowActions[rowActions.length - 1]
    await deleteBtn!.trigger('click')
    await nextTick()

    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Delete Vendor')

    const confirmButton = wrapper.findAll('button').find(btn => btn.text().includes('Delete Vendor') && !btn.text().includes('Cancel'))
    await confirmButton!.trigger('click')
    await nextTick()

    expect(mockDeleteNimbleVendor).toHaveBeenCalledWith('v1')
    expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({ title: 'Vendor deleted', color: 'success' }))
  })

  it('shows error toast when delete fails', async () => {
    mockDeleteNimbleVendor.mockRejectedValue({ statusMessage: 'Vendor is in use' })
    const wrapper = await mountVendorManagement()

    const rowActions = wrapper.find('.vendor-row').findAll('button')
    await rowActions[rowActions.length - 1]!.trigger('click')
    await nextTick()

    const confirmButton = wrapper.findAll('button').find(btn => btn.text().includes('Delete Vendor') && !btn.text().includes('Cancel'))
    await confirmButton!.trigger('click')
    await nextTick()

    expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Delete failed',
      description: 'Vendor is in use',
      color: 'error',
    }))
  })

  it('refreshes vendor list after saved event from form', async () => {
    const wrapper = await mountVendorManagement()
    const savedVendor = makeNimbleDbVendor({ vendor_id: 'v-new', name: 'New Vendor' })

    await wrapper.findComponent({ name: 'VendorsVendorForm' }).vm.$emit('saved', savedVendor)
    await nextTick()

    expect(mockFetchNimble).toHaveBeenCalledWith('corp-1', true)
    expect(mockRefresh).toHaveBeenCalledWith('corp-1')
  })
})
