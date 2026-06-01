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
      <span v-if="hasItems" class="text-[11px] font-medium text-muted uppercase tracking-wide">
        {{ items.length }} items
      </span>
    </div>

    <div v-if="error" class="px-4 py-3 text-xs text-error-700 bg-error-50/80 dark:bg-error-900/20 border-b border-error-200">
      {{ error }}
    </div>

    <div v-else-if="loading" class="px-4 py-6 text-sm text-muted text-center">
      Loading location-wise material items…
    </div>

    <div v-else-if="hasItems">
      <!-- Desktop -->
      <div class="hidden md:block overflow-x-auto">
        <table class="min-w-full table-fixed divide-y divide-default/60">
          <thead class="bg-muted/20 text-[11px] font-semibold uppercase tracking-wide text-muted">
            <tr>
              <th class="px-4 py-2 text-left w-[22%]">Cost Code</th>
              <th class="px-4 py-2 text-left w-[14%]">Location</th>
              <th class="px-4 py-2 text-left w-[12%]">Description</th>
              <th v-if="showBudgetedAmount" class="px-4 py-2 text-right w-[13%]">Budgeted</th>
              <th class="px-4 py-2 text-right w-[13%]">{{ orderAmountLabel }}</th>
              <th class="px-4 py-2 text-right w-[13%]">Previously Invoiced</th>
              <th class="px-4 py-2 text-right w-[13%]">Invoice Amount</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default/60 text-sm text-default">
            <tr
              v-for="(item, index) in items"
              :key="item.po_lwm_uuid || item.co_lwm_uuid || `lwm-inv-${index}`"
              class="align-middle transition-colors duration-150"
            >
              <td class="px-4 py-2 align-middle">
                <div class="flex flex-col min-w-0">
                  <span class="text-xs font-medium text-default truncate">
                    {{ item.cost_code_label || '—' }}
                  </span>
                  <span
                    v-if="item.division_name"
                    class="text-[11px] text-muted uppercase tracking-wide truncate"
                  >
                    {{ item.division_name }}
                  </span>
                </div>
              </td>
              <td class="px-4 py-2 align-middle text-xs">
                {{ item.location_label || '—' }}
              </td>
              <td class="px-4 py-2 align-middle text-xs text-muted">
                {{ item.description || '—' }}
              </td>
              <td v-if="showBudgetedAmount" class="px-4 py-2 text-right align-middle">
                <span class="font-mono text-xs">
                  {{ currencySymbolText }}{{ formatAmount(item.material_budgeted_amount) }}
                </span>
              </td>
              <td class="px-4 py-2 text-right align-middle">
                <span class="font-mono text-xs font-medium">
                  {{ currencySymbolText }}{{ formatAmount(orderAmount(item)) }}
                </span>
              </td>
              <td class="px-4 py-2 text-right align-middle">
                <span class="font-mono text-xs text-muted">
                  {{ currencySymbolText }}{{ formatAmount(item.previously_invoiced || 0) }}
                </span>
              </td>
              <td class="px-4 py-2 text-right align-middle">
                <div class="w-full max-w-[160px] ml-auto">
                  <CurrencyInput
                    :model-value="invoiceDrafts[index] ?? toInputString(item.invoice_amount)"
                    inputmode="decimal"
                    :disabled="readonly"
                    size="sm"
                    :corporation-uuid="corporationUuid"
                    @update:model-value="(value) => handleInvoiceAmountChange(index, value)"
                  />
                  <div
                    v-if="isOverInvoiced(item, index)"
                    class="mt-1 text-[10px] font-medium text-warning-600 dark:text-warning-400"
                  >
                    Exceeds balance by {{ currencySymbolText }}{{ formatAmount(getOverAmount(item, index)) }}
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
          <tfoot class="bg-muted/10 border-t border-default/70">
            <tr>
              <td :colspan="showBudgetedAmount ? 4 : 3" class="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-muted">
                Total
              </td>
              <td class="px-4 py-2 text-right">
                <span class="font-mono text-xs font-semibold">
                  {{ currencySymbolText }}{{ formatAmount(totalOrderAmount) }}
                </span>
              </td>
              <td class="px-4 py-2 text-right">
                <span class="font-mono text-xs text-muted">
                  {{ currencySymbolText }}{{ formatAmount(totalPreviouslyInvoiced) }}
                </span>
              </td>
              <td class="px-4 py-2 text-right">
                <span class="font-mono text-xs font-semibold text-primary-600 dark:text-primary-400">
                  {{ currencySymbolText }}{{ formatAmount(totalInvoiceAmount) }}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Mobile -->
      <div class="md:hidden divide-y divide-default/60">
        <div
          v-for="(item, index) in items"
          :key="item.po_lwm_uuid || item.co_lwm_uuid || `lwm-inv-m-${index}`"
          class="px-4 py-4 space-y-3"
        >
          <div class="space-y-1">
            <span class="block text-[11px] uppercase tracking-wide text-muted/80">Cost Code</span>
            <span class="text-xs font-medium text-default">{{ item.cost_code_label || '—' }}</span>
            <span v-if="item.division_name" class="block text-[11px] text-muted uppercase tracking-wide">
              {{ item.division_name }}
            </span>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <span class="block text-[11px] uppercase tracking-wide text-muted/80">Location</span>
              <span class="text-xs">{{ item.location_label || '—' }}</span>
            </div>
            <div class="space-y-1">
              <span class="block text-[11px] uppercase tracking-wide text-muted/80">{{ orderAmountLabel }}</span>
              <span class="font-mono text-xs font-medium">
                {{ currencySymbolText }}{{ formatAmount(orderAmount(item)) }}
              </span>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <span class="block text-[11px] uppercase tracking-wide text-muted/80">Previously Invoiced</span>
              <span class="font-mono text-xs text-muted">
                {{ currencySymbolText }}{{ formatAmount(item.previously_invoiced || 0) }}
              </span>
            </div>
            <div class="space-y-1">
              <span class="block text-[11px] uppercase tracking-wide text-muted/80">Invoice Amount</span>
              <CurrencyInput
                :model-value="invoiceDrafts[index] ?? toInputString(item.invoice_amount)"
                inputmode="decimal"
                :disabled="readonly"
                size="sm"
                :corporation-uuid="corporationUuid"
                @update:model-value="(value) => handleInvoiceAmountChange(index, value)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="px-4 py-6 text-sm text-muted text-center">
      No location-wise material items found.
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, watch, unref } from 'vue'
import { useCurrencyFormat } from '~/composables/useCurrencyFormat'
import CurrencyInput from '~/components/shared/CurrencyInput.vue'

