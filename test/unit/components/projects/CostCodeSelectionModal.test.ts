import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CostCodeSelectionModal from '~/components/projects/CostCodeSelectionModal.vue'

// ── Stubs ──────────────────────────────────────────────────────────────────────
const UModalStub = {
  name: 'UModal',
  props: ['open', 'fullscreen', 'title', 'description', 'ui'],
  emits: ['update:open'],
  template: `
    <div v-if="open" data-testid="modal">
      <div data-testid="modal-header"><slot name="header" /></div>
      <div data-testid="modal-body"><slot name="body" /></div>
      <div data-testid="modal-footer"><slot name="footer" /></div>
    </div>
  `,
}

const UTabsStub = {
  name: 'UTabs',
  props: ['items', 'modelValue', 'orientation', 'variant', 'content'],
  emits: ['update:modelValue'],
  template: `
    <div data-testid="tabs">
      <button
        v-for="tab in (items || [])"
        :key="tab.value"
        data-testid="tab-btn"
        :data-value="tab.value"
        :data-label="tab.label"
        @click="$emit('update:modelValue', tab.value)"
      >{{ tab.label }}</button>
    </div>
  `,
}

const UCheckboxStub = {
  name: 'UCheckbox',
  props: ['modelValue', 'indeterminate'],
  emits: ['update:modelValue'],
  template: `<input type="checkbox" data-testid="checkbox" :checked="modelValue" @change="$emit('update:modelValue', $event.target.checked)" />`,
}

const UButtonStub = {
  name: 'UButton',
  props: ['icon', 'color', 'variant', 'size'],
  emits: ['click'],
  template: `<button data-testid="btn" @click="$emit('click')"><slot /></button>`,
}

const UIconStub = { name: 'UIcon', template: '<span />' }

// ── Fixtures ───────────────────────────────────────────────────────────────────
const makeSubCostCode = (uuid: string, num: string) => ({
  uuid,
  cost_code_number: num,
  cost_code_name: `Sub CC ${num}`,
  subSubCostCodes: [],
})

const makeCostCode = (uuid: string, num: string, subs: any[] = []) => ({
  uuid,
  cost_code_number: num,
  cost_code_name: `CC ${num}`,
  subCostCodes: subs,
})

const makeDivision = (uuid: string, overrides = {}) => ({
  uuid,
  division_number: '01',
  division_name: 'Concrete',
  costCodes: [makeCostCode('cc-1', '01-100'), makeCostCode('cc-2', '01-200')],
  ...overrides,
})

const hierarchicalData = [
  makeDivision('div-1'),
  {
    uuid: 'div-2',
    division_number: '02',
    division_name: 'Masonry',
    costCodes: [makeCostCode('cc-3', '02-100', [makeSubCostCode('sc-1', '02-100-A')])],
  },
]

