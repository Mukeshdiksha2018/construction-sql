import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia, defineStore } from 'pinia'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import ReceiptNoteList from '~/components/purchaseOrders/ReceiptNoteList.vue'

const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

const uiStubs = {
  UInput: { template: '<input />' },
  UButton: { template: '<button><slot /></button>' },
  UTooltip: { template: '<div><slot /></div>' },
  UModal: {
    template: '<div><slot name="body" /><slot name="footer" /><slot name="header" /></div>',
  },
  UTable: { template: '<table data-testid="grn-table" />' },
  UPageCard: { template: '<div><slot name="body" /></div>' },
  UAlert: { template: '<div />' },
  USelect: { template: '<select />' },
  UPagination: { template: '<div />' },
  UIcon: { template: '<span />' },
  UCard: { template: '<div><slot /></div>' },
  UPopover: { template: '<div><slot /><slot name="content" /></div>' },
  UCalendar: { template: '<div />' },
  USlideover: { template: '<div><slot /></div>' },
  UBadge: { template: '<span><slot /></span>' },
  UCheckbox: { template: '<input type="checkbox" />' },
  UFormGroup: { template: '<div><slot /></div>' },
  UTextarea: { template: '<textarea />' },
  UDropdownMenu: { template: '<div><slot /></div>' },
  UDrawer: { template: '<div><slot /><slot name="body" /></div>' },
  UAvatar: { template: '<span />' },
  USkeleton: { template: '<div />' },
}

vi.mock('~/components/purchaseOrders/ReceiptNoteForm.vue', () => ({
  default: {
    name: 'ReceiptNoteForm',
    template: '<div data-testid="receipt-note-form" />',
    props: ['form', 'editingReceiptNote', 'readonly'],
  },
}))

vi.mock('~/components/purchaseOrders/ReturnNoteForm.vue', () => ({
  default: { template: '<div />' },
}))

vi.mock('~/components/purchaseOrders/ReceiptNotesExpanded.vue', () => ({
  default: { template: '<div />' },
}))

vi.mock('~/components/shared/ProjectSelect.vue', () => ({
  default: { template: '<div />' },
}))
vi.mock('~/components/shared/VendorSelect.vue', () => ({
  default: { template: '<div />' },
}))
vi.mock('~/components/shared/CorporationSelect.vue', () => ({
  default: { template: '<div />' },
}))
vi.mock('~/components/shared/LocationSelect.vue', () => ({
  default: { template: '<div />' },
}))
vi.mock('~/components/shared/ItemCategorySelect.vue', () => ({
  default: { template: '<div />' },
}))
vi.mock('~/components/shared/ItemDivisionSelect.vue', () => ({
  default: { template: '<div />' },
}))
vi.mock('~/components/shared/ItemTypeSelect.vue', () => ({
  default: { template: '<div />' },
}))

vi.mock('~/composables/useTableStandard', () => ({
  useTableStandard: () => ({
    pagination: { value: { pageSize: 10 } },
    paginationOptions: {},
    pageSizeOptions: [10, 20, 50],
    updatePageSize: vi.fn(),
    getPaginationProps: vi.fn(() => ({})),
    getPageInfo: vi.fn(() => ({ value: '1-10 of 10' })),
    shouldShowPagination: vi.fn(() => ({ value: true })),
  }),
}))

vi.mock('~/composables/useDateFormat', () => ({
  useDateFormat: () => ({ formatDate: (d: string) => d }),
}))

vi.mock('~/composables/useCurrencyFormat', () => ({
  useCurrencyFormat: () => ({
    formatCurrency: (n: number) => `$${Number(n || 0).toFixed(2)}`,
    formatCurrencyAbbreviated: (n: number) => `$${Number(n || 0).toFixed(2)}`,
  }),
}))

vi.mock('~/composables/useUTCDateFormat', () => ({
  useUTCDateFormat: () => ({
    toUTCString: (d: string) => d,
    getCurrentLocal: () => '2025-06-01',
  }),
}))

