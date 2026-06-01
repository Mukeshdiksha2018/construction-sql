<template>
  <div class="mt-6">
    <UCard variant="soft">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-base font-semibold text-default">
          Holdback Breakdown
        </h3>
        <!-- Add Row button hidden -->
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="text-center py-8">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p class="mt-2 text-sm text-gray-500">Loading holdback data...</p>
      </div>

      <!-- Table -->
      <div v-else-if="filteredCostCodeRows.length > 0" class="overflow-x-auto">
        <table class="min-w-full divide-y divide-default/60">
          <thead class="bg-muted/20 text-[11px] font-semibold uppercase tracking-wide text-muted">
            <tr>
              <th class="px-3 py-2 text-left">Cost Code</th>
              <th class="px-3 py-2 text-left">GL Account</th>
              <th class="px-3 py-2 text-right">Holdback Amount</th>
              <th v-show="!props.currentInvoiceUuid" class="px-3 py-2 text-right">Available</th>
              <th class="px-3 py-2 text-right">Release Amount</th>
              <!-- Action column hidden -->
            </tr>
          </thead>
          <tbody class="divide-y divide-default/60 text-sm text-default bg-white dark:bg-gray-900/40">
            <tr
              v-for="(row, filteredIndex) in filteredCostCodeRows"
              :key="row.id || filteredIndex"
              :class="[
                'align-middle transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-gray-800/50',
                shouldValidateReleaseAmount && isReleaseAmountExceeded(row.cost_code_uuid, parseFloat(String(row.releaseAmount || 0)) || 0, row.retainageAmount || 0) && row.cost_code_uuid && row.retainageAmount
                  ? 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-400'
                  : ''
              ]"
            >
              <!-- Cost Code -->
              <td class="px-3 py-2 align-middle">
                <CostCodeSelect
                  :model-value="row.cost_code_uuid || undefined"
                  :corporation-uuid="corporationUuid"
                  size="xs"
                  class="w-full"
                  :disabled="isCostCodeDisabled"
                  placeholder="Select Cost Code"
                  @update:model-value="(value) => handleCostCodeChange(getOriginalIndex(row.id), value ?? null)"
                  @change="(option) => handleCostCodeChange(getOriginalIndex(row.id), (option?.costCode?.uuid || option?.value) ?? null, option)"
                />
              </td>

              <!-- GL Account -->
              <td class="px-3 py-2 align-middle">
                <ChartOfAccountsSelect
                  :key="`gl-account-${row.id}-${localChartOfAccounts.length}`"
                  :model-value="row.gl_account_uuid || undefined"
                  :local-accounts="localChartOfAccounts"
                  size="xs"
                  class="w-full"
                  :disabled="readonly || !row.cost_code_uuid"
                  placeholder="Select GL Account"
                  @update:model-value="(value) => handleGLAccountChange(getOriginalIndex(row.id), value)"
                  @change="(account) => handleGLAccountChange(getOriginalIndex(row.id), account?.value, account)"
                />
              </td>

              <!-- Retainage Amount -->
              <td class="px-3 py-2 align-middle text-right">
                <span class="text-sm font-medium text-default">
                  {{ formatCurrency(row.retainageAmount || 0) }}
                </span>
              </td>

              <!-- Available -->
              <td v-show="!props.currentInvoiceUuid" class="px-3 py-2 align-middle text-right">
                <div v-if="row.cost_code_uuid && row.retainageAmount" class="text-sm">
                  <div class="text-gray-700 dark:text-gray-300 font-medium">
                    {{ formatCurrency(getRemainingRetainageAmount(row.cost_code_uuid, row.retainageAmount)) }}
                  </div>
                  <div v-if="getPreviouslyReleasedAmount(row.cost_code_uuid) > 0" class="text-xs text-warning-600 dark:text-warning-400 mt-0.5">
                    ({{ formatCurrency(getPreviouslyReleasedAmount(row.cost_code_uuid)) }} already released)
                  </div>
                </div>
                <span v-else class="text-sm text-gray-400 dark:text-gray-500">-</span>
              </td>

              <!-- Release Amount -->
              <td class="px-3 py-2 align-middle">
                <div class="flex flex-col gap-1">
                  <div class="relative">
                    <span class="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted">
                      {{ currencySymbol }}
                    </span>
                  <UInput
                    :model-value="row.releaseAmount !== null && row.releaseAmount !== undefined ? String(row.releaseAmount) : ''"
                    type="text"
                    step="0.01"
                    :min="0"
                    :max="getRemainingRetainageAmount(row.cost_code_uuid, row.retainageAmount || 0) + (parseFloat(String(row.releaseAmount || 0)) || 0)"
                    pattern="[0-9.]*"
                    inputmode="decimal"
                    size="xs"
                    :class="[
                      'w-full pl-6',
                      shouldValidateReleaseAmount && isReleaseAmountExceeded(row.cost_code_uuid, parseFloat(String(row.releaseAmount || 0)) || 0, row.retainageAmount || 0) 
                        ? 'border-red-500 dark:border-red-400' 
                        : ''
                    ]"
                    :disabled="readonly || !row.cost_code_uuid || isPaidOrPartiallyPaid"
                    placeholder="0.00"
                    @update:model-value="(value) => handleReleaseAmountChange(getOriginalIndex(row.id), value)"
                    @keydown="preventReleaseAmountKeydown"
                    @paste="preventReleaseAmountPaste"
                  />
                  </div>
                  <div v-if="!readonly && shouldValidateReleaseAmount && row.cost_code_uuid && row.retainageAmount" class="text-[10px] text-muted">
                    <span v-if="shouldValidateReleaseAmount && isReleaseAmountExceeded(row.cost_code_uuid, parseFloat(String(row.releaseAmount || 0)) || 0, row.retainageAmount || 0)" class="text-red-600 dark:text-red-400">
                      Exceeds available amount
                    </span>
                    <span v-if="getRemainingReleaseAmount(row, getOriginalIndex(row.id)) < -0.01" class="text-red-600 dark:text-red-400">
                      Over by: {{ formatCurrency(Math.abs(getRemainingReleaseAmount(row, getOriginalIndex(row.id)))) }}
                    </span>
                  </div>
                </div>
              </td>

              <!-- Action column hidden -->
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty state -->
      <div v-else-if="!loading" class="text-center py-8">
        <p v-if="!props.holdbackInvoiceUuid && !props.purchaseOrderUuid && !props.changeOrderUuid" class="text-sm text-warning-600 dark:text-warning-400">
          Please select a holdback invoice from the modal above to view the breakdown
        </p>
        <p v-else class="text-sm text-muted">No cost codes found in the selected PO/CO</p>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useCurrencyFormat } from '~/composables/useCurrencyFormat'
