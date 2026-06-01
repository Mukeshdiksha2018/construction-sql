<template>
  <!-- Only show if there are advance payments with adjustable amounts -->
  <div v-if="hasAdvancePaymentsToAdjust" class="mt-6">
    <div class="mb-4">
      <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Advance Payment Breakdown</h3>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <p class="mt-2 text-xs text-gray-500">Loading advance payments...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="rounded-md bg-error-50 dark:bg-error-900/20 p-4">
      <p class="text-xs text-error-600 dark:text-error-400">{{ error }}</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="(!purchaseOrderUuid && !changeOrderUuid) || advancePayments.length === 0" class="rounded-md bg-gray-50 dark:bg-gray-800/50 p-8 text-center">
      <UIcon name="i-heroicons-document-text" class="w-12 h-12 mx-auto text-gray-400 mb-4" />
      <p class="text-gray-500 text-xs">
        {{ (!purchaseOrderUuid && !changeOrderUuid) ? 'No purchase order or change order selected' : purchaseOrderUuid ? 'No advance payments found for this purchase order' : 'No advance payments found for this change order' }}
      </p>
    </div>

    <!-- Advance Payments Table -->
    <div v-else class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th class="px-1.5 py-1 text-left text-[10px] font-semibold uppercase tracking-wide leading-tight text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
              Invoice Number
            </th>
            <th class="px-1.5 py-1 text-left text-[10px] font-semibold uppercase tracking-wide leading-tight text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
              Invoice Date
            </th>
            <th class="px-1.5 py-1 text-left text-[10px] font-semibold uppercase tracking-wide leading-tight text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
              Status
            </th>
            <th class="px-1.5 py-1 text-left text-[10px] font-semibold uppercase tracking-wide leading-tight text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
              Cost code
            </th>
            <th class="px-1.5 py-1 text-right text-[10px] font-semibold uppercase tracking-wide leading-tight text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
              Advance Paid Amount
            </th>
            <th v-if="hasPreviouslyAdjustedCostCodes && showAdjustmentInputs && !isInvoiceSaved" class="px-1.5 py-1 text-left text-[10px] font-semibold uppercase tracking-wide leading-tight text-blue-700 dark:text-blue-400 border-b border-gray-200 dark:border-gray-700">
              Remaining to be Adjusted
            </th>
            <th v-if="showAdjustmentInputs" class="px-1.5 py-1 text-left text-[10px] font-semibold uppercase tracking-wide leading-tight text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
              Adjust Amount
            </th>
            <th class="px-1.5 py-1 text-left text-[10px] font-semibold uppercase tracking-wide leading-tight text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
              Total Amount
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          <tr
            v-for="row in tbodyRows"
            :key="row.key"
            :class="[
              'hover:bg-gray-50 dark:hover:bg-gray-800/50',
              hasOverAdjustedAmount(row.payment) ? 'bg-error-50/50 dark:bg-error-900/20 border-l-4 border-error-500' : ''
            ]"
          >
            <!-- Invoice Number (rowspan per advance invoice) -->
            <td
              v-if="row.lineIdx === 0"
              class="px-1.5 py-1 text-xs text-gray-900 dark:text-gray-100 align-middle"
              :rowspan="rowspanForInvoiceBlock(row)"
            >
              {{ row.payment.number || 'N/A' }}
            </td>

            <!-- Invoice Date -->
            <td
              v-if="row.lineIdx === 0"
              class="px-1.5 py-1 text-xs text-gray-700 dark:text-gray-300 align-middle"
              :rowspan="rowspanForInvoiceBlock(row)"
            >
              {{ formatDate(row.payment.bill_date) }}
            </td>

            <!-- Status -->
            <td
              v-if="row.lineIdx === 0"
              class="px-1.5 py-1 align-middle"
              :rowspan="rowspanForInvoiceBlock(row)"
            >
                <UBadge
                :color="getStatusColor(row.payment.is_active)"
                variant="soft"
                size="xs"
              >
                {{ row.payment.is_active ? 'Active' : 'Inactive' }}
              </UBadge>
            </td>

            <!-- Cost code label (one row per cost code / tax line) -->
            <td class="px-1.5 py-1 text-xs text-gray-900 dark:text-gray-100">
              <template v-if="row.line === null">
                <span class="text-xs text-gray-400">No cost codes</span>
              </template>
              <template v-else-if="row.line.kind === 'cost'">
                <span class="font-medium text-gray-800 dark:text-gray-200">
                  {{ costCodeDisplayLabel(row.line.costCode) }}
                </span>
              </template>
              <template v-else>
                <span class="font-medium text-gray-800 dark:text-gray-200">
                  {{ row.line.taxLine.label }}
                </span>
              </template>
            </td>

            <!-- Advance Paid Amount -->
            <td class="px-1.5 py-1 text-xs text-right text-gray-800 dark:text-gray-200">
              <template v-if="row.line === null">
                <span class="text-xs text-gray-400">—</span>
              </template>
              <template v-else-if="row.line.kind === 'cost'">
                {{ formatCurrency(row.line.costCode.advance_amount || row.line.costCode.advanceAmount || 0) }}
              </template>
              <template v-else>
                {{ formatCurrency(row.line.taxLine.amount) }}
              </template>
            </td>

            <!-- Remaining to be Adjusted -->
            <td
              v-if="hasPreviouslyAdjustedCostCodes && showAdjustmentInputs && !isInvoiceSaved"
              class="px-1.5 py-1 text-xs"
            >
              <template v-if="row.line === null">
                <span class="text-xs text-gray-400">—</span>
              </template>
              <template v-else-if="row.line.kind === 'cost'">
                <span class="font-medium text-blue-600 dark:text-blue-400">
                  {{ formatCurrency(getRemainingAmount(row.payment.uuid, row.line.costCode)) }}
                </span>
              </template>
              <template v-else>
                <span class="font-medium text-blue-600 dark:text-blue-400">
                  {{ formatCurrency(getRemainingTaxLineBeforeCurrent(row.payment, row.payment.uuid, row.line.taxLine)) }}
                </span>
              </template>
            </td>

            <!-- Adjust Amount -->
            <td v-if="showAdjustmentInputs" class="px-1.5 py-1">
              <template v-if="row.line === null">
                <span class="text-xs text-gray-400">—</span>
              </template>
              <template v-else-if="row.line.kind === 'cost'">
                <div class="flex items-center justify-end gap-2 flex-wrap">
                  <UInput
                    :model-value="getAdjustedAmount(row.payment.uuid, row.line.costCode.cost_code_uuid || row.line.costCode.uuid)"
                    type="number"
                    step="1"
                    min="0"
                    pattern="[0-9.]*"
                    inputmode="decimal"
                    :max="getRemainingAmount(row.payment.uuid, row.line.costCode)"
                    placeholder="0.00"
                    size="xs"
                    class="w-24"
                    :disabled="readonly || isInvoiceSaved"
                    @keypress="(e: KeyboardEvent) => { if (e.key && !/[0-9.]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Tab') e.preventDefault(); }"
                    @update:model-value="handleAdjustedAmountChange(row.payment.uuid, row.line.costCode, $event)"
                  />
                  <span class="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    / {{ formatCurrency(getRemainingAfterAdjustment(row.payment.uuid, row.line.costCode)) }}
                  </span>
                </div>
              </template>
              <template v-else>
                <div class="flex items-center justify-end gap-2 flex-wrap">
                  <UInput
                    :model-value="getAdjustedAmount(row.payment.uuid, taxAdjustmentKey(row.line.taxLine.key))"
                    type="number"
                    step="1"
                    min="0"
                    pattern="[0-9.]*"
                    inputmode="decimal"
                    :max="getRemainingTaxLineBeforeCurrent(row.payment, row.payment.uuid, row.line.taxLine)"
                    placeholder="0.00"
                    size="xs"
                    class="w-24"
                    :disabled="readonly || isInvoiceSaved"
                    @keypress="(e: KeyboardEvent) => { if (e.key && !/[0-9.]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Tab') e.preventDefault(); }"
                    @update:model-value="handleTaxLineAdjustedChange(row.payment.uuid, row.line.taxLine, $event)"
                  />
                  <span class="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    / {{ formatCurrency(getRemainingAfterTaxLineAdjustment(row.payment, row.payment.uuid, row.line.taxLine)) }}
                  </span>
                </div>
              </template>
            </td>

            <!-- Total Amount: one cell per line (cost advance + tax lines); same sign convention as invoice total -->
            <td class="px-1.5 py-1 text-right align-top">
              <div class="text-xs font-semibold text-red-600 dark:text-red-400">
                {{ formatCurrency(-getLineAmountTowardInvoiceTotal(row.payment, row.line)) }}
              </div>
            </td>
          </tr>
        </tbody>
        <tfoot v-if="advancePayments.length > 0" class="bg-gray-50 dark:bg-gray-800">
          <tr>
            <td :colspan="footerColspan" class="px-1.5 py-1 text-xs font-semibold text-gray-900 dark:text-gray-100 text-right">
              Total Advance Paid:
            </td>
            <td class="px-1.5 py-1 text-xs font-bold text-red-600 dark:text-red-400 text-right">
              {{ formatCurrency(-totalAdvancePaidWithTaxes) }}
            </td>
          </tr>
          <tr v-if="showAdjustmentInputs">
            <td :colspan="footerColspan" class="px-1.5 py-1 text-xs font-semibold text-gray-900 dark:text-gray-100 text-right">
              Total Adjusted:
            </td>
            <td class="px-1.5 py-1 text-xs font-bold text-primary-600 dark:text-primary-400 text-right">
              {{ formatCurrency(totalAdjustedAmount) }}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useDateFormat } from '~/composables/useDateFormat'
