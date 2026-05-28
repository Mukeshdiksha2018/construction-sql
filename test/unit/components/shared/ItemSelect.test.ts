import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ItemSelect from '~/components/shared/ItemSelect.vue'

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
      <div v-for="item in (items || [])" :key="item.value" data-testid="item" :data-value="item.value" :data-label="item.label">
        <slot name="item-label" :item="item" />
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
  unit_price: 49.99,
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

describe('ItemSelect', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockGetConfigurationsByCorporation.mockReturnValue([])
  })

  const mountComponent = (props = {}) =>
    mount(ItemSelect, {
      props: { corporationUuid: 'corp-1', ...props },
      global: { stubs: { USelectMenu: USelectMenuStub, UIcon: UIconStub } },
    })

  // ── Options from store ────────────────────────────────────────────────────────
  describe('options from configurations store', () => {
    it('builds item options from configurations store preferred_items', async () => {
      mockGetConfigurationsByCorporation.mockReturnValue([makeConfig()])
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      const menu = wrapper.find('[data-testid="select-menu"]')
      expect(Number(menu.attributes('data-item-count'))).toBeGreaterThanOrEqual(1)
    })

    it('uses item_name as label for preferred items', async () => {
      mockGetConfigurationsByCorporation.mockReturnValue([makeConfig()])
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      const item = wrapper.find('[data-testid="item"]')
      expect(item.attributes('data-label')).toBe('Steel Beam')
    })

    it('shows empty list when no configurations', async () => {
      mockGetConfigurationsByCorporation.mockReturnValue([])
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      const menu = wrapper.find('[data-testid="select-menu"]')
      expect(menu.attributes('data-item-count')).toBe('0')
    })
  })

  // ── itemTypeUuid filtering ────────────────────────────────────────────────────
  describe('itemTypeUuid filtering', () => {
    it('shows only items matching itemTypeUuid', async () => {
      mockGetConfigurationsByCorporation.mockReturnValue([
        makeConfig({
          preferred_items: [
            makePreferredItem({ item_uuid: 'i-1', item_type_uuid: 'it-match' }),
            makePreferredItem({ item_uuid: 'i-2', item_type_uuid: 'it-other' }),
          ],
        }),
      ])

      const wrapper = mountComponent({ itemTypeUuid: 'it-match' })
      await wrapper.vm.$nextTick()

      const menu = wrapper.find('[data-testid="select-menu"]')
      expect(Number(menu.attributes('data-item-count'))).toBe(1)
    })

    it('shows all items when itemTypeUuid is not set', async () => {
      mockGetConfigurationsByCorporation.mockReturnValue([
        makeConfig({
          preferred_items: [
            makePreferredItem({ item_uuid: 'i-1', item_type_uuid: 'it-a' }),
            makePreferredItem({ item_uuid: 'i-2', item_type_uuid: 'it-b' }),
          ],
        }),
      ])

      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      const menu = wrapper.find('[data-testid="select-menu"]')
      expect(Number(menu.attributes('data-item-count'))).toBe(2)
    })
  })

  // ── Project filtering ─────────────────────────────────────────────────────────
  describe('projectUuid filtering', () => {
    it('excludes items belonging to a different project when projectUuid is set', async () => {
      mockGetConfigurationsByCorporation.mockReturnValue([
        makeConfig({
          preferred_items: [
            makePreferredItem({ item_uuid: 'i-1', item_name: 'Match Project', project_uuid: 'proj-1' }),
            makePreferredItem({ item_uuid: 'i-2', item_name: 'Other Project', project_uuid: 'proj-2' }),
          ],
        }),
      ])

      const wrapper = mountComponent({ projectUuid: 'proj-1' })
      await wrapper.vm.$nextTick()

      const menu = wrapper.find('[data-testid="select-menu"]')
      // Only proj-1 item should show (proj-2 item excluded)
      expect(Number(menu.attributes('data-item-count'))).toBe(1)
    })
  })

  // ── Inactive item filtering ───────────────────────────────────────────────────
  describe('inactive items', () => {
    it('excludes items with is_active=false', async () => {
      mockGetConfigurationsByCorporation.mockReturnValue([
        makeConfig({
          preferred_items: [
            makePreferredItem({ item_uuid: 'active-1', is_active: true }),
            makePreferredItem({ item_uuid: 'inactive-1', is_active: false }),
          ],
        }),
      ])

      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      const menu = wrapper.find('[data-testid="select-menu"]')
      expect(Number(menu.attributes('data-item-count'))).toBe(1)
    })
  })

  // ── Deduplication ─────────────────────────────────────────────────────────────
  describe('deduplication', () => {
    it('deduplicates items with same item_uuid across configs', async () => {
      mockGetConfigurationsByCorporation.mockReturnValue([
        makeConfig({ uuid: 'cc-1', preferred_items: [makePreferredItem({ item_uuid: 'dup-uuid' })] }),
        makeConfig({ uuid: 'cc-2', preferred_items: [makePreferredItem({ item_uuid: 'dup-uuid' })] }),
      ])

      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      const menu = wrapper.find('[data-testid="select-menu"]')
      expect(Number(menu.attributes('data-item-count'))).toBe(1)
    })
  })

  // ── Emit on selection ─────────────────────────────────────────────────────────
  describe('emits', () => {
    it('emits update:modelValue on selection', async () => {
      mockGetConfigurationsByCorporation.mockReturnValue([makeConfig()])
      const wrapper = mountComponent()
      const vm = wrapper.vm as any

      vm.handleSelection({ value: 'item-uuid-1', label: 'Steel Beam' })
      await wrapper.vm.$nextTick()

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['item-uuid-1'])
    })

    it('emits change event with option on selection', async () => {
      mockGetConfigurationsByCorporation.mockReturnValue([makeConfig()])
      const wrapper = mountComponent()
      const vm = wrapper.vm as any

      vm.handleSelection({ value: 'item-uuid-1', label: 'Steel Beam' })
      await wrapper.vm.$nextTick()

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
})
