<template>
  <div class="w-full">
    <USelectMenu
      v-model="selectedAccountObject"
      :items="filteredOptions"
      :filter-fields="['label', 'account_type', 'searchText']"
      :placeholder="computedPlaceholder"
      :searchable="searchable"
      :searchable-placeholder="searchablePlaceholder"
      :size="size"
      :class="className"
      :ui="menuUi"
      :disabled="disabled"
      :loading="store.loading"
      value-key="value"
      @update:model-value="handleSelection"
    >
      <template #item-label="{ item }">
        <div class="flex items-center justify-between w-full">
          <div class="flex items-center gap-2 min-w-0 flex-1">
            <span class="truncate font-medium">{{ item.label }}</span>
            <UBadge
              v-if="item.account_type"
              :color="item.account_type_color"
              variant="solid"
              size="xs"
            >
              {{ item.account_type }}
            </UBadge>
          </div>
        </div>
      </template>

      <template #empty>
        <div v-if="store.loading" class="flex items-center justify-center gap-2 py-4 text-sm text-gray-400">
          <UIcon name="i-lucide-loader-circle" class="size-4 animate-spin" />
          <span>Loading accounts…</span>
        </div>
        <div v-else class="py-3 text-center text-sm text-gray-400">
          No accounts found
        </div>
      </template>
    </USelectMenu>

    <!-- API error indicator -->
    <p v-if="store.error" class="mt-1 text-xs text-red-500 truncate" :title="store.error">
      {{ store.error }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useChartOfAccountsStore } from '~/stores/chartOfAccounts'
import type { ChartOfAccountOption } from '~/stores/chartOfAccounts'

interface Props {
  modelValue?: string
  placeholder?: string
  searchable?: boolean
  searchablePlaceholder?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  disabled?: boolean
  corporationUuid?: string
  /** Optional local accounts array — takes precedence over the store when provided */
  localAccounts?: any[]
  /**
   * When set (e.g. `['Expense', 'Cost of Goods Sold']`), only those account_type
   * values are listed. If the current modelValue points to another type, that row
   * is still prepended so existing records stay readable.
   */
  accountTypesFilter?: string[] | null
  /** Excludes matching account_type values (case-insensitive). */
  accountTypesExclude?: string[] | null
  /** Excludes accounts whose account_type is "Bank". */
  excludeBankAccounts?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Search account...',
  searchable: true,
  searchablePlaceholder: 'Type to search...',
  size: 'sm',
  className: 'w-full',
  disabled: false,
  accountTypesFilter: null,
  accountTypesExclude: null,
  excludeBankAccounts: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | undefined]
  'change': [account: ChartOfAccountOption | undefined]
}>()

const store = useChartOfAccountsStore()

// Let dropdown expand to show long labels regardless of trigger width
const menuUi = { content: 'max-h-60 min-w-full w-max' }

const selectedAccountObject = ref<ChartOfAccountOption | undefined>(undefined)

const computedPlaceholder = computed(() =>
  !props.corporationUuid ? 'Select corporation first' : props.placeholder,
)

// ── Options pipeline ──────────────────────────────────────────────────────────

function normalizeType(t: string | null | undefined): string {
  return String(t ?? '').trim().toLowerCase()
}

/** Base options before filtering: either from localAccounts prop or from the store */
const baseOptions = computed<ChartOfAccountOption[]>(() => {
  if (props.localAccounts !== undefined) {
    return props.localAccounts
      .filter((a: any) => a?.is_active !== false)
      .map((a: any) => ({
        label: `${a.code} - ${a.account_name}`,
        value: a.uuid,
        account_type: a.account_type ?? '',
        account_type_color: (store as any).accountTypeColor?.(a.account_type) ?? 'neutral',
        searchText: `${a.code} ${a.account_name} ${a.account_type ?? ''}`.toLowerCase(),
      }))
  }

  const corp = props.corporationUuid?.toLowerCase()
  const activeUuids = new Set(
    store.accounts
      .filter(a => a.is_active && (!corp || a.corporation_id.toLowerCase() === corp))
      .map(a => a.uuid),
  )

  return store.accountOptions.filter(o => activeUuids.has(o.value))
})

/** Apply include/exclude/bank filters, preserving the current selection even if filtered out */
const filteredOptions = computed<ChartOfAccountOption[]>(() => {
  const include = props.accountTypesFilter?.length
    ? new Set(props.accountTypesFilter.map(normalizeType))
    : null
  const exclude = props.accountTypesExclude?.length
    ? new Set(props.accountTypesExclude.map(normalizeType))
    : null

  let list = [...baseOptions.value]

  if (include) list = list.filter(o => include.has(normalizeType(o.account_type)))
  if (exclude) list = list.filter(o => !exclude.has(normalizeType(o.account_type)))
  if (props.excludeBankAccounts) list = list.filter(o => normalizeType(o.account_type) !== 'bank')

  // Prepend current selection even if it was filtered out, so existing records stay readable
  if (
    props.modelValue
    && (include || exclude || props.excludeBankAccounts)
    && !list.some(o => o.value === props.modelValue)
  ) {
    const existing = store.accountOptions.find(o => o.value === props.modelValue)
    if (existing) list = [existing, ...list]
  }

  return list
})

const optionsMap = computed(() => new Map(filteredOptions.value.map(o => [o.value, o])))

function syncSelected(uuid: string | undefined) {
  selectedAccountObject.value = uuid ? optionsMap.value.get(uuid) : undefined
}

// ── Selection handler ────────────────────────────────────────────────────────

function handleSelection(val: any) {
  if (val) {
    const uuid = typeof val === 'string' ? val : (val as ChartOfAccountOption).value
    const opt = optionsMap.value.get(uuid) ?? (typeof val === 'object' ? val : undefined)
    emit('update:modelValue', uuid)
    emit('change', opt)
  }
  else {
    emit('update:modelValue', undefined)
    emit('change', undefined)
  }
}

// ── Watchers ─────────────────────────────────────────────────────────────────

watch(() => props.modelValue, (v) => syncSelected(v), { immediate: true })
watch(filteredOptions, () => syncSelected(props.modelValue))

watch(() => props.corporationUuid, (v) => {
  if (v && props.localAccounts === undefined) {
    store.fetchAccounts(v).catch(() => {})
  }
})

onMounted(() => {
  if (props.corporationUuid && props.localAccounts === undefined) {
    store.fetchAccounts(props.corporationUuid).catch(() => {})
  }
})
</script>