import { useCurrencyFormat } from '~/composables/useCurrencyFormat'
import { taxAdjustmentKey } from '~/utils/advancePaymentTaxAdjustmentKeys'

interface PreviouslyAdjustedCostCode {
  cost_code_uuid: string
  cost_code_label?: string
  cost_code_number?: string
  cost_code_name?: string
  adjusted_amount: number
  advance_payment_uuid: string
}

interface Props {
  purchaseOrderUuid?: string | null
  changeOrderUuid?: string | null
  currentInvoiceUuid?: string | null
  showAdjustmentInputs?: boolean
  readonly?: boolean
  adjustedAmounts?: Record<string, Record<string, number>> // Map of advancePaymentUuid -> costCodeUuid -> adjustedAmount
  previouslyAdjustedCostCodes?: PreviouslyAdjustedCostCode[] // Cost codes that were previously adjusted for this invoice
  isInvoiceSaved?: boolean // Whether the invoice is saved (has UUID and is being edited)
}

const props = withDefaults(defineProps<Props>(), {
  purchaseOrderUuid: null,
  changeOrderUuid: null,
  currentInvoiceUuid: null,
  showAdjustmentInputs: false,
  readonly: false,
  adjustedAmounts: () => ({}),
  previouslyAdjustedCostCodes: () => [],
  isInvoiceSaved: false
})

