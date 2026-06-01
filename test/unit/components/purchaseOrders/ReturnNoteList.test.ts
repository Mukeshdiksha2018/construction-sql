import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia, defineStore } from 'pinia'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import ReturnNoteList from '~/components/purchaseOrders/ReturnNoteList.vue'

const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

const uiStubs = {
  UInput: { template: '<input />' },
  UButton: { template: '<button><slot /></button>' },
  UTooltip: { template: '<div><slot /></div>' },
  UModal: {
    template: '<div><slot name="body" /><slot name="footer" /><slot name="header" /></div>',
  },
  UTable: { template: '<table data-testid="return-table" />' },
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

vi.mock('~/components/purchaseOrders/ReturnNoteForm.vue', () => ({
  default: {
    name: 'ReturnNoteForm',
    template: '<div data-testid="return-note-form" />',
    props: ['form', 'editingReturnNote', 'readonly'],
  },
}))

vi.mock('~/components/shared/ProjectSelect.vue', () => ({ default: { template: '<div />' } }))
vi.mock('~/components/shared/VendorSelect.vue', () => ({ default: { template: '<div />' } }))
vi.mock('~/components/shared/CorporationSelect.vue', () => ({ default: { template: '<div />' } }))
vi.mock('~/components/shared/LocationSelect.vue', () => ({ default: { template: '<div />' } }))
vi.mock('~/components/shared/ItemCategorySelect.vue', () => ({ default: { template: '<div />' } }))
vi.mock('~/components/shared/ItemDivisionSelect.vue', () => ({ default: { template: '<div />' } }))
vi.mock('~/components/shared/ItemTypeSelect.vue', () => ({ default: { template: '<div />' } }))

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

describe('ReturnNoteList.vue', () => {
  let pinia: ReturnType<typeof createPinia>
  let fetchStockReturnNotes: ReturnType<typeof vi.fn>

  const mockNotes = [
    {
      uuid: 'rtn-1',
      corporation_uuid: 'corp-1',
      project_uuid: 'proj-1',
      purchase_order_uuid: 'po-1',
      return_number: 'RTN-1',
      return_note_number: 'RTN-1',
      status: 'Returned',
      total_return_amount: 100,
      entry_date: '2025-06-01',
      created_at: '2025-06-01T00:00:00Z',
      updated_at: '2025-06-01T00:00:00Z',
    },
    {
      uuid: 'rtn-2',
      corporation_uuid: 'corp-1',
      project_uuid: 'proj-1',
      purchase_order_uuid: 'po-2',
      return_number: 'RTN-2',
      return_note_number: 'RTN-2',
      status: 'Waiting',
      total_return_amount: 50,
      entry_date: '2025-06-02',
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
    fetchStockReturnNotes = vi.fn().mockResolvedValue(undefined)

    defineStore('corporation', () => ({
      selectedCorporationId: ref('corp-1'),
      selectedCorporation: ref({ uuid: 'corp-1', corporation_name: 'Test Corp' }),
      corporations: ref([{ uuid: 'corp-1', corporation_name: 'Test Corp' }]),
    }))()

    defineStore('stockReturnNotes', () => {
      const stockReturnNotes = ref([...mockNotes])
      return {
        stockReturnNotes,
        loading: ref(false),
        error: ref(null),
        fetchStockReturnNotes,
        createStockReturnNote: vi.fn(),
        updateStockReturnNote: vi.fn(),
        deleteStockReturnNote: vi.fn(),
        getNoteByUuid: vi.fn((uuid: string) => stockReturnNotes.value.find(n => n.uuid === uuid) ?? null),
        generateNextReturnNumber: vi.fn(() => 'RTN-3'),
        notesByCorporation: ref({}),
        clearData: vi.fn(),
      }
    })()

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
    mount(ReturnNoteList, {
      global: {
        plugins: [pinia],
        stubs: uiStubs,
      },
    })

  it('renders summary and returned status cards', () => {
    const wrapper = mountList()
    expect(wrapper.text()).toContain('Summary')
    expect(wrapper.text()).toContain('Returned')
  })

  it('calls fetchStockReturnNotes on mount when corporation is selected', async () => {
    mountList()
    await flushPromises()
    expect(fetchStockReturnNotes).toHaveBeenCalled()
    expect(fetchStockReturnNotes.mock.calls[0][0]).toBe('corp-1')
  })

  it('filters list by Returned status when status card clicked', async () => {
    const wrapper = mountList()
    const vm = wrapper.vm as Record<string, unknown>
    await (vm.toggleStatusFilter as (s: string) => void)('Returned')
    await wrapper.vm.$nextTick()
    const filtered = vm.filteredReturnNotes as Array<{ status: string }>
    expect(filtered.every(n => (n.status || 'Returned') === 'Returned')).toBe(true)
  })

  it('opens create modal with empty form', async () => {
    mockFetch.mockResolvedValue({ data: { return_number: 'RTN-99' } })
    const wrapper = mountList()
    const vm = wrapper.vm as Record<string, unknown>
    expect(vm.showFormModal).toBe(false)
    await (vm.openCreateModal as () => Promise<void>)()
    await wrapper.vm.$nextTick()
    expect(vm.showFormModal).toBe(true)
    expect(vm.isViewMode).toBe(false)
    expect((vm.returnNoteForm as { return_number?: string }).return_number).toBeTruthy()
  })

  it('computes summary and returned stats from store notes', () => {
    const wrapper = mountList()
    const vm = wrapper.vm as Record<string, unknown>
    const allStats = vm.allStats as { count: number, totalValue: number }
    const returnedStats = vm.returnedStats as { count: number, totalValue: number }
    expect(allStats.count).toBe(2)
    expect(allStats.totalValue).toBe(150)
    expect(returnedStats.count).toBe(1)
    expect(returnedStats.totalValue).toBe(100)
  })
})