describe('CostCodeSelectionModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  const mountComponent = (props = {}) =>
    mount(CostCodeSelectionModal, {
      props: { open: true, hierarchicalData, ...props },
      global: {
        stubs: {
          UModal: UModalStub,
          UTabs: UTabsStub,
          UCheckbox: UCheckboxStub,
          UButton: UButtonStub,
          UIcon: UIconStub,
        },
      },
    })

  // ── Rendering ─────────────────────────────────────────────────────────────────
  describe('rendering', () => {
    it('renders modal when open is true', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('[data-testid="modal"]').exists()).toBe(true)
    })

    it('does not render modal when open is false', () => {
      const wrapper = mountComponent({ open: false })
      expect(wrapper.find('[data-testid="modal"]').exists()).toBe(false)
    })

    it('renders division tabs for each division', () => {
      const wrapper = mountComponent()
      const tabs = wrapper.findAll('[data-testid="tab-btn"]')
      expect(tabs).toHaveLength(2)
    })

    it('labels each tab with division number and name', () => {
      const wrapper = mountComponent()
      const tabs = wrapper.findAll('[data-testid="tab-btn"]')
      expect(tabs[0].attributes('data-label')).toContain('01')
      expect(tabs[0].attributes('data-label')).toContain('Concrete')
    })

    it('shows "OTHER COSTS" label for OTHER division', () => {
      const data = [
        {
          uuid: 'other-div',
          division_number: 'OTHER',
          division_name: 'OTHER COSTS',
          costCodes: [],
        },
      ]
      const wrapper = mountComponent({ hierarchicalData: data })
      const tab = wrapper.find('[data-testid="tab-btn"]')
      expect(tab.attributes('data-label')).toBe('OTHER COSTS')
    })

    it('renders checkboxes for each cost code in active division', async () => {
      const wrapper = mountComponent()
      // Trigger first tab activation
      const firstTab = wrapper.find('[data-testid="tab-btn"]')
      await firstTab.trigger('click')
      await wrapper.vm.$nextTick()

      const checkboxes = wrapper.findAll('[data-testid="checkbox"]')
      // Should have division-level + cost code checkboxes
      expect(checkboxes.length).toBeGreaterThan(0)
    })
  })

  // ── Selection logic ───────────────────────────────────────────────────────────
  describe('selection state', () => {
    it('shows all cost codes as selected initially (no removedCostCodeUuids)', async () => {
      const wrapper = mountComponent({ removedCostCodeUuids: [] })
      const vm = wrapper.vm as any

      expect(vm.isSelected('cc-1')).toBe(true)
      expect(vm.isSelected('cc-2')).toBe(true)
    })

    it('shows removed items as deselected', () => {
      const wrapper = mountComponent({ removedCostCodeUuids: ['cc-1'] })
      const vm = wrapper.vm as any

      expect(vm.isSelected('cc-1')).toBe(false)
      expect(vm.isSelected('cc-2')).toBe(true)
    })

    it('handles sub-cost-code removal', () => {
      const wrapper = mountComponent({ removedCostCodeUuids: ['sc-1'] })
      const vm = wrapper.vm as any

      expect(vm.isSelected('sc-1')).toBe(false)
      expect(vm.isSelected('cc-3')).toBe(true)
    })
  })

  // ── Toggle ────────────────────────────────────────────────────────────────────
  describe('handleToggle', () => {
    it('marks a cost code as deselected when toggled off', () => {
      const wrapper = mountComponent()
      const vm = wrapper.vm as any

      vm.handleToggle('cc-1', false)
      expect(vm.isSelected('cc-1')).toBe(false)
    })

    it('marks a cost code as selected when toggled on', () => {
      const wrapper = mountComponent({ removedCostCodeUuids: ['cc-1'] })
      const vm = wrapper.vm as any

      vm.handleToggle('cc-1', true)
      expect(vm.isSelected('cc-1')).toBe(true)
    })
  })

  // ── Division toggle ───────────────────────────────────────────────────────────
  describe('handleDivisionToggle', () => {
    it('deselects all cost codes in a division', () => {
      const wrapper = mountComponent()
      const vm = wrapper.vm as any

      vm.handleDivisionToggle(hierarchicalData[0], false)
      expect(vm.isSelected('cc-1')).toBe(false)
      expect(vm.isSelected('cc-2')).toBe(false)
    })

    it('selects all cost codes in a division', () => {
      const wrapper = mountComponent({ removedCostCodeUuids: ['cc-1', 'cc-2'] })
      const vm = wrapper.vm as any

      vm.handleDivisionToggle(hierarchicalData[0], true)
      expect(vm.isSelected('cc-1')).toBe(true)
      expect(vm.isSelected('cc-2')).toBe(true)
    })

    it('isDivisionFullySelected returns true when all codes selected', () => {
      const wrapper = mountComponent({ removedCostCodeUuids: [] })
      const vm = wrapper.vm as any

      expect(vm.isDivisionFullySelected(hierarchicalData[0])).toBe(true)
    })

    it('isDivisionFullySelected returns false when any code deselected', () => {
      const wrapper = mountComponent({ removedCostCodeUuids: ['cc-1'] })
      const vm = wrapper.vm as any

      expect(vm.isDivisionFullySelected(hierarchicalData[0])).toBe(false)
    })

    it('isDivisionPartiallySelected returns true for partial selection', () => {
      const wrapper = mountComponent({ removedCostCodeUuids: ['cc-1'] })
      const vm = wrapper.vm as any

      expect(vm.isDivisionPartiallySelected(hierarchicalData[0])).toBe(true)
    })

    it('isDivisionPartiallySelected returns false when fully selected', () => {
      const wrapper = mountComponent({ removedCostCodeUuids: [] })
      const vm = wrapper.vm as any

      expect(vm.isDivisionPartiallySelected(hierarchicalData[0])).toBe(false)
    })
  })

  // ── Select All / Deselect All ─────────────────────────────────────────────────
  describe('select all / deselect all', () => {
    it('handleSelectAll makes all cost codes selected', () => {
      const wrapper = mountComponent({ removedCostCodeUuids: ['cc-1', 'cc-2', 'cc-3'] })
      const vm = wrapper.vm as any

      vm.handleSelectAll()
      expect(vm.isSelected('cc-1')).toBe(true)
      expect(vm.isSelected('cc-2')).toBe(true)
      expect(vm.isSelected('cc-3')).toBe(true)
    })

    it('handleDeselectAll makes all cost codes deselected', () => {
      const wrapper = mountComponent({ removedCostCodeUuids: [] })
      const vm = wrapper.vm as any

      vm.handleDeselectAll()
      expect(vm.isSelected('cc-1')).toBe(false)
      expect(vm.isSelected('cc-2')).toBe(false)
      expect(vm.isSelected('cc-3')).toBe(false)
      expect(vm.isSelected('sc-1')).toBe(false)
    })
  })

  // ── Confirm & Cancel ──────────────────────────────────────────────────────────
  describe('handleConfirm', () => {
    it('emits confirm with array of removed uuids', () => {
      const wrapper = mountComponent({ removedCostCodeUuids: ['cc-1'] })
      const vm = wrapper.vm as any

      vm.handleConfirm()
      const emitted = wrapper.emitted('confirm')
      expect(emitted).toBeTruthy()
      expect(emitted![0][0]).toContain('cc-1')
    })

    it('emits confirm with empty array when all selected', () => {
      const wrapper = mountComponent({ removedCostCodeUuids: [] })
      const vm = wrapper.vm as any

      vm.handleConfirm()
      const emitted = wrapper.emitted('confirm')
      expect(emitted![0][0]).toHaveLength(0)
    })

    it('emits update:open with false to close modal', () => {
      const wrapper = mountComponent()
      const vm = wrapper.vm as any

      vm.handleConfirm()
      expect(wrapper.emitted('update:open')?.[0]).toEqual([false])
    })
  })

  describe('handleCancel', () => {
    it('emits cancel and closes modal', () => {
      const wrapper = mountComponent()
      const vm = wrapper.vm as any

      vm.handleCancel()
      expect(wrapper.emitted('cancel')).toBeTruthy()
      expect(wrapper.emitted('update:open')?.[0]).toEqual([false])
    })
  })

  // ── getAllCostCodeUuids ────────────────────────────────────────────────────────
  describe('getAllCostCodeUuids', () => {
    it('returns all uuids including sub and sub-sub cost codes', () => {
      const wrapper = mountComponent()
      const vm = wrapper.vm as any

      const all = vm.getAllCostCodeUuids()
      // cc-1, cc-2 from div-1; cc-3, sc-1 from div-2
      expect(all).toContain('cc-1')
      expect(all).toContain('cc-2')
      expect(all).toContain('cc-3')
      expect(all).toContain('sc-1')
    })
  })

  // ── Prop sync ─────────────────────────────────────────────────────────────────
  describe('prop sync', () => {
    it('resets local removed uuids when open changes to true', async () => {
      const wrapper = mountComponent({ open: false, removedCostCodeUuids: ['cc-1'] })
      const vm = wrapper.vm as any

      // Add extra removals locally
      vm.handleToggle('cc-2', false)
      expect(vm.isSelected('cc-2')).toBe(false)

      // Re-open triggers reset to prop values
      await wrapper.setProps({ open: true })
      expect(vm.isSelected('cc-1')).toBe(false)
      expect(vm.isSelected('cc-2')).toBe(true) // reset to prop
    })
  })
})