const emit = defineEmits<{
  'adjusted-amount-change': [advancePaymentUuid: string, costCode: any, amount: number | null]
  'adjusted-amounts-update': [adjustedAmounts: Record<string, Record<string, number>>]
}>()

const { formatDate } = useDateFormat()
const { formatCurrency } = useCurrencyFormat()

const advancePayments = ref<any[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// Local state for adjusted amounts (keyed by advancePaymentUuid -> costCodeUuid)
const localAdjustedAmounts = ref<Record<string, Record<string, number>>>({})

// Check if we have previously adjusted cost codes to display
const hasPreviouslyAdjustedCostCodes = computed(() => {
  return props.previouslyAdjustedCostCodes && props.previouslyAdjustedCostCodes.length > 0
})

// Get previously adjusted amount for a specific advance payment and cost code
// Sum all adjustments across all invoices for this advance payment and cost code
const getPreviouslyAdjustedAmount = (advancePaymentUuid: string, costCodeUuid: string): number => {
  if (!props.previouslyAdjustedCostCodes || props.previouslyAdjustedCostCodes.length === 0) {
    return 0
  }
  // Filter all matching cost codes and sum their adjusted amounts
  const matches = props.previouslyAdjustedCostCodes.filter(
    cc => cc.advance_payment_uuid === advancePaymentUuid && cc.cost_code_uuid === costCodeUuid
  )
  return matches.reduce((sum, cc) => sum + (parseFloat(String(cc.adjusted_amount)) || 0), 0)
}

// Get remaining amount to be adjusted for a specific advance payment and cost code
// This is: advance_amount - previously_adjusted (not including current adjustment)
const getRemainingAmount = (advancePaymentUuid: string, costCode: any): number => {
  const advanceAmount = parseFloat(costCode.advance_amount || costCode.advanceAmount || '0') || 0
  const costCodeUuid = costCode.cost_code_uuid || costCode.uuid
  const previouslyAdjusted = getPreviouslyAdjustedAmount(advancePaymentUuid, costCodeUuid)
  const remaining = advanceAmount - previouslyAdjusted
  return Math.max(0, remaining) // Don't allow negative
}

// Get remaining amount after current adjustment (for display after /)
// This shows what will be left after the user's adjustment: remaining - currently_adjusted
const getRemainingAfterAdjustment = (advancePaymentUuid: string, costCode: any): number => {
  const remaining = getRemainingAmount(advancePaymentUuid, costCode)
  const costCodeUuid = costCode.cost_code_uuid || costCode.uuid
  const currentlyAdjusted = parseFloat(getAdjustedAmount(advancePaymentUuid, costCodeUuid)) || 0
  const remainingAfterAdjustment = remaining - currentlyAdjusted
  return Math.max(0, remainingAfterAdjustment) // Don't allow negative
}

// Filter cost codes to exclude those with zero remaining amount
// Returns filtered cost codes for a specific payment
// For saved invoices, include cost codes that were previously adjusted even if remaining is 0
const getFilteredCostCodes = (payment: any): any[] => {
  if (!payment.costCodes || payment.costCodes.length === 0) {
    return []
  }
  
  return payment.costCodes.filter((costCode: any) => {
    const remaining = getRemainingAmount(payment.uuid, costCode)
    const costCodeUuid = costCode.cost_code_uuid || costCode.uuid

    // Saved invoice: always show rows we persisted for this invoice (other invoices' "previously adjusted"
    // can drive remaining to 0 and hide the row otherwise).
    if (props.isInvoiceSaved) {
      const saved = props.adjustedAmounts?.[payment.uuid]?.[costCodeUuid]
      if (saved != null && Number(saved) > 0) {
        return true
      }
    }
    
    // For saved invoices, show cost codes that were previously adjusted even if remaining is 0
    if (props.isInvoiceSaved && props.previouslyAdjustedCostCodes && props.previouslyAdjustedCostCodes.length > 0) {
      const wasAdjusted = props.previouslyAdjustedCostCodes.some(
        cc => cc.advance_payment_uuid === payment.uuid && cc.cost_code_uuid === costCodeUuid
      )
      // If this cost code was adjusted, show it even if remaining is 0
      if (wasAdjusted) {
        return true
      }
    }
    
    // Filter out cost codes where remaining amount is exactly zero
    // Keep cost codes with remaining > 0 or remaining < 0 (over-adjusted, for error display)
    return remaining !== 0
  })
}

// Get total previously adjusted amount for a specific advance payment
const getTotalPreviouslyAdjustedForPayment = (advancePaymentUuid: string): number => {
  if (!props.previouslyAdjustedCostCodes || props.previouslyAdjustedCostCodes.length === 0) {
    return 0
  }
  return props.previouslyAdjustedCostCodes
    .filter(cc => cc.advance_payment_uuid === advancePaymentUuid)
    .reduce((sum, cc) => sum + (parseFloat(String(cc.adjusted_amount)) || 0), 0)
}

// Get total previously adjusted amount across all payments
const totalPreviouslyAdjusted = computed(() => {
  if (!props.previouslyAdjustedCostCodes || props.previouslyAdjustedCostCodes.length === 0) {
    return 0
  }
  return props.previouslyAdjustedCostCodes.reduce(
    (sum, cc) => sum + (parseFloat(String(cc.adjusted_amount)) || 0), 0
  )
})

// Calculate footer colspan based on visible columns
const footerColspan = computed(() => {
  let cols = 5 // Invoice Number, Invoice Date, Status, Cost code, Advance Paid Amount
  if (hasPreviouslyAdjustedCostCodes.value && props.showAdjustmentInputs && !props.isInvoiceSaved) cols++ // Remaining column
  if (props.showAdjustmentInputs) cols++
  return cols
})

// Check if any cost code in a payment has over-adjusted amount
// Only check filtered cost codes (those with remaining > 0 or < 0)
const hasOverAdjustedAmount = (payment: any): boolean => {
  const filteredCostCodes = getFilteredCostCodes(payment)
  const taxLines = getTaxLines(payment)
  if (filteredCostCodes.length === 0 && taxLines.length === 0) return false
  if (!props.showAdjustmentInputs) return false
  // Skip validation if invoice is saved (already adjusted amounts should not be validated)
  if (props.isInvoiceSaved) return false

  const epsilon = 1e-6
  const costOver = filteredCostCodes.some((costCode: any) => {
    const costCodeUuid = costCode.cost_code_uuid || costCode.uuid
    const currentlyAdjusted = parseFloat(getAdjustedAmount(payment.uuid, costCodeUuid)) || 0
    const remainingNet = getRemainingAmount(payment.uuid, costCode)
    return currentlyAdjusted > remainingNet + epsilon
  })
  if (costOver) return true
  return taxLines.some((taxLine) => {
    const key = taxAdjustmentKey(taxLine.key)
    const current = parseFloat(getAdjustedAmount(payment.uuid, key)) || 0
    const before = getRemainingTaxLineBeforeCurrent(payment, payment.uuid, taxLine)
    return current > before + epsilon
  })
}

// Initialize local adjusted amounts from props
watch(
  () => props.adjustedAmounts,
  (newAmounts) => {
    if (newAmounts && Object.keys(newAmounts).length > 0) {
      // Deep copy to ensure Vue reactivity works properly with nested objects
      localAdjustedAmounts.value = JSON.parse(JSON.stringify(newAmounts))
    }
  },
  { immediate: true, deep: true }
)

// Fetch advance payment invoices for the purchase order or change order
const fetchAdvancePayments = async () => {
  if (!props.purchaseOrderUuid && !props.changeOrderUuid) {
    advancePayments.value = []
    return
  }

  loading.value = true
  error.value = null

  try {
    // Build query parameters
    const queryParams: Record<string, string> = {}
    if (props.currentInvoiceUuid) {
      queryParams.currentInvoiceUuid = props.currentInvoiceUuid
    }

    // Fetch advance payment invoices with cost codes for this PO or CO
    let apiUrl = ''
    if (props.purchaseOrderUuid) {
      apiUrl = `/api/purchase-orders/${props.purchaseOrderUuid}/advance-payments`
    } else if (props.changeOrderUuid) {
      apiUrl = `/api/change-orders/${props.changeOrderUuid}/advance-payments`
    }

    const response = await $fetch<{ data: any[] }>(
      apiUrl,
      {
        query: queryParams
      }
    )

    const payments = Array.isArray(response?.data) ? response.data : []
    advancePayments.value = payments
  } catch (err: any) {
    console.error('Error fetching advance payments:', err)
    error.value = err.message || 'Failed to load advance payments'
    advancePayments.value = []
  } finally {
    loading.value = false
  }
}

// Get amount without taxes for a payment
const getAmountWithoutTaxes = (payment: any): number => {
  const totalAmount = parseFloat(payment.amount || '0') || 0
  
  return totalAmount - getTaxTotal(payment)
}

// Get total tax from financial_breakdown (sales_taxes + fallback totals.tax_total)
const getTaxTotal = (payment: any): number => {
  if (!payment?.financial_breakdown) return 0
  try {
    let breakdown = payment.financial_breakdown

    // Parse if it's a string
    if (typeof breakdown === 'string') {
      breakdown = JSON.parse(breakdown)
    }

    const totals = breakdown?.totals || breakdown || {}

    if (breakdown?.sales_taxes) {
      const salesTaxes = breakdown.sales_taxes
      const tax1 =
        parseFloat(salesTaxes.sales_tax_1?.amount || salesTaxes.salesTax1?.amount || '0') || 0
      const tax2 =
        parseFloat(salesTaxes.sales_tax_2?.amount || salesTaxes.salesTax2?.amount || '0') || 0
      return tax1 + tax2
    }

    return parseFloat(totals.tax_total || totals.taxTotal || '0') || 0
  } catch {
    return 0
  }
}

// Get amount including taxes for display totals
const getAmountWithTaxes = (payment: any): number => {
  return parseFloat(payment?.amount || '0') || 0
}

// Calculate total advance paid without taxes
const totalAdvancePaidWithTaxes = computed(() => {
  return advancePayments.value.reduce(
    (sum, payment) => sum + getAmountWithTaxes(payment),
    0
  )
})

// Get status color for badge based on is_active
const getStatusColor = (isActive: boolean | undefined): "error" | "warning" | "info" | "success" | "primary" | "secondary" | "neutral" => {
  return isActive ? 'success' : 'neutral'
}

// Get adjusted amount for a specific advance payment and cost code (this invoice's adjustment only).
// Order: local edits → parent `adjustedAmounts` (saved `adjusted_advance_payment_amounts`).
// Do not use `previouslyAdjustedCostCodes` here — that reflects *other* invoices' usage, not this row's input.
const getAdjustedAmount = (advancePaymentUuid: string, costCodeUuid: string): string => {
  const localAmount = localAdjustedAmounts.value[advancePaymentUuid]?.[costCodeUuid]
  if (localAmount !== null && localAmount !== undefined) {
    return String(localAmount)
  }

  const propAmount = props.adjustedAmounts?.[advancePaymentUuid]?.[costCodeUuid]
  if (propAmount !== null && propAmount !== undefined) {
    return String(propAmount)
  }

  return ''
}

// Handle adjusted amount change
const handleAdjustedAmountChange = (advancePaymentUuid: string, costCode: any, value: string | null) => {
  // Prevent changes if invoice is saved (already adjusted amounts should not be changed)
  if (props.isInvoiceSaved) {
    return
  }
  // IMPORTANT: Prioritize cost_code_uuid over uuid to match the database storage
  // cost_code_uuid is the foreign key to cost_code_configurations
  // uuid is the row ID of advance_payment_cost_codes table
  const costCodeUuid = costCode.cost_code_uuid || costCode.uuid
  if (!costCodeUuid) {
    console.warn('[APBT] costCodeUuid is falsy, returning early!')
    return
  }

  // Parse the value
  let numericValue: number | null = null
  if (value !== null && value !== undefined && value !== '') {
    const parsed = parseFloat(value)
    if (!isNaN(parsed) && parsed >= 0) {
      // Calculate max allowed: advance_amount - previously_adjusted
      const advanceAmount = parseFloat(costCode.advance_amount || costCode.advanceAmount || '0') || 0
      const previouslyAdjusted = getPreviouslyAdjustedAmount(advancePaymentUuid, costCodeUuid)
      const maxAllowed = advanceAmount - previouslyAdjusted
      // Allow user to type any value (for validation/highlighting), but don't cap it
      numericValue = parsed
    }
  }

  // Update local state
  if (!localAdjustedAmounts.value[advancePaymentUuid]) {
    localAdjustedAmounts.value[advancePaymentUuid] = {}
  }
  
  if (numericValue !== null && numericValue > 0) {
    localAdjustedAmounts.value[advancePaymentUuid][costCodeUuid] = numericValue
  } else {
    delete localAdjustedAmounts.value[advancePaymentUuid][costCodeUuid]
    if (Object.keys(localAdjustedAmounts.value[advancePaymentUuid]).length === 0) {
      delete localAdjustedAmounts.value[advancePaymentUuid]
    }
  }

  // Emit events
  emit('adjusted-amount-change', advancePaymentUuid, costCode, numericValue)
  // Deep copy to ensure Vue reactivity is triggered in parent component
  const deepCopy = JSON.parse(JSON.stringify(localAdjustedAmounts.value))
  emit('adjusted-amounts-update', deepCopy)
}

const handleTaxLineAdjustedChange = (advancePaymentUuid: string, taxLine: { key: string; label: string; amount: number }, value: string | null) => {
  if (props.isInvoiceSaved) {
    return
  }
  const key = taxAdjustmentKey(taxLine.key)

  let numericValue: number | null = null
  if (value !== null && value !== undefined && value !== '') {
    const parsed = parseFloat(value)
    if (!isNaN(parsed) && parsed >= 0) {
      numericValue = parsed
    }
  }

  if (!localAdjustedAmounts.value[advancePaymentUuid]) {
    localAdjustedAmounts.value[advancePaymentUuid] = {}
  }

  if (numericValue !== null && numericValue > 0) {
    localAdjustedAmounts.value[advancePaymentUuid][key] = numericValue
  } else {
    delete localAdjustedAmounts.value[advancePaymentUuid][key]
    if (Object.keys(localAdjustedAmounts.value[advancePaymentUuid]).length === 0) {
      delete localAdjustedAmounts.value[advancePaymentUuid]
    }
  }

  emit('adjusted-amount-change', advancePaymentUuid, { tax_line_key: taxLine.key, tax_line_label: taxLine.label }, numericValue)
  const deepCopy = JSON.parse(JSON.stringify(localAdjustedAmounts.value))
  emit('adjusted-amounts-update', deepCopy)
}

// Calculate total adjusted amount across all advance payments
// For saved invoices, use props.adjustedAmounts; for new invoices, use localAdjustedAmounts
const totalAdjustedAmount = computed(() => {
  let total = 0
  const amountsToUse = props.isInvoiceSaved ? props.adjustedAmounts : localAdjustedAmounts.value
  Object.values(amountsToUse).forEach((costCodeAmounts) => {
    Object.values(costCodeAmounts).forEach((amount) => {
      total += amount || 0
    })
  })
  return total
})

// Total remaining advance amount that can still be adjusted
// (after subtracting previously adjusted amounts across invoices).
const totalRemainingAdjustableAmount = computed(() => {
  return advancePayments.value.reduce((paymentSum, payment) => {
    const filteredCostCodes = getFilteredCostCodes(payment)
    const taxLines = getTaxLines(payment)
    const netCostRemaining = filteredCostCodes.reduce(
      (ccSum: number, costCode: any) => ccSum + getRemainingAmount(payment.uuid, costCode),
      0
    )
    const taxRemaining = taxLines.reduce(
      (txSum: number, tl: TaxLine) =>
        txSum + getRemainingTaxLineBeforeCurrent(payment, payment.uuid, tl),
      0
    )
    return paymentSum + netCostRemaining + taxRemaining
  }, 0)
})

// Check if there are advance payments with amounts that can be adjusted
// For saved invoices: show if there are adjusted amounts
// For new invoices: show if there are advance payments with cost codes that have remaining amounts > 0
// Always show if loading, error, or no PO/CO selected (to display loading/error/empty states)
const hasAdvancePaymentsToAdjust = computed(() => {
  // Always show if loading or error (to display loading/error states)
  if (loading.value || error.value) {
    return true
  }
  
  // Always show if no PO/CO selected (to display empty state)
  if (!props.purchaseOrderUuid && !props.changeOrderUuid) {
    return true
  }
  
  // For saved invoices, only show if there are adjusted amounts
  if (props.isInvoiceSaved) {
    return totalAdjustedAmount.value > 0
  }
  
  // For new invoices, check if there are advance payments with cost codes that have remaining amounts > 0
  if (advancePayments.value.length === 0) {
    // Show empty state if no advance payments found
    return true
  }
  
  // Check if any payment has cost codes with remaining amounts > 0
  // If a payment has no cost codes at all, still show it (data issue, but should be visible)
  // Only hide if all payments have cost codes AND all those cost codes have zero remaining amounts
  const hasAdjustableAmounts = advancePayments.value.some((payment) => {
    // If payment has no cost codes, show it (might be a data issue)
    if (!payment.costCodes || payment.costCodes.length === 0) {
      return true
    }
    const filteredCostCodes = getFilteredCostCodes(payment)
    const taxLines = getTaxLines(payment)
    const hasTaxToAdjust = taxLines.some((tl) => getRemainingTaxLineBeforeCurrent(payment, payment.uuid, tl) > 0)
    return filteredCostCodes.length > 0 || hasTaxToAdjust
  })
  
  return hasAdjustableAmounts
})

const toNumber = (value: unknown): number => {
  if (value === null || value === undefined || value === '') return 0
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const parsed = parseFloat(String(value))
  return Number.isFinite(parsed) ? parsed : 0
}

const parseFinancialBreakdown = (financialBreakdown: any): any => {
  if (!financialBreakdown) return null
  if (typeof financialBreakdown === 'string') {
    try {
      return JSON.parse(financialBreakdown)
    } catch {
      return null
    }
  }
  return financialBreakdown
}

type TaxLine = { key: string; label: string; amount: number }

/**
 * Tax lines from the advance invoice financial_breakdown (Sales Tax 1 / 2).
 * Each line has its own adjust amount (tax dollars) stored under key __tax_{key}.
 */
const getTaxLines = (payment: any): TaxLine[] => {
  const fb = parseFinancialBreakdown(payment?.financial_breakdown)
  const salesTaxes = fb?.sales_taxes || fb?.salesTaxes || {}

  const tax1 = salesTaxes?.sales_tax_1 ?? salesTaxes?.salesTax1 ?? null
  const tax2 = salesTaxes?.sales_tax_2 ?? salesTaxes?.salesTax2 ?? null

  const amount1 = tax1?.amount ?? tax1?.amount_value ?? tax1?.value
  const amount2 = tax2?.amount ?? tax2?.amount_value ?? tax2?.value

  const taxLines: TaxLine[] = []

  const normalizedAmount1 = toNumber(amount1)
  if (tax1 && amount1 !== null && amount1 !== undefined && normalizedAmount1 > 0) {
    taxLines.push({
      key: 'sales_tax_1',
      label: 'Sales Tax 1',
      amount: normalizedAmount1,
    })
  }

  const normalizedAmount2 = toNumber(amount2)
  if (tax2 && amount2 !== null && amount2 !== undefined && normalizedAmount2 > 0) {
    taxLines.push({
      key: 'sales_tax_2',
      label: 'Sales Tax 2',
      amount: normalizedAmount2,
    })
  }

  return taxLines
}

type LineRow = { kind: 'cost'; costCode: any } | { kind: 'tax'; taxLine: TaxLine }

/**
 * Positive magnitude of this line's share of the advance invoice total (cost advance_amount or tax line amount).
 * For invoices with no line rows, the empty placeholder row uses the full invoice amount.
 */
function getLineAmountTowardInvoiceTotal(payment: any, line: LineRow | null): number {
  if (line === null) {
    return getAmountWithTaxes(payment)
  }
  if (line.kind === 'cost') {
    const cc = line.costCode
    return parseFloat(cc.advance_amount || cc.advanceAmount || '0') || 0
  }
  return line.taxLine.amount
}

/** One table row per cost code and per tax line for the same advance invoice. */
function getLineRows(payment: any): LineRow[] {
  const rows: LineRow[] = []
  for (const cc of getFilteredCostCodes(payment)) {
    rows.push({ kind: 'cost', costCode: cc })
  }
  for (const taxLine of getTaxLines(payment)) {
    rows.push({ kind: 'tax', taxLine })
  }
  return rows
}

function costCodeDisplayLabel(costCode: any): string {
  return (
    costCode.cost_code_label ||
    (costCode.cost_code_number && costCode.cost_code_name
      ? `${costCode.cost_code_number} ${costCode.cost_code_name}`.trim()
      : 'N/A')
  )
}

function rowspanForInvoiceBlock(row: { lineCount: number }): number {
  return row.lineCount === 0 ? 1 : row.lineCount
}

const tbodyRows = computed(() => {
  const out: Array<{
    key: string
    payment: any
    line: LineRow | null
    lineIdx: number
    lineCount: number
  }> = []
  for (const payment of advancePayments.value) {
    const lines = getLineRows(payment)
    const paymentAmountWithTaxes = getAmountWithTaxes(payment)

    // Hide invoice rows that have no payable advance/tax lines and a zero total.
    if (lines.length === 0 && paymentAmountWithTaxes === 0) {
      continue
    }

    if (lines.length === 0) {
      out.push({
        key: `${payment.uuid}-empty`,
        payment,
        line: null,
        lineIdx: 0,
        lineCount: 0,
      })
    } else {
      lines.forEach((line, lineIdx) => {
        out.push({
          key: `${payment.uuid}-line-${lineIdx}`,
          payment,
          line,
          lineIdx,
          lineCount: lines.length,
        })
      })
    }
  }
  return out
})

/** Remaining adjustable for this invoice tax line (tax dollars), before current input. */
const getRemainingTaxLineBeforeCurrent = (payment: any, paymentUuid: string, taxLine: TaxLine): number => {
  const key = taxAdjustmentKey(taxLine.key)
  const taxAmt = taxLine.amount
  const prevAdj = getPreviouslyAdjustedAmount(paymentUuid, key)
  return Math.max(0, taxAmt - prevAdj)
}

const getRemainingAfterTaxLineAdjustment = (
  payment: any,
  paymentUuid: string,
  taxLine: TaxLine
): number => {
  const key = taxAdjustmentKey(taxLine.key)
  const current = parseFloat(getAdjustedAmount(paymentUuid, key)) || 0
  const before = getRemainingTaxLineBeforeCurrent(payment, paymentUuid, taxLine)
  return Math.max(0, before - current)
}

// Watch for purchase order changes
// Watch for changes to purchaseOrderUuid, changeOrderUuid, OR currentInvoiceUuid
// We need to re-fetch when currentInvoiceUuid changes because the API filters based on it
// (it includes advance payments that were adjusted against the current invoice)
watch(
  () => [props.purchaseOrderUuid, props.changeOrderUuid, props.currentInvoiceUuid],
  ([newPoUuid, newCoUuid, newCurrentInvoiceUuid]) => {
    if (newPoUuid || newCoUuid) {
      fetchAdvancePayments()
    } else {
      advancePayments.value = []
    }
  },
  { immediate: true }
)

// Expose validation state for parent component
const hasValidationError = computed(() => {
  return advancePayments.value.some((payment) => hasOverAdjustedAmount(payment))
})

defineExpose({
  hasValidationError,
  totalAdjustedAmount,
  totalRemainingAdjustableAmount,
})
</script>

