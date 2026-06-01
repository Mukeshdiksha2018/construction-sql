import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import CostCodeConfigurationForm from '~/components/projects/CostCodeConfigurationForm.vue'
import {
  filterPreferredItemsForConfig,
  makePreferredItemApi,
} from '../../../helpers/preferredItems'

const mockFetchProjects = vi.fn()
const mockFetch = vi.fn()

vi.mock('~/stores/corporations', () => ({
  useCorporationStore: () => ({
    selectedCorporationId: 'corp-1',
  }),
}))

vi.mock('~/stores/projects', () => ({
  useProjectsStore: () => ({
    projects: [{ uuid: 'proj-1', project_name: 'Tower A' }],
    fetchProjects: mockFetchProjects,
  }),
}))

vi.stubGlobal('$fetch', mockFetch)

const PreferredModalStub = {
  name: 'SharedPreferredItemsAddEditModal',
  props: ['modelValue', 'mode', 'costCodeConfigurationUuid', 'costCodeLabel'],
  emits: ['update:modelValue', 'saved'],
  template: `
    <div
      v-if="modelValue"
      data-testid="preferred-items-modal"
      :data-mode="mode"
      :data-cost-code="costCodeConfigurationUuid"
      :data-label="costCodeLabel"
    />
  `,
}

const stubField = { template: '<div />' }

describe('CostCodeConfigurationForm preferred items', () => {
  const baseForm = {
    division_uuid: null,
    cost_code_number: '01-100',
    cost_code_name: 'General',
    parent_cost_code_uuid: null,
    order_number: null,
    gl_account_uuid: null,
    description: null,
    is_active: true,
    update_previous_transactions: false,
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockFetchProjects.mockResolvedValue(undefined)
    mockFetch.mockResolvedValue({
      data: [
        makePreferredItemApi({
          uuid: 'item-a',
          cost_code_configuration_uuid: 'cfg-edit-1',
          item_name: 'Bolt',
          item_sequence: 'B-1',
          project_uuid: 'proj-1',
          unit_price: 2.5,
        }),
        makePreferredItemApi({
          uuid: 'item-b',
          cost_code_configuration_uuid: 'other-cfg',
          item_name: 'Other',
        }),
      ],
    })
  })

  function mountForm(editingUuid?: string) {
    return mount(CostCodeConfigurationForm, {
      props: {
        modelValue: { ...baseForm },
        editingUuid,
        readonly: false,
      },
      global: {
        stubs: {
          UCard: { template: '<div><slot /></div>' },
          UIcon: true,
          UInput: stubField,
          UTextarea: stubField,
          UCheckbox: stubField,
          UButton: {
            props: ['icon'],
            emits: ['click'],
            template: '<button type="button" @click="$emit(\'click\')"><slot /></button>',
          },
          SharedDivisionSelect: stubField,
          SharedParentCostCodeSelect: stubField,
          SharedOrderSelect: stubField,
          SharedChartOfAccountsSelect: stubField,
          SharedPreferredItemsAddEditModal: PreferredModalStub,
        },
      },
    })
  }

  it('does not show preferred items section for new cost codes', async () => {
    const wrapper = mountForm()
    await flushPromises()
    expect(wrapper.text()).not.toContain('Preferred Items')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('loads and lists preferred items for the editing cost code', async () => {
    const wrapper = mountForm('cfg-edit-1')
    await flushPromises()

    expect(mockFetch).toHaveBeenCalledWith('/api/preferred-items', {
      query: { corporation_uuid: 'corp-1' },
      credentials: 'include',
    })
    expect(wrapper.text()).toContain('Bolt')
    expect(wrapper.text()).toContain('Tower A')
    expect(wrapper.text()).not.toContain('Other')
  })

  it('opens embedded modal with editing uuid and label', async () => {
    const wrapper = mountForm('cfg-edit-1')
    await flushPromises()

    const btn = wrapper.findAll('button').find(b => b.text().includes('Add / Manage Items'))
    expect(btn).toBeTruthy()
    await btn!.trigger('click')
    await nextTick()

    const modal = wrapper.get('[data-testid="preferred-items-modal"]')
    expect(modal.attributes('data-mode')).toBe('embedded')
    expect(modal.attributes('data-cost-code')).toBe('cfg-edit-1')
    expect(modal.attributes('data-label')).toContain('01-100')
  })

  it('reloads preferred items after modal saved', async () => {
    const wrapper = mountForm('cfg-edit-1')
    await flushPromises()
    const callsBefore = mockFetch.mock.calls.length

    await wrapper.findAll('button').find(b => b.text().includes('Add / Manage Items'))!.trigger('click')
    await nextTick()

    const modal = wrapper.findComponent(PreferredModalStub)
    await modal.vm.$emit('saved')
    await flushPromises()

    expect(mockFetch.mock.calls.length).toBeGreaterThan(callsBefore)
  })
})

describe('filterPreferredItemsForConfig', () => {
  it('returns only items for the given cost code (case-insensitive)', () => {
    const items = [
      makePreferredItemApi({ cost_code_configuration_uuid: 'CFG-A' }),
      makePreferredItemApi({ cost_code_configuration_uuid: 'cfg-b' }),
    ]
    const filtered = filterPreferredItemsForConfig(items, 'cfg-a')
    expect(filtered).toHaveLength(1)
    expect(filtered[0]?.uuid).toBe('item-uuid-1')
  })
})
