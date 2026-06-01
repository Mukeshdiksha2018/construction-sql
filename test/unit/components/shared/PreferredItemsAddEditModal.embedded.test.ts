import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import PreferredItemsAddEditModal from '~/components/shared/PreferredItemsAddEditModal.vue'

const mockFetch = vi.fn()
const toastAdd = vi.fn()

vi.stubGlobal('$fetch', mockFetch)
vi.stubGlobal('useToast', () => ({ add: toastAdd }))

vi.mock('~/stores/corporations', () => ({
  useCorporationStore: () => ({
    selectedCorporationId: 'corp-1',
    selectedCorporation: { id: 'corp-1', name: 'Test Corp' },
  }),
}))

vi.mock('~/stores/itemTypes', () => ({
  useItemTypesStore: () => ({
    itemTypes: [],
    fetchItemTypes: vi.fn(),
  }),
}))

vi.mock('~/stores/preferredItems', () => ({
  usePreferredItemsStore: () => ({}),
}))

const UModalStub = {
  name: 'UModal',
  props: ['open'],
  emits: ['update:open'],
  template: `
    <div v-if="open" data-testid="modal">
      <slot name="header" />
      <slot />
    </div>
  `,
}

const stubSelect = { template: '<div />' }

describe('PreferredItemsAddEditModal embedded mode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({ data: [] })
  })

  function mountEmbedded(props: Record<string, unknown> = {}) {
    return mount(PreferredItemsAddEditModal, {
      props: {
        modelValue: true,
        mode: 'embedded',
        corporationUuid: 'corp-1',
        costCodeConfigurationUuid: 'CFG-UUID-1',
        costCodeLabel: '01-100 — General',
        allowEmbeddedProjectSelect: true,
        lockEmbeddedCostCodeSelection: true,
        ...props,
      },
      global: {
        stubs: {
          UModal: UModalStub,
          UButton: { template: '<button><slot /></button>' },
          UInput: stubSelect,
          UTextarea: stubSelect,
          USelect: stubSelect,
          USelectMenu: stubSelect,
          UCheckbox: stubSelect,
          UIcon: stubSelect,
          CorporationSelect: stubSelect,
          ProjectsSelect: stubSelect,
          ItemTypeSelect: stubSelect,
          UomSelect: stubSelect,
          LocationSelect: stubSelect,
          VendorSelect: stubSelect,
          CostCodeSelect: stubSelect,
          EditorContent: stubSelect,
        },
      },
    })
  }

  it('shows embedded cost code label in title area', async () => {
    const wrapper = mountEmbedded()
    await flushPromises()
    expect(wrapper.text()).toContain('01-100 — General')
  })

  it('uses embedded corporation uuid for API calls', async () => {
    const wrapper = mountEmbedded()
    await flushPromises()

    const vm = wrapper.vm as unknown as {
      itemForm: { project_uuid: string; item_type_uuid: string }
    }
    vm.itemForm.project_uuid = 'proj-1'
    vm.itemForm.item_type_uuid = 'it-1'
    await nextTick()
    await flushPromises()

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('corporation_uuid=corp-1'),
    )
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('cost_code_configuration_uuid=cfg-uuid-1'),
    )
  })

  it('pre-fills cost_code_configuration_uuid on new rows when locked', async () => {
    const wrapper = mountEmbedded()
    await flushPromises()

    const vm = wrapper.vm as unknown as {
      addEmptyRow: () => void
      itemRows: Array<{ cost_code_configuration_uuid: string }>
    }
    vm.addEmptyRow()
    expect(vm.itemRows[vm.itemRows.length - 1].cost_code_configuration_uuid).toBe('cfg-uuid-1')
  })

  it('blocks save when locked cost code row is missing linkage', async () => {
    const wrapper = mountEmbedded()
    await flushPromises()

    const vm = wrapper.vm as unknown as {
      itemForm: { project_uuid: string; item_type_uuid: string }
      itemRows: Array<Record<string, unknown>>
      saveItem: () => Promise<void>
    }
    vm.itemForm.project_uuid = 'proj-1'
    vm.itemForm.item_type_uuid = 'it-1'
    vm.itemRows.push({
      item_sequence: 'S1',
      item_name: 'Item A',
      unit_price: 10,
      cost_code_configuration_uuid: '',
      description: '',
      model_number: '',
      uom_uuid: '',
      preferred_vendor_uuid: '',
      location_uuid: '',
      initial_quantity: '',
      as_of_date: '',
      reorder_point: '',
      maximum_limit: '',
      status: 'Active',
    })

    await vm.saveItem()
    expect(toastAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Validation Error',
        description: 'Each row must be linked to this cost code.',
      }),
    )
    expect(mockFetch).not.toHaveBeenCalledWith(
      '/api/preferred-items/bulk',
      expect.anything(),
    )
  })
})
