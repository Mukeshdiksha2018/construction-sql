import { createPinia, defineStore, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'

const mockFetchProjectItemsSummary = vi.fn()
const mockProjectItemsSummaryData = ref<{ items: any[] } | null>(null)
const mockProjectItemsSummaryLoading = ref(false)

vi.mock('~/composables/useProjectItemsSummary', () => ({
  useProjectItemsSummary: () => ({
    data: mockProjectItemsSummaryData,
    loading: mockProjectItemsSummaryLoading,
    error: ref(null),
    fetchProjectItemsSummary: mockFetchProjectItemsSummary,
  }),
}))

const capturedItemsTables: Array<Record<string, unknown>> = []

vi.mock('~/components/purchaseOrders/PurchaseOrderForm.vue', () => ({
  default: { name: 'PurchaseOrderForm', template: '<div />', props: ['form'] },
}))

vi.mock('~/components/purchaseOrders/POBreakdown.vue', () => ({
  default: { name: 'POBreakdown', template: '<div />' },
}))

vi.mock('~/composables/useTableStandard', () => ({
  useTableStandard: () => ({
    pagination: ref({ pageIndex: 0, pageSize: 10 }),
    paginationOptions: {},
    pageSizeOptions: [10, 25, 50],
    updatePageSize: vi.fn(),
    getPaginationProps: vi.fn(() => ({})),
    getPageInfo: vi.fn(() => ref('')),
    shouldShowPagination: vi.fn(() => ref(false)),
  }),
}))

vi.mock('~/composables/useDateFormat', () => ({
  useDateFormat: () => ({ formatDate: (v: unknown) => String(v ?? '') }),
}))

vi.mock('~/composables/useCurrencyFormat', () => ({
  useCurrencyFormat: () => ({
    formatCurrency: (n: number) => `$${n}`,
    formatCurrencyAbbreviated: (n: number) => `$${n}`,
  }),
}))

vi.mock('~/composables/useUTCDateFormat', () => ({
  useUTCDateFormat: () => ({
    toUTCString: (s: string) => s,
    getCurrentLocal: () => '2025-01-01',
    createDateRangeParams: vi.fn(),
  }),
}))

vi.mock('~/composables/usePermissions', () => ({
  usePermissions: () => ({ hasPermission: () => true, isReady: ref(true) }),
}))

vi.mock('~/composables/usePurchaseOrderPrint', () => ({
  usePurchaseOrderPrint: () => ({ openPrintPreview: vi.fn() }),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))

vi.mock('~/stores/purchaseOrderListResources', () => ({
  usePurchaseOrderListResourcesStore: () => ({
    ensureProjects: vi.fn().mockResolvedValue([]),
    ensureVendors: vi.fn().mockResolvedValue([]),
    getProjects: vi.fn(() => []),
    getVendors: vi.fn(() => []),
    clear: vi.fn(),
  }),
}))

vi.mock('~/stores/purchaseOrderResources', () => ({
  usePurchaseOrderResourcesStore: () => ({
    clear: vi.fn(),
    ensureEstimates: vi.fn().mockResolvedValue([]),
    ensureEstimateItems: vi.fn().mockResolvedValue([]),
    fetchPurchaseOrderItems: vi.fn().mockResolvedValue([]),
    getEstimatesByProject: vi.fn(() => []),
  }),
}))

vi.mock('~/stores/vendors', () => ({
  useVendorStore: () => ({
    vendors: [],
    fetchVendors: vi.fn().mockResolvedValue([]),
  }),
}))

vi.mock('~/stores/projectAddresses', () => ({
  useProjectAddressesStore: () => ({ fetchAddresses: vi.fn() }),
}))

vi.mock('~/stores/locations', () => ({
  useLocationsStore: () => ({
    getAll: [],
    fetchLocations: vi.fn().mockResolvedValue(undefined),
  }),
}))

vi.mock('~/stores/freight', () => ({
  useShipViaStore: () => ({
    shipVia: [],
    fetchShipVia: vi.fn().mockResolvedValue(undefined),
  }),
}))

vi.mock('~/stores/freightGlobal', () => ({
  useFreightStore: () => ({
    freight: [],
    fetchFreight: vi.fn().mockResolvedValue(undefined),
  }),
}))

vi.stubGlobal('useToast', () => ({ add: vi.fn() }))
vi.stubGlobal('useHead', vi.fn())
vi.stubGlobal('useRuntimeConfig', () => ({
  public: { nimbleIntegrations: 'false' },
}))
vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({ data: [] }))

const uiStubs = {
  ClientOnly: { template: '<div><slot /></div>' },
  UButton: { template: '<button @click="$emit(\'click\')"><slot /></button>' },
  UIcon: { template: '<span />' },
  UTable: {
    props: ['columns', 'data', 'columnPinning', 'class'],
    template: '<table data-testid="utable" />',
    mounted() {
      capturedItemsTables.push({
        columns: (this as any).columns,
        columnPinning: (this as any).columnPinning,
        class: (this as any).class,
      })
    },
  },
  UDrawer: { template: '<div><slot /><slot name="body" /></div>' },
  UModal: { template: '<div><slot name="body" /><slot name="footer" /></div>' },
  UCard: { template: '<div><slot /></div>' },
  UBadge: { template: '<span><slot /></span>' },
  UPopover: { template: '<div><slot /></div>' },
  UDropdownMenu: { template: '<div><slot /></div>' },
  UAlert: { template: '<div />' },
  UTooltip: { template: '<div><slot /></div>' },
  UCalendar: { template: '<div />' },
  UBanner: { template: '<div />' },
  UCheckbox: {
    template: '<input type="checkbox" />',
    props: ['modelValue'],
  },
  USelect: { template: '<select />' },
  USelectMenu: { template: '<select />' },
  UPagination: { template: '<div />' },
  CorporationSelect: { template: '<select />' },
  ProjectSelect: { template: '<select />' },
  VendorSelect: { template: '<select />' },
  LocationSelect: { template: '<select />' },
  ItemCategorySelect: { template: '<select />' },
  ItemTypeSelect: { template: '<select />' },
  StorageLocationSelect: { template: '<select />' },
  SendPreviewDocumentEmailModal: { template: '<div />' },
  PurchaseOrderAuditTimeline: { template: '<div />' },
}

describe('PurchaseOrdersList Create PO screen', () => {
  beforeEach(() => {
    capturedItemsTables.length = 0
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockProjectItemsSummaryData.value = null
    mockProjectItemsSummaryLoading.value = false
    mockFetchProjectItemsSummary.mockResolvedValue({ items: [] })

    defineStore('corporations', () => ({
      selectedCorporationId: ref('corp-1'),
    }))()

    defineStore('purchaseOrders', () => ({
      purchaseOrders: [],
      loading: false,
      fetchPurchaseOrders: vi.fn().mockResolvedValue(undefined),
      fetchPurchaseOrder: vi.fn(),
      createPurchaseOrder: vi.fn(),
      updatePurchaseOrder: vi.fn(),
    }))()

    defineStore('changeOrders', () => ({
      changeOrders: [],
    }))()

    defineStore('projects', () => ({
      projects: [],
    }))()

    defineStore('corporationSettings', () => ({
      settings: null,
      fetchSettings: vi.fn(),
    }))()

    defineStore('auth', () => ({
      token: 'token',
    }))()
  })

  async function mountList() {
    const component = (await import('~/components/purchaseOrders/PurchaseOrdersList.vue')).default
    return mount(component, { global: { stubs: uiStubs } })
  }

  it('fetches project items summary when Show Results is used on Create PO screen', async () => {
    const wrapper = await mountList()
    const vm = wrapper.vm as any

    await vm.toggleStatusFilter('ToBeRaised')
    await nextTick()

    vm.filterCorporation = 'corp-1'
    vm.filterProject = 'proj-1'
    await vm.handleShowResults()
    await flushPromises()

    expect(mockFetchProjectItemsSummary).toHaveBeenCalledWith(
      'corp-1',
      'proj-1',
      undefined,
      undefined,
    )
  })

  it('renders create PO items table without column pinning', async () => {
    mockProjectItemsSummaryData.value = {
      items: [
        {
          item_uuid: 'item-1',
          cost_code_label: '03 Concrete',
          item_name: 'Mix',
          budget_qty: 10,
          po_qty: 4,
          pending_qty: 6,
          status: 'Partial',
        },
      ],
    }

    const wrapper = await mountList()
    const vm = wrapper.vm as any

    await vm.toggleStatusFilter('ToBeRaised')
    vm.filterCorporation = 'corp-1'
    vm.filterProject = 'proj-1'
    await vm.handleShowResults()
    await flushPromises()
    await nextTick()

    const createPoTable = capturedItemsTables.find((t) =>
      String(t.class || '').includes('create-po-items-table'),
    )
    expect(createPoTable).toBeDefined()
    expect(createPoTable?.columnPinning).toBeUndefined()

    const headers = (createPoTable?.columns as any[])?.map((c) => c.header)
    expect(headers).toContain('Budget Qty')
    expect(headers).toContain('PO Qty')
    expect(headers).toContain('Pending Qty')

    const budgetIdx = headers?.indexOf('Budget Qty') ?? -1
    const poIdx = headers?.indexOf('PO Qty') ?? -1
    const pendingIdx = headers?.indexOf('Pending Qty') ?? -1
    expect(poIdx).toBe(budgetIdx + 1)
    expect(pendingIdx).toBe(poIdx + 1)
  })
})
