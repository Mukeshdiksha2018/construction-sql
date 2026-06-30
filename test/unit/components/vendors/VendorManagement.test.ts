import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import VendorManagement from '~/components/vendors/VendorManagement.vue'

const mockFetchNimble = vi.fn()

vi.mock('~/stores/vendors', () => ({
  useVendorStore: () => ({
    nimbleLoading: false,
    nimbleError: null,
    getNimbleVendorsForCorporation: (_corpId: string) => [
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
        type: 1,
        bid: '1',
        created_by: null,
        modified_by: null,
        created_at: null,
        modified_at: null,
      },
    ],
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
})
