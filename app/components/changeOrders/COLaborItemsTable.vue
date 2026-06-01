<template>
  <div class="rounded-xl border border-default bg-white dark:bg-gray-900/40 shadow-sm overflow-hidden">
    <div class="flex items-center justify-between gap-4 px-4 py-3 border-b border-default/70 bg-gray-50 dark:bg-gray-800">
      <div>
        <h3 class="text-sm font-semibold text-default uppercase tracking-wide">
          {{ title }}
        </h3>
        <p v-if="description" class="text-xs text-muted mt-1">
          {{ description }}
        </p>
      </div>
      <div v-if="hasItems" class="text-[11px] font-medium text-muted uppercase tracking-wide">
        {{ items.length }} items
      </div>
    </div>

    <div v-if="error" class="px-4 py-3 text-xs text-error-700 bg-error-50/80 dark:bg-error-900/20 border-b border-error-200">
      {{ error }}
    </div>
    
    <!-- Skeleton Loaders -->
    <div v-else-if="loading" class="px-4 py-4">
      <div class="hidden md:block">
        <table class="min-w-full table-fixed divide-y divide-default/60">
          <thead class="bg-muted/20 text-[11px] font-semibold uppercase tracking-wide text-muted">
            <tr>
              <th class="w-1/4 px-4 py-2 text-left"><USkeleton class="h-3 w-20" /></th>
              <th class="w-1/4 px-4 py-2 text-right"><USkeleton class="h-3 w-20" /></th>
              <th class="w-1/4 px-4 py-2 text-right"><USkeleton class="h-3 w-20" /></th>
              <th class="w-1/4 px-4 py-2 text-right"><USkeleton class="h-3 w-16" /></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default/60">
            <tr v-for="i in 3" :key="i" class="align-middle">
              <td class="px-2 py-2"><USkeleton class="h-4 w-32" /></td>
              <td class="px-2 py-2 text-right"><USkeleton class="h-4 w-20 ml-auto" /></td>
              <td class="px-2 py-2 text-right"><USkeleton class="h-4 w-20 ml-auto" /></td>
              <td class="px-2 py-2 text-right"><USkeleton class="h-4 w-8 ml-auto" /></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="md:hidden divide-y divide-default/60">
        <div v-for="i in 3" :key="i" class="px-4 py-4 space-y-3">
          <USkeleton class="h-4 w-32" />
          <div class="grid grid-cols-2 gap-3">
            <USkeleton class="h-4 w-full" />
            <USkeleton class="h-4 w-full" />
          </div>
          <USkeleton class="h-8 w-16 ml-auto" />
        </div>
      </div>
    </div>

    <div v-else-if="hasItems">
      <div class="hidden md:block">
        <table class="min-w-full table-fixed divide-y divide-default/60">
          <thead class="bg-muted/20 text-[11px] font-semibold uppercase tracking-wide text-muted">
            <tr>
              <th class="px-4 py-2 text-left" :class="props.showLocationColumn ? 'w-1/4' : 'w-1/3'">Cost Code</th>
              <th v-if="props.showLocationColumn" class="w-1/5 px-4 py-2 text-left">Location</th>
              <th v-if="props.showLocationColumn" class="w-1/5 px-4 py-2 text-left">Description</th>
              <th class="px-4 py-2 text-right" :class="props.showLocationColumn ? 'w-1/6' : 'w-1/4'">PO Amount</th>
              <th class="px-4 py-2 text-right" :class="props.showLocationColumn ? 'w-1/6' : 'w-1/4'">CO Amount</th>
              <th class="w-[64px] px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default/60 text-sm text-default">
            <tr
              v-for="(row, index) in displayRows"
              :key="row.id || `${row.cost_code_uuid || ''}-${row.location_uuid || index}`"
              class="align-middle"
            >
              <td class="px-2 py-2">
                <div class="text-xs">
                  <div class="font-medium truncate">{{ row.cost_code_label || `${row.cost_code_number} ${row.cost_code_name}`.trim() }}</div>
                  <div v-if="row.division_name" class="text-[11px] text-muted uppercase tracking-wide mt-0.5">
                    {{ row.division_name }}
                  </div>
                </div>
              </td>
              <td v-if="props.showLocationColumn" class="px-2 py-2 align-middle text-xs text-default">
                <LocationSelect
                  :model-value="row.location_uuid ?? undefined"
                  size="xs"
                  class-name="w-full"
                  :disabled="props.readonly"
                  @update:model-value="(value) => emitLocationChange(index, value as string | undefined)"
                  @change="(option) => emitLocationChange(index, option?.value as string | undefined, option)"
                />
              </td>
              <td v-if="props.showLocationColumn" class="px-2 py-2 align-top text-xs text-default max-w-xs">
                <textarea
                  :value="row.description || ''"
                  class="w-full min-h-[56px] max-h-28 rounded-md border border-default bg-background dark:bg-gray-900/60 px-2 py-1.5 text-[12px] leading-snug text-default/90 resize-y outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 disabled:opacity-70"
                  placeholder="Enter description"
                  :disabled="props.readonly"
                  @input="(event) => onDescriptionInput(index, (event.target as HTMLTextAreaElement).value)"
                />
              </td>
              <td class="px-2 py-2 text-right">
                <span class="font-mono text-sm">{{ formatCurrency(row.po_amount || 0) }}</span>
              </td>
              <td class="px-2 py-2 text-right">
                <div class="flex items-center justify-end rounded-md border border-default bg-background dark:bg-gray-900/60 px-3 py-1.5 text-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/40">
                  <div class="flex items-center gap-0 shrink-0">
                    <span class="text-xs font-semibold text-default">{{ currencySymbolText }}</span>
                    <input
                      :value="drafts[index]?.coAmountInput ?? toInputString(row.co_amount)"
                      inputmode="decimal"
                      class="min-w-[3ch] bg-transparent text-right font-mono leading-none outline-none border-none focus:outline-none pl-0"
                      :size="Math.max((drafts[index]?.coAmountInput?.length || toInputString(row.co_amount).length || 3), 3)"
                      :disabled="props.readonly"
                      @keydown="preventNonNumericKeydown"
                      @paste="preventNonNumericPaste"
                      @input="(event) => onCoAmountInput(index, (event.target as HTMLInputElement).value)"
                    />
                  </div>
                </div>
              </td>
              <td class="px-2 py-2 text-right">
                <slot name="actions" :row="row" :index="index">
                  <UButton
                    icon="i-heroicons-minus"
                    variant="soft"
                    color="error"
                    size="xs"
                    class="shrink-0"
                    :disabled="props.readonly"
                    @click.stop="emitRemoveRow(index)"
                  />
                </slot>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="md:hidden divide-y divide-default/60">
        <div
          v-for="(row, index) in displayRows"
          :key="row.id || `${row.cost_code_uuid || ''}-${row.location_uuid || index}`"
          class="px-4 py-4 space-y-3"
        >
          <div class="text-xs">
            <div class="font-semibold text-default">{{ row.cost_code_label || `${row.cost_code_number} ${row.cost_code_name}`.trim() }}</div>
            <div v-if="row.division_name" class="text-[11px] text-muted uppercase tracking-wide mt-1">
              {{ row.division_name }}
            </div>
          </div>

          <div v-if="props.showLocationColumn" class="mt-2 space-y-1 text-xs text-default">
            <div>
              <span class="block text-[11px] uppercase tracking-wide text-muted/80">Location</span>
              <span class="block">
                {{ row.location_label || row.location_uuid || '—' }}
              </span>
            </div>
            <div>
              <span class="block text-[11px] uppercase tracking-wide text-muted/80">Description</span>
              <textarea
                :value="row.description || ''"
                class="w-full min-h-[56px] max-h-28 rounded-md border border-default bg-background dark:bg-gray-900/60 px-2 py-1.5 text-[12px] leading-snug text-default/90 resize-y outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 disabled:opacity-70"
                placeholder="Enter description"
                :disabled="props.readonly"
                @input="(event) => onDescriptionInput(index, (event.target as HTMLTextAreaElement).value)"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 text-xs text-default mt-3">
            <div>
              <span class="block text-[11px] uppercase tracking-wide text-muted/80">PO Amount</span>
              <div class="font-mono">{{ formatCurrency(row.po_amount || 0) }}</div>
            </div>
            <div>
              <span class="block text-[11px] uppercase tracking-wide text-muted/80">CO Amount</span>
              <div class="flex items-center justify-end rounded-md border border-default bg-background dark:bg-gray-900/60 px-3 py-1.5 text-sm">
                <div class="flex items-center gap-0 shrink-0">
                  <span class="text-[11px] font-semibold text-default">{{ currencySymbolText }}</span>
                  <input
                    :value="drafts[index]?.coAmountInput ?? toInputString(row.co_amount)"
                    inputmode="decimal"
                    class="min-w-[3ch] bg-transparent text-right font-mono leading-none outline-none border-none focus:outline-none pl-0"
                    :size="Math.max((drafts[index]?.coAmountInput?.length || toInputString(row.co_amount).length || 3), 3)"
                    :disabled="props.readonly"
                    @keydown="preventNonNumericKeydown"
                    @paste="preventNonNumericPaste"
                    @input="(event) => onCoAmountInput(index, (event.target as HTMLInputElement).value)"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <slot name="actions" :row="row" :index="index">
              <UButton
                icon="i-heroicons-minus"
                variant="soft"
                color="error"
                size="xs"
                :disabled="props.readonly"
                @click.stop="emitRemoveRow(index)"
              />
            </slot>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="px-4 py-6 text-sm text-muted text-center">
      {{ emptyMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, unref, watch } from 'vue'
import { useCurrencyFormat } from '~/composables/useCurrencyFormat'
import LocationSelect from '~/components/shared/LocationSelect.vue'

interface LaborCOItemDisplay {
  id?: string | number
  cost_code_uuid?: string | null
  cost_code_number?: string | null
  cost_code_name?: string | null
  cost_code_label?: string | null
  division_name?: string | null
  po_amount?: number | null
  co_amount?: number | null
  [key: string]: any
}

const props = withDefaults(defineProps<{
  title?: string
  description?: string
  items: LaborCOItemDisplay[]
  loading?: boolean
  error?: string | null
  loadingMessage?: string
  emptyMessage?: string
  readonly?: boolean
  showLocationColumn?: boolean
}>(), {
  title: 'Labor Change Order Items',
  description: 'Original purchase order amounts shown for reference. Enter change order amounts.',
  items: () => [],
  loading: false,
  error: null,
  loadingMessage: 'Loading labor items…',
  emptyMessage: 'No labor items found.',
  readonly: false,
  showLocationColumn: true,
})

const emit = defineEmits<{
  (e: 'co-amount-change', payload: { index: number; value: string | number | null | undefined; numericValue: number }): void
  (e: 'remove-row', index: number): void
  (e: 'location-change', payload: { index: number; value: string | null; option?: any }): void
  (e: 'description-change', payload: { index: number; value: string }): void
}>()

const hasItems = computed(() => Array.isArray(props.items) && props.items.length > 0)
const { formatCurrency, currencySymbol } = useCurrencyFormat()
const currencySymbolText = computed(() => unref(currencySymbol) || '')

const parseNumericInput = (value: any): number => {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }
  const normalized = String(value).replace(/,/g, '').trim()
  if (!normalized) return 0
  const numeric = Number(normalized)
  return Number.isFinite(numeric) ? numeric : 0
}