vi.mock('~/composables/usePermissions', () => ({
  usePermissions: () => ({
    hasPermission: vi.fn(() => true),
    isReady: { value: true },
  }),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))

vi.mock('#app', () => ({
  useToast: () => ({ add: vi.fn() }),
}))

vi.mock('~/stores/locations', () => ({
  useLocationsStore: () => ({
    fetchLocations: vi.fn().mockResolvedValue(undefined),
    locations: [],
    getAll: [],
    getLocationByUuid: vi.fn(),
  }),
}))

vi.mock('~/stores/userProfiles', () => ({
  useUserProfilesStore: defineStore('userProfiles', () => ({
    users: ref([]),
    fetchUsers: vi.fn().mockResolvedValue(undefined),
  })),
}))

describe('ReceiptNoteList.vue', () => {
  let pinia: ReturnType<typeof createPinia>
  let fetchStockReceiptNotes: ReturnType<typeof vi.fn>

  const mockNotes = [
    {
      uuid: 'rn-1',
      corporation_uuid: 'corp-1',
      project_uuid: 'proj-1',
      purchase_order_uuid: 'po-1',
      change_order_uuid: null,
      receipt_type: 'purchase_order',
      entry_date: '2025-06-01',
      grn_number: 'GRN-1',
      status: 'Shipment',
      total_received_amount: 100,
      created_at: '2025-06-01T00:00:00Z',
      updated_at: '2025-06-01T00:00:00Z',
    },
    {
      uuid: 'rn-2',
      corporation_uuid: 'corp-1',
      project_uuid: 'proj-1',
      purchase_order_uuid: 'po-1',
      change_order_uuid: null,
      receipt_type: 'purchase_order',
      entry_date: '2025-06-02',
      grn_number: 'GRN-2',
      status: 'Received',
      total_received_amount: 250,
      created_at: '2025-06-02T00:00:00Z',
      updated_at: '2025-06-02T00:00:00Z',
    },
  ]

  beforeEach(() => {
    mockFetch.mockResolvedValue({ data: [] })
    vi.stubGlobal('useRuntimeConfig', () => ({
      public: { nimbleIntegrations: false },
    }))
    pinia = createPinia()
    setActivePinia(pinia)
    fetchStockReceiptNotes = vi.fn().mockResolvedValue(undefined)

    defineStore('corporation', () => ({
      selectedCorporationId: ref('corp-1'),
      selectedCorporation: ref({ uuid: 'corp-1', corporation_name: 'Test Corp' }),
      corporations: ref([{ uuid: 'corp-1', corporation_name: 'Test Corp' }]),
    }))()

    defineStore('stockReceiptNotes', () => {
      const stockReceiptNotes = ref([...mockNotes])
      return {
        stockReceiptNotes,
        loading: ref(false),
        error: ref(null),
        fetchStockReceiptNotes,
        createStockReceiptNote: vi.fn(),
        updateStockReceiptNote: vi.fn(),
        deleteStockReceiptNote: vi.fn(),
        getNoteByUuid: vi.fn((uuid: string) => stockReceiptNotes.value.find(n => n.uuid === uuid) ?? null),
        generateNextGrnNumber: vi.fn(() => 'GRN-3'),
        notesByStatus: ref({}),
        notesByCorporation: ref({}),
        clearData: vi.fn(),
      }
    })()

    defineStore('stockReturnNotes', () => ({
      stockReturnNotes: ref([]),
      loading: ref(false),
      fetchStockReturnNotes: vi.fn(),
      clearData: vi.fn(),
    }))()

    defineStore('purchaseOrders', () => ({
      purchaseOrders: ref([]),
      fetchPurchaseOrders: vi.fn().mockResolvedValue(undefined),
    }))()

    defineStore('purchaseOrderResources', () => ({
      clear: vi.fn(),
    }))()

    defineStore('changeOrders', () => ({
      changeOrders: ref([]),
      fetchChangeOrders: vi.fn().mockResolvedValue(undefined),
    }))()

    defineStore('projects', () => ({
      projects: ref([]),
      fetchProjects: vi.fn(),
      fetchProjectsMetadata: vi.fn().mockResolvedValue(undefined),
    }))()

    defineStore('vendors', () => ({
      vendors: ref([]),
      fetchVendors: vi.fn().mockResolvedValue(undefined),
    }))()
  })

  const mountList = () =>
    mount(ReceiptNoteList, {
      global: {
        plugins: [pinia],
        stubs: uiStubs,
      },
    })

  it('renders status summary when permissions allow', () => {
    const wrapper = mountList()
    expect(wrapper.text()).toContain('Summary')
    expect(wrapper.text()).toContain('Shipment')
    expect(wrapper.text()).toContain('Received')
  })

  it('calls fetchStockReceiptNotes on mount when corporation is selected', async () => {
    mountList()
    await flushPromises()
    expect(fetchStockReceiptNotes).toHaveBeenCalled()
    const [corpId, options] = fetchStockReceiptNotes.mock.calls[0]
    expect(corpId).toBe('corp-1')
    expect(options).toMatchObject({ force: false })
  })

  it('filters notes by Shipment status when status card clicked', async () => {
    const wrapper = mountList()
    const vm = wrapper.vm as Record<string, unknown>
    await (vm.toggleStatusFilter as (s: string) => void)('Shipment')
    await wrapper.vm.$nextTick()
    const filtered = vm.filteredReceiptNotes as Array<{ status: string }>
    expect(filtered.every(n => n.status === 'Shipment')).toBe(true)
  })

  it('opens create modal with empty form', async () => {
    const wrapper = mountList()
    const vm = wrapper.vm as Record<string, unknown>
    expect(vm.showFormModal).toBe(false)
    await (vm.openCreateModal as () => void)()
    await wrapper.vm.$nextTick()
    expect(vm.showFormModal).toBe(true)
    expect(vm.isViewMode).toBe(false)
    expect((vm.receiptNoteForm as { uuid?: string }).uuid).toBeFalsy()
  })

  it('computes shipment and received stats from store notes', () => {
    const wrapper = mountList()
    const vm = wrapper.vm as Record<string, unknown>
    const shipmentStats = vm.shipmentStats as { count: number, totalValue: number }
    const receivedStats = vm.receivedStats as { count: number, totalValue: number }
    expect(shipmentStats.count).toBe(1)
    expect(receivedStats.count).toBe(1)
    expect(shipmentStats.totalValue).toBe(100)
    expect(receivedStats.totalValue).toBe(250)
  })
})
