import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ChartOfAccountsSelect from '~/components/shared/ChartOfAccountsSelect.vue'
import { useChartOfAccountsStore } from '~/stores/chartOfAccounts'
import type { ChartOfAccountItem } from '~/stores/chartOfAccounts'

// ── Stubs ─────────────────────────────────────────────────────────────────────

/**
 * USelectMenu stub – exposes just enough to verify:
 *   - the items passed to it
 *   - loading / disabled attributes
 *   - placeholder
 *   - slot rendering (item-label, empty)
 */
const USelectMenuStub = {
  name: 'USelectMenu',
  props: [
    'modelValue', 'items', 'placeholder', 'searchable',
    'searchablePlaceholder', 'size', 'class', 'ui', 'disabled',
    'loading', 'filterFields', 'valueKey',
  ],
  emits: ['update:modelValue'],
  template: `
    <div
      data-testid="select-menu"
      :data-loading="String(loading)"
      :data-disabled="String(disabled)"
      :data-placeholder="placeholder"
      :data-item-count="items ? items.length : 0"
    >
      <!-- Render each item via item-label slot so we can check badge rendering -->
      <div
        v-for="item in items"
        :key="item.value"
        data-testid="select-item"
        :data-value="item.value"
        :data-label="item.label"
        :data-account-type="item.account_type"
      >
        <slot name="item-label" :item="item" />
      </div>

      <!-- Render empty slot (visible regardless so we can assert its content) -->
      <div data-testid="empty-slot">
        <slot name="empty" />
      </div>
    </div>
  `,
}

const UBadgeStub = {
  name: 'UBadge',
  props: ['color', 'variant', 'size'],
  template: `<span data-testid="badge" :data-color="color"><slot /></span>`,
}

const UIconStub = {
  name: 'UIcon',
  props: ['name', 'class'],
  template: `<span data-testid="icon" :data-name="name" :class="$props.class" />`,
}

// ── Factories ─────────────────────────────────────────────────────────────────

const CORP_UUID = 'corp-test-1'

function makeAccount(overrides: Partial<ChartOfAccountItem> = {}): ChartOfAccountItem {
  return {
    uuid: 'acct-1',
    code: '10000.000',
    account_name: '10000.000. Cash',
    account_type: 'Bank',
    account_type_id: 'type-bank',
    account_type_order: 1,
    corporation_id: CORP_UUID,
    parent_account_name: null,
    parent_account_number: null,
    is_active: true,
    ...overrides,
  }
}

// ── Mount helper ──────────────────────────────────────────────────────────────

