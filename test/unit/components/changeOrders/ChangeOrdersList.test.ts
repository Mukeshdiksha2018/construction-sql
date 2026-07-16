import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia, defineStore } from 'pinia'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import ChangeOrdersList from '~/components/changeOrders/ChangeOrdersList.vue'

const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

const uiStubs = {
  UInput: { template: '<input />' },
  UButton: { template: '<button><slot /></button>' },
  UTooltip: { template: '<div><slot /></div>' },
  UModal: {
    template:
      '<div><slot name="body" /><slot name="footer" /><slot name="header" /></div>',
  },
  UTable: { template: '<table />' },
  UPageCard: {
    template: '<div class="page-card"><slot name="body" /></div>',
    props: ['highlight', 'highlightColor', 'onClick', 'variant', 'class', 'ui'],
  },
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
  UDrawer: { template: '<div><slot /></div>' },
  USelectMenu: { template: '<select />' },
  UTimeline: { template: '<div />' },
}

const changeOrderFormStub = vi.hoisted(() => ({
  name: 'ChangeOrderForm',
  template: '<div data-testid="co-form" />',
  props: ['form', 'loading', 'readonly', 'allowRevise'],
}))

vi.mock('~/components/changeOrders/ChangeOrderForm.vue', () => ({
  default: changeOrderFormStub,
}))

vi.mock('~/components/shared/ProjectSelect.vue', () => ({
  default: { template: '<div />', props: ['modelValue', 'corporationUuid'] },
}))
vi.mock('~/components/shared/VendorSelect.vue', () => ({
  default: { template: '<div />', props: ['modelValue', 'corporationUuid'] },
}))
vi.mock('~/components/shared/LocationSelect.vue', () => ({
  default: { template: '<div />', props: ['modelValue'] },
}))
vi.mock('~/components/changeOrders/ChangeOrderAuditTimeline.vue', () => ({
  default: { template: '<div />' },
}))

