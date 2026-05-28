import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SequenceSelect from '~/components/shared/SequenceSelect.vue'

// ── Mock stores ────────────────────────────────────────────────────────────────
const mockGetConfigurationsByCorporation = vi.fn()

vi.mock('~/stores/costCodeConfigurations', () => ({
  useCostCodeConfigurationsStore: () => ({
    getConfigurationsByCorporation: mockGetConfigurationsByCorporation,
    configurations: [],
    loading: false,
    getConfigurationCountByCorporation: vi.fn().mockReturnValue(0),
    fetchConfigurations: vi.fn().mockResolvedValue(undefined),
  }),
}))

vi.mock('~/stores/estimateCreation', () => ({
  useEstimateCreationStore: () => ({
    costCodeConfigurations: [],
    getActiveConfigurations: [],
    selectedCorporationUuid: null,
  }),
}))

// ── Stubs ──────────────────────────────────────────────────────────────────────
const USelectMenuStub = {
  name: 'USelectMenu',
  props: ['modelValue', 'items', 'placeholder', 'disabled', 'loading', 'size', 'class', 'ui', 'filterFields', 'valueKey', 'searchable', 'variant', 'trailingIcon'],
  emits: ['update:modelValue'],
  template: `
    <div data-testid="select-menu"
      :data-item-count="items ? items.length : 0"
      :data-placeholder="placeholder">
      <div v-for="item in (items || [])" :key="item.value" data-testid="item"
        :data-value="item.value"
        :data-label="item.label"
        :data-subtitle="item.subtitle || ''">
      </div>
    </div>
  `,
}

const UIconStub = { name: 'UIcon', template: '<span />' }

// ── Fixtures ───────────────────────────────────────────────────────────────────
const makePreferredItem = (overrides = {}) => ({
  uuid: 'pi-1',
  item_uuid: 'item-uuid-1',
  item_name: 'Steel Beam',
  item_sequence: 'SB-001',
  item_type_uuid: 'it-1',
  cost_code_configuration_uuid: 'cc-1',
  project_uuid: null,
  status: 'Active',
  is_active: true,
  ...overrides,
})

const makeConfig = (overrides = {}) => ({
  uuid: 'cc-1',
  cost_code_number: '01-100',
  cost_code_name: 'Concrete',
  corporation_uuid: 'corp-1',
  is_active: true,
  preferred_items: [makePreferredItem()],
  ...overrides,
})

describe('SequenceSelect', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockGetConfigurationsByCorporation.mockReturnValue([])
  })

  const mountComponent = (props = {}) =>
    mount(SequenceSelect, {
      props: { corporationUuid: 'corp-1', ...props },
      global: { stubs: { USelectMenu: USelectMenuStub, UIcon: UIconStub } },
    })

  // ── Sequence as label ─────────────────────────────────────────────────────────
  describe('label from item_sequence', () => {
    it('uses item_sequence as the option label', async () => {
      mockGetConfigurationsByCorporation.mockReturnValue([makeConfig()])
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      const item = wrapper.find('[data-testid="item"]')
      expect(item.attributes('data-label')).toBe('SB-001')
    })

    it('falls back to item_name when item_sequence is empty', async () => {
      mockGetConfigurationsByCorporation.mockReturnValue([
        makeConfig({ preferred_items: [makePreferredItem({ item_sequence: '', item_name: 'Timber Post' })] }),
      ])
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      const item = wrapper.find('[data-testid="item"]')
      expect(item.attributes('data-label')).toBe('Timber Post')
    })

    it('includes item_name in subtitle', async () => {
      mockGetConfigurationsByCorporation.mockReturnValue([makeConfig()])
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      const item = wrapper.find('[data-testid="item"]')
      expect(item.attributes('data-subtitle')).toContain('Steel Beam')
    })
  })

  // ── Value identity ────────────────────────────────────────────────────────────
  describe('value from item_uuid', () => {
    it('uses item_uuid as the option value', async () => {
      mockGetConfigurationsByCorporation.mockReturnValue([makeConfig()])
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      const item = wrapper.find('[data-testid="item"]')
      expect(item.attributes('data-value')).toBe('item-uuid-1')
    })
  })

  // ── itemTypeUuid filtering ────────────────────────────────────────────────────
  describe('itemTypeUuid filtering', () => {
    it('filters sequences by itemTypeUuid when provided', async () => {
      mockGetConfigurationsByCorporation.mockReturnValue([
        makeConfig({
          preferred_items: [
            makePreferredItem({ item_uuid: 'i-1', item_sequence: 'A-001', item_type_uuid: 'match' }),
            makePreferredItem({ item_uuid: 'i-2', item_sequence: 'B-001', item_type_uuid: 'other' }),
          ],
        }),
      ])

      const wrapper = mountComponent({ itemTypeUuid: 'match' })
      await wrapper.vm.$nextTick()

      const menu = wrapper.find('[data-testid="select-menu"]')
      expect(Number(menu.attributes('data-item-count'))).toBe(1)
    })
  })

  // ── Deduplication ─────────────────────────────────────────────────────────────
  describe('deduplication', () => {
    it('deduplicates options with same item_uuid', async () => {
      mockGetConfigurationsByCorporation.mockReturnValue([
        makeConfig({
          preferred_items: [
            makePreferredItem({ item_uuid: 'same-uuid', item_sequence: 'S-001' }),
            makePreferredItem({ item_uuid: 'same-uuid', item_sequence: 'S-002' }),
          ],
        }),
      ])

      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      const menu = wrapper.find('[data-testid="select-menu"]')
      expect(Number(menu.attributes('data-item-count'))).toBe(1)
    })
  })

  // ── Placeholder ───────────────────────────────────────────────────────────────
  describe('placeholder', () => {
    it('defaults to "Select sequence"', async () => {
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      const menu = wrapper.find('[data-testid="select-menu"]')
      expect(menu.attributes('data-placeholder')).toBe('Select sequence')
    })

    it('uses custom placeholder', async () => {
      const wrapper = mountComponent({ placeholder: 'Choose specification' })
      await wrapper.vm.$nextTick()

      const menu = wrapper.find('[data-testid="select-menu"]')
      expect(menu.attributes('data-placeholder')).toBe('Choose specification')
    })
  })

  // ── Emits ─────────────────────────────────────────────────────────────────────
  describe('emits', () => {
    it('emits update:modelValue and change on selection', async () => {
      mockGetConfigurationsByCorporation.mockReturnValue([makeConfig()])
      const wrapper = mountComponent()
      const vm = wrapper.vm as any

      vm.handleSelection({ value: 'item-uuid-1', label: 'SB-001' })
      await wrapper.vm.$nextTick()

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['item-uuid-1'])
      const changeEmit = wrapper.emitted('change')?.[0]?.[0] as any
      expect(changeEmit?.value).toBe('item-uuid-1')
    })

    it('emits undefined on clear', async () => {
      const wrapper = mountComponent({ modelValue: 'item-uuid-1' })
      const vm = wrapper.vm as any

      vm.handleSelection(undefined)
      await wrapper.vm.$nextTick()

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([undefined])
    })
  })

  // ── Empty state ───────────────────────────────────────────────────────────────
  describe('empty state', () => {
    it('shows 0 items when no configurations', async () => {
      mockGetConfigurationsByCorporation.mockReturnValue([])
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      const menu = wrapper.find('[data-testid="select-menu"]')
      expect(menu.attributes('data-item-count')).toBe('0')
    })
  })
})
