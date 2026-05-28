import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CostCodeSelect from '~/components/shared/CostCodeSelect.vue'
import { useCostCodeConfigurationsStore } from '~/stores/costCodeConfigurations'

// ── Stubs ─────────────────────────────────────────────────────────────────────

/**
 * UPopover – renders the trigger slot always and the content slot when open.
 * Exposes a `data-open` attribute and a button to toggle it.
 */
const UPopoverStub = {
  name: 'UPopover',
  props: ['open', 'disabled'],
  emits: ['update:open'],
  template: `
    <div data-testid="popover" :data-open="open" :data-disabled="disabled">
      <slot />
      <div v-if="open" data-testid="popover-content"><slot name="content" /></div>
    </div>
  `,
}

/** UButton – renders content and fires click */
const UButtonStub = {
  name: 'UButton',
  props: ['disabled', 'loading', 'size', 'variant', 'class'],
  template: `<button data-testid="trigger-btn" :disabled="disabled" @click="$emit('click')"><slot /></button>`,
  emits: ['click'],
}

/**
 * UTree – renders a flat list of all items (recursively) as buttons so we can
 * simulate clicks on leaf and parent nodes.
 */
const UTreeStub = {
  name: 'UTree',
  props: ['items', 'modelValue', 'size', 'getKey'],
  emits: ['select'],
  template: `
    <div data-testid="tree">
      <template v-for="item in flatItems" :key="item.id || item.label">
        <button
          :data-testid="'tree-item-' + (item.id || item.label)"
          :data-disabled="item.disabled"
          :data-has-children="item.children && item.children.length > 0"
          :data-label="item.label"
          :data-uuid="item.id"
          @click="$emit('select', { preventDefault: () => {} }, item)"
        >
          {{ item.label }}
        </button>
      </template>
    </div>
  `,
  computed: {
    flatItems(): any[] {
      const result: any[] = []
      const walk = (items: any[]) => {
        for (const item of items) {
          result.push(item)
          if (item.children?.length) walk(item.children)
        }
      }
      walk((this as any).items ?? [])
      return result
    },
  },
}

const UInputStub = {
  name: 'UInput',
  props: ['modelValue', 'placeholder', 'disabled', 'size', 'class', 'readonly', 'icon', 'autofocus'],
  emits: ['update:modelValue'],
  template: `<input data-testid="input-stub" :value="modelValue" :placeholder="placeholder" :disabled="disabled" @input="$emit('update:modelValue', $event.target.value)" />`,
}
const UIconStub = { template: '<span />' }
const UBadgeStub = { template: '<span><slot /></span>' }

// ── Factories ──────────────────────────────────────────────────────────────────

const makeConfig = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  uuid: 'cfg-1',
  corporation_uuid: 'corp-1',
  cost_code_number: '01-100',
  cost_code_name: 'General Conditions',
  parent_cost_code_uuid: null,
  order_number: 1,
  is_active: true,
  description: null,
  ...overrides,
})

// ── Mount helper ──────────────────────────────────────────────────────────────