import CostCodeSelect from '~/components/shared/CostCodeSelect.vue'
import ChartOfAccountsSelect from '~/components/shared/ChartOfAccountsSelect.vue'
import {
  computeRetainageAmountsByCostCode,
  resolveSourceItemsFromVendorInvoicePayload,
} from '~/utils/holdbackRetainageByCostCode'

interface PreviouslyReleasedCostCode {
  cost_code_uuid: string;
  cost_code_label?: string;
  cost_code_number?: string;
  cost_code_name?: string;
  release_amount: number;
  holdback_invoice_uuid: string; // Reference to the original holdback invoice
  vendor_invoice_uuid: string; // Reference to the invoice that released this amount
}

interface Props {
  purchaseOrderUuid?: string | null
  changeOrderUuid?: string | null
  corporationUuid?: string
  invoiceStatus?: string | null
  readonly?: boolean
  modelValue?: any[]
  holdbackInvoiceUuid?: string | null // UUID of the holdback invoice to get retainage amounts
  currentInvoiceUuid?: string | null // UUID of the current invoice being created/edited (to exclude from calculations)
  previouslyReleasedCostCodes?: PreviouslyReleasedCostCode[] // Cost codes that were previously released (similar to previouslyAdjustedCostCodes for advance payments)
  isLaborPO?: boolean // Whether the PO is labor type
  isLaborCO?: boolean // Whether the CO is labor type
}

const props = withDefaults(defineProps<Props>(), {
  invoiceStatus: null,
  readonly: false,
  modelValue: () => [],
  holdbackInvoiceUuid: null,
  currentInvoiceUuid: null,
  previouslyReleasedCostCodes: () => [],
  isLaborPO: false,
  isLaborCO: false
})

const emit = defineEmits<{
  'update:modelValue': [value: any[]]
  'release-amounts-update': [totalReleaseAmount: number]
}>()

const { formatCurrency, currencySymbol } = useCurrencyFormat()

// Local state
const loading = ref(false)
const costCodeRows = ref<any[]>([])
const costCodeConfigMap = ref<Map<string, any>>(new Map())
const localChartOfAccounts = ref<any[]>([])
const holdbackInvoiceData = ref<any>(null)
const isProcessingItems = ref(false) // Guard flag to prevent infinite loops
const cachedPOItems = ref<Map<string, any[]>>(new Map()) // Cache PO items by UUID
const cachedCOItems = ref<Map<string, any[]>>(new Map()) // Cache CO items by UUID
const cachedHoldbackInvoice = ref<Map<string, any>>(new Map()) // Cache holdback invoice by UUID
const cachedCostCodeConfigs = ref<Map<string, any[]>>(new Map()) // Cache cost code configurations by corporation UUID
// Computed: Check if we have previously released cost codes
const hasPreviouslyReleasedCostCodes = computed(() => {
  return props.previouslyReleasedCostCodes && props.previouslyReleasedCostCodes.length > 0
})


// Computed
const showTable = computed(() => {
  return (props.purchaseOrderUuid || props.changeOrderUuid) && props.holdbackInvoiceUuid
})

// Cost code should be disabled when readonly OR when PO/CO is selected (cost codes come from PO/CO)
const isCostCodeDisabled = computed(() => {
  return props.readonly || !!(props.purchaseOrderUuid || props.changeOrderUuid)
})

const isPaidOrPartiallyPaid = computed(() => {
  const status = String(props.invoiceStatus || '').trim().toUpperCase()
  return status === 'PAID' || status === 'PARTIALLY_PAID'
})

/** Validate release vs cap whenever the user can edit (new or editing). Paid/partially paid + readonly stay non-validating. */
const shouldValidateReleaseAmount = computed(
  () => !props.readonly && !isPaidOrPartiallyPaid.value
)

// Helper to get original index from row id
const getOriginalIndex = (rowId: string | undefined): number => {
  if (!rowId) return -1
  return costCodeRows.value.findIndex(r => r.id === rowId)
}

/** Holdback Amount column (retainage): rows with zero or negative effective value are not shown. */
function isPositiveHoldbackAmount(row: any): boolean {
  const raw = row?.retainageAmount ?? row?.retainage_amount
  if (raw === null || raw === undefined || raw === '') return false
  const hb = parseFloat(String(raw)) || 0
  return Math.round((hb + Number.EPSILON) * 100) / 100 > 0
}

// Track initial remaining amounts for each row (set when items are first processed)
// This allows us to filter based on initial state, not current state after user input
const initialRemainingAmounts = ref<Map<string, number>>(new Map())

// Filter out rows where remaining amount is zero
// Only filter based on initial remaining (at population time), not current remaining (after user input)
// This prevents rows from disappearing when user types a release amount equal to available amount
// IMPORTANT: When viewing an existing invoice (currentInvoiceUuid is set), show all rows regardless of remaining amount
const filteredCostCodeRows = computed(() => {
  return costCodeRows.value.filter((row) => {
    // Never show a line when Holdback Amount (retainage) is zero or missing
    if (!isPositiveHoldbackAmount(row)) {
      return false
    }

    // Draft rows with positive holdback but no cost code yet (rare)
    if (!row.cost_code_uuid) {
      return true
    }

    // When viewing an existing invoice, show all rows regardless of remaining amount
    // This ensures saved holdback breakdown is visible even if all amounts were fully released
    if (props.currentInvoiceUuid) {
      return true
    }

    // Get original index for this row
    const originalIndex = getOriginalIndex(row.id)
    if (originalIndex === -1) return true

    // Check initial remaining amount (at population time)
    // If we don't have an initial remaining amount for this row, calculate it now
    // This handles rows that were added after initial population
    if (!initialRemainingAmounts.value.has(row.id)) {
      const availableAmount = getRemainingRetainageAmount(row.cost_code_uuid, row.retainageAmount)
      initialRemainingAmounts.value.set(row.id, availableAmount)
    }

    const initialRemaining = initialRemainingAmounts.value.get(row.id) ?? 0

    // Only filter out rows that had zero remaining at initial population
    // Keep rows that had non-zero remaining initially, even if they become zero after user input
    return initialRemaining !== 0
  })
})