vi.mock('~/composables/useTableStandard', () => ({
  useTableStandard: () => ({
    pagination: { value: { pageSize: 10 } },
    paginationOptions: {},
    pageSizeOptions: [10, 20, 50],
    updatePageSize: vi.fn(),
    getPaginationProps: vi.fn(() => ({})),
    getPageInfo: vi.fn(() => ({ value: '1-10 of 10 change orders' })),
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

vi.mock('~/stores/freight', () => ({
  useShipViaStore: () => ({
    fetchShipVia: vi.fn(),
    clearShipVia: vi.fn(),
    getAllShipVia: [],
  }),
}))

vi.mock('~/stores/freightGlobal', () => ({
  useFreightStore: () => ({
    fetchFreight: vi.fn(),
    clearFreight: vi.fn(),
    getAllFreight: [],
  }),
}))

const clearResourcesSpy = vi.fn()
vi.mock('~/stores/changeOrderResources', () => ({
  useChangeOrderResourcesStore: defineStore('changeOrderResources', () => ({
    clear: clearResourcesSpy,
  })),
}))

describe('ChangeOrdersList.vue', () => {
  let pinia: ReturnType<typeof createPinia>
  let useCorporationStore: ReturnType<typeof defineStore>
  let useChangeOrdersStore: ReturnType<typeof defineStore>
  let fetchChangeOrders: ReturnType<typeof vi.fn>

  const mockCOs = [
    {
      uuid: 'co-1',
      corporation_uuid: 'corp-1',
      project_uuid: 'proj-1',
      co_number: 'CO-000001',
      created_date: '2025-11-05',
      status: 'Draft',
      co_type: 'MATERIAL',
      total_co_amount: 100,
    },
    {
      uuid: 'co-2',
      corporation_uuid: 'corp-1',
      project_uuid: 'proj-1',
      co_number: 'CO-000002',
      created_date: '2025-11-06',
      status: 'Ready',
      co_type: 'MATERIAL',
      total_co_amount: 200,
    },
    {
      uuid: 'co-3',
      corporation_uuid: 'corp-1',
      project_uuid: 'proj-1',
      co_number: 'CO-000003',
      created_date: '2025-11-07',
      status: 'Approved',
      co_type: 'MATERIAL',
      total_co_amount: 300,
    },
  ]

  beforeEach(() => {
    mockFetch.mockResolvedValue({ data: [] })
    vi.stubGlobal('useRuntimeConfig', () => ({
      public: { nimbleIntegrations: false },
    }))
    pinia = createPinia()
    setActivePinia(pinia)
    fetchChangeOrders = vi.fn()

    useCorporationStore = defineStore('corporation', () => ({
      selectedCorporationId: ref('corp-1'),
      selectedCorporation: ref({ uuid: 'corp-1', corporation_name: 'Test Corp' }),
    }))

    useChangeOrdersStore = defineStore('changeOrders', () => {
      const changeOrders = ref([...mockCOs])
      return {
        changeOrders,
        loading: ref(false),
        error: ref(null),
        fetchChangeOrders,
        fetchChangeOrder: vi.fn(async () => null),
        createChangeOrder: vi.fn(async (p: unknown) => ({ ...(p as object), uuid: 'co-new' })),
        updateChangeOrder: vi.fn(async (p: unknown) => p),
        deleteChangeOrder: vi.fn(async () => true),
        getPaginationInfo: vi.fn(() => ({
          page: 1,
          pageSize: 100,
          totalRecords: mockCOs.length,
          totalPages: 1,
          hasMore: false,
        })),
      }
    })

    useCorporationStore()
    useChangeOrdersStore()
  })

  const mountList = () =>
    mount(ChangeOrdersList, {
      global: {
        plugins: [pinia],
        stubs: {
          ...uiStubs,
          // Match async component by name so the loader never runs in unit tests
          ChangeOrderForm: changeOrderFormStub,
        },
      },
    })

  const widenDateFilter = (vm: Record<string, unknown>) => {
    vm.filterDateFrom = '2025-01-01'
    vm.filterDateTo = '2025-12-31'
    ;(vm.appliedFilters as { dateFrom: string, dateTo: string }).dateFrom = '2025-01-01'
    ;(vm.appliedFilters as { dateFrom: string, dateTo: string }).dateTo = '2025-12-31'
  }

  it('renders the CO table when permissions allow', () => {
    const wrapper = mountList()
    expect(wrapper.find('table').exists()).toBe(true)
  })

  it('calls fetchChangeOrders on mount when corporation is selected', async () => {
    mountList()
    await flushPromises()
    expect(fetchChangeOrders).toHaveBeenCalled()
    const [corpId, forceRefresh, page, pageSize, filters] = fetchChangeOrders.mock.calls[0]
    expect(corpId).toBe('corp-1')
    expect(forceRefresh).toBe(false)
    expect(page).toBe(1)
    expect(pageSize).toBe(100)
    expect(filters).toMatchObject({
      created_date_from: expect.any(String),
      created_date_to: expect.any(String),
    })
  })

  it('opens create modal and resets form state', async () => {
    const wrapper = mountList()
    const vm = wrapper.vm as Record<string, unknown>
    expect(vm.showFormModal).toBe(false)
    await (vm.openCreateModal as () => Promise<void>)()
    await wrapper.vm.$nextTick()
    expect(vm.showFormModal).toBe(true)
    expect(vm.isViewMode).toBe(false)
    expect((vm.coForm as { status: string }).status).toBe('Draft')
  })

  it('filters list by Draft status when status card clicked', async () => {
    const wrapper = mountList()
    const vm = wrapper.vm as Record<string, unknown>
    widenDateFilter(vm)
    await (vm.toggleStatusFilter as (s: string) => void)('Draft')
    await wrapper.vm.$nextTick()
    const filtered = vm.filteredChangeOrders as Array<{ status: string }>
    expect(filtered.every((co) => co.status === 'Draft')).toBe(true)
  })

  it('refetches change orders when corporation changes', async () => {
    const wrapper = mountList()
    await flushPromises()
    fetchChangeOrders.mockClear()

    const corpStore = useCorporationStore()
    corpStore.selectedCorporationId = 'corp-2'
    await wrapper.vm.$nextTick()
    await flushPromises()

    expect(fetchChangeOrders).toHaveBeenCalled()
    expect(fetchChangeOrders.mock.calls[0]?.[0]).toBe('corp-2')
  })
})