interface LwmInvoiceItem {
  po_lwm_uuid?: string | null
  co_lwm_uuid?: string | null
  cost_code_uuid?: string | null
  cost_code_label?: string
  cost_code_number?: string
  cost_code_name?: string
  division_name?: string | null
  location_uuid?: string | null
  location_label?: string | null
  material_budgeted_amount?: number | null
  po_amount?: number | null
  co_amount?: number | null
  invoice_amount?: number | null
  previously_invoiced?: number | null
  description?: string | null
}

const props = withDefaults(defineProps<{
  title?: string
  description?: string
  items: LwmInvoiceItem[]
  loading?: boolean
  error?: string | null
  readonly?: boolean
  corporationUuid?: string
  showBudgetedAmount?: boolean
  mode?: 'po' | 'co'
}>(), {
  title: 'Location-wise Material Items',
  description: '',
  items: () => [],
  loading: false,
  error: null,
  readonly: false,
  corporationUuid: undefined,
  showBudgetedAmount: true,
  mode: 'po',
})

const emit = defineEmits<{
  (e: 'invoice-amount-change', payload: { index: number; value: string | number | null | undefined; numericValue: number }): void
}>()

const { formatCurrency, currencySymbol } = useCurrencyFormat()
const currencySymbolText = computed(() => unref(currencySymbol) || '')

const hasItems = computed(() => Array.isArray(props.items) && props.items.length > 0)
const orderAmountLabel = computed(() => props.mode === 'co' ? 'CO Amount' : 'PO Amount')

const orderAmount = (item: LwmInvoiceItem) =>
  props.mode === 'co' ? (item.co_amount ?? 0) : (item.po_amount ?? 0)

const parseNumericInput = (value: any): number => {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const normalized = String(value).replace(/,/g, '').trim()
  if (!normalized) return 0
  const numeric = Number(normalized)
  return Number.isFinite(numeric) ? numeric : 0
}

const toInputString = (value: any): string => {
  if (value === null || value === undefined) return ''
  return String(value)
}

const formatAmount = (value: any): string => {
  const formatted = formatCurrency(value)
  const symbol = currencySymbolText.value
  if (typeof formatted !== 'string') return String(formatted ?? '')
  if (symbol && formatted.startsWith(symbol)) return formatted.slice(symbol.length).trimStart()
  return formatted
}

const invoiceDrafts = reactive<Record<number, string>>({})

watch(
  () => props.items,
  (newItems = []) => {
    newItems.forEach((item, index) => {
      if (invoiceDrafts[index] === undefined) {
        invoiceDrafts[index] = toInputString(item.invoice_amount)
      }
    })
    Object.keys(invoiceDrafts).forEach((key) => {
      const idx = Number(key)
      if (!Number.isNaN(idx) && !newItems[idx]) delete invoiceDrafts[idx]
    })
  },
  { immediate: true },
)

const handleInvoiceAmountChange = (index: number, value: string | number | null | undefined) => {
  invoiceDrafts[index] = toInputString(value)
  const numericValue = parseNumericInput(value)
  emit('invoice-amount-change', { index, value, numericValue })
}

const isOverInvoiced = (item: LwmInvoiceItem, index: number): boolean => {
  const order = orderAmount(item)
  const prev = parseNumericInput(item.previously_invoiced)
  const balance = order - prev
  const draft = invoiceDrafts[index]
  const current = draft !== undefined ? parseNumericInput(draft) : parseNumericInput(item.invoice_amount)
  return current > balance && balance >= 0
}

const getOverAmount = (item: LwmInvoiceItem, index: number): number => {
  const order = orderAmount(item)
  const prev = parseNumericInput(item.previously_invoiced)
  const balance = order - prev
  const draft = invoiceDrafts[index]
  const current = draft !== undefined ? parseNumericInput(draft) : parseNumericInput(item.invoice_amount)
  return Math.max(0, current - balance)
}

const totalOrderAmount = computed(() =>
  props.items.reduce((sum, item) => sum + parseNumericInput(orderAmount(item)), 0)
)

const totalPreviouslyInvoiced = computed(() =>
  props.items.reduce((sum, item) => sum + parseNumericInput(item.previously_invoiced), 0)
)

const totalInvoiceAmount = computed(() =>
  props.items.reduce((sum, item, index) => {
    const draft = invoiceDrafts[index]
    return sum + (draft !== undefined ? parseNumericInput(draft) : parseNumericInput(item.invoice_amount))
  }, 0)
)
</script>
