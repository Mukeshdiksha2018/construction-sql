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
      <div v-if="hasItems" class="flex items-center gap-3 ml-auto">
        <span class="text-[11px] font-medium text-muted uppercase tracking-wide">
          {{ items.length }} items
        </span>
      </div>
    </div>

    <div v-if="error" class="px-4 py-3 text-xs text-error-700 bg-error-50/80 dark:bg-error-900/20 border-b border-error-200">
      {{ error }}
    </div>

    <div v-else-if="loading" class="px-4 py-6 text-sm text-muted text-center">
      {{ loadingMessage }}
    </div>

    <div v-else-if="hasItems" :key="`items-${items.length}`">
      <div class="hidden md:block">
        <table class="min-w-full table-fixed divide-y divide-default/60">
          <thead class="bg-muted/20 text-[11px] font-semibold uppercase tracking-wide text-muted">
            <tr>
              <th class="px-4 py-2 text-left">Cost Code</th>
              <th v-if="hasLocationBreakdown" class="px-4 py-2 text-left">Location</th>
              <th class="px-4 py-2 text-left">Description</th>
              <th class="px-4 py-2 text-left">Original Amount</th>
              <th class="px-4 py-2 text-left">Previously Invoiced</th>
              <th class="px-4 py-2 text-left">Remaining Amount</th>
              <th class="px-4 py-2 text-right">Invoice Amount</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default/60 text-sm text-default">
            <tr
              v-for="(item, index) in items"
              :key="item.uuid"
              :class="[
                'align-middle transition-colors duration-150',
                hasOverInvoicedAmount(item) ? 'bg-error-50/50 dark:bg-error-900/20 border-l-4 border-error-500' : ''
              ]"
            >
              <!-- Cost Code -->
              <td class="px-4 py-2 align-middle">
                <div class="flex flex-col">
                  <span class="text-xs font-medium text-default">
                    {{ costCodeDisplay(item) }}
                  </span>
                </div>
              </td>

              <!-- Location -->
              <td v-if="hasLocationBreakdown" class="px-4 py-2 align-middle">
                <span class="text-xs text-default">
                  {{ locationDisplay(item) }}
                </span>
              </td>

              <!-- Description -->
              <td class="px-4 py-2 align-middle text-muted text-xs">
                {{ item.description || 'Labor cost code item' }}
              </td>

              <!-- Original Amount -->
              <td class="px-4 py-2 align-middle">
                <div class="text-xs font-medium text-default">
                  {{ formatCurrency(originalAmount(item)) }}
                </div>
              </td>

              <!-- Previously Paid -->
              <td class="px-4 py-2 align-middle">
                <div class="text-xs font-medium text-default">
                  {{ formatCurrency(previouslyInvoicedAmount(item)) }}
                </div>
              </td>

              <!-- Remaining Amount -->
              <td class="px-4 py-2 align-middle">
                <div class="text-xs font-medium text-default">
                  {{ formatCurrency(remainingAmount(item)) }}
                </div>
              </td>

              <!-- Invoice Amount -->
              <td class="px-4 py-2 align-middle">
                <div class="relative">
                  <span
                    class="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-default pointer-events-none z-10"
                  >
                    {{ currencySymbolText }}
                  </span>
                  <UInput
                    :model-value="item.invoice_amount !== null && item.invoice_amount !== undefined ? String(item.invoice_amount) : ''"
                    type="number"
                    step="1"
                    min="0"
                    :max="remainingAmount(item).toString()"
                    pattern="[0-9.]*"
                    inputmode="decimal"
                    size="xs"
                    :disabled="readonly"
                    class="w-full text-right pl-6"
                    @keydown="preventNonNumericKeydown"
                    @paste="preventNonNumericPaste"
                    @update:model-value="onInvoiceAmountInput(index, $event)"
                  />
                  <div v-if="hasOverInvoicedAmount(item)" class="text-[10px] text-error-600 mt-1 text-right">
                    Exceeds remaining amount
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
          <tfoot v-if="items.length > 0" class="bg-muted/20 border-t border-default/60">
            <tr>
              <td :colspan="hasLocationBreakdown ? 6 : 5" class="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide">
                Total Invoice Amount
              </td>
              <td class="px-4 py-2 text-right">
                <span class="text-sm font-bold text-primary-600">
                  {{ formatCurrency(totalInvoiceAmount) }}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Mobile view -->
      <div class="md:hidden space-y-3 p-4">
        <div
          v-for="(item, index) in items"
          :key="item.uuid"
          class="border border-default/60 rounded-lg p-3"
          :class="[
            hasOverInvoicedAmount(item) ? 'border-error-300 bg-error-50/50 dark:bg-error-900/20' : ''
          ]"
        >
          <div class="flex justify-between items-start mb-2">
            <div class="flex-1">
              <div class="text-xs font-medium text-default mb-1">
                {{ costCodeDisplay(item) }}
              </div>
              <div v-if="hasLocationBreakdown" class="text-[10px] text-muted">
                Location: {{ locationDisplay(item) }}
              </div>
              <div class="text-[10px] text-muted">{{ item.description || 'Labor cost code item' }}</div>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-3 mb-3">
            <div>
              <label class="block text-[10px] font-medium text-muted uppercase tracking-wide mb-1">
                Original Amount
              </label>
              <div class="text-xs font-medium text-default">
                {{ formatCurrency(originalAmount(item)) }}
              </div>
            </div>
            <div>
              <label class="block text-[10px] font-medium text-muted uppercase tracking-wide mb-1">
                Previously Invoiced
              </label>
              <div class="text-xs font-medium text-default">
                {{ formatCurrency(previouslyInvoicedAmount(item)) }}
              </div>
            </div>
            <div>
              <label class="block text-[10px] font-medium text-muted uppercase tracking-wide mb-1">
                Remaining Amount
              </label>
              <div class="text-xs font-medium text-default">
                {{ formatCurrency(remainingAmount(item)) }}
              </div>
            </div>
          </div>

          <div class="mb-3">
            <label class="block text-[10px] font-medium text-muted uppercase tracking-wide mb-1">
              Invoice Amount
            </label>
            <div class="relative">
              <span
                class="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-default pointer-events-none z-10"
              >
                {{ currencySymbolText }}
              </span>
              <UInput
                :model-value="item.invoice_amount !== null && item.invoice_amount !== undefined ? String(item.invoice_amount) : ''"
                type="number"
                step="1"
                min="0"
                :max="remainingAmount(item)"
                pattern="[0-9.]*"
                inputmode="decimal"
                size="xs"
                :disabled="readonly"
                class="w-full text-right pl-6"
                @keydown="preventNonNumericKeydown"
                @paste="preventNonNumericPaste"
                @update:model-value="onInvoiceAmountInput(index, $event)"
              />
            </div>
          </div>

          <div v-if="hasOverInvoicedAmount(item)" class="text-[10px] text-error-600">
            Exceeds remaining amount
          </div>
        </div>

        <div v-if="items.length > 0" class="border-t border-default/60 pt-3">
          <div class="flex justify-between items-center">
            <span class="text-xs font-semibold uppercase tracking-wide text-muted">
              Total Invoice Amount
            </span>
            <span class="text-sm font-bold text-primary-600">
              {{ formatCurrency(totalInvoiceAmount) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="px-4 py-8 text-center">
      <UIcon name="i-heroicons-document-text" class="w-12 h-12 mx-auto text-muted mb-4" />
      <p class="text-muted text-sm">
        {{ emptyMessage }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLocationsStore } from '~/stores/locations'

// Props
const props = withDefaults(defineProps<{
  title: string
  description?: string
  items: any[]
  loading?: boolean
  error?: string | null
  readonly?: boolean
  loadingMessage?: string
  emptyMessage?: string
}>(), {
  loading: false,
  error: null,
  readonly: false,
  loadingMessage: 'Loading labor items...',
  emptyMessage: 'No labor items found',
})

// Emits
const emit = defineEmits<{
  'invoice-amount-change': [index: number, value: string | null]
}>()

// Composables
const { formatCurrency, currencySymbol } = useCurrencyFormat() as any
const locationsStore = useLocationsStore()
const currencySymbolText = computed(() => {
  const v = typeof currencySymbol === 'object' && currencySymbol?.value !== undefined
    ? currencySymbol.value
    : currencySymbol
  return String(v || '$')
})

// Computed
const hasItems = computed(() => props.items.length > 0)
const hasLocationBreakdown = computed(() =>
  props.items.some((item: any) => Boolean(item && (item.location_uuid || item.location_label)))
)

const totalInvoiceAmount = computed(() => {
  return props.items.reduce((total, item) => {
    const amount = parseFloat(item.invoice_amount || '0') || 0
    return total + amount
  }, 0)
})

const hasRemainingAmounts = computed(() => {
  return props.items.some(item => item.remaining_amount !== undefined && item.remaining_amount !== null)
})

// Methods
const originalAmount = (item: any): number => {
  // Return the original PO/CO amount - prioritize original_amount if available (from API)
  // For CO items: use po_amount + co_amount (total approved amount)
  // For PO items: use po_amount
  // Fall back to labor_budgeted_amount for estimate-based invoices
  if (item.original_amount !== undefined && item.original_amount !== null) {
    return parseFloat(item.original_amount) || 0
  }

  // CO labor line (change order): billable amount is the CO delta per row; po_amount is base PO allocation.
  if (item.co_amount !== undefined && item.co_amount !== null) {
    if (item.labor_co_item_uuid) {
      return parseFloat(item.co_amount || '0') || 0
    }
    const poAmount = parseFloat(item.po_amount || '0') || 0
    const coAmount = parseFloat(item.co_amount || '0') || 0
    return poAmount + coAmount
  }

  // For PO items, use po_amount
  if (item.po_amount !== undefined && item.po_amount !== null) {
    return parseFloat(item.po_amount) || 0
  }

  // Fallback to labor_budgeted_amount
  return parseFloat(item.labor_budgeted_amount || '0') || 0
}

const previouslyInvoicedAmount = (item: any): number => {
  // Return the total amount already invoiced (including pending invoices)
  return parseFloat(item.already_invoiced || '0') || 0
}

const remainingAmount = (item: any): number => {
  // Calculate remaining as original amount minus previously invoiced amount
  return Math.max(0, originalAmount(item) - previouslyInvoicedAmount(item))
}

const hasOverInvoicedAmount = (item: any): boolean => {
  if (props.readonly) return false

  const invoiceAmount = parseFloat(item.invoice_amount || '0') || 0
  const maxAmount = remainingAmount(item)

  return invoiceAmount > maxAmount
}

const emitInvoiceAmountChange = (index: number, value: string | null) => {
  emit('invoice-amount-change', index, value)
}

const onInvoiceAmountInput = (index: number, value: string | null) => {
  emitInvoiceAmountChange(index, value)
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
  if (!/^\d*\.?\d*$/.test(text.trim())) {
    event.preventDefault()
  }
}

const costCodeDisplay = (item: any): string => {
  if (!item) return ''
  if (item.cost_code_label) return item.cost_code_label
  return `${item.cost_code_number || ''} - ${item.cost_code_name || ''}`.trim()
}

const locationDisplay = (item: any): string => {
  if (!item) return '-'
  const rawLabel = item.location_label || item.location_name || item.location || ''
  const locationUuid = item.location_uuid || ''

  const looksLikeUuid = (value: string): boolean =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)

  const resolveName = (uuid: string): string => {
    if (!uuid) return ''
    const byGetter = locationsStore.getByUuid?.(uuid)
    if (byGetter?.location_name || byGetter?.name) return byGetter.location_name || byGetter.name

    const allLocations = (locationsStore as any).getAll || []
    const byList = Array.isArray(allLocations)
      ? allLocations.find((loc: any) => loc?.uuid === uuid)
      : null
    return byList?.location_name || byList?.name || ''
  }

  // Prefer explicit non-UUID labels first.
  if (rawLabel && !looksLikeUuid(String(rawLabel))) return String(rawLabel)

  // Resolve UUID (from dedicated field or fallback label) to a user-friendly location name.
  const uuidToResolve = locationUuid || (looksLikeUuid(String(rawLabel)) ? String(rawLabel) : '')
  const resolvedName = resolveName(uuidToResolve)
  if (resolvedName) return resolvedName

  return uuidToResolve || rawLabel || '-'
}

// Expose computed for parent component validation
defineExpose({
  totalInvoiceAmount,
  hasValidationError: () => props.items.some(item => hasOverInvoicedAmount(item))
})
</script>