// Calculate total release amount (rounded to 2 decimal places)
const totalReleaseAmount = computed(() => {
  console.log('[HoldbackBreakdownTable] Calculating totalReleaseAmount from costCodeRows:', costCodeRows.value.length, 'rows');
  
  const total = costCodeRows.value.reduce((sum, row, index) => {
    const raw = row.releaseAmount ?? row.release_amount
    const releaseAmount = parseFloat(String(raw ?? 0)) || 0
    console.log(`[HoldbackBreakdownTable] Row ${index}: releaseAmount = ${releaseAmount}, cost_code_uuid = ${row.cost_code_uuid}`);
    return sum + releaseAmount
  }, 0)
  
  console.log('[HoldbackBreakdownTable] Raw total before rounding:', total);
  
  // Round to 2 decimal places to avoid floating point precision issues
  const rounded = Math.round(total * 100) / 100
  console.log('[HoldbackBreakdownTable] Rounded total:', rounded);
  
  return rounded
})

// Watch total release amount and emit to parent
watch(totalReleaseAmount, (newTotal, oldTotal) => {
  console.log('[HoldbackBreakdownTable] totalReleaseAmount changed from', oldTotal, 'to', newTotal);
  console.log('[HoldbackBreakdownTable] Emitting release-amounts-update with value:', newTotal);
  emit('release-amounts-update', newTotal)
}, { immediate: true })

// Fetch PO items including location-wise material items (with caching)
const fetchPOItems = async (poUuid: string) => {
  if (cachedPOItems.value.has(poUuid)) {
    return cachedPOItems.value.get(poUuid) || []
  }

  try {
    const apiEndpoint = props.isLaborPO
      ? `/api/labor-invoice-items?purchase_order_uuid=${poUuid}`
      : `/api/purchase-order-items?purchase_order_uuid=${poUuid}`

    const [response, poResponse] = await Promise.all([
      $fetch<{ data: any[] }>(apiEndpoint),
      $fetch<{ data: any }>(`/api/purchase-order-forms/${poUuid}`)
    ])
    const regularItems = Array.isArray(response?.data) ? response.data : []
    const lwmItems = Array.isArray(poResponse?.data?.po_location_wise_material_items)
      ? poResponse.data.po_location_wise_material_items
      : []
    const items = [...regularItems, ...lwmItems]
    cachedPOItems.value.set(poUuid, items)
    return items
  } catch (error) {
    console.error('[HoldbackBreakdownTable] Error fetching PO items:', error)
    return []
  }
}

// Fetch CO items including location-wise material items (with caching)
const fetchCOItems = async (coUuid: string) => {
  if (cachedCOItems.value.has(coUuid)) {
    return cachedCOItems.value.get(coUuid) || []
  }

  try {
    const apiEndpoint = props.isLaborCO
      ? `/api/labor-invoice-items?change_order_uuid=${coUuid}`
      : `/api/change-order-items?change_order_uuid=${coUuid}`

    const [response, coResponse] = await Promise.all([
      $fetch<{ data: any[] }>(apiEndpoint),
      $fetch<{ data: any }>(`/api/change-orders/${coUuid}`)
    ])
    const regularItems = Array.isArray(response?.data) ? response.data : []
    const lwmItems = Array.isArray(coResponse?.data?.co_location_wise_material_items)
      ? coResponse.data.co_location_wise_material_items
      : []
    const items = [...regularItems, ...lwmItems]
    cachedCOItems.value.set(coUuid, items)
    return items
  } catch (error) {
    console.error('[HoldbackBreakdownTable] Error fetching CO items:', error)
    return []
  }
}

// Fetch holdback invoice data (with caching)
const fetchHoldbackInvoice = async (invoiceUuid: string) => {
  if (!invoiceUuid) {
    holdbackInvoiceData.value = null
    return
  }

  // Return cached data if available
  if (cachedHoldbackInvoice.value.has(invoiceUuid)) {
    holdbackInvoiceData.value = cachedHoldbackInvoice.value.get(invoiceUuid) || null
    return
  }

  try {
    const response = await $fetch<{ data: any }>(`/api/vendor-invoices/${invoiceUuid}`)
    const invoiceData = response?.data || null
    holdbackInvoiceData.value = invoiceData
    // Cache the result
    if (invoiceData) {
      cachedHoldbackInvoice.value.set(invoiceUuid, invoiceData)
    }
  } catch (error) {
    console.error('[HoldbackBreakdownTable] Error fetching holdback invoice:', error)
    holdbackInvoiceData.value = null
  }
}

// Fetch cost code configurations (with caching)
const fetchCostCodeConfigurations = async (corporationUuid: string) => {
  if (!corporationUuid) return
  
  // Return cached data if available
  if (cachedCostCodeConfigs.value.has(corporationUuid)) {
    const configs = cachedCostCodeConfigs.value.get(corporationUuid) || []
    costCodeConfigMap.value.clear()
    configs.forEach((config: any) => {
      if (config?.uuid) {
        costCodeConfigMap.value.set(config.uuid, config)
      }
    })
    return
  }

  try {
    const response = await $fetch<{ data: any[] }>(`/api/cost-code-configurations`, {
      query: { corporation_uuid: corporationUuid },
    })
    
    const configs = Array.isArray(response?.data) ? response.data : []
    
    // Cache the result
    cachedCostCodeConfigs.value.set(corporationUuid, configs)
    
    // Update the map
    costCodeConfigMap.value.clear()
    configs
      .filter((config: any) => config?.is_active !== false && config?.uuid) // Only active configurations
      .forEach((config: any) => {
        if (config?.uuid) {
          costCodeConfigMap.value.set(config.uuid, config)
        }
      })
  } catch (error) {
    console.error('[HoldbackBreakdownTable] Error fetching cost code configurations:', error)
    // Don't throw - just log the error and continue
    cachedCostCodeConfigs.value.set(corporationUuid, []) // Cache empty array to prevent repeated failed fetches
  }
}

// Fetch chart of accounts
const fetchChartOfAccounts = async (corporationUuid: string) => {
  if (!corporationUuid) return
  
  try {
    const response = await $fetch<{ data: any[] }>(`/api/corporations/chart-of-accounts?corporation_uuid=${corporationUuid}`)
    
    let accounts: any[] = []
    if (response?.data) {
      accounts = Array.isArray(response.data) ? response.data : []
    } else if (Array.isArray(response)) {
      accounts = response
    }
    
    localChartOfAccounts.value = accounts
  } catch (error) {
    console.error('[HoldbackBreakdownTable] Error fetching chart of accounts:', error)
    localChartOfAccounts.value = []
  }
}

