import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ItemTypeSelect from '~/components/shared/ItemTypeSelect.vue'

// ── Mock stores ────────────────────────────────────────────────────────────────
const mockGetActiveItemTypes = vi.fn()

vi.mock('~/stores/itemTypes', () => ({
  useItemTypesStore: () => ({
    getActiveItemTypes: mockGetActiveItemTypes,
    hasCachedData: vi.fn().mockReturnValue(true),
    fetchItemTypes: vi.fn().mockResolvedValue(undefined),
    itemTypes: [],
    loading: false,
  }),
}))

vi.mock('~/stores/estimateCreation', () => ({
  useEstimateCreationStore: () => ({
    itemTypes: [],
    getActiveConfigurations: [],
  }),
}))

// ── Stubs ──────────────────────────────────────────────────────────────────────
const USelectMenuStub = {
  name: 'USelectMenu',
  props: ['modelValue', 'items', 'placeholder', 'disabled', 'loading', 'size', 'class', 'ui', 'filterFields', 'valueKey', 'searchable', 'searchablePlaceholder', 'variant', 'trailingIcon'],
  emits: ['update:modelValue'],
  template: `
    <div data-testid="select-menu"
      :data-item-count="items ? items.length : 0"
      :data-disabled="String(!!disabled)"
      :data-placeholder="placeholder">
      <div v-for="item in (items || [])" :key="item.value" data-testid="item" :data-value="item.value" :data-label="item.label">
        <slot name="item-label" :item="item" />
      </div>
    </div>
  `,
}

const makeItemType = (overrides = {}) => ({
  uuid: 'it-uuid-1',
  id: 1,
  spec_type: 'Structural',
  item_type: 'Steel Beam',
  category: 'materials',
  description: 'Heavy steel beam',
  is_active: true,
  ...overrides,
})

describe('ItemTypeSelect', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockGetActiveItemTypes.mockReturnValue([])
  })

  const mountComponent = (props = {}) =>
    mount(ItemTypeSelect, {
      props: { corporationUuid: 'corp-1', ...props },
      global: { stubs: { USelectMenu: USelectMenuStub } },
    })

  // ── Label rendering ──────────────────────────────────────────────────────────
  describe('label formatting', () => {
    it('formats label as "SpecType - ItemType" when both present', async () => {
      mockGetActiveItemTypes.mockReturnValue([makeItemType()])
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      const item = wrapper.find('[data-testid="item"]')
      expect(item.attributes('data-label')).toBe('Structural - Steel Beam')
    })

    it('shows only item_type when spec_type is empty', async () => {
      mockGetActiveItemTypes.mockReturnValue([makeItemType({ spec_type: '', item_type: 'Timber' })])
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      const item = wrapper.find('[data-testid="item"]')
      expect(item.attributes('data-label')).toBe('Timber')
    })

    it('shows only spec_type when item_type is empty', async () => {
      mockGetActiveItemTypes.mockReturnValue([makeItemType({ spec_type: 'Framing', item_type: '' })])
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      const item = wrapper.find('[data-testid="item"]')
      expect(item.attributes('data-label')).toBe('Framing')
    })
  })

  // ── Category filtering ───────────────────────────────────────────────────────
  describe('category filtering', () => {
    it('shows only items matching category prop', async () => {
      mockGetActiveItemTypes.mockReturnValue([
        makeItemType({ uuid: 'it-1', category: 'materials' }),
        makeItemType({ uuid: 'it-2', category: 'labor' }),
        makeItemType({ uuid: 'it-3', category: 'materials' }),
      ])
      const wrapper = mountComponent({ category: 'materials' })
      await wrapper.vm.$nextTick()

      const menu = wrapper.find('[data-testid="select-menu"]')
      expect(menu.attributes('data-item-count')).toBe('2')
    })

    it('shows all items when category prop is not set', async () => {
      mockGetActiveItemTypes.mockReturnValue([
        makeItemType({ uuid: 'it-1', category: 'materials' }),
        makeItemType({ uuid: 'it-2', category: 'labor' }),
      ])
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      const menu = wrapper.find('[data-testid="select-menu"]')
      expect(menu.attributes('data-item-count')).toBe('2')
    })
  })

  // ── External items prop ──────────────────────────────────────────────────────
  describe('externalItemTypes prop', () => {
    it('uses externalItemTypes instead of store when provided', async () => {
      mockGetActiveItemTypes.mockReturnValue([makeItemType(), makeItemType({ uuid: 'it-2' })])
      const external = [makeItemType({ uuid: 'ext-1', item_type: 'External Item' })]
      const wrapper = mountComponent({ externalItemTypes: external })
      await wrapper.vm.$nextTick()

      const menu = wrapper.find('[data-testid="select-menu"]')
      expect(menu.attributes('data-item-count')).toBe('1')
    })
  })

  // ── Disabled state ───────────────────────────────────────────────────────────
  describe('disabled prop', () => {
    it('passes disabled to USelectMenu', async () => {
      const wrapper = mountComponent({ disabled: true })
      await wrapper.vm.$nextTick()

      const menu = wrapper.find('[data-testid="select-menu"]')
      expect(menu.attributes('data-disabled')).toBe('true')
    })
  })

  // ── Placeholder ───────────────────────────────────────────────────────────────
  describe('placeholder', () => {
    it('uses custom placeholder', async () => {
      const wrapper = mountComponent({ placeholder: 'Pick a type' })
      await wrapper.vm.$nextTick()

      const menu = wrapper.find('[data-testid="select-menu"]')
      expect(menu.attributes('data-placeholder')).toBe('Pick a type')
    })
  })

  // ── All option ────────────────────────────────────────────────────────────────
  describe('includeAllOption', () => {
    it('prepends All option when includeAllOption is true', async () => {
      mockGetActiveItemTypes.mockReturnValue([makeItemType()])
      const wrapper = mountComponent({ includeAllOption: true, allOptionLabel: 'All Types' })
      await wrapper.vm.$nextTick()

      const menu = wrapper.find('[data-testid="select-menu"]')
      // 1 real item + 1 ALL option
      expect(Number(menu.attributes('data-item-count'))).toBeGreaterThanOrEqual(2)
    })
  })

  // ── Deduplication ─────────────────────────────────────────────────────────────
  describe('deduplication', () => {
    it('deduplicates options with same uuid', async () => {
      mockGetActiveItemTypes.mockReturnValue([
        makeItemType({ uuid: 'same-uuid' }),
        makeItemType({ uuid: 'same-uuid' }),
      ])
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      const menu = wrapper.find('[data-testid="select-menu"]')
      expect(menu.attributes('data-item-count')).toBe('1')
    })
  })

  // ── Emit on selection ─────────────────────────────────────────────────────────
  describe('emits', () => {
    it('emits update:modelValue when item selected', async () => {
      mockGetActiveItemTypes.mockReturnValue([makeItemType()])
      const wrapper = mountComponent()
      const vm = wrapper.vm as any

      vm.handleSelection({ value: 'it-uuid-1', label: 'Structural - Steel Beam' })
      await wrapper.vm.$nextTick()

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['it-uuid-1'])
    })

    it('emits undefined when selection is cleared', async () => {
      mockGetActiveItemTypes.mockReturnValue([makeItemType()])
      const wrapper = mountComponent({ modelValue: 'it-uuid-1' })
      const vm = wrapper.vm as any

      vm.handleSelection(undefined)
      await wrapper.vm.$nextTick()

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([undefined])
    })
  })
})