const sanitizeNumericDecimalInput = (value: string): string => {
  const raw = String(value ?? '').replace(/,/g, '')
  let result = ''
  let hasDot = false
  for (const ch of raw) {
    if (ch >= '0' && ch <= '9') {
      result += ch
      continue
    }
    if (ch === '.' && !hasDot) {
      result += ch
      hasDot = true
    }
  }
  return result
}

const preventNonNumericKeydown = (event: KeyboardEvent) => {
  if (event.ctrlKey || event.metaKey || event.altKey) return
  const allowedKeys = new Set([
    'Backspace',
    'Delete',
    'Tab',
    'Enter',
    'Escape',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Home',
    'End',
  ])
  if (allowedKeys.has(event.key)) return

  const isDigit = /^[0-9]$/.test(event.key)
  const isDot = event.key === '.'
  if (!isDigit && !isDot) {
    event.preventDefault()
    return
  }

  if (isDot) {
    const input = event.target as HTMLInputElement | null
    if (input?.value?.includes('.')) {
      event.preventDefault()
    }
  }
}

const preventNonNumericPaste = (event: ClipboardEvent) => {
  const text = event.clipboardData?.getData('text') ?? ''
  const sanitized = sanitizeNumericDecimalInput(text).trim()
  if (sanitized !== text.trim()) {
    event.preventDefault()
  }
}