// Get previously released amount for a specific cost code
// Sum releases from *other* vendor invoices for this cost code (similar to advance payment adjusted amounts).
// When editing, the parent may still include this invoice's saved rows — exclude vendor_invoice_uuid === currentInvoiceUuid
// so we never subtract the current form's own release amounts from "available" (avoids double-counting on load).
const getPreviouslyReleasedAmount = (costCodeUuid: string): number => {
  if (!props.previouslyReleasedCostCodes || props.previouslyReleasedCostCodes.length === 0) {
    return 0
  }

  const currentInv =
    props.currentInvoiceUuid != null && String(props.currentInvoiceUuid).trim() !== ''
      ? String(props.currentInvoiceUuid).trim()
      : ''

  const matches = props.previouslyReleasedCostCodes.filter((cc) => {
    if (cc.cost_code_uuid !== costCodeUuid) return false
    if (!currentInv) return true
    const releasedBy = String(cc.vendor_invoice_uuid || '').trim()
    return releasedBy !== currentInv
  })

  return matches.reduce((sum, cc) => sum + (parseFloat(String(cc.release_amount)) || 0), 0)
}

// Get remaining retainage amount to be released for a specific cost code
// This is: retainage_amount - previously_released_by_others (current invoice's releases excluded above)
const getRemainingRetainageAmount = (costCodeUuid: string | null, retainageAmount: number): number => {
  if (!costCodeUuid) {
    return 0
  }
  
  const previouslyReleased = getPreviouslyReleasedAmount(costCodeUuid)
  const remaining = retainageAmount - previouslyReleased
  
  return Math.max(0, remaining) // Don't allow negative
}

// Get available retainage amount for a cost code (alias for consistency with UI)
const getAvailableRetainageAmount = (costCodeUuid: string | null, retainageAmount: number): number => {
  return getRemainingRetainageAmount(costCodeUuid, retainageAmount)
}

// Check if release amount exceeds remaining retainage (available) for this cost code
const isReleaseAmountExceeded = (costCodeUuid: string | null, releaseAmount: number, retainageAmount: number): boolean => {
  if (!shouldValidateReleaseAmount.value) return false

  if (!costCodeUuid) return false

  const remaining = getRemainingRetainageAmount(costCodeUuid, retainageAmount)
  // Compare in cents so even 1 cent over is treated as exceeded, without float drift.
  const releaseCents = Math.round((releaseAmount + Number.EPSILON) * 100)
  const remainingCents = Math.round((remaining + Number.EPSILON) * 100)
  return releaseCents > remainingCents
}

// Calculate remaining amount after subtracting release amount from available amount
const getRemainingReleaseAmount = (row: any, index: number): number => {
  if (!row.cost_code_uuid || !row.retainageAmount) {
    return 0
  }

  const availableAmount = getRemainingRetainageAmount(row.cost_code_uuid, row.retainageAmount)
  const releaseAmount = parseFloat(String(row.releaseAmount || 0)) || 0

  const remaining = availableAmount - releaseAmount
  // Round to 2 decimal places to handle floating point precision issues
  return Math.round(remaining * 100) / 100
}

// Get CSS class for remaining release amount display
const getRemainingReleaseAmountClass = (row: any, index: number): string => {
  const remaining = getRemainingReleaseAmount(row, index)
  const availableAmount = getRemainingRetainageAmount(row.cost_code_uuid, row.retainageAmount)
  
  if (remaining < 0) {
    return 'text-error-600 dark:text-error-400'
  } else if (remaining === 0) {
    return 'text-warning-600 dark:text-warning-400'
  } else if (availableAmount > 0 && remaining <= availableAmount * 0.1) {
    return 'text-warning-500 dark:text-warning-500'
  } else {
    return 'text-muted'
  }
}

// Check if any row has exceeded the applicable cap (remaining retainage)
const hasExceededReleaseAmount = computed(() => {
  if (!shouldValidateReleaseAmount.value) return false

  return costCodeRows.value.some((row) => {
    if (!row.cost_code_uuid || !row.retainageAmount) return false

    const releaseAmount = parseFloat(String(row.releaseAmount || 0)) || 0
    if (releaseAmount <= 0) return false

    return isReleaseAmountExceeded(row.cost_code_uuid, releaseAmount, row.retainageAmount)
  })
})

