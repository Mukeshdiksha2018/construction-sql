import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { h, nextTick } from 'vue'
import {
  buildPreferredItemCounts,
  makeCostCodeConfigApi,
  makePreferredItemApi,
} from '../../../helpers/preferredItems'

const mockFetchConfigurations = vi.fn()
const mockDeleteConfiguration = vi.fn()
const mockRouterPush = vi.fn()
const toastAdd = vi.fn()
const mockFetch = vi.fn()

const configurations = [
  makeCostCodeConfigApi({ uuid: 'cfg-1', cost_code_number: '01', cost_code_name: 'Alpha' }),
  makeCostCodeConfigApi({ uuid: 'cfg-2', cost_code_number: '02', cost_code_name: 'Beta' }),
]

vi.mock('~/stores/costCodeConfigurations', () => ({
  useCostCodeConfigurationsStore: () => ({
    configurations,
    loading: false,
    error: null,
    fetchConfigurations: mockFetchConfigurations,
    deleteConfiguration: mockDeleteConfiguration,
  }),
}))

vi.mock('~/stores/corporations', () => ({
  useCorporationStore: () => ({
    selectedCorporationId: 'corp-1',
  }),
}))

vi.stubGlobal('useRouter', () => ({ push: mockRouterPush }))
vi.stubGlobal('useRoute', () => ({ query: {} }))
vi.stubGlobal('useToast', () => ({ add: toastAdd }))
vi.stubGlobal('$fetch', mockFetch)

const PreferredModalStub = {
  name: 'SharedPreferredItemsAddEditModal',
  props: [
    'modelValue',
    'mode',
    'corporationUuid',
    'costCodeConfigurationUuid',
    'costCodeLabel',
    'lockEmbeddedCostCodeSelection',
  ],
  emits: ['update:modelValue', 'saved'],
  template: `
    <div
      v-if="modelValue"
      data-testid="preferred-items-modal"
      :data-mode="mode"
      :data-cost-code="costCodeConfigurationUuid"
      :data-label="costCodeLabel"
      :data-locked="lockEmbeddedCostCodeSelection"
    />
  `,
}

const UTableStub = {
  name: 'UTable',
  props: ['data', 'columns'],
  setup(props: { data: unknown[]; columns: Array<{ accessorKey?: string; cell?: (ctx: unknown) => unknown }> }) {
    return () =>
      h(
        'div',
        { 'data-testid': 'cost-codes-table' },
        (props.data || []).map((row: Record<string, unknown>) => {
          const itemsCol = props.columns?.find(c => c.accessorKey === 'preferred_items')
          const actionsCol = props.columns?.find(c => c.accessorKey === 'actions')
          const itemsVnode = itemsCol?.cell?.({ row: { original: row } })
          const actionsVnode = actionsCol?.cell?.({ row: { original: row } })
          return h('div', { 'data-testid': `row-${row.uuid}`, class: 'table-row' }, [
            itemsVnode,
            actionsVnode,
          ])
        }),
      )
  },
}

const UButtonStub = {
  name: 'UButton',
  props: ['icon', 'onClick'],
  setup(props: Record<string, unknown>) {
    return () =>
      h('button', {
        type: 'button',
        'data-testid': `btn-${String(props.icon || 'default')}`,
        onClick: props.onClick as (() => void) | undefined,
      })
  },
}

describe('CostCodesConfiguration preferred items', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockFetchConfigurations.mockResolvedValue(undefined)
    mockFetch.mockImplementation(async (url: string) => {
      if (String(url).includes('/api/preferred-items')) {
        return {
          data: [
            makePreferredItemApi({ cost_code_configuration_uuid: 'cfg-1' }),
            makePreferredItemApi({ uuid: 'item-2', cost_code_configuration_uuid: 'cfg-1' }),
          ],
        }
      }
      return { data: [] }
    })
  })

  async function mountList() {
    const mod = await import('~/components/projects/CostCodesConfiguration.vue')
    return mount(mod.default, {
      global: {
        stubs: {
          UTable: UTableStub,
          UButton: UButtonStub,
          UTooltip: { template: '<div><slot /></div>' },
          UDropdownMenu: true,
          USelect: true,
          UPagination: true,
          UModal: { template: '<div><slot name="body" /><slot name="footer" /></div>' },
          UAlert: true,
          UIcon: true,
          USkeleton: true,
          SharedPreferredItemsAddEditModal: PreferredModalStub,
        },
      },
    })
  }

  it('loads preferred item counts per cost code on corporation watch', async () => {
    const wrapper = await mountList()
    await flushPromises()

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/preferred-items',
      expect.objectContaining({ query: { corporation_uuid: 'corp-1' } }),
    )
    expect(wrapper.get('[data-testid="row-cfg-1"]').text()).toContain('2 items')
    expect(wrapper.get('[data-testid="row-cfg-2"]').text()).toContain('No items')
  })

  it('opens embedded preferred items modal for a configuration', async () => {
    const wrapper = await mountList()
    await flushPromises()

    const manageBtn = wrapper
      .get('[data-testid="row-cfg-1"]')
      .find('[data-testid="btn-i-heroicons-cube"]')
    await manageBtn.trigger('click')
    await nextTick()

    const modal = wrapper.get('[data-testid="preferred-items-modal"]')
    expect(modal.attributes('data-mode')).toBe('embedded')
    expect(modal.attributes('data-cost-code')).toBe('cfg-1')
    expect(modal.attributes('data-label')).toContain('01')
    expect(modal.attributes('data-locked')).toBe('true')
  })

  it('blocks delete when preferred items exist', async () => {
    const wrapper = await mountList()
    await flushPromises()

    const deleteBtn = wrapper
      .get('[data-testid="row-cfg-1"]')
      .find('[data-testid="btn-mingcute:delete-fill"]')
    await deleteBtn.trigger('click')
    await flushPromises()

    expect(toastAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Cannot delete cost code',
        description: expect.stringContaining('2 preferred item'),
      }),
    )
    expect(mockDeleteConfiguration).not.toHaveBeenCalled()
  })

  it('refreshes counts after preferred items saved', async () => {
    const wrapper = await mountList()
    await flushPromises()
    const initialFetchCount = mockFetch.mock.calls.filter(
      (c: unknown[]) => String(c[0]).includes('/api/preferred-items'),
    ).length

    const manageBtn = wrapper
      .get('[data-testid="row-cfg-1"]')
      .find('[data-testid="btn-i-heroicons-cube"]')
    await manageBtn.trigger('click')
    await nextTick()

    const modal = wrapper.findComponent(PreferredModalStub)
    await modal.vm.$emit('saved')
    await flushPromises()

    const afterFetchCount = mockFetch.mock.calls.filter(
      (c: unknown[]) => String(c[0]).includes('/api/preferred-items'),
    ).length
    expect(afterFetchCount).toBeGreaterThan(initialFetchCount)
    expect(mockFetchConfigurations).toHaveBeenCalledWith('corp-1', true)
  })
})

describe('preferred item count helpers', () => {
  it('buildPreferredItemCounts aggregates by normalized uuid', () => {
    const counts = buildPreferredItemCounts([
      { cost_code_configuration_uuid: 'CFG-1' },
      { cost_code_configuration_uuid: 'cfg-1' },
      { cost_code_configuration_uuid: 'cfg-2' },
      { cost_code_configuration_uuid: null },
    ])
    expect(counts['cfg-1']).toBe(2)
    expect(counts['cfg-2']).toBe(1)
  })
})
