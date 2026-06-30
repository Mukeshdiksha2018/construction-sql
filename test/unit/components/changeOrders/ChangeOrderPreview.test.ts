import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('~/composables/useDateFormat', () => ({
  useDateFormat: () => ({
    formatDate: (v: unknown) => String(v ?? ''),
    formatCoEstimatedDeliveryForPrint: (v: unknown) => String(v ?? ''),
    formatPoEstimatedDeliveryForPrint: (v: unknown) => String(v ?? ''),
  }),
}))

vi.mock('~/composables/useCurrencyFormat', () => ({
  useCurrencyFormat: () => ({
    formatCurrency: (v: unknown) => `$${Number(v || 0).toFixed(2)}`,
    currencyCode: 'USD',
  }),
}))

vi.mock('~/stores/corporations', () => ({
  useCorporationStore: () => ({
    corporations: [],
    selectedCorporation: null,
    fetchCorporations: vi.fn().mockResolvedValue(undefined),
  }),
}))

vi.mock('~/stores/termsAndConditions', () => ({
  useTermsAndConditionsStore: () => ({
    termsAndConditions: [],
    fetchTermsAndConditions: vi.fn().mockResolvedValue(undefined),
    getTermsAndConditionById: () => null,
  }),
}))

vi.mock('~/stores/specialInstructions', () => ({
  useSpecialInstructionsStore: () => ({
    specialInstructions: [],
    fetchSpecialInstructions: vi.fn().mockResolvedValue(undefined),
  }),
}))

vi.mock('~/stores/freightGlobal', () => ({
  useFreightStore: () => ({
    freight: [],
    fetchFreight: vi.fn().mockResolvedValue(undefined),
    getFreightByUuid: () => undefined,
  }),
}))

vi.mock('~/stores/userProfiles', () => ({
  useUserProfilesStore: () => ({
    users: [],
    fetchUsers: vi.fn().mockResolvedValue(undefined),
  }),
}))

vi.mock('~/stores/approvalChecks', () => ({
  useApprovalChecksStore: () => ({
    approvalChecks: [],
    fetchApprovalChecks: vi.fn().mockResolvedValue(undefined),
    getApprovalCheckByUuid: () => null,
  }),
}))

vi.mock('~/stores/locations', () => ({
  useLocationsStore: () => ({
    locations: [],
    fetchLocations: vi.fn().mockResolvedValue(undefined),
    getByUuid: () => undefined,
  }),
}))

vi.mock('~/stores/uom', () => ({
  useUOMStore: () => ({
    uom: [],
    fetchUOM: vi.fn().mockResolvedValue(undefined),
    getUOMByUuid: () => undefined,
  }),
}))

vi.mock('~/stores/corporationSettings', () => ({
  useAppSettingsStore: () => ({
    settings: null,
    poPrintApprovedByVendor: false,
    poUseEntityName: false,
    fetchSettings: vi.fn().mockResolvedValue(undefined),
  }),
}))

vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({ data: null }))
vi.stubGlobal('useRuntimeConfig', () => ({
  public: { nimbleIntegrations: 'false' },
}))

const stubs = {
  UAlert: { template: '<div />' },
  USwitch: {
    template:
      '<input type="checkbox" data-testid="currency-print-switch" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />',
    props: ['modelValue', 'size'],
  },
}

function buildMockCO(overrides: Record<string, unknown> = {}) {
  return {
    uuid: 'co-1',
    co_number: 'CO-001',
    corporation_uuid: 'corp-1',
    project_uuid: 'proj-1',
    vendor_uuid: 'vendor-1',
    created_date: '2026-01-15',
    co_type: 'MATERIAL',
    co_items: [
      {
        item_name: 'Item 1',
        description: 'Desc 1',
        co_quantity: 10,
        co_unit_price: 5,
        co_total: 50,
        unit_label: 'EA',
        item_sequence: 'SEQ-001',
      },
    ],
    labor_co_items: [],
    charges: [],
    tax_total: 0,
    total_co_amount: 50,
    status: 'approved',
    is_revised: false,
    ...overrides,
  }
}

describe('ChangeOrderPreview currency conversion print', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  async function mountPreview(overrides: Record<string, unknown> = {}) {
    const component = (await import('~/components/changeOrders/ChangeOrderPreview.vue')).default
    return mount(component, {
      props: {
        changeOrder: buildMockCO(overrides),
      },
      global: { stubs },
    })
  }

  it('does not show currency print switch in preview body', async () => {
    const wrapper = await mountPreview({
      currency_conversion_enabled: true,
      currency_from: 'CAD',
      currency_to: 'USD',
      conversion_rate: 1.35,
    })
    await flushPromises()

    expect(wrapper.find('[data-testid="currency-print-switch"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="po-preview-currency-print-bar"]').exists()).toBe(false)
  })

  it('prints amounts in from currency when conversion is enabled', async () => {
    const wrapper = await mountPreview({
      currency_conversion_enabled: true,
      currency_from: 'CAD',
      currency_to: 'USD',
      conversion_rate: 1.35,
    })
    await flushPromises()

    expect(wrapper.text()).toMatch(/\$50\.00/)
    expect(wrapper.text()).not.toMatch(/\$67\.50/)
  })
})