// Process items and group by cost code
const processItems = async () => {
  // Prevent concurrent processing
  if (isProcessingItems.value) {
    return
  }

  // If we have saved data (modelValue), don't clear it even if props are temporarily unset
  // This prevents clearing data during the loading sequence
  const hasSavedData = Array.isArray(props.modelValue) && props.modelValue.length > 0

  if (!props.purchaseOrderUuid && !props.changeOrderUuid) {
    // Only clear if we don't have saved data
    if (!hasSavedData) {
      costCodeRows.value = []
    }
    loading.value = false
    return
  }

  // If holdback invoice UUID is not set, don't process items but keep component visible
  // But preserve saved data if it exists
  // For existing invoices, if we have saved data and PO/CO UUIDs, we can still display the saved data
  if (!props.holdbackInvoiceUuid) {
    // If we have saved data, load it directly (for existing invoices)
    if (hasSavedData) {
      const savedRows = props.modelValue
        .map((savedRow: any) => ({
          id: savedRow.id || savedRow.uuid || `holdback-row-${Date.now()}-${Math.random().toString(36).substring(2)}`,
          cost_code_uuid: savedRow.cost_code_uuid || null,
          cost_code_label: savedRow.cost_code_label || null,
          cost_code_number: savedRow.cost_code_number || null,
          cost_code_name: savedRow.cost_code_name || null,
          totalAmount: savedRow.totalAmount !== undefined ? savedRow.totalAmount : (savedRow.total_amount !== undefined ? savedRow.total_amount : 0),
          retainageAmount: savedRow.retainageAmount !== undefined ? savedRow.retainageAmount : (savedRow.retainage_amount !== undefined ? savedRow.retainage_amount : 0),
          releaseAmount: savedRow.releaseAmount !== undefined && savedRow.releaseAmount !== null
            ? savedRow.releaseAmount
            : (savedRow.release_amount !== undefined && savedRow.release_amount !== null ? savedRow.release_amount : 0),
          gl_account_uuid: savedRow.gl_account_uuid || null
        }))
        .filter(isPositiveHoldbackAmount)
      costCodeRows.value = savedRows
      loading.value = false
      return
    }
    // Only clear if we don't have saved data
    if (!hasSavedData) {
      costCodeRows.value = []
    }
    loading.value = false
    return
  }

  isProcessingItems.value = true
  loading.value = true

  try {
    // Fetch holdback invoice data
    await fetchHoldbackInvoice(props.holdbackInvoiceUuid)

    // Use invoice rows from the selected holdback source invoice first.
    // This preserves the exact saved invoice basis (especially for labor PO/CO).
    let items: any[] = holdbackInvoiceData.value
      ? resolveSourceItemsFromVendorInvoicePayload(
          holdbackInvoiceData.value,
          props.isLaborPO,
          props.isLaborCO
        )
      : []

    if (items.length === 0) {
      // Fallback: fetch PO/CO items if invoice items are not available
      if (props.purchaseOrderUuid) {
        items = await fetchPOItems(props.purchaseOrderUuid)
      } else if (props.changeOrderUuid) {
        items = await fetchCOItems(props.changeOrderUuid)
      }
    }

    if (items.length === 0) {
      // Parent holdback invoice had no line items in the API response, but we may still have
      // persisted holdback_cost_codes for this release invoice — show them instead of an empty table.
      if (Array.isArray(props.modelValue) && props.modelValue.length > 0) {
        const savedRows = props.modelValue
          .map((savedRow: any) => ({
            id: savedRow.id || savedRow.uuid || `holdback-row-${Date.now()}-${Math.random().toString(36).substring(2)}`,
            cost_code_uuid: savedRow.cost_code_uuid || null,
            cost_code_label: savedRow.cost_code_label || null,
            cost_code_number: savedRow.cost_code_number || null,
            cost_code_name: savedRow.cost_code_name || null,
            totalAmount: savedRow.totalAmount !== undefined ? savedRow.totalAmount : (savedRow.total_amount !== undefined ? savedRow.total_amount : 0),
            retainageAmount: savedRow.retainageAmount !== undefined ? savedRow.retainageAmount : (savedRow.retainage_amount !== undefined ? savedRow.retainage_amount : 0),
            releaseAmount: savedRow.releaseAmount !== undefined && savedRow.releaseAmount !== null
              ? savedRow.releaseAmount
              : (savedRow.release_amount !== undefined && savedRow.release_amount !== null ? savedRow.release_amount : 0),
            gl_account_uuid: savedRow.gl_account_uuid || null
          }))
          .filter(isPositiveHoldbackAmount)
        costCodeRows.value = savedRows
        loading.value = false
        isProcessingItems.value = false
        return
      }
      costCodeRows.value = []
      loading.value = false
      return
    }

    // Calculate retainage amounts per cost code
    const computedRetainage = computeRetainageAmountsByCostCode(items, holdbackInvoiceData.value, {
      preferInvoiceAmountFirst: props.isLaborPO || props.isLaborCO,
    })
    const persistedRows = holdbackInvoiceData.value?.holdback_coa_breakdown
    const persistedByCostCode =
      Array.isArray(persistedRows) && persistedRows.length > 0
        ? new Map(
            persistedRows
              .filter((r: any) => r?.cost_code_uuid)
              .map((r: any) => [String(r.cost_code_uuid), r])
          )
        : null
    const retainageAmounts = new Map<string, number>()
    // When the source invoice has persisted holdback_coa_breakdown from Configure COA, treat it as
    // authoritative to avoid introducing extra cost codes from recomputation.
    if (persistedByCostCode && persistedByCostCode.size > 0) {
      persistedByCostCode.forEach((row: any, costCodeUuid: string) => {
        const parsed = parseFloat(String(row?.holdback_amount ?? 0)) || 0
        retainageAmounts.set(costCodeUuid, Math.round((parsed + Number.EPSILON) * 100) / 100)
      })
    } else {
      computedRetainage.forEach((amount, costCodeUuid) => {
        retainageAmounts.set(costCodeUuid, amount)
      })
    }

    // Group items by cost code
    const costCodeMap = new Map<string, any>()

    items.forEach((item: any) => {
      const costCodeUuid = item.cost_code_uuid || null
      if (!costCodeUuid) return

      // If persisted source breakdown exists, do not introduce extra cost codes beyond it.
      if (persistedByCostCode && persistedByCostCode.size > 0 && !persistedByCostCode.has(costCodeUuid)) {
        return
      }

      if (!costCodeMap.has(costCodeUuid)) {
        const config = costCodeConfigMap.value.get(costCodeUuid)
        const costCodeNumber = config?.cost_code_number || item.cost_code_number || ''
        const costCodeName = config?.cost_code_name || item.cost_code_name || ''
        const costCodeLabel = config 
          ? [config.cost_code_number, config.cost_code_name].filter(Boolean).join(' ').trim()
          : [costCodeNumber, costCodeName].filter(Boolean).join(' ').trim() || null

        // Calculate total amount for this cost code
        let totalAmount = 0
        items.forEach((i: any) => {
          if (i.cost_code_uuid === costCodeUuid) {
            if (i.invoice_total !== null && i.invoice_total !== undefined) {
              totalAmount += parseFloat(String(i.invoice_total)) || 0
            } else if (i.co_total !== null && i.co_total !== undefined) {
              totalAmount += parseFloat(String(i.co_total)) || 0
            } else if (i.po_total !== null && i.po_total !== undefined) {
              totalAmount += parseFloat(String(i.po_total)) || 0
            } else if (i.total !== null && i.total !== undefined) {
              totalAmount += parseFloat(String(i.total)) || 0
            } else if (i.po_amount !== null && i.po_amount !== undefined) {
              totalAmount += parseFloat(String(i.po_amount)) || 0
            } else if (i.co_amount !== null && i.co_amount !== undefined) {
              totalAmount += parseFloat(String(i.co_amount)) || 0
            } else if (i.invoice_amount !== null && i.invoice_amount !== undefined) {
              totalAmount += parseFloat(String(i.invoice_amount)) || 0
            }
          }
        })

        const persistedLine = persistedByCostCode?.get(costCodeUuid)
        // Prefer GL saved on the source invoice holdback snapshot, then cost code config
        const glAccountUuid = persistedLine?.gl_account_uuid || config?.gl_account_uuid || null

        costCodeMap.set(costCodeUuid, {
          cost_code_uuid: costCodeUuid,
          cost_code_number: costCodeNumber,
          cost_code_name: costCodeName,
          cost_code_label: costCodeLabel,
          totalAmount: Math.round((totalAmount + Number.EPSILON) * 100) / 100,
          retainageAmount: retainageAmounts.get(costCodeUuid) || 0,
          releaseAmount: 0,
          gl_account_uuid: glAccountUuid
        })
      }
    })

    // Convert map to array
    const rows = Array.from(costCodeMap.values()).map((row, index) => ({
      id: `holdback-row-${index}-${Date.now()}`,
      ...row
    }))

    // Ensure persisted breakdown rows are represented even if source invoice line arrays are sparse.
    if (persistedByCostCode && persistedByCostCode.size > 0) {
      persistedByCostCode.forEach((savedRow: any, costCodeUuid: string) => {
        if (costCodeMap.has(costCodeUuid)) return
        rows.push({
          id: savedRow.id || savedRow.uuid || `holdback-row-${rows.length}-${Date.now()}`,
          cost_code_uuid: costCodeUuid,
          cost_code_number: savedRow.cost_code_number || null,
          cost_code_name: savedRow.cost_code_name || null,
          cost_code_label: savedRow.cost_code_label || null,
          totalAmount: 0,
          retainageAmount: retainageAmounts.get(costCodeUuid) || 0,
          releaseAmount: 0,
          gl_account_uuid: savedRow.gl_account_uuid || null,
        })
      })
    }

    // If we have saved data (modelValue), merge it with the rows
    if (Array.isArray(props.modelValue) && props.modelValue.length > 0) {
      const savedRowsMap = new Map<string, any>()
      const savedRowsWithoutCostCode: any[] = [] // Store rows without cost_code_uuid
      
      props.modelValue.forEach((savedRow: any) => {
        if (savedRow.cost_code_uuid) {
          savedRowsMap.set(savedRow.cost_code_uuid, savedRow)
        } else {
          // Preserve rows without cost_code_uuid (user-added empty rows)
          savedRowsWithoutCostCode.push(savedRow)
        }
      })

      // Merge saved data with calculated rows
      rows.forEach((row) => {
        const savedRow = savedRowsMap.get(row.cost_code_uuid)
        if (savedRow) {
          row.releaseAmount = savedRow.releaseAmount !== undefined && savedRow.releaseAmount !== null
            ? savedRow.releaseAmount
            : (savedRow.release_amount !== undefined && savedRow.release_amount !== null ? savedRow.release_amount : 0)
          // Preserve saved GL account, or use from cost code config if not saved
          row.gl_account_uuid = savedRow.gl_account_uuid || row.gl_account_uuid || null
          // Preserve saved retainage amount if it exists (for existing invoices)
          if (savedRow.retainageAmount !== undefined && savedRow.retainageAmount !== null) {
            row.retainageAmount = savedRow.retainageAmount
          } else if (savedRow.retainage_amount !== undefined && savedRow.retainage_amount !== null) {
            row.retainageAmount = savedRow.retainage_amount
          }
        } else {
          // If no saved row, try to get GL account from cost code config
          const config = costCodeConfigMap.value.get(row.cost_code_uuid)
          if (!row.gl_account_uuid && config?.gl_account_uuid) {
            row.gl_account_uuid = config.gl_account_uuid
          }
        }
      })

      // Add any saved rows that don't exist in current cost codes (user-added rows with cost codes)
      savedRowsMap.forEach((savedRow, costCodeUuid) => {
        if (!costCodeMap.has(costCodeUuid)) {
          rows.push({
            id: savedRow.id || `holdback-row-${rows.length}-${Date.now()}`,
            cost_code_uuid: savedRow.cost_code_uuid,
            cost_code_number: savedRow.cost_code_number || '',
            cost_code_name: savedRow.cost_code_name || '',
            cost_code_label: savedRow.cost_code_label || 
              [savedRow.cost_code_number, savedRow.cost_code_name].filter(Boolean).join(' ').trim() || null,
            totalAmount: savedRow.totalAmount !== undefined ? savedRow.totalAmount : (savedRow.total_amount !== undefined ? savedRow.total_amount : 0),
            retainageAmount: savedRow.retainageAmount !== undefined ? savedRow.retainageAmount : (savedRow.retainage_amount !== undefined ? savedRow.retainage_amount : 0),
            releaseAmount: savedRow.releaseAmount !== undefined && savedRow.releaseAmount !== null
              ? savedRow.releaseAmount
              : (savedRow.release_amount !== undefined && savedRow.release_amount !== null ? savedRow.release_amount : 0),
            gl_account_uuid: savedRow.gl_account_uuid || null
          })
        }
      })

      // Add saved rows without cost_code_uuid (user-added empty rows)
      savedRowsWithoutCostCode.forEach((savedRow) => {
        rows.push({
          id: savedRow.id || `holdback-row-${rows.length}-${Date.now()}`,
          cost_code_uuid: savedRow.cost_code_uuid || null,
          cost_code_number: savedRow.cost_code_number || '',
          cost_code_name: savedRow.cost_code_name || '',
          cost_code_label: savedRow.cost_code_label || 
            [savedRow.cost_code_number, savedRow.cost_code_name].filter(Boolean).join(' ').trim() || null,
          totalAmount: savedRow.totalAmount !== undefined ? savedRow.totalAmount : (savedRow.total_amount !== undefined ? savedRow.total_amount : 0),
          retainageAmount: savedRow.retainageAmount !== undefined ? savedRow.retainageAmount : (savedRow.retainage_amount !== undefined ? savedRow.retainage_amount : 0),
          releaseAmount: savedRow.releaseAmount !== undefined && savedRow.releaseAmount !== null
            ? savedRow.releaseAmount
            : (savedRow.release_amount !== undefined && savedRow.release_amount !== null ? savedRow.release_amount : 0),
          gl_account_uuid: savedRow.gl_account_uuid || null
        })
      })
    }

    const finalRows = rows.filter((row) => isPositiveHoldbackAmount(row))
    costCodeRows.value = finalRows

    // Store initial remaining amounts for each row (after merging saved data, before any new user input)
    // This is used to filter rows based on initial state, not current state
    // Calculate remaining = available - releaseAmount (where releaseAmount includes saved data)
    initialRemainingAmounts.value.clear()
    finalRows.forEach((row) => {
      if (row.cost_code_uuid && row.retainageAmount) {
        const availableAmount = getRemainingRetainageAmount(row.cost_code_uuid, row.retainageAmount)
        const releaseAmount = parseFloat(String(row.releaseAmount || 0)) || 0
        const initialRemaining = availableAmount - releaseAmount
        initialRemainingAmounts.value.set(row.id, initialRemaining)
      }
    })
    
    // Only emit if the data actually changed to prevent infinite loops
    const currentModelValue = Array.isArray(props.modelValue) ? props.modelValue : []
    const hasChanged = JSON.stringify(costCodeRows.value) !== JSON.stringify(currentModelValue)
    if (hasChanged) {
      emit('update:modelValue', costCodeRows.value)
    }
  } catch (error) {
    console.error('[HoldbackBreakdownTable] Error processing items:', error)
    costCodeRows.value = []
  } finally {
    loading.value = false
    isProcessingItems.value = false
  }
}

