import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import VendorManagement from '~/components/vendors/VendorManagement.vue'

const mockState = vi.hoisted(() => ({
  nimbleLoading: false,
  vendors: [
    {
      vendor_id: 'v1',
      name: 'Acme',
      company_name: 'Acme LLC',
      corporation_id: 'corp-1',
      account_id: null,
      status: 1,
      status_label: 'active',
      tax_id: null,
      contact_person_name: null,
      credit_limit: null,
      check_reference: null,
      federal_id: null,
      ssn: null,
      print_check_as: null,
      is_1099: false,
      credit_days_id: null,
      type: 1,
      bid: '1',
      created_by: null,
      modified_by: null,
      created_at: null,
      modified_at: null,
    },
  ] as Array<Record<string, unknown>>,
}))

const mockFetchNimble = vi.fn()

vi.mock('~/stores/vendors', () => ({
  useVendorStore: () => ({
    nimbleLoading: mockState.nimbleLoading,
    nimbleError: null,
    getNimbleVendorsForCorporation: (_corpId: string) => mockState.vendors,
    fetchNimbleDbVendors: mockFetchNimble,
    refresh: vi.fn(),
    deleteNimbleVendor: vi.fn(),
  }),
}))

vi.mock('~/stores/corporations', () => ({
  useCorporationStore: () => ({
    selectedCorporation: { id: 'corp-1', name: 'Test Corp' },
    corporations: [{ id: 'corp-1', name: 'Test Corp' }],
  }),
}))

vi.mock('~/stores/chartOfAccounts', () => ({
  useChartOfAccountsStore: () => ({
    accounts: [],
    getAccountLabel: (id: string) => id,
    fetchAccounts: vi.fn(),
  }),
}))

vi.stubGlobal('useToast', () => ({ add: vi.fn() }))

describe('VendorManagement', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockState.nimbleLoading = false
    mockState.vendors = [
      {
        vendor_id: 'v1',
        name: 'Acme',
        company_name: 'Acme LLC',
        corporation_id: 'corp-1',
        account_id: null,
        status: 1,
        status_label: 'active',
        tax_id: null,
        contact_person_name: null,
        credit_limit: null,
        check_reference: null,
        federal_id: null,
        ssn: null,
        print_check_as: null,
        is_1099: false,
        credit_days_id: null,
        type: 1,
        bid: '1',
        created_by: null,
        modified_by: null,
        created_at: null,
        modified_at: null,
      },
    ]
    mockFetchNimble.mockReset()
  })

  it('loads vendors for selected corporation and shows add button', async () => {
    const wrapper = mount(VendorManagement, {
      global: {
        stubs: {
          UInput: true,
          UButton: { template: '<button><slot /></button>' },
          UTable: true,
          UPagination: true,
          USelect: true,
          UModal: true,
          UBadge: { template: '<span><slot /></span>' },
          VendorsVendorForm: true,
        },
      },
    })

    await wrapper.vm.$nextTick()
    expect(mockFetchNimble).toHaveBeenCalledWith('corp-1', true)
    expect(wrapper.text()).toContain('Add Vendor')
  })

  it('shows loading spinner while nimbleLoading', async () => {
    mockState.nimbleLoading = true
    const wrapper = mount(VendorManagement, {
      global: {
        stubs: {
          UInput: true,
          UButton: true,
          UTable: true,
          UIcon: { template: '<span class="spinner-icon" />' },
          VendorsVendorForm: true,
        },
      },
    })

    expect(wrapper.text()).toContain('Loading vendors...')
    expect(wrapper.find('.spinner-icon').exists()).toBe(true)
  })

  it('excludes deleted vendors from the table data', async () => {
    mockState.vendors = [
      { vendor_id: 'active', name: 'Active Co', corporation_id: 'corp-1', status: 1, status_label: 'active' },
      { vendor_id: 'deleted', name: 'Deleted Co', corporation_id: 'corp-1', status: 3, status_label: 'deleted' },
    ]

    const wrapper = mount(VendorManagement, {
      global: {
        stubs: {
          UInput: true,
          UButton: true,
          UTable: {
            props: ['data'],
            template: '<div class="table-row-count">{{ data.length }}</div>',
          },
          UPagination: true,
          USelect: true,
          VendorsVendorForm: true,
        },
      },
    })

    await wrapper.vm.$nextTick()
    expect(wrapper.find('.table-row-count').text()).toBe('1')
  })
})