function mountSelect(props: Record<string, unknown> = {}) {
  return mount(CostCodeSelect, {
    props: {
      corporationUuid: 'corp-1',
      ...props,
    },
    global: {
      stubs: {
        UPopover: UPopoverStub,
        UButton: UButtonStub,
        UTree: UTreeStub,
        UInput: UInputStub,
        UIcon: UIconStub,
        UBadge: UBadgeStub,
      },
    },
  })
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CostCodeSelect', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    setActivePinia(createPinia())
    mockFetch = vi.fn().mockResolvedValue({ data: [] })
    vi.stubGlobal('$fetch', mockFetch)
  })

  afterEach(() => vi.restoreAllMocks())

  // ── Rendering ───────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('renders a UPopover trigger when corporationUuid is provided', () => {
      const wrapper = mountSelect()
      expect(wrapper.find('[data-testid="popover"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="input-stub"]').exists()).toBe(false)
    })

    it('renders a readonly UInput when corporationUuid is not provided', () => {
      const wrapper = mountSelect({ corporationUuid: undefined })
      expect(wrapper.find('[data-testid="input-stub"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="popover"]').exists()).toBe(false)
    })

    it('shows "Select corporation first" placeholder when no corporation', () => {
      const wrapper = mountSelect({ corporationUuid: undefined })
      expect(wrapper.find('[data-testid="input-stub"]').attributes('placeholder')).toContain('Select corporation first')
    })

    it('trigger button is disabled when disabled prop is true', () => {
      const wrapper = mountSelect({ disabled: true })
      expect(wrapper.find('[data-testid="trigger-btn"]').attributes('disabled')).toBeDefined()
    })

    it('trigger button is enabled by default', () => {
      const wrapper = mountSelect()
      expect(wrapper.find('[data-testid="trigger-btn"]').attributes('disabled')).toBeUndefined()
    })
  })

  // ── Data loading ─────────────────────────────────────────────────────────────

  describe('data loading', () => {
    it('calls fetchConfigurations with the corporation UUID on mount', async () => {
      mountSelect({ corporationUuid: 'corp-abc' })
      await vi.dynamicImportSettled?.()
      expect(mockFetch).toHaveBeenCalledWith('/api/cost-code-configurations', {
        query: { corporation_uuid: 'corp-abc' },
      })
    })

    it('does not fetch when externalConfigurations is provided', async () => {
      mountSelect({ externalConfigurations: [makeConfig()] })
      await vi.dynamicImportSettled?.()
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('fetches again when corporationUuid prop changes', async () => {
      mockFetch.mockResolvedValue({ data: [] })
      const wrapper = mountSelect({ corporationUuid: 'corp-1' })
      await wrapper.vm.$nextTick()

      await wrapper.setProps({ corporationUuid: 'corp-2' })
      await wrapper.vm.$nextTick()

      const calls = mockFetch.mock.calls.map((c: any[]) => c[1]?.query?.corporation_uuid)
      expect(calls).toContain('corp-2')
    })
  })

  // ── Tree building ─────────────────────────────────────────────────────────

  describe('tree structure', () => {
    async function loadAndOpen(configs: ReturnType<typeof makeConfig>[]) {
      mockFetch.mockResolvedValue({ data: configs })
      const store = useCostCodeConfigurationsStore()
      await store.fetchConfigurations('corp-1')

      const wrapper = mountSelect()
      // Open the popover
      await wrapper.find('[data-testid="popover"]').trigger('click')
      await wrapper.setProps({ corporationUuid: 'corp-1' }) // re-trigger
      // Manually open the popover by patching the vm state
      ;(wrapper.vm as any).isPopoverOpen = true
      await wrapper.vm.$nextTick()
      return wrapper
    }

    it('renders root cost codes in the tree', async () => {
      const configs = [
        makeConfig({ uuid: 'root-1', cost_code_number: '01', cost_code_name: 'Foundations' }),
        makeConfig({ uuid: 'root-2', cost_code_number: '02', cost_code_name: 'Structure' }),
      ]
      mockFetch.mockResolvedValue({ data: configs })
      const store = useCostCodeConfigurationsStore()
      await store.fetchConfigurations('corp-1')

      const wrapper = mountSelect()
      ;(wrapper.vm as any).isPopoverOpen = true
      await wrapper.vm.$nextTick()

      const treeText = wrapper.find('[data-testid="tree"]').text()
      expect(treeText).toContain('01 – Foundations')
      expect(treeText).toContain('02 – Structure')
    })

    it('renders child nodes under their parent', async () => {
      const parent = makeConfig({ uuid: 'parent-uuid', cost_code_number: '01', cost_code_name: 'Site Work' })
      const child = makeConfig({
        uuid: 'child-uuid',
        cost_code_number: '01-100',
        cost_code_name: 'Excavation',
        parent_cost_code_uuid: 'parent-uuid',
      })
      mockFetch.mockResolvedValue({ data: [parent, child] })
      const store = useCostCodeConfigurationsStore()
      await store.fetchConfigurations('corp-1')

      const wrapper = mountSelect()
      ;(wrapper.vm as any).isPopoverOpen = true
      await wrapper.vm.$nextTick()

      const parentItem = wrapper.find('[data-testid="tree-item-parent-uuid"]')
      const childItem = wrapper.find('[data-testid="tree-item-child-uuid"]')
      expect(parentItem.exists()).toBe(true)
      expect(childItem.exists()).toBe(true)
      expect(parentItem.attributes('data-has-children')).toBe('true')
      // Vue removes falsy boolean attributes from the DOM — absence means "no children"
      expect(childItem.attributes('data-has-children')).toBeUndefined()
    })

    it('marks parent nodes as disabled (not directly selectable)', async () => {
      const parent = makeConfig({ uuid: 'p', cost_code_number: '01', cost_code_name: 'Parent' })
      const child = makeConfig({ uuid: 'c', cost_code_number: '01-100', cost_code_name: 'Child', parent_cost_code_uuid: 'p' })
      mockFetch.mockResolvedValue({ data: [parent, child] })
      const store = useCostCodeConfigurationsStore()
      await store.fetchConfigurations('corp-1')

      const wrapper = mountSelect()
      ;(wrapper.vm as any).isPopoverOpen = true
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-testid="tree-item-p"]').attributes('data-disabled')).toBe('true')
      expect(wrapper.find('[data-testid="tree-item-c"]').attributes('data-disabled')).toBe('false')
    })

    it('excludes inactive configurations from the tree', async () => {
      const active = makeConfig({ uuid: 'active-1', cost_code_name: 'Active', is_active: true })
      const inactive = makeConfig({ uuid: 'inactive-1', cost_code_name: 'Inactive', cost_code_number: '02', is_active: false })
      mockFetch.mockResolvedValue({ data: [active, inactive] })
      const store = useCostCodeConfigurationsStore()
      await store.fetchConfigurations('corp-1')

      const wrapper = mountSelect()
      ;(wrapper.vm as any).isPopoverOpen = true
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-testid="tree"]').text()).toContain('Active')
      expect(wrapper.find('[data-testid="tree"]').text()).not.toContain('Inactive')
    })
  })

  // ── Natural sort ──────────────────────────────────────────────────────────

  describe('natural sort', () => {
    it('sorts "1.9" before "1.10"', async () => {
      const configs = [
        makeConfig({ uuid: 'c10', cost_code_number: '1.10', cost_code_name: 'Ten' }),
        makeConfig({ uuid: 'c9', cost_code_number: '1.9', cost_code_name: 'Nine' }),
        makeConfig({ uuid: 'c2', cost_code_number: '1.2', cost_code_name: 'Two' }),
      ]
      mockFetch.mockResolvedValue({ data: configs })
      const store = useCostCodeConfigurationsStore()
      await store.fetchConfigurations('corp-1')

      const wrapper = mountSelect()
      ;(wrapper.vm as any).isPopoverOpen = true
      await wrapper.vm.$nextTick()

      const items = wrapper.findAll('[data-testid^="tree-item-"]')
      const labels = items.map(i => i.attributes('data-label') ?? '')
      const numbers = labels.map(l => l.split(' – ')[0])
      expect(numbers).toEqual(['1.2', '1.9', '1.10'])
    })
  })

  // ── Selection ─────────────────────────────────────────────────────────────

  describe('selection', () => {
    async function loadWithLeaf() {
      const leaf = makeConfig({ uuid: 'leaf-uuid', cost_code_number: '01-100', cost_code_name: 'Excavation' })
      mockFetch.mockResolvedValue({ data: [leaf] })
      const store = useCostCodeConfigurationsStore()
      await store.fetchConfigurations('corp-1')

      const wrapper = mountSelect()
      ;(wrapper.vm as any).isPopoverOpen = true
      await wrapper.vm.$nextTick()
      return { wrapper, leaf }
    }

    it('emits update:modelValue with UUID when leaf node is selected', async () => {
      const { wrapper } = await loadWithLeaf()
      await wrapper.find('[data-testid="tree-item-leaf-uuid"]').trigger('click')
      await wrapper.vm.$nextTick()

      const emitted = wrapper.emitted('update:modelValue')
      expect(emitted).toBeTruthy()
      expect(emitted![0]).toEqual(['leaf-uuid'])
    })

    it('emits change with full cost-code option when leaf node is selected', async () => {
      const { wrapper } = await loadWithLeaf()
      await wrapper.find('[data-testid="tree-item-leaf-uuid"]').trigger('click')
      await wrapper.vm.$nextTick()

      const changeEmit = wrapper.emitted('change')
      expect(changeEmit).toBeTruthy()
      expect(changeEmit![0][0]).toMatchObject({
        value: 'leaf-uuid',
        label: '01-100 – Excavation',
      })
    })

    it('does NOT emit when a parent node (with children) is clicked', async () => {
      const parent = makeConfig({ uuid: 'par', cost_code_number: '01', cost_code_name: 'Parent' })
      const child = makeConfig({ uuid: 'chd', cost_code_number: '01-100', cost_code_name: 'Child', parent_cost_code_uuid: 'par' })
      mockFetch.mockResolvedValue({ data: [parent, child] })
      const store = useCostCodeConfigurationsStore()
      await store.fetchConfigurations('corp-1')

      const wrapper = mountSelect()
      ;(wrapper.vm as any).isPopoverOpen = true
      await wrapper.vm.$nextTick()

      await wrapper.find('[data-testid="tree-item-par"]').trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.emitted('update:modelValue')).toBeFalsy()
      expect(wrapper.emitted('change')).toBeFalsy()
    })

    it('closes the popover after selection', async () => {
      const { wrapper } = await loadWithLeaf()
      await wrapper.find('[data-testid="tree-item-leaf-uuid"]').trigger('click')
      await wrapper.vm.$nextTick()

      expect((wrapper.vm as any).isPopoverOpen).toBe(false)
    })

    it('shows the selected label in the trigger button after selection', async () => {
      const { wrapper } = await loadWithLeaf()
      await wrapper.find('[data-testid="tree-item-leaf-uuid"]').trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-testid="trigger-btn"]').text()).toContain('01-100 – Excavation')
    })
  })

  // ── modelValue sync ────────────────────────────────────────────────────────

  describe('modelValue sync', () => {
    it('shows selected label when modelValue is set on mount', async () => {
      const cfg = makeConfig({ uuid: 'pre-sel', cost_code_number: '03', cost_code_name: 'Pre-Selected' })
      mockFetch.mockResolvedValue({ data: [cfg] })
      const store = useCostCodeConfigurationsStore()
      await store.fetchConfigurations('corp-1')

      const wrapper = mountSelect({ modelValue: 'pre-sel' })
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-testid="trigger-btn"]').text()).toContain('03 – Pre-Selected')
    })

    it('updates the displayed label when modelValue changes externally', async () => {
      const cfg1 = makeConfig({ uuid: 'id-1', cost_code_number: '01', cost_code_name: 'First' })
      const cfg2 = makeConfig({ uuid: 'id-2', cost_code_number: '02', cost_code_name: 'Second' })
      mockFetch.mockResolvedValue({ data: [cfg1, cfg2] })
      const store = useCostCodeConfigurationsStore()
      await store.fetchConfigurations('corp-1')

      const wrapper = mountSelect({ modelValue: 'id-1' })
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('01 – First')

      await wrapper.setProps({ modelValue: 'id-2' })
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('02 – Second')
    })

    it('clears the displayed label when modelValue is set to undefined', async () => {
      const cfg = makeConfig({ uuid: 'clear-me', cost_code_number: '01', cost_code_name: 'Clear Me' })
      mockFetch.mockResolvedValue({ data: [cfg] })
      const store = useCostCodeConfigurationsStore()
      await store.fetchConfigurations('corp-1')

      const wrapper = mountSelect({ modelValue: 'clear-me' })
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('Clear Me')

      await wrapper.setProps({ modelValue: undefined })
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).not.toContain('Clear Me')
    })
  })

  // ── Search filtering ──────────────────────────────────────────────────────

  describe('search filtering', () => {
    async function loadForSearch() {
      const configs = [
        makeConfig({ uuid: 'a', cost_code_number: '01', cost_code_name: 'Foundations' }),
        makeConfig({ uuid: 'b', cost_code_number: '02', cost_code_name: 'Structure' }),
        makeConfig({ uuid: 'c', cost_code_number: '03', cost_code_name: 'Roofing' }),
      ]
      mockFetch.mockResolvedValue({ data: configs })
      const store = useCostCodeConfigurationsStore()
      await store.fetchConfigurations('corp-1')

      const wrapper = mountSelect()
      ;(wrapper.vm as any).isPopoverOpen = true
      await wrapper.vm.$nextTick()
      return wrapper
    }

    it('shows all items when search is empty', async () => {
      const wrapper = await loadForSearch()
      const items = wrapper.findAll('[data-testid^="tree-item-"]')
      expect(items.length).toBe(3)
    })

    it('filters items by cost code number', async () => {
      const wrapper = await loadForSearch()
      ;(wrapper.vm as any).searchQuery = '02'
      await wrapper.vm.$nextTick()

      const items = wrapper.findAll('[data-testid^="tree-item-"]')
      expect(items.length).toBe(1)
      expect(items[0].attributes('data-label')).toContain('Structure')
    })

    it('filters items by cost code name (case-insensitive)', async () => {
      const wrapper = await loadForSearch()
      ;(wrapper.vm as any).searchQuery = 'roof'
      await wrapper.vm.$nextTick()

      const items = wrapper.findAll('[data-testid^="tree-item-"]')
      expect(items.length).toBe(1)
      expect(items[0].attributes('data-label')).toContain('Roofing')
    })

    it('keeps a parent when a child matches the search query', async () => {
      const parent = makeConfig({ uuid: 'par', cost_code_number: '01', cost_code_name: 'Site Work' })
      const matchingChild = makeConfig({ uuid: 'chd', cost_code_number: '01-100', cost_code_name: 'Excavation', parent_cost_code_uuid: 'par' })
      mockFetch.mockResolvedValue({ data: [parent, matchingChild] })
      const store = useCostCodeConfigurationsStore()
      await store.fetchConfigurations('corp-1')

      const wrapper = mountSelect()
      ;(wrapper.vm as any).isPopoverOpen = true
      ;(wrapper.vm as any).searchQuery = 'excavation'
      await wrapper.vm.$nextTick()

      // Both parent and its matching child should be present
      expect(wrapper.find('[data-testid="tree-item-par"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="tree-item-chd"]').exists()).toBe(true)
    })

    it('returns no results message when nothing matches', async () => {
      const wrapper = await loadForSearch()
      ;(wrapper.vm as any).searchQuery = 'zzznomatch'
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-testid^="tree-item-"]').exists()).toBe(false)
      expect(wrapper.text()).toContain('No cost codes found matching')
    })

    it('clears search query when popover is closed', async () => {
      const wrapper = await loadForSearch()
      ;(wrapper.vm as any).searchQuery = 'roof'
      ;(wrapper.vm as any).isPopoverOpen = false
      await wrapper.vm.$nextTick()

      expect((wrapper.vm as any).searchQuery).toBe('')
    })
  })

  // ── External configurations ───────────────────────────────────────────────

  describe('externalConfigurations prop', () => {
    it('uses external configurations instead of the store', async () => {
      const external = [
        makeConfig({ uuid: 'ext-1', cost_code_name: 'External Code', corporation_uuid: 'corp-1' }),
      ]
      const wrapper = mountSelect({ externalConfigurations: external })
      ;(wrapper.vm as any).isPopoverOpen = true
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-testid="tree"]').text()).toContain('External Code')
    })

    it('does not call the store fetch when external configurations are provided', async () => {
      mountSelect({ externalConfigurations: [makeConfig()] })
      await new Promise(r => setTimeout(r, 10))
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('only shows active external configurations', async () => {
      const external = [
        makeConfig({ uuid: 'e1', cost_code_name: 'Active Ext', is_active: true }),
        makeConfig({ uuid: 'e2', cost_code_name: 'Inactive Ext', cost_code_number: '99', is_active: false }),
      ]
      const wrapper = mountSelect({ externalConfigurations: external })
      ;(wrapper.vm as any).isPopoverOpen = true
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Active Ext')
      expect(wrapper.text()).not.toContain('Inactive Ext')
    })
  })

  // ── Case-insensitive corporation matching ─────────────────────────────────

  describe('case-insensitive corporation UUID matching', () => {
    it('shows configurations even when store UUID is lowercase and prop is uppercase', async () => {
      // Store normalises to lowercase internally; the prop might come in uppercase from Nimble
      mockFetch.mockResolvedValue({ data: [makeConfig({ corporation_uuid: 'corp-1', cost_code_name: 'Site Work' })] })
      const store = useCostCodeConfigurationsStore()
      await store.fetchConfigurations('corp-1')   // fetched with lowercase

      // Component receives uppercase (as Nimble would supply it)
      const wrapper = mountSelect({ corporationUuid: 'CORP-1' })
      ;(wrapper.vm as any).isPopoverOpen = true
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-testid="tree"]').text()).toContain('Site Work')
    })
  })
})