// Handlers
const handleCostCodeChange = (index: number, value: string | null, option?: any) => {
  if (index < 0 || index >= costCodeRows.value.length) return

  const row = { ...costCodeRows.value[index] }
  row.cost_code_uuid = value || null

  // Fetch cost code configurations in background if needed (non-blocking)
  if (value && props.corporationUuid && costCodeConfigMap.value.size === 0) {
    // Don't await - fetch in background and update later if needed
    fetchCostCodeConfigurations(props.corporationUuid).catch((error) => {
      // Silently fail - we'll try to get config from option or use defaults
      console.warn('[HoldbackBreakdownTable] Failed to fetch cost code configurations:', error)
    })
  }

  if (option?.costCode) {
    const costCode = option.costCode
    row.cost_code_number = costCode.cost_code_number || ''
    row.cost_code_name = costCode.cost_code_name || ''
    row.cost_code_label = [costCode.cost_code_number, costCode.cost_code_name].filter(Boolean).join(' ').trim() || null
  } else if (value) {
    const config = costCodeConfigMap.value.get(value)
    if (config) {
      row.cost_code_number = config.cost_code_number || ''
      row.cost_code_name = config.cost_code_name || ''
      row.cost_code_label = [config.cost_code_number, config.cost_code_name].filter(Boolean).join(' ').trim() || null
      // Set GL account from cost code configuration if not already set
      if (!row.gl_account_uuid && config.gl_account_uuid) {
        row.gl_account_uuid = config.gl_account_uuid
      }
    }
  } else {
    // Clear GL account if cost code is cleared
    row.gl_account_uuid = null
  }

  costCodeRows.value[index] = row
  emit('update:modelValue', costCodeRows.value)
}