function mountComponent(props: Record<string, unknown> = {}) {
  return mount(ChartOfAccountsSelect, {
    props: {
      corporationUuid: CORP_UUID,
      ...props,
    },
    global: {
      stubs: {
        USelectMenu: USelectMenuStub,
        UBadge: UBadgeStub,
        UIcon: UIconStub,
      },
    },
  })
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ChartOfAccountsSelect', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    setActivePinia(createPinia())
    mockFetch = vi.fn().mockResolvedValue({ accounts: [], total: 0 })
    vi.stubGlobal('$fetch', mockFetch)
  })

  afterEach(() => vi.restoreAllMocks())

  // ── Rendering ─────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('renders the USelectMenu wrapper', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('[data-testid="select-menu"]').exists()).toBe(true)
    })

    it('defaults placeholder to "Search account..." when corporation is provided', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('[data-testid="select-menu"]').attributes('data-placeholder')).toBe('Search account...')
    })

    it('overrides placeholder to "Select corporation first" when no corporation', () => {
      const wrapper = mountComponent({ corporationUuid: undefined })
      expect(wrapper.find('[data-testid="select-menu"]').attributes('data-placeholder')).toBe('Select corporation first')
    })

    it('accepts a custom placeholder prop', () => {
      const wrapper = mountComponent({ placeholder: 'Pick an account' })
      expect(wrapper.find('[data-testid="select-menu"]').attributes('data-placeholder')).toBe('Pick an account')
    })

    it('passes disabled = true to USelectMenu when disabled prop is true', () => {
      const wrapper = mountComponent({ disabled: true })
      expect(wrapper.find('[data-testid="select-menu"]').attributes('data-disabled')).toBe('true')
    })

    it('passes disabled = false to USelectMenu by default', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('[data-testid="select-menu"]').attributes('data-disabled')).toBe('false')
    })

    it('does not render error paragraph when store.error is null', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('p.text-red-500').exists()).toBe(false)
    })
  })

  // ── Data loading ──────────────────────────────────────────────────────────

  describe('data loading', () => {
    it('calls store.fetchAccounts with corporationUuid on mount', async () => {
      mockFetch.mockResolvedValue({ accounts: [], total: 0 })
      mountComponent({ corporationUuid: 'corp-xyz' })
      await vi.dynamicImportSettled?.()
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/nimble/chart-of-accounts',
        expect.objectContaining({ query: { corporation_uuid: 'corp-xyz' } }),
      )
    })

    it('does not fetch when corporationUuid is undefined', async () => {
      mountComponent({ corporationUuid: undefined })
      await vi.dynamicImportSettled?.()
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('does not fetch when localAccounts prop is provided', async () => {
      mountComponent({ localAccounts: [] })
      await vi.dynamicImportSettled?.()
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('fetches again when corporationUuid prop changes', async () => {
      mockFetch.mockResolvedValue({ accounts: [], total: 0 })
      const wrapper = mountComponent({ corporationUuid: 'corp-1' })
      await wrapper.setProps({ corporationUuid: 'corp-2' })
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/nimble/chart-of-accounts',
        expect.objectContaining({ query: { corporation_uuid: 'corp-2' } }),
      )
    })

    it('does not fetch on corporationUuid change when localAccounts is provided', async () => {
      const wrapper = mountComponent({ corporationUuid: 'corp-1', localAccounts: [] })
      await wrapper.setProps({ corporationUuid: 'corp-2' })
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  // ── Options rendering ─────────────────────────────────────────────────────

  describe('options rendering', () => {
    it('passes active accounts for the corporation as items to USelectMenu', async () => {
      mockFetch.mockResolvedValue({ accounts: [], total: 0 })
      const wrapper = mountComponent()
      await vi.dynamicImportSettled?.()

      const store = useChartOfAccountsStore()
      store.accounts.push(makeAccount())

      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-testid="select-menu"]').attributes('data-item-count')).toBe('1')
    })

    it('does not expose inactive accounts as items', async () => {
      const wrapper = mountComponent()
      await vi.dynamicImportSettled?.()

      const store = useChartOfAccountsStore()
      store.accounts.push(makeAccount({ uuid: 'inactive-1', is_active: false }))

      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-testid="select-menu"]').attributes('data-item-count')).toBe('0')
    })

    it('does not show accounts from other corporations', async () => {
      const wrapper = mountComponent({ corporationUuid: 'corp-a' })
      await vi.dynamicImportSettled?.()

      const store = useChartOfAccountsStore()
      store.accounts.push(makeAccount({ uuid: 'other-corp-acct', corporation_id: 'corp-b' }))

      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-testid="select-menu"]').attributes('data-item-count')).toBe('0')
    })

    it('uses localAccounts when provided, ignoring the store', async () => {
      const localAccounts = [
        { uuid: 'local-1', code: '99000.000', account_name: '99000.000. Local', account_type: 'Asset', is_active: true },
      ]
      const store = useChartOfAccountsStore()
      store.accounts.push(makeAccount({ uuid: 'store-acct' }))

      const wrapper = mountComponent({ localAccounts })
      await wrapper.vm.$nextTick()

      const items = wrapper.findAll('[data-testid="select-item"]')
      expect(items).toHaveLength(1)
      expect(items[0]?.attributes('data-value')).toBe('local-1')
    })

    it('renders a badge for each item that has an account_type', async () => {
      const wrapper = mountComponent()
      const store = useChartOfAccountsStore()
      store.accounts.push(makeAccount({ account_type: 'Expense' }))

      await wrapper.vm.$nextTick()

      const badge = wrapper.find('[data-testid="badge"]')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toBe('Expense')
    })

    it('does not render a badge when account_type is empty string', async () => {
      const wrapper = mountComponent()
      const store = useChartOfAccountsStore()
      store.accounts.push(makeAccount({ account_type: null }))

      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-testid="badge"]').exists()).toBe(false)
    })
  })

  // ── Filtering props ───────────────────────────────────────────────────────

  describe('accountTypesFilter prop', () => {
    it('includes only matching account types', async () => {
      const wrapper = mountComponent({ accountTypesFilter: ['Expense'] })
      const store = useChartOfAccountsStore()
      store.accounts.push(
        makeAccount({ uuid: 'exp-1', account_type: 'Expense' }),
        makeAccount({ uuid: 'bnk-1', account_type: 'Bank' }),
      )

      await wrapper.vm.$nextTick()

      const items = wrapper.findAll('[data-testid="select-item"]')
      expect(items).toHaveLength(1)
      expect(items[0]?.attributes('data-value')).toBe('exp-1')
    })

    it('filter is case-insensitive', async () => {
      const wrapper = mountComponent({ accountTypesFilter: ['expense'] })
      const store = useChartOfAccountsStore()
      store.accounts.push(makeAccount({ uuid: 'exp-1', account_type: 'Expense' }))

      await wrapper.vm.$nextTick()

      expect(wrapper.findAll('[data-testid="select-item"]')).toHaveLength(1)
    })

    it('prepends the current modelValue account even if filtered out', async () => {
      const wrapper = mountComponent({
        modelValue: 'bnk-1',
        accountTypesFilter: ['Expense'],
      })
      const store = useChartOfAccountsStore()
      store.accounts.push(
        makeAccount({ uuid: 'exp-1', account_type: 'Expense' }),
        makeAccount({ uuid: 'bnk-1', account_type: 'Bank' }),
      )

      await wrapper.vm.$nextTick()

      const items = wrapper.findAll('[data-testid="select-item"]')
      expect(items).toHaveLength(2)
      expect(items[0]?.attributes('data-value')).toBe('bnk-1')
    })
  })

  describe('accountTypesExclude prop', () => {
    it('excludes matching account types', async () => {
      const wrapper = mountComponent({ accountTypesExclude: ['Bank'] })
      const store = useChartOfAccountsStore()
      store.accounts.push(
        makeAccount({ uuid: 'exp-1', account_type: 'Expense' }),
        makeAccount({ uuid: 'bnk-1', account_type: 'Bank' }),
      )

      await wrapper.vm.$nextTick()

      const items = wrapper.findAll('[data-testid="select-item"]')
      expect(items).toHaveLength(1)
      expect(items[0]?.attributes('data-value')).toBe('exp-1')
    })

    it('exclusion is case-insensitive', async () => {
      const wrapper = mountComponent({ accountTypesExclude: ['bank'] })
      const store = useChartOfAccountsStore()
      store.accounts.push(makeAccount({ uuid: 'bnk-1', account_type: 'Bank' }))

      await wrapper.vm.$nextTick()

      expect(wrapper.findAll('[data-testid="select-item"]')).toHaveLength(0)
    })
  })

  describe('excludeBankAccounts prop', () => {
    it('removes Bank accounts when true', async () => {
      const wrapper = mountComponent({ excludeBankAccounts: true })
      const store = useChartOfAccountsStore()
      store.accounts.push(
        makeAccount({ uuid: 'exp-1', account_type: 'Expense' }),
        makeAccount({ uuid: 'bnk-1', account_type: 'Bank' }),
      )

      await wrapper.vm.$nextTick()

      const items = wrapper.findAll('[data-testid="select-item"]')
      expect(items).toHaveLength(1)
      expect(items[0]?.attributes('data-value')).toBe('exp-1')
    })

    it('keeps Bank accounts when false (default)', async () => {
      const wrapper = mountComponent({ excludeBankAccounts: false })
      const store = useChartOfAccountsStore()
      store.accounts.push(
        makeAccount({ uuid: 'exp-1', account_type: 'Expense' }),
        makeAccount({ uuid: 'bnk-1', account_type: 'Bank' }),
      )

      await wrapper.vm.$nextTick()

      expect(wrapper.findAll('[data-testid="select-item"]')).toHaveLength(2)
    })

    it('is case-insensitive ("bank" matches "Bank")', async () => {
      const wrapper = mountComponent({ excludeBankAccounts: true })
      const store = useChartOfAccountsStore()
      store.accounts.push(makeAccount({ uuid: 'bnk-1', account_type: 'bank' }))

      await wrapper.vm.$nextTick()

      expect(wrapper.findAll('[data-testid="select-item"]')).toHaveLength(0)
    })
  })

  // ── Loading states ────────────────────────────────────────────────────────

  describe('loading state', () => {
    it('passes store.loading as :loading to USelectMenu', async () => {
      const wrapper = mountComponent()
      const store = useChartOfAccountsStore()
      store.loading = true

      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-testid="select-menu"]').attributes('data-loading')).toBe('true')
    })

    it('shows loading spinner in #empty slot when store.loading is true and no items', async () => {
      const wrapper = mountComponent()
      const store = useChartOfAccountsStore()
      store.loading = true

      await wrapper.vm.$nextTick()

      const emptySlot = wrapper.find('[data-testid="empty-slot"]')
      expect(emptySlot.text()).toContain('Loading accounts')
    })

    it('shows "No accounts found" in #empty slot when not loading and options are empty', async () => {
      const wrapper = mountComponent()
      const store = useChartOfAccountsStore()
      store.loading = false

      await wrapper.vm.$nextTick()

      const emptySlot = wrapper.find('[data-testid="empty-slot"]')
      expect(emptySlot.text()).toContain('No accounts found')
    })

    it('is NOT disabled when store.loading is true (dropdown stays clickable)', async () => {
      const wrapper = mountComponent()
      const store = useChartOfAccountsStore()
      store.loading = true

      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-testid="select-menu"]').attributes('data-disabled')).toBe('false')
    })

    it('shows spinning icon in the empty slot while loading', async () => {
      const wrapper = mountComponent()
      const store = useChartOfAccountsStore()
      store.loading = true

      await wrapper.vm.$nextTick()

      const icon = wrapper.find('[data-testid="icon"]')
      expect(icon.exists()).toBe(true)
      expect(icon.classes()).toContain('animate-spin')
    })
  })

  // ── Error display ─────────────────────────────────────────────────────────

  describe('error display', () => {
    it('renders error message when store.error is set', async () => {
      const wrapper = mountComponent()
      const store = useChartOfAccountsStore()
      store.error = 'Failed to fetch chart of accounts from Nimble'

      await wrapper.vm.$nextTick()

      const errorEl = wrapper.find('p.text-red-500')
      expect(errorEl.exists()).toBe(true)
      expect(errorEl.text()).toContain('Failed to fetch')
    })

    it('sets the title attribute to the full error for truncated display', async () => {
      const wrapper = mountComponent()
      const store = useChartOfAccountsStore()
      store.error = 'Something went wrong'

      await wrapper.vm.$nextTick()

      expect(wrapper.find('p.text-red-500').attributes('title')).toBe('Something went wrong')
    })
  })

  // ── Selection and emit ────────────────────────────────────────────────────

  describe('selection', () => {
    it('emits update:modelValue with the UUID when an account is selected', async () => {
      const wrapper = mountComponent()
      const store = useChartOfAccountsStore()
      store.accounts.push(makeAccount({ uuid: 'sel-uuid' }))
      await wrapper.vm.$nextTick()

      // Simulate USelectMenu emitting update:model-value
      await wrapper.findComponent(USelectMenuStub).vm.$emit('update:modelValue', 'sel-uuid')

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['sel-uuid'])
    })

    it('emits update:modelValue with undefined when selection is cleared', async () => {
      const wrapper = mountComponent({ modelValue: 'acct-1' })
      const store = useChartOfAccountsStore()
      store.accounts.push(makeAccount())
      await wrapper.vm.$nextTick()

      await wrapper.findComponent(USelectMenuStub).vm.$emit('update:modelValue', null)

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([undefined])
    })

    it('emits change event alongside update:modelValue', async () => {
      const wrapper = mountComponent()
      const store = useChartOfAccountsStore()
      store.accounts.push(makeAccount({ uuid: 'emit-uuid' }))
      await wrapper.vm.$nextTick()

      await wrapper.findComponent(USelectMenuStub).vm.$emit('update:modelValue', 'emit-uuid')

      expect(wrapper.emitted('change')).toBeTruthy()
    })
  })

  // ── modelValue synchronisation ────────────────────────────────────────────

  describe('modelValue synchronisation', () => {
    it('pre-selects the account matching the modelValue prop', async () => {
      // Populate the store via fetchAccounts so Vue's reactivity chain is established
      // before the component mounts and its immediate watch fires.
      mockFetch.mockResolvedValue({
        accounts: [
          {
            ID: 'pre-sel',
            Number: '30000.000',
            Name: '30000.000. Revenue',
            AccountTypeName: 'Revenue',
            AccountTypeID: 'type-rev',
            AccountTypeOrder: 3,
            AccountStatus: 1,
            IsAllow: 1,
            IsAllowAccount: true,
          },
        ],
        total: 1,
      })
      const store = useChartOfAccountsStore()
      await store.fetchAccounts(CORP_UUID)

      const wrapper = mountComponent({ modelValue: 'pre-sel' })
      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick()

      // The USelectMenu stub's modelValue should be the matching option object.
      const selectStub = wrapper.findComponent(USelectMenuStub)
      const received = selectStub.props('modelValue') as any
      expect(received?.value).toBe('pre-sel')
    })

    it('clears selectedAccountObject when modelValue changes to undefined', async () => {
      const store = useChartOfAccountsStore()
      store.accounts.push(makeAccount({ uuid: 'acct-1' }))

      const wrapper = mountComponent({ modelValue: 'acct-1' })
      await wrapper.vm.$nextTick()
      await wrapper.setProps({ modelValue: undefined })
      await wrapper.vm.$nextTick()

      const vm = wrapper.vm as any
      expect(vm.selectedAccountObject).toBeUndefined()
    })
  })
})
