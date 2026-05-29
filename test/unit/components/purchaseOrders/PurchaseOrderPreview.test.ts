import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockFetch = vi.fn()
const mockResolveAuthToken = vi.fn()
const mockWaitForAuthReady = vi.fn().mockResolvedValue(undefined)

vi.stubGlobal('$fetch', mockFetch)

vi.mock('~/utils/authToken', () => ({
  resolveAuthToken: () => mockResolveAuthToken(),
  waitForAuthReady: () => mockWaitForAuthReady(),
}))

vi.mock('~/composables/useDateFormat', () => ({
  useDateFormat: () => ({
    formatDate: (value: unknown) => String(value ?? ''),
    formatPoEstimatedDeliveryForPrint: (value: unknown) => String(value ?? ''),
  }),
}))

vi.mock('~/composables/useCurrencyFormat', () => ({
  useCurrencyFormat: () => ({
    formatCurrency: (value: unknown) => String(value ?? ''),
    currencyCode: 'USD',
  }),
}))

vi.mock('~/composables/useProjectAddressForPrint', () => ({
  resolveShippingAddressForPrint: vi.fn().mockReturnValue(null),
}))

const mockFetchCorporations = vi.fn().mockResolvedValue(undefined)
const mockFetchShipVia = vi.fn().mockResolvedValue(undefined)
const mockFetchUOM = vi.fn().mockResolvedValue(undefined)

const storeStub = (extra: Record<string, unknown> = {}) => ({
  corporations: [],
  selectedCorporation: null,
  fetchCorporations: mockFetchCorporations,
  termsAndConditions: [],
  fetchTermsAndConditions: vi.fn().mockResolvedValue(undefined),
  specialInstructions: [],
  fetchSpecialInstructions: vi.fn().mockResolvedValue(undefined),
  freight: [],
  fetchFreight: vi.fn().mockResolvedValue(undefined),
  shipVia: [],
  fetchShipVia: mockFetchShipVia,
  getShipViaByUuid: vi.fn(),
  approvalChecks: [],
  fetchApprovalChecks: vi.fn().mockResolvedValue(undefined),
  settings: null,
  fetchSettings: vi.fn().mockResolvedValue(undefined),
  locations: [],
  fetchLocations: vi.fn().mockResolvedValue(undefined),
  uom: [],
  fetchUOM: mockFetchUOM,
  getUOMByUuid: vi.fn(),
  ...extra,
})

const termsAndConditionsStoreStub = {
  termsAndConditions: [
    { uuid: 'tc-uuid-1', name: 'Standard Terms', content: '<p>Standard terms content</p>', isActive: true },
  ],
  fetchTermsAndConditions: vi.fn().mockResolvedValue(undefined),
  getTermsAndConditionById: (id: string) =>
    termsAndConditionsStoreStub.termsAndConditions.find(
      (tc) => tc.uuid === id || String(tc.uuid) === id,
    ) || null,
}

vi.mock('~/stores/corporations', () => ({ useCorporationStore: () => storeStub() }))
vi.mock('~/stores/termsAndConditions', () => ({ useTermsAndConditionsStore: () => termsAndConditionsStoreStub }))
vi.mock('~/stores/specialInstructions', () => ({ useSpecialInstructionsStore: () => storeStub() }))
vi.mock('~/stores/freightGlobal', () => ({ useFreightStore: () => storeStub() }))
vi.mock('~/stores/freight', () => ({ useShipViaStore: () => storeStub() }))
vi.mock('~/stores/approvalChecks', () => ({ useApprovalChecksStore: () => storeStub() }))
vi.mock('~/stores/corporationSettings', () => ({ useAppSettingsStore: () => storeStub() }))
vi.mock('~/stores/locations', () => ({ useLocationsStore: () => storeStub() }))
vi.mock('~/stores/uom', () => ({ useUOMStore: () => storeStub() }))

vi.stubGlobal('useRuntimeConfig', () => ({
  public: { nimbleIntegrations: 'false' },
}))

const UAlertStub = {
  name: 'UAlert',
  props: ['title', 'description'],
  template: '<div data-testid="preview-error">{{ title }}</div>',
}

function makeLaborPo(overrides: Record<string, unknown> = {}) {
  return {
    uuid: 'po-uuid-1',
    po_type: 'LABOR',
    corporation_uuid: 'corp-1',
    project_uuid: 'proj-1',
    vendor_uuid: 'vendor-1',
    po_items: [],
    labor_po_items: [],
    ...overrides,
  }
}