const handleGLAccountChange = (index: number, value: string | null | undefined, account?: any) => {
  if (index < 0 || index >= costCodeRows.value.length) return

  const row = { ...costCodeRows.value[index] }
  row.gl_account_uuid = value || null

  costCodeRows.value[index] = row
  emit('update:modelValue', costCodeRows.value)
}

const handleReleaseAmountChange = (index: number, value: string | null) => {
  if (index < 0 || index >= costCodeRows.value.length) return

  const row = { ...costCodeRows.value[index] }
  
  const normalizedInput = normalizeReleaseAmountInput(value)
  let numericValue: number | null = null
  if (normalizedInput !== null) {
    const parsed = parseFloat(normalizedInput)
    if (!isNaN(parsed) && parsed >= 0) {
      // Check if value exceeds available retainage amount
      const costCodeUuid = row.cost_code_uuid
      const retainageAmount = row.retainageAmount || 0
      const remaining = getRemainingRetainageAmount(costCodeUuid, retainageAmount)
      
      // Allow user to type any value (for validation/highlighting), but don't cap it here
      // The max attribute on the input will prevent entering values above available
      numericValue = parsed
    }
  }

  row.releaseAmount = numericValue
  costCodeRows.value[index] = row
  emit('update:modelValue', costCodeRows.value)
}

const normalizeReleaseAmountInput = (value: string | null | undefined): string | null => {
  if (value === null || value === undefined) return null
  const raw = String(value).trim()
  if (!raw) return null
  const cleaned = raw.replace(/[^\d.]/g, '')
  if (!cleaned) return null
  const parts = cleaned.split('.')
  const integerPart = parts[0] || '0'
  const decimalPart = parts.length > 1 ? parts.slice(1).join('').slice(0, 2) : ''
  const normalized = decimalPart ? `${integerPart}.${decimalPart}` : integerPart
  if (normalized === '' || normalized === '.') return null
  return normalized
}

const preventReleaseAmountKeydown = (event: KeyboardEvent) => {
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
  if ((event.ctrlKey || event.metaKey) && ['a', 'c', 'v', 'x', 'z', 'y'].includes(event.key.toLowerCase())) return
  if (!/^[0-9.]$/.test(event.key)) {
    event.preventDefault()
    return
  }
  const target = event.target as HTMLInputElement | null
  const current = target?.value ?? ''
  if (event.key === '.') {
    if (current.includes('.')) event.preventDefault()
    return
  }
  const dotIndex = current.indexOf('.')
  if (dotIndex >= 0 && target) {
    const selectionStart = target.selectionStart ?? current.length
    const selectionEnd = target.selectionEnd ?? current.length
    const isReplacing = selectionEnd > selectionStart
    const decimalsCount = current.length - dotIndex - 1
    if (selectionStart > dotIndex && !isReplacing && decimalsCount >= 2) {
      event.preventDefault()
    }
  }
}

const preventReleaseAmountPaste = (event: ClipboardEvent) => {
  const pastedText = event.clipboardData?.getData('text') ?? ''
  const normalized = normalizeReleaseAmountInput(pastedText)
  const sanitized = String(pastedText).replace(/[^\d.]/g, '')
  if (!normalized || sanitized !== pastedText.trim()) {
    event.preventDefault()
  }
}

const handleAddRow = (afterIndex?: number) => {
  const newRow = {
    id: `holdback-row-${costCodeRows.value.length}-${Date.now()}`,
    cost_code_uuid: null,
    cost_code_number: '',
    cost_code_name: '',
    cost_code_label: null,
    totalAmount: 0,
    retainageAmount: 0,
    releaseAmount: 0,
    gl_account_uuid: null
  }

  if (afterIndex !== undefined && afterIndex >= 0 && afterIndex < costCodeRows.value.length) {
    costCodeRows.value.splice(afterIndex + 1, 0, newRow)
  } else {
    costCodeRows.value.push(newRow)
  }

  emit('update:modelValue', costCodeRows.value)
}

const handleRemoveRow = (index: number) => {
  if (index >= 0 && index < costCodeRows.value.length) {
    costCodeRows.value.splice(index, 1)
    emit('update:modelValue', costCodeRows.value)
  }
}