const toInputString = (value: any): string => {
  if (value === null || value === undefined) return ''
  return typeof value === 'number' ? String(value) : String(value)
}

const formatCurrencyInput = (value: any): string => {
  const formatted = formatCurrency(value)
  const symbol = currencySymbolText.value
  if (typeof formatted !== 'string') {
    return String(formatted ?? '')
  }
  if (symbol && formatted.startsWith(symbol)) {
    return formatted.slice(symbol.length).trimStart()
  }
  return formatted
}

const drafts = reactive<Record<number, { coAmountInput: string }>>({})

const getRowKey = (row: LaborCOItemDisplay | undefined, index: number): string => {
  if (!row) return `__missing-${index}`
  if (row.id != null && row.id !== '') return String(row.id)
  return `${row.cost_code_uuid ?? ''}-${row.location_uuid ?? index}`
}

const hasStructuralItemsChange = (
  items: LaborCOItemDisplay[],
  prevItems: LaborCOItemDisplay[] | undefined
): boolean => {
  if (!prevItems) return true
  if (items.length !== prevItems.length) return true
  return items.some((row, i) => getRowKey(row, i) !== getRowKey(prevItems[i], i))
}

watch(
  () => props.items,
  (items, prevItems) => {
    const list = items || []
    const prev = prevItems || []

    if (hasStructuralItemsChange(list, prevItems)) {
      for (const key of Object.keys(drafts)) {
        delete drafts[Number(key)]
      }
      list.forEach((row, index) => {
        drafts[index] = { coAmountInput: toInputString(row.co_amount) }
      })
      return
    }

    list.forEach((row, index) => {
      const prevRow = prev[index]
      const d = drafts[index] || (drafts[index] = { coAmountInput: toInputString(row.co_amount) })
      const prevPropAmount = toInputString(prevRow?.co_amount)
      const newPropAmount = toInputString(row.co_amount)
      if (d.coAmountInput === prevPropAmount) {
        d.coAmountInput = newPropAmount
      }
    })
  },
  { deep: true }
)

const displayRows = computed(() => {
  return (props.items || []).map((row, index) => {
    // ensure draft cache exists
    const d = drafts[index] || (drafts[index] = {
      coAmountInput: toInputString(row.co_amount),
    })
    // keep drafts in sync if untouched
    if (d.coAmountInput === '' && toInputString(row.co_amount) !== '') {
      d.coAmountInput = toInputString(row.co_amount)
    }
    return row
  })
})

const onCoAmountInput = (index: number, value: string | number | null | undefined) => {
  if (props.readonly) return
  const d = drafts[index] || (drafts[index] = { coAmountInput: '' })
  d.coAmountInput = sanitizeNumericDecimalInput(toInputString(value))
  const numericValue = parseNumericInput(d.coAmountInput)
  emit('co-amount-change', { index, value: d.coAmountInput, numericValue })
}

const emitRemoveRow = (index: number) => {
  if (props.readonly) return
  emit('remove-row', index)
}

const emitLocationChange = (index: number, value?: string, option?: any) => {
  if (props.readonly) return
  emit('location-change', { index, value: value ?? null, option })
}

const onDescriptionInput = (index: number, value: string) => {
  if (props.readonly) return
  emit('description-change', { index, value: value ?? '' })
}
</script>

<style scoped>
</style>