describe('PurchaseOrderPreview print preview loading', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockResolveAuthToken.mockReturnValue(null)
    mockWaitForAuthReady.mockResolvedValue(undefined)
    mockFetchCorporations.mockClear()
    mockFetchShipVia.mockClear()
    mockFetchUOM.mockClear()
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/api/purchase-order-forms/')) {
        return { data: makeLaborPo() }
      }
      if (url.includes('/api/purchase-orders/vendors')) {
        return { data: [{ uuid: 'vendor-1', vendor_name: 'Acme Vendor' }] }
      }
      if (url.includes('/api/projects/')) {
        return { data: { uuid: 'proj-1', project_name: 'Test Project', project_id: 'P-1' } }
      }
      return { data: [] }
    })
  })

  async function mountPreview(props: Record<string, unknown> = {}) {
    const component = (await import('~/components/purchaseOrders/PurchaseOrderPreview.vue')).default
    return mount(component, {
      props: {
        purchaseOrderUuid: 'po-uuid-1',
        ...props,
      },
      global: {
        stubs: {
          UAlert: UAlertStub,
        },
      },
    })
  }

  it('loads PO via plain GET $fetch without Authorization header (reference pattern)', async () => {
    await mountPreview()
    await flushPromises()

    const poCall = mockFetch.mock.calls.find(([url]) =>
      String(url).includes('/api/purchase-order-forms/po-uuid-1'),
    )
    expect(poCall).toBeTruthy()
    expect(poCall?.[1]).toMatchObject({ method: 'GET' })

    const headers = poCall?.[1]?.headers as Headers | Record<string, string> | undefined
    if (headers instanceof Headers) {
      expect(headers.has('Authorization')).toBe(false)
    }
    else {
      expect(headers?.Authorization).toBeUndefined()
    }
  })

  it('does not call authenticatedFetch (uses global $fetch only)', async () => {
    await mountPreview()
    await flushPromises()

    expect(mockFetch).toHaveBeenCalled()
    // If authenticatedFetch were used it would still call $fetch, but we verify no auth header above.
    // Also ensure the primary endpoint was hit.
    expect(mockFetch.mock.calls.some(([url]) => String(url).includes('/api/purchase-order-forms/'))).toBe(true)
  })

  it('emits preview-ready after successful load', async () => {
    const wrapper = await mountPreview()
    await flushPromises()

    expect(wrapper.emitted('preview-ready')).toBeTruthy()
  })

  it('emits preview-error when the PO form GET fails', async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (String(url).includes('/api/purchase-order-forms/')) {
        throw {
          statusCode: 401,
          statusMessage: 'Unauthorized',
          message: '[GET] "/api/purchase-order-forms/po-uuid-1": 401 Unauthorized',
        }
      }
      return { data: [] }
    })

    const wrapper = await mountPreview()
    await flushPromises()
    await flushPromises()

    expect(wrapper.emitted('preview-error')).toBeTruthy()
    expect(wrapper.find('[data-testid="preview-error"]').exists()).toBe(true)
  })

  it('skips API fetch when purchaseOrder prop is provided', async () => {
    const wrapper = await mountPreview({
      purchaseOrder: makeLaborPo(),
      purchaseOrderUuid: undefined,
    })
    await flushPromises()

    expect(mockFetch).not.toHaveBeenCalledWith(
      expect.stringContaining('/api/purchase-order-forms/'),
      expect.anything(),
    )
    expect(wrapper.emitted('preview-ready')).toBeTruthy()
  })

  it('fetches material PO line items with GET when po_type is not LABOR', async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/api/purchase-order-forms/')) {
        return { data: makeLaborPo({ po_type: 'MATERIAL' }) }
      }
      if (url.includes('/api/purchase-order-items')) {
        return { data: [{ item_name: 'Widget', po_quantity: 2, po_unit_price: 10, po_total: 20 }] }
      }
      if (url.includes('/api/purchase-orders/vendors')) {
        return { data: [{ uuid: 'vendor-1', vendor_name: 'Acme Vendor' }] }
      }
      if (url.includes('/api/projects/')) {
        return { data: { uuid: 'proj-1', project_name: 'Test Project', project_id: 'P-1' } }
      }
      return { data: [] }
    })

    await mountPreview()
    await flushPromises()

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/purchase-order-items?purchase_order_uuid=po-uuid-1'),
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('skips Nimble master-data store fetches when no auth token is available', async () => {
    mockResolveAuthToken.mockReturnValue(null)

    await mountPreview()
    await flushPromises()

    expect(mockFetchCorporations).not.toHaveBeenCalled()
    expect(mockFetchShipVia).not.toHaveBeenCalled()
    expect(mockFetchUOM).not.toHaveBeenCalled()
  })

  it('loads Nimble master-data stores when auth token is available', async () => {
    mockResolveAuthToken.mockReturnValue('test-token')

    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/api/purchase-order-forms/')) {
        return { data: makeLaborPo({ po_type: 'MATERIAL' }) }
      }
      if (url.includes('/api/purchase-orders/vendors')) {
        return { data: [{ uuid: 'vendor-1', vendor_name: 'Acme Vendor' }] }
      }
      if (url.includes('/api/projects/')) {
        return { data: { uuid: 'proj-1', project_name: 'Test Project', project_id: 'P-1' } }
      }
      return { data: [] }
    })

    await mountPreview()
    await flushPromises()

    expect(mockFetchCorporations).toHaveBeenCalled()
    expect(mockFetchShipVia).toHaveBeenCalled()
    expect(mockFetchUOM).toHaveBeenCalled()
  })
})

describe('PurchaseOrderPreview terms and conditions', () => {
  async function mountPreviewWithPo(overrides: Record<string, unknown> = {}) {
    const component = (await import('~/components/purchaseOrders/PurchaseOrderPreview.vue')).default
    return mount(component, {
      props: {
        purchaseOrder: makeLaborPo({
          terms_and_conditions_uuid: 'tc-uuid-1',
          ...overrides,
        }),
      },
      global: { stubs: { UAlert: UAlertStub } },
    })
  }

  it('renders terms and conditions content when terms_and_conditions_uuid is set', async () => {
    const wrapper = await mountPreviewWithPo()
    await flushPromises()

    expect(wrapper.text()).toContain('TERMS AND CONDITIONS')
    expect(wrapper.text()).toContain('Standard terms content')
  })

  it('renders inline terms when only terms_and_conditions text is stored (legacy)', async () => {
    const wrapper = await mountPreviewWithPo({
      terms_and_conditions_uuid: undefined,
      terms_and_conditions: '<p>Legacy inline terms</p>',
    })
    await flushPromises()

    expect(wrapper.text()).toContain('TERMS AND CONDITIONS')
    expect(wrapper.text()).toContain('Legacy inline terms')
  })
})