// Watch for props changes
watch(
  [() => props.purchaseOrderUuid, () => props.changeOrderUuid, () => props.holdbackInvoiceUuid, () => props.corporationUuid, () => props.currentInvoiceUuid],
  async ([newPoUuid, newCoUuid, newHoldbackUuid, newCorpUuid, newCurrentInvoiceUuid], [oldPoUuid, oldCoUuid, oldHoldbackUuid, oldCorpUuid, oldCurrentInvoiceUuid]) => {
    // Skip if already processing
    if (isProcessingItems.value) {
      return
    }


    // If we have saved data (modelValue), don't clear it even if props are temporarily unset
    // This prevents clearing data during the loading sequence
    const hasSavedData = Array.isArray(props.modelValue) && props.modelValue.length > 0
    
    // Only clear data if we don't have saved data AND props are actually being cleared (not just initially undefined)
    if (!hasSavedData && !newPoUuid && !newCoUuid && !newHoldbackUuid && (oldPoUuid || oldCoUuid || oldHoldbackUuid)) {
      // Props are being cleared (not just initially undefined), so clear the data
      costCodeRows.value = []
      loading.value = false
      return
    }

    // If we have saved data but props aren't set yet, wait for them to be set
    if (hasSavedData && !newPoUuid && !newCoUuid && !newHoldbackUuid) {
      // Don't process yet, wait for props to be set
      return
    }

    if (newCorpUuid) {
      await Promise.all([
        fetchCostCodeConfigurations(newCorpUuid),
        fetchChartOfAccounts(newCorpUuid)
      ])
    }
    await processItems()
  },
  { immediate: false } // Changed to false to prevent firing before props are set
)

// Watch for modelValue changes (when loading existing invoice)
// Only process if we're not already processing and the data actually changed
watch(
  () => props.modelValue,
  async (newValue, oldValue) => {
    // Skip if we're already processing to prevent infinite loops
    if (isProcessingItems.value) {
      return
    }

    // Skip if the data hasn't actually changed (deep comparison)
    if (JSON.stringify(newValue) === JSON.stringify(oldValue)) {
      return
    }

    // If we have saved data, ensure we process items to load them
    // This handles the case where saved data arrives after the component has already processed items
    if (Array.isArray(newValue) && newValue.length > 0) {
      // If we have PO/CO and holdback invoice UUID, process items to merge saved data
      if ((props.purchaseOrderUuid || props.changeOrderUuid) && props.holdbackInvoiceUuid) {
        // Only process if we don't already have rows or if the saved data is different
        const currentRowsString = JSON.stringify(costCodeRows.value)
        const newValueString = JSON.stringify(newValue)
        if (costCodeRows.value.length === 0 || currentRowsString !== newValueString) {
          await processItems()
        }
      } else if (costCodeRows.value.length === 0) {
        // If we don't have PO/CO yet but have saved data, load it directly
        // This handles the case where saved data arrives before PO/CO is set
        const savedRows = newValue
          .map((savedRow: any) => ({
            id: savedRow.id || savedRow.uuid || `holdback-row-${Date.now()}-${Math.random().toString(36).substring(2)}`,
            cost_code_uuid: savedRow.cost_code_uuid || null,
            cost_code_label: savedRow.cost_code_label || null,
            cost_code_number: savedRow.cost_code_number || null,
            cost_code_name: savedRow.cost_code_name || null,
            totalAmount: savedRow.totalAmount !== undefined ? savedRow.totalAmount : (savedRow.total_amount !== undefined ? savedRow.total_amount : 0),
            retainageAmount: savedRow.retainageAmount !== undefined ? savedRow.retainageAmount : (savedRow.retainage_amount !== undefined ? savedRow.retainage_amount : 0),
            releaseAmount: savedRow.releaseAmount !== undefined && savedRow.releaseAmount !== null
              ? savedRow.releaseAmount
              : (savedRow.release_amount !== undefined && savedRow.release_amount !== null ? savedRow.release_amount : 0),
            gl_account_uuid: savedRow.gl_account_uuid || null
          }))
          .filter(isPositiveHoldbackAmount)
        costCodeRows.value = savedRows
        // Only emit if data actually changed
        const currentModelValue = Array.isArray(props.modelValue) ? props.modelValue : []
        if (JSON.stringify(savedRows) !== JSON.stringify(currentModelValue)) {
          emit('update:modelValue', costCodeRows.value)
        }
      }
    } else if (Array.isArray(newValue) && newValue.length === 0 && costCodeRows.value.length > 0) {
      // If modelValue is cleared, clear rows
      costCodeRows.value = []
    }
  },
  { immediate: false, deep: true } // Changed to false to avoid immediate processing on mount
)

// Initialize
onMounted(async () => {
  // If we have saved data but props aren't set yet, load it directly
  // This handles the case where the component mounts with saved data before props are set
  if (Array.isArray(props.modelValue) && props.modelValue.length > 0 && costCodeRows.value.length === 0) {
    if (!props.purchaseOrderUuid && !props.changeOrderUuid && !props.holdbackInvoiceUuid) {
      // Load saved data directly if props aren't set yet
      const savedRows = props.modelValue
        .map((savedRow: any) => ({
          id: savedRow.id || savedRow.uuid || `holdback-row-${Date.now()}-${Math.random().toString(36).substring(2)}`,
          cost_code_uuid: savedRow.cost_code_uuid || null,
          cost_code_label: savedRow.cost_code_label || null,
          cost_code_number: savedRow.cost_code_number || null,
          cost_code_name: savedRow.cost_code_name || null,
          totalAmount: savedRow.totalAmount !== undefined ? savedRow.totalAmount : (savedRow.total_amount !== undefined ? savedRow.total_amount : 0),
          retainageAmount: savedRow.retainageAmount !== undefined ? savedRow.retainageAmount : (savedRow.retainage_amount !== undefined ? savedRow.retainage_amount : 0),
          releaseAmount: savedRow.releaseAmount !== undefined && savedRow.releaseAmount !== null
            ? savedRow.releaseAmount
            : (savedRow.release_amount !== undefined && savedRow.release_amount !== null ? savedRow.release_amount : 0),
          gl_account_uuid: savedRow.gl_account_uuid || null
        }))
        .filter(isPositiveHoldbackAmount)
      costCodeRows.value = savedRows
    }
  }

  if (props.corporationUuid) {
    await Promise.all([
      fetchCostCodeConfigurations(props.corporationUuid),
      fetchChartOfAccounts(props.corporationUuid)
    ])
  }
  
  // Process items if we have all required props
  if ((props.purchaseOrderUuid || props.changeOrderUuid) && props.holdbackInvoiceUuid && props.corporationUuid) {
    await processItems()
  }
  await processItems()
})

// Expose validation error and helper methods to parent component
defineExpose({
  hasValidationError: hasExceededReleaseAmount,
  hasExceededReleaseAmount,
  filteredCostCodeRows,
  getOriginalIndex,
  getRemainingReleaseAmount,
  costCodeRows,
})
</script>

