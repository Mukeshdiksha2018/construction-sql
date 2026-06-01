<template>
  <div v-if="showTable" class="mt-6">
    <UCard variant="soft">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-base font-semibold text-default">
          Advance Payment Distribution
        </h3>
        <div class="flex items-center gap-2">
          <!-- Show Removed Cost Codes Button -->
          <UButton
            v-if="hasRemovedCostCodes"
            icon="i-heroicons-arrow-path"
            size="sm"
            color="neutral"
            variant="outline"
            @click="openRemovedCostCodesModal"
          >
            Show Removed Cost Codes ({{ removedCostCodesList.length }})
          </UButton>
          <UButton
            v-if="!readonly"
            icon="i-heroicons-plus"
            size="sm"
            color="primary"
            variant="outline"
            @click="() => handleAddRow()"
          >
            Add Row
          </UButton>
        </div>
      </div>

      <!-- Loading state with skeleton -->
      <div v-if="loading || isLoadingData" class="overflow-x-auto">
        <table class="min-w-full divide-y divide-default/60">
          <thead class="bg-muted/20 text-[11px] font-semibold uppercase tracking-wide text-muted">
            <tr>
              <th class="px-3 py-2 text-left"><USkeleton class="h-3 w-20" /></th>
              <th class="px-3 py-2 text-left"><USkeleton class="h-3 w-20" /></th>
              <th class="px-3 py-2 text-right"><USkeleton class="h-3 w-24" /></th>
              <th class="px-3 py-2 text-right"><USkeleton class="h-3 w-24" /></th>
              <th class="px-3 py-2 text-center"><USkeleton class="h-3 w-16" /></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default/60 text-sm text-default bg-white dark:bg-gray-900/40">
            <tr v-for="i in 3" :key="i" class="align-middle">
              <td class="px-3 py-2"><USkeleton class="h-8 w-full" /></td>
              <td class="px-3 py-2"><USkeleton class="h-8 w-full" /></td>
              <td class="px-3 py-2 text-right"><USkeleton class="h-4 w-20 ml-auto" /></td>
              <td class="px-3 py-2 text-right"><USkeleton class="h-8 w-24 ml-auto" /></td>
              <td class="px-3 py-2 text-center"><USkeleton class="h-6 w-12 mx-auto" /></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Table -->
      <div v-else-if="costCodeRows.length > 0" class="overflow-x-auto">
        <table class="min-w-full divide-y divide-default/60">
          <thead class="bg-muted/20 text-[11px] font-semibold uppercase tracking-wide text-muted">
            <tr>
              <th class="px-3 py-2 text-left">Cost Code</th>
              <th class="px-3 py-2 text-left">GL Account</th>
              <th class="px-3 py-2 text-right">Total Amount</th>
              <th class="px-3 py-2 text-right">Advance Amount</th>
              <th class="px-3 py-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default/60 text-sm text-default bg-white dark:bg-gray-900/40">
            <tr
              v-for="(row, index) in costCodeRows"
              :key="row.id || index"
              :class="[
                'align-middle transition-colors duration-150',
                hasOverAdvancedAmount(row)
                  ? 'bg-error-50/50 dark:bg-error-900/20 border-l-4 border-error-500 hover:bg-error-50 dark:hover:bg-error-900/30'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
              ]"
            >
              <!-- Cost Code -->
              <td class="px-3 py-2 align-middle">
                <CostCodeSelect
                  :model-value="row.cost_code_uuid || undefined"
                  :corporation-uuid="corporationUuid"
                  :external-configurations="scopedCostCodeConfigurations"
                  size="xs"
                  class="w-full"
                  :disabled="isCostCodeDisabledForRow(row)"
                  placeholder="Select Cost Code"
                  @update:model-value="(value) => handleCostCodeChange(index, value ?? null)"
                  @change="(option) => handleCostCodeChange(index, (option?.costCode?.uuid || option?.value) ?? null, option)"
                />
              </td>

              <!-- GL Account -->
              <td class="px-3 py-2 align-middle">
                <ChartOfAccountsSelect
                  :key="`gl-account-${row.id}`"
                  :model-value="row.gl_account_uuid || undefined"
                  :local-accounts="localChartOfAccounts"
                  size="xs"
                  class="w-full"
                  :disabled="readonly || !row.cost_code_uuid"
                  placeholder="Select GL Account"
                  @update:model-value="(value) => handleGLAccountChange(index, value)"
                />
              </td>

              <!-- Total Amount -->
              <td class="px-3 py-2 align-middle text-right">
                <span class="text-sm font-medium text-default">
                  {{ formatCurrency(row.totalAmount || 0) }}
                </span>
              </td>

              <!-- Advance Amount -->
              <td class="px-3 py-2 align-middle">
                <div class="relative">
                  <span class="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted">
                    {{ currencySymbol }}
                  </span>
                  <UInput
                    :model-value="row.advanceAmount !== null && row.advanceAmount !== undefined ? String(row.advanceAmount) : ''"
                    type="text"
                    step="0.01"
                    min="0"
                    pattern="[0-9.]*"
                    inputmode="decimal"
                    size="xs"
                    class="w-full pl-6"
                    :disabled="readonly || !row.cost_code_uuid"
                    placeholder="0.00"
                    @update:model-value="(value) => handleAdvanceAmountChange(index, value)"
                    @keydown="preventAdvanceAmountKeydown"
                    @paste="preventAdvanceAmountPaste"
                  />
                </div>
              </td>

              <!-- Action -->
              <td class="px-3 py-2 align-middle text-center">
                <div class="flex items-center justify-center gap-1">
                  <UButton
                    v-if="!readonly"
                    icon="i-heroicons-plus"
                    size="xs"
                    color="primary"
                    variant="soft"
                    class="p-1"
                    @click="handleAddRow(index)"
                  />
                  <UButton
                    v-if="!readonly"
                    icon="i-heroicons-x-mark"
                    size="xs"
                    color="error"
                    variant="soft"
                    class="p-1"
                    @click="handleRemoveRow(index)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty state -->
      <div v-else class="text-center py-8">
        <p class="text-sm text-muted">No cost codes found in the selected PO/CO</p>
      </div>

    </UCard>

    <!-- Removed Cost Codes Modal -->
    <UModal v-model:open="removedCostCodesModalOpen">
      <template #header>
        <div class="flex items-center justify-between w-full">
          <h3 class="text-base font-semibold">Removed Cost Codes</h3>
          <UButton icon="i-heroicons-x-mark" size="xs" variant="solid" color="neutral" @click="closeRemovedCostCodesModal" />
        </div>
      </template>
      <template #body>
        <div v-if="removedCostCodesList.length" class="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          <div
            v-for="(costCode, index) in removedCostCodesList"
            :key="costCode.cost_code_uuid || `removed-${index}`"
            class="p-3 border border-default rounded-lg bg-elevated/40 dark:bg-elevated/20 flex flex-col gap-2"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0 flex-1">
                <div class="text-sm font-semibold text-default truncate">
                  {{ costCode.cost_code_label || (costCode.cost_code_number && costCode.cost_code_name ? `${costCode.cost_code_number} ${costCode.cost_code_name}`.trim() : `Cost Code ${index + 1}`) }}
                </div>
                <div class="text-xs text-muted mt-1 space-x-2">
                  <span v-if="costCode.cost_code_number">
                    Number: {{ costCode.cost_code_number }}
                  </span>
                  <span v-if="costCode.totalAmount !== null && costCode.totalAmount !== undefined">
                    Total: {{ formatCurrency(costCode.totalAmount) }}
                  </span>
                </div>
                <div v-if="costCode.removed_at" class="text-[11px] text-muted mt-1">
                  Removed: {{ formatRemovedDate(costCode.removed_at) }}
                </div>
              </div>
              <div class="flex flex-col items-end gap-2 shrink-0">
                <UButton size="xs" color="primary" variant="solid" @click="restoreRemovedCostCode(index)">
                  Restore
                </UButton>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="py-6 text-sm text-muted text-center">
          No removed cost codes available.
        </div>
      </template>
      <template #footer>
        <div class="flex justify-between w-full">
          <UButton color="neutral" variant="soft" @click="closeRemovedCostCodesModal">
            Close
          </UButton>
          <UButton
            v-if="removedCostCodesList.length"
            color="primary"
            variant="solid"
            @click="restoreAllRemovedCostCodes"
          >
            Restore All ({{ removedCostCodesList.length }})
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick, triggerRef } from 'vue'
import { useCurrencyFormat } from '~/composables/useCurrencyFormat'
import CostCodeSelect from '~/components/shared/CostCodeSelect.vue'
import ChartOfAccountsSelect from '~/components/shared/ChartOfAccountsSelect.vue'

interface Props {
  poCoUuid?: string | null
  poCoType?: 'PO' | 'CO' | null
  corporationUuid?: string
  readonly?: boolean
  modelValue?: any[]
  removedCostCodes?: any[] // Array of removed cost codes from saved data
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  modelValue: () => [],
  removedCostCodes: () => []
})

const emit = defineEmits<{
  'update:modelValue': [value: any[]]
  'update:removedCostCodes': [value: any[]] // Emit removed cost codes to parent for saving
}>()

const { formatCurrency, currencySymbol } = useCurrencyFormat()

// Local state
const loading = ref(false)
const isLoadingData = ref(false) // Loading state for when loading existing data from modelValue
const costCodeRows = ref<any[]>([])
const costCodeConfigMap = ref<Map<string, any>>(new Map())
// Local chart of accounts for the form's corporation (not TopBar's)
// This ensures we don't pollute the global store
const localChartOfAccounts = ref<any[]>([])
const cachedCostCodeConfigs = ref<Map<string, any[]>>(new Map()) // Cache cost code configurations by corporation UUID
// Track cost codes that have been explicitly removed by the user
// Store full cost code data for restoration
// Use a reactive array instead of Map for better Vue reactivity
const removedCostCodes = ref<any[]>([])
// Track when user is actively editing to prevent watcher from overwriting selections
const isUserEditing = ref(false)
// Track the last emitted value to prevent watcher from clearing when parent updates
const lastEmittedValue = ref<any[]>([])

// Helper to get a Map view of removed cost codes (for efficient lookups)
const removedCostCodesMap = computed(() => {
  const map = new Map<string, any>()
  removedCostCodes.value.forEach((costCode: any) => {
    if (costCode.cost_code_uuid) {
      map.set(costCode.cost_code_uuid, costCode)
    }
  })
  return map
})

// Scoped cost code configurations for passing to CostCodeSelect
// This ensures CostCodeSelect uses the form's corporation cost codes, not TopBar's
const scopedCostCodeConfigurations = computed(() => {
  if (!props.corporationUuid) return []
  
  // Get cached configurations for this corporation
  const configs = cachedCostCodeConfigs.value.get(props.corporationUuid) || []
  
  // Return active configurations
  return configs.filter((config: any) => config?.is_active !== false && config?.uuid)
})

// Initialize removed cost codes from props (when loading existing invoice)
const initializeRemovedCostCodes = () => {
  if (Array.isArray(props.removedCostCodes) && props.removedCostCodes.length > 0) {
    // Create a new array to ensure reactivity
    removedCostCodes.value = [...props.removedCostCodes]
  }
}

// Computed
const showTable = computed(() => {
  return props.poCoUuid && props.poCoType
})

// Cost code should be disabled when readonly OR when PO/CO is selected (cost codes come from PO/CO)
// However, user-added rows (rows without a cost_code_uuid from PO/CO) should allow cost code selection
const isCostCodeDisabledForRow = (row: any) => {
  // Always disabled if readonly
  if (props.readonly) return true
  
  // If PO/CO is selected, check if this is a user-added row
  // User-added rows have an id starting with "new-row-" or don't have a cost_code_uuid that came from PO/CO
  if (props.poCoUuid && props.poCoType) {
    // Check if this row is a user-added row (not from PO/CO)
    // User-added rows typically have id starting with "new-row-" or were added manually
    // Saved rows from database have numeric id or uuid, so they should be disabled
    const rowId = row.id
    const isUserAddedRow = 
      (typeof rowId === 'string' && rowId.startsWith('new-row-')) ||
      (!row.cost_code_uuid)
    
    // Allow cost code selection for user-added rows
    if (isUserAddedRow) {
      return false
    }
    
    // Disable for rows that came from PO/CO
    return true
  }
  
  // If no PO/CO selected, allow cost code selection
  return false
}

// Legacy computed for backward compatibility (not used anymore but kept for reference)
const isCostCodeDisabled = computed(() => {
  return props.readonly || !!(props.poCoUuid && props.poCoType)
})

// Computed properties for removed cost codes UI
const removedCostCodesList = computed(() => {
  return removedCostCodes.value
})

const hasRemovedCostCodes = computed(() => {
  return removedCostCodes.value.length > 0
})

const removedCostCodesModalOpen = ref(false)

const openRemovedCostCodesModal = () => {
  removedCostCodesModalOpen.value = true
}

const closeRemovedCostCodesModal = () => {
  removedCostCodesModalOpen.value = false
}

const formatRemovedDate = (dateString: string) => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    return date.toLocaleString()
  } catch {
    return dateString
  }
}

// Store the PO/CO type for use in processItems
const poCoType = computed(() => props.poCoType)
const poCoUuid = computed(() => props.poCoUuid)

// Fetch PO items (including location-wise material items when available)
const fetchPOItems = async (poUuid: string) => {
  try {
    const poResponse = await $fetch<{ data: any }>(`/api/purchase-order-forms/${poUuid}`)
    const poType = poResponse?.data?.po_type?.toUpperCase()

    const apiUrl = poType === 'LABOR'
      ? `/api/labor-purchase-order-items?purchase_order_uuid=${poUuid}`
      : `/api/purchase-order-items?purchase_order_uuid=${poUuid}`

    const response = await $fetch<{ data: any[] }>(apiUrl)
    const regularItems = Array.isArray(response?.data) ? response.data : []

    const lwmItems = Array.isArray(poResponse?.data?.po_location_wise_material_items)
      ? poResponse.data.po_location_wise_material_items
      : []

    return [...regularItems, ...lwmItems]
  } catch (error) {
    console.error('[AdvancePaymentCostCodesTable] Error fetching PO items:', error)
    return []
  }
}

// Fetch CO items (including location-wise material items when available)
const fetchCOItems = async (coUuid: string) => {
  try {
    const coResponse = await $fetch<{ data: any }>(`/api/change-orders/${coUuid}`)
    const coType = coResponse?.data?.co_type?.toUpperCase()

    const apiUrl = coType === 'LABOR'
      ? `/api/labor-change-order-items?change_order_uuid=${coUuid}`
      : `/api/change-order-items?change_order_uuid=${coUuid}`

    const response = await $fetch<{ data: any[] }>(apiUrl)
    const regularItems = Array.isArray(response?.data) ? response.data : []

    const lwmItems = Array.isArray(coResponse?.data?.co_location_wise_material_items)
      ? coResponse.data.co_location_wise_material_items
      : []

    return [...regularItems, ...lwmItems]
  } catch (error) {
    console.error('[AdvancePaymentCostCodesTable] Error fetching CO items:', error)
    return []
  }
}

// Fetch cost code configurations (with caching)
const fetchCostCodeConfigurations = async (corporationUuid: string) => {
  if (!corporationUuid) return
  
  // Return cached data if available
  if (cachedCostCodeConfigs.value.has(corporationUuid)) {
    const configs = cachedCostCodeConfigs.value.get(corporationUuid) || []
    costCodeConfigMap.value.clear()
    configs
      .filter((config: any) => config?.is_active !== false && config?.uuid) // Only active configurations
      .forEach((config: any) => {
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
    console.error('[AdvancePaymentCostCodesTable] Error fetching cost code configurations:', error)
    // Don't throw - just log the error and continue
    cachedCostCodeConfigs.value.set(corporationUuid, []) // Cache empty array to prevent repeated failed fetches
  }
}

// Fetch chart of accounts directly from API for the form's corporation
// This ensures we don't pollute the global store which is scoped to TopBar's corporation
const fetchChartOfAccounts = async (corporationUuid: string) => {
  if (!corporationUuid) return
  
  try {
    // Fetch accounts directly from API for the form's corporation
    const response = await $fetch<{ data: any[] }>(`/api/corporations/chart-of-accounts?corporation_uuid=${corporationUuid}`)
    
    // Handle different response types
    let accounts: any[] = []
    if (response?.data) {
      accounts = Array.isArray(response.data) ? response.data : []
    } else if (Array.isArray(response)) {
      accounts = response
    }
    
    localChartOfAccounts.value = accounts
  } catch (error) {
    console.error('[AdvancePaymentCostCodesTable] Error fetching chart of accounts:', error)
    localChartOfAccounts.value = []
  }
}

// Handler for GL account changes
const handleGLAccountChange = (index: number, value: string | null | undefined) => {
  if (index < 0 || index >= costCodeRows.value.length) return

  // Ignore if value is explicitly undefined (component might be initializing or clearing)
  // Only process if value is a string (UUID) or null (explicitly cleared)
  if (value === undefined) {
    console.log('[AdvancePaymentCostCodesTable] handleGLAccountChange called with undefined - ignoring (likely component initialization or internal state update)')
    return
  }

  const currentRow = costCodeRows.value[index]
  const currentGLAccount = currentRow?.gl_account_uuid
  
  // Skip if the value hasn't actually changed (prevents duplicate processing)
  if (currentGLAccount === value) {
    console.log('[AdvancePaymentCostCodesTable] handleGLAccountChange called with same value - skipping duplicate update:', {
      index,
      value,
      currentGLAccount
    })
    return
  }

  console.log('[AdvancePaymentCostCodesTable] handleGLAccountChange called:', {
    index,
    value,
    valueType: typeof value,
    currentRow,
    currentGLAccount,
    isChanging: true
  })

  // Set flag to prevent watcher from overwriting user selection
  isUserEditing.value = true

  const row = { ...currentRow }
  // Use the value directly - it's either a string (UUID) or null
  row.gl_account_uuid = value

  costCodeRows.value[index] = row
  
  console.log('[AdvancePaymentCostCodesTable] Updated row:', {
    index,
    row: costCodeRows.value[index],
    allRows: costCodeRows.value.map((r: any) => ({
      id: r.id,
      cost_code_uuid: r.cost_code_uuid,
      gl_account_uuid: r.gl_account_uuid
    }))
  })
  
  // Store the emitted value to prevent watcher from overwriting
  lastEmittedValue.value = [...costCodeRows.value]
  
  console.log('[AdvancePaymentCostCodesTable] Emitting update:modelValue with GL accounts:', 
    costCodeRows.value.map((r: any) => ({
      id: r.id,
      cost_code_uuid: r.cost_code_uuid,
      gl_account_uuid: r.gl_account_uuid
    }))
  )
  
  emit('update:modelValue', costCodeRows.value)
  
  // Reset flag after a short delay to allow watcher to process if needed
  nextTick(() => {
    setTimeout(() => {
      isUserEditing.value = false
    }, 100)
  })
}

// Process items and group by cost code
const processItems = async () => {
  // DO NOT process items if we have loaded saved data - this would overwrite saved advance payment cost codes
  if (hasLoadedSavedData.value) {
    console.log('[AdvancePaymentCostCodesTable] processItems called but hasLoadedSavedData is true - skipping to preserve saved data')
    return
  }
  
  // Also check if costCodeRows already has saved data (defensive check)
  // This handles cases where the flag might not be set yet but we already have saved data
  const hasSavedDataInRows = costCodeRows.value.length > 0 && 
    costCodeRows.value.some((row: any) => {
      const hasDatabaseId = (row.id && typeof row.id === 'number') || 
        (row.uuid && typeof row.uuid === 'string' && row.uuid.length > 10) ||
        (row.id && typeof row.id === 'string' && !row.id.startsWith('cost-code-') && !row.id.startsWith('new-row-') && !row.id.startsWith('row-'))
      const hasAdvanceAmount = (row.advanceAmount !== null && row.advanceAmount !== undefined && row.advanceAmount !== 0) ||
        (row.advance_amount !== null && row.advance_amount !== undefined && row.advance_amount !== 0)
      return hasDatabaseId || hasAdvanceAmount
    })
  
  if (hasSavedDataInRows) {
    console.log('[AdvancePaymentCostCodesTable] processItems called but costCodeRows has saved data - skipping to preserve saved data', {
      rows: costCodeRows.value.map((r: any) => ({
        id: r.id,
        uuid: r.uuid,
        advanceAmount: r.advanceAmount || r.advance_amount
      }))
    })
    hasLoadedSavedData.value = true // Set flag to prevent future calls
    return
  }
  
  // Also check modelValue for saved data (another defensive check)
  const hasSavedDataInModelValue = Array.isArray(props.modelValue) && props.modelValue.length > 0 && 
    props.modelValue.some((row: any) => {
      const hasDatabaseId = (row.id && typeof row.id === 'number') || 
        (row.uuid && typeof row.uuid === 'string' && row.uuid.length > 10)
      const hasAdvanceAmount = (row.advanceAmount !== null && row.advanceAmount !== undefined && row.advanceAmount !== 0) ||
        (row.advance_amount !== null && row.advance_amount !== undefined && row.advance_amount !== 0)
      return hasDatabaseId || hasAdvanceAmount
    })
  
  if (hasSavedDataInModelValue) {
    console.log('[AdvancePaymentCostCodesTable] processItems called but modelValue has saved data - skipping to preserve saved data')
    hasLoadedSavedData.value = true // Set flag to prevent future calls
    return
  }
  
  if (!props.poCoUuid || !props.poCoType) {
    costCodeRows.value = []
    return
  }

  loading.value = true

  try {
    // Extract UUID from "PO:uuid" or "CO:uuid" format
    const uuid = props.poCoUuid.replace(/^(PO|CO):/, '').trim()
    
    // Fetch items based on type
    const items = props.poCoType === 'PO' 
      ? await fetchPOItems(uuid)
      : await fetchCOItems(uuid)

    // Fetch cost code configurations and chart of accounts if needed
    // This ensures both cost codes and GL accounts are available
    if (props.corporationUuid) {
      await Promise.all([
        fetchCostCodeConfigurations(props.corporationUuid),
        fetchChartOfAccounts(props.corporationUuid)
      ])
    }

    // Group items by cost_code_uuid and calculate totals
    const costCodeMap = new Map<string, {
      cost_code_uuid: string
      cost_code_label: string
      cost_code_number: string
      cost_code_name: string
      totalAmount: number
      items: any[]
    }>()

    items.forEach((item: any, index: number) => {
      // Extract cost_code_uuid - check both direct property and metadata (for CO items)
      const metadata = item?.metadata || item?.display_metadata || item?.displayMetadata || {}
      const costCodeUuid = item.cost_code_uuid || metadata.cost_code_uuid
      
      if (!costCodeUuid) {
        return
      }

      // Skip cost codes that have been explicitly removed by the user
      if (removedCostCodesMap.value.has(costCodeUuid)) {
        return
      }

      // Extract cost code label - check both direct property and metadata
      // If not found, look up from cost code configurations store
      let costCodeLabel = item.cost_code_label || 
        metadata.cost_code_label ||
        metadata.cost_code ||
        (item.cost_code_number && item.cost_code_name 
          ? `${item.cost_code_number} ${item.cost_code_name}`.trim()
          : null) ||
        (metadata.cost_code_number && metadata.cost_code_name
          ? `${metadata.cost_code_number} ${metadata.cost_code_name}`.trim()
          : null)
      
      // If still no label, try to get it from cost code configurations store
      if (!costCodeLabel && costCodeUuid) {
        const costCodeConfig = costCodeConfigMap.value.get(costCodeUuid)
        if (costCodeConfig) {
          const number = costCodeConfig.cost_code_number || ''
          const name = costCodeConfig.cost_code_name || ''
          costCodeLabel = [number, name].filter(Boolean).join(' ').trim() || null
        }
      }
      
      if (!costCodeLabel) {
        return
      }

      // Calculate total for this item
      // Handle both labor and material items:
      // Labor items: po_amount/co_amount, Material items: po_total/co_total
      const itemTotal = props.poCoType === 'PO'
        ? (item.po_amount || item.po_total || item.total || 0)
        : (item.co_amount || item.co_total || item.total || 0)

      if (costCodeMap.has(costCodeUuid)) {
        const existing = costCodeMap.get(costCodeUuid)!
        existing.totalAmount += Number(itemTotal) || 0
        existing.items.push(item)
      } else {
        // Extract cost code number and name from item or metadata
        // If not found, look up from cost code configurations store
        let costCodeNumber = item.cost_code_number || metadata.cost_code_number || ''
        let costCodeName = item.cost_code_name || metadata.cost_code_name || ''
        
        // If still missing, get from cost code configurations store
        if ((!costCodeNumber || !costCodeName) && costCodeUuid) {
          const costCodeConfig = costCodeConfigMap.value.get(costCodeUuid)
          if (costCodeConfig) {
            costCodeNumber = costCodeNumber || costCodeConfig.cost_code_number || ''
            costCodeName = costCodeName || costCodeConfig.cost_code_name || ''
          }
        }
        
        costCodeMap.set(costCodeUuid, {
          cost_code_uuid: costCodeUuid,
          cost_code_label: costCodeLabel,
          cost_code_number: costCodeNumber,
          cost_code_name: costCodeName,
          totalAmount: Number(itemTotal) || 0,
          items: [item]
        })
      }
    })

    // Build a map of existing rows by cost_code_uuid
    const existingRowsMap = new Map(
      costCodeRows.value
        .filter(row => row.cost_code_uuid)
        .map(row => [row.cost_code_uuid, row])
    )

    // Create new rows only for cost codes that:
    // 1. Are not in the removed set
    // 2. Don't already exist in costCodeRows (to preserve loaded data)
    const newRows = Array.from(costCodeMap.values())
      .filter(costCode => {
        // Skip removed cost codes
        if (removedCostCodesMap.value.has(costCode.cost_code_uuid)) {
          return false
        }
        // Skip cost codes that already exist in costCodeRows (preserve loaded data)
        if (existingRowsMap.has(costCode.cost_code_uuid)) {
          return false
        }
        return true
      })
      .map((costCode, index) => {
        const config = costCodeConfigMap.value.get(costCode.cost_code_uuid)
        const glAccountUuid = config?.gl_account_uuid ?? null
        
        return {
          id: `cost-code-${costCode.cost_code_uuid}-${index}`,
          cost_code_uuid: costCode.cost_code_uuid,
          cost_code_label: costCode.cost_code_label,
          cost_code_number: costCode.cost_code_number,
          cost_code_name: costCode.cost_code_name,
          totalAmount: costCode.totalAmount,
          advanceAmount: null,
          gl_account_uuid: glAccountUuid
        }
      })

    // Update existing rows with new totalAmount from PO/CO (in case it changed)
    // Preserve GL account selection - only populate from cost code configuration if not already set
    // IMPORTANT: Always preserve user-selected GL accounts, even if they differ from cost code config
    const updatedExistingRows = costCodeRows.value.map(row => {
      if (row.cost_code_uuid && costCodeMap.has(row.cost_code_uuid)) {
        const costCode = costCodeMap.get(row.cost_code_uuid)!
        const config = costCodeConfigMap.value.get(row.cost_code_uuid)
        
        // ALWAYS preserve existing GL account selection - never overwrite user selections
        // Only populate from cost code configuration if GL account is completely missing (null/undefined)
        let glAccountUuid = row.gl_account_uuid
        // Only set from config if gl_account_uuid is explicitly null/undefined (not just falsy)
        // This ensures we preserve user selections even if they're empty strings
        if ((glAccountUuid === null || glAccountUuid === undefined) && config?.gl_account_uuid) {
          glAccountUuid = config.gl_account_uuid
        }
        
        return {
          ...row,
          totalAmount: costCode.totalAmount,
          // Preserve the existing GL account selection (whether from user or config)
          gl_account_uuid: glAccountUuid
        }
      }
      return row
    })

    // Filter out rows that are in the removed set
    const rowsToKeep = updatedExistingRows.filter(
      row => {
        // Keep user-added rows (rows without cost_code_uuid)
        if (!row.cost_code_uuid) {
          return true
        }
        // Remove rows that are in the removed set
        return !removedCostCodesMap.value.has(row.cost_code_uuid)
      }
    )

    // Combine: existing rows (filtered) + new rows
    const finalRows = [...rowsToKeep, ...newRows]
    
    costCodeRows.value = finalRows
    
    // Wait for next tick to ensure ChartOfAccountsSelect components have received the accounts
    // This ensures the GL account value can be properly displayed
    await nextTick()
    
    // Emit the updated rows
    emit('update:modelValue', costCodeRows.value)
  } catch (error) {
    console.error('[AdvancePaymentCostCodesTable] Error processing items:', error)
    costCodeRows.value = []
  } finally {
    loading.value = false
  }
}

// Handlers
const handleCostCodeChange = (index: number, value: string | null, option?: any) => {
  if (index < 0 || index >= costCodeRows.value.length) return

  const row = { ...costCodeRows.value[index] }
  row.cost_code_uuid = value || null

  // Fetch cost code configurations and chart of accounts in background if needed (non-blocking)
  if (value && props.corporationUuid) {
    if (costCodeConfigMap.value.size === 0) {
      // Don't await - fetch in background and update later if needed
      fetchCostCodeConfigurations(props.corporationUuid).catch((error) => {
        console.warn('[AdvancePaymentCostCodesTable] Failed to fetch cost code configurations:', error)
      })
    }
    // Ensure chart of accounts are loaded so ChartOfAccountsSelect can display the selected value
    if (localChartOfAccounts.value.length === 0) {
      // Don't await - fetch in background
      fetchChartOfAccounts(props.corporationUuid).catch((error) => {
        console.warn('[AdvancePaymentCostCodesTable] Failed to fetch chart of accounts:', error)
      })
    }
  }
  
  // Update GL account and cost code info
  if (value) {
    const config = costCodeConfigMap.value.get(value)
    
    // Set GL account from cost code configuration if not already set
    if (!row.gl_account_uuid && config?.gl_account_uuid) {
      row.gl_account_uuid = config.gl_account_uuid
    }
    
    // Update cost code label from option if available
    if (option?.costCode) {
      row.cost_code_label = option.costCode.cost_code_label || 
        (option.costCode.cost_code_number && option.costCode.cost_code_name
          ? `${option.costCode.cost_code_number} ${option.costCode.cost_code_name}`.trim()
          : null)
      row.cost_code_number = option.costCode.cost_code_number || ''
      row.cost_code_name = option.costCode.cost_code_name || ''
    } else if (config) {
      // Fallback to config if option not available
      row.cost_code_label = config.cost_code_label || 
        (config.cost_code_number && config.cost_code_name
          ? `${config.cost_code_number} ${config.cost_code_name}`.trim()
          : null)
      row.cost_code_number = config.cost_code_number || ''
      row.cost_code_name = config.cost_code_name || ''
    }
  } else {
    row.gl_account_uuid = null
    row.cost_code_label = null
    row.cost_code_number = ''
    row.cost_code_name = ''
  }

  costCodeRows.value[index] = row
  
  // If GL account was set, ensure accounts are loaded (non-blocking)
  // This ensures ChartOfAccountsSelect can display the selected value
  if (row.gl_account_uuid && localChartOfAccounts.value.length === 0 && props.corporationUuid) {
    // Don't await - fetch in background
    fetchChartOfAccounts(props.corporationUuid).catch((error) => {
      console.warn('[AdvancePaymentCostCodesTable] Failed to fetch chart of accounts:', error)
    })
  }
  
  // Store the emitted value to prevent watcher from overwriting
  lastEmittedValue.value = [...costCodeRows.value]
  
  // Use nextTick without await to avoid blocking
  nextTick(() => {
    emit('update:modelValue', costCodeRows.value)
  })
}

const handleAdvanceAmountChange = (index: number, value: string | null) => {
  if (index < 0 || index >= costCodeRows.value.length) return

  const row = { ...costCodeRows.value[index] }
  const normalizedInput = normalizeAdvanceAmountInput(value)
  const numericValue =
    normalizedInput === null
      ? null
      : Number.parseFloat(normalizedInput)
  
  row.advanceAmount = isNaN(numericValue!) ? null : numericValue

  costCodeRows.value[index] = row
  
  // Store the emitted value to prevent watcher from overwriting
  lastEmittedValue.value = [...costCodeRows.value]
  
  emit('update:modelValue', costCodeRows.value)
}

const normalizeAdvanceAmountInput = (value: string | null | undefined): string | null => {
  if (value === null || value === undefined) return null
  const raw = String(value).trim()
  if (!raw) return null
  // Keep only digits and a single decimal point.
  const cleaned = raw.replace(/[^\d.]/g, '')
  if (!cleaned) return null
  const parts = cleaned.split('.')
  const integerPart = parts[0] || '0'
  const decimalPart = parts.length > 1 ? parts.slice(1).join('').slice(0, 2) : ''
  const normalized = decimalPart ? `${integerPart}.${decimalPart}` : integerPart
  if (normalized === '' || normalized === '.') return null
  return normalized
}

const preventAdvanceAmountKeydown = (event: KeyboardEvent) => {
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

const preventAdvanceAmountPaste = (event: ClipboardEvent) => {
  const pastedText = event.clipboardData?.getData('text') ?? ''
  const normalized = normalizeAdvanceAmountInput(pastedText)
  const sanitized = String(pastedText).replace(/[^\d.]/g, '')
  if (!normalized || sanitized !== pastedText.trim()) {
    event.preventDefault()
  }
}

const handleAddRow = (afterIndex?: number) => {
  const newRow = {
    id: `new-row-${Date.now()}-${Math.random().toString(36).substring(2)}`,
    cost_code_uuid: null,
    cost_code_label: null,
    cost_code_number: '',
    cost_code_name: '',
    totalAmount: 0,
    advanceAmount: null,
    gl_account_uuid: null
  }

  if (afterIndex !== undefined && afterIndex >= 0) {
    costCodeRows.value.splice(afterIndex + 1, 0, newRow)
  } else {
    costCodeRows.value.push(newRow)
  }

  // Store the emitted value to prevent watcher from overwriting
  lastEmittedValue.value = [...costCodeRows.value]
  
  emit('update:modelValue', costCodeRows.value)
}

const handleRemoveRow = (index: number) => {
  if (index < 0 || index >= costCodeRows.value.length) return

  const rowToRemove = costCodeRows.value[index]
  
  // If the row has a cost_code_uuid that came from PO/CO (not a user-added row),
  // store it in the removed array with full data for restoration
  if (rowToRemove.cost_code_uuid) {
    const removedCostCode = {
      ...rowToRemove,
      removed_at: new Date().toISOString()
    }
    // Create a new array to ensure Vue reactivity tracks the change
    // Check if already removed to avoid duplicates
    const alreadyRemoved = removedCostCodes.value.some(
      (cc: any) => cc.cost_code_uuid === rowToRemove.cost_code_uuid
    )
    
    if (!alreadyRemoved) {
      // Create a new array reference to ensure Vue reactivity
      const newArray = [...removedCostCodes.value, removedCostCode]
      removedCostCodes.value = newArray
      
      // Force reactivity update
      triggerRef(removedCostCodes)
    }
    
    // Emit removed cost codes to parent for saving (only if not initializing)
    // Use nextTick to ensure the array update is complete before emitting
    if (!isInitializingRemovedCostCodes.value) {
      nextTick(() => {
        emitRemovedCostCodes()
      })
    }
  }
  
  costCodeRows.value.splice(index, 1)
  emit('update:modelValue', costCodeRows.value)
}

// Track the last emitted value to prevent watcher from clearing when parent updates
const lastEmittedRemovedCostCodes = ref<any[]>([])

// Emit removed cost codes array to parent
const emitRemovedCostCodes = () => {
  // Skip emitting if we're initializing from props to prevent recursive updates
  if (isInitializingRemovedCostCodes.value) {
    return
  }
  // Create a new array to ensure reactivity
  const arrayToEmit = [...removedCostCodes.value]
  lastEmittedRemovedCostCodes.value = arrayToEmit
  emit('update:removedCostCodes', arrayToEmit)
}

const restoreRemovedCostCode = (index: number) => {
  if (index < 0 || index >= removedCostCodes.value.length) return
  
  const costCodeToRestore = removedCostCodes.value[index]
  if (!costCodeToRestore.cost_code_uuid) return
  
  // Remove from removed array - create new array to ensure reactivity
  removedCostCodes.value = removedCostCodes.value.filter(
    (cc: any) => cc.cost_code_uuid !== costCodeToRestore.cost_code_uuid
  )
  
  // Emit updated removed cost codes (only if not initializing)
  if (!isInitializingRemovedCostCodes.value) {
    emitRemovedCostCodes()
  }
  
  // Create a new row from the removed cost code data
  const restoredRow = {
    id: costCodeToRestore.id || `cost-code-${costCodeToRestore.cost_code_uuid}-${Date.now()}`,
    cost_code_uuid: costCodeToRestore.cost_code_uuid,
    cost_code_label: costCodeToRestore.cost_code_label,
    cost_code_number: costCodeToRestore.cost_code_number,
    cost_code_name: costCodeToRestore.cost_code_name,
    totalAmount: costCodeToRestore.totalAmount || 0,
    advanceAmount: costCodeToRestore.advanceAmount ?? null,
    gl_account_uuid: costCodeToRestore.gl_account_uuid ?? null
  }
  
  // Add the restored row to costCodeRows
  costCodeRows.value.push(restoredRow)
  
  // Emit the updated rows
  emit('update:modelValue', costCodeRows.value)
  
  // Close modal if no more removed items
  if (removedCostCodes.value.length === 0) {
    closeRemovedCostCodesModal()
  }
}

const restoreAllRemovedCostCodes = () => {
  if (removedCostCodes.value.length === 0) return
  
  const restoredRows: any[] = []
  
  removedCostCodes.value.forEach((costCode: any) => {
    if (costCode.cost_code_uuid) {
      const restoredRow = {
        id: costCode.id || `cost-code-${costCode.cost_code_uuid}-${Date.now()}`,
        cost_code_uuid: costCode.cost_code_uuid,
        cost_code_label: costCode.cost_code_label,
        cost_code_number: costCode.cost_code_number,
        cost_code_name: costCode.cost_code_name,
        totalAmount: costCode.totalAmount || 0,
        advanceAmount: costCode.advanceAmount ?? null,
        gl_account_uuid: costCode.gl_account_uuid ?? null
      }
      restoredRows.push(restoredRow)
    }
  })
  
  // Add all restored rows to costCodeRows
  costCodeRows.value.push(...restoredRows)
  
  // Clear the removed array - create new empty array to ensure reactivity
  removedCostCodes.value = []
  
  // Emit updated removed cost codes (empty array) - only if not initializing
  if (!isInitializingRemovedCostCodes.value) {
    emitRemovedCostCodes()
  }
  
  // Emit the updated rows
  emit('update:modelValue', costCodeRows.value)
  
  // Close modal
  closeRemovedCostCodesModal()
}

// Guard flag to prevent recursive updates when initializing from props
const isInitializingRemovedCostCodes = ref(false)

// Watch for removedCostCodes prop changes (when loading existing invoice)
watch(
  () => props.removedCostCodes,
  (newRemovedCostCodes, oldRemovedCostCodes) => {
    // Skip if we're currently emitting to prevent recursive updates
    if (isInitializingRemovedCostCodes.value) {
      return
    }
    
    const newArray = Array.isArray(newRemovedCostCodes) ? newRemovedCostCodes : []
    const oldArray = Array.isArray(oldRemovedCostCodes) ? oldRemovedCostCodes : []
    const lastEmitted = lastEmittedRemovedCostCodes.value
    
    // Check if this update matches what we just emitted (to prevent clearing our own updates)
    const matchesLastEmitted = JSON.stringify(newArray) === JSON.stringify(lastEmitted)
    
    // Skip if the value matches what we just emitted (prevent clearing our own updates)
    if (matchesLastEmitted && newArray.length > 0) {
      return
    }
    
    // Skip if the value hasn't actually changed (deep comparison)
    if (newArray.length === oldArray.length && 
        newArray.length === 0 && 
        removedCostCodes.value.length === 0) {
      // Both are empty and array is empty, no change needed
      return
    }
    
    if (Array.isArray(newRemovedCostCodes) && newRemovedCostCodes.length > 0) {
      // Only initialize if the array is empty (to avoid overwriting during editing)
      if (removedCostCodes.value.length === 0) {
        isInitializingRemovedCostCodes.value = true
        try {
          initializeRemovedCostCodes()
        } finally {
          nextTick(() => {
            isInitializingRemovedCostCodes.value = false
          })
        }
      }
    } else if (Array.isArray(newRemovedCostCodes) && newRemovedCostCodes.length === 0) {
      // Only clear if:
      // 1. We actually have items to clear
      // 2. The old prop value had items (meaning parent intentionally cleared it, not a race condition)
      // 3. This doesn't match what we just emitted
      if (removedCostCodes.value.length > 0 && oldArray.length > 0 && !matchesLastEmitted) {
        // Parent intentionally cleared it (old had items, new is empty, and we didn't just emit this)
        isInitializingRemovedCostCodes.value = true
        try {
          // Create new empty array to ensure reactivity
          removedCostCodes.value = []
        } finally {
          nextTick(() => {
            isInitializingRemovedCostCodes.value = false
          })
        }
      }
    }
  },
  { immediate: true, deep: true }
)

// Track if we've loaded saved data to prevent processItems from overwriting it
const hasLoadedSavedData = ref(false)

// Watch for PO/CO changes
// IMPORTANT: Use immediate: false to prevent running before saved data is loaded
watch(
  [() => props.poCoUuid, () => props.poCoType, () => props.corporationUuid],
  async (newValues, oldValues) => {
    // Clear removed cost codes when PO/CO changes (switching to a different PO/CO)
    const [newPoCoUuid, newPoCoType] = newValues || []
    const [oldPoCoUuid, oldPoCoType] = oldValues || []
    
    const poCoChanged = newPoCoUuid !== oldPoCoUuid || newPoCoType !== oldPoCoType
    
    if (poCoChanged) {
      // Create new empty array to ensure reactivity
      removedCostCodes.value = []
      // Only emit if not initializing to prevent recursive updates
      if (!isInitializingRemovedCostCodes.value) {
        emitRemovedCostCodes()
      }
      // Reset the flag when PO/CO changes (user is switching to a different PO/CO)
      hasLoadedSavedData.value = false
    }
    
    // Check if we have saved advance payment cost codes (existing invoice)
    // Saved data typically has database IDs (numeric id or uuid), advance amounts, or gl_account_uuid
    const hasSavedData = Array.isArray(props.modelValue) && props.modelValue.length > 0 && 
      props.modelValue.some((row: any) => {
        // Check if this looks like saved data from database
        // Database rows have numeric 'id' or 'uuid' field, and often have advance_amount
        const hasDatabaseId = (row.id && typeof row.id === 'number') || row.uuid
        const hasAdvanceAmount = (row.advanceAmount !== null && row.advanceAmount !== undefined) ||
          (row.advance_amount !== null && row.advance_amount !== undefined)
        const hasGLAccount = row.gl_account_uuid && row.gl_account_uuid !== null
        
        return hasDatabaseId || hasAdvanceAmount || hasGLAccount
      })
    
    console.log('[AdvancePaymentCostCodesTable] PO/CO watcher:', {
      newPoCoUuid,
      newPoCoType,
      poCoChanged,
      hasSavedData,
      hasLoadedSavedData: hasLoadedSavedData.value,
      modelValueLength: props.modelValue?.length || 0,
      costCodeRowsLength: costCodeRows.value.length,
      sampleRow: props.modelValue?.[0],
      costCodeRowsSample: costCodeRows.value[0]
    })
    
    // CRITICAL: Check multiple sources for saved data before calling processItems
    // This prevents overwriting saved data that might be loading asynchronously
    
    // 1. Check if flag is already set
    if (hasLoadedSavedData.value) {
      console.log('[AdvancePaymentCostCodesTable] hasLoadedSavedData flag is true - skipping processItems')
      return
    }
    
    // 2. Check if modelValue has saved data (might be loading)
    if (hasSavedData) {
      hasLoadedSavedData.value = true
      console.log('[AdvancePaymentCostCodesTable] modelValue has saved data - setting flag and skipping processItems')
      return
    }
    
    // 3. Check if costCodeRows already has saved data (defensive check)
    const costCodeRowsHasSavedData = costCodeRows.value.length > 0 && 
      costCodeRows.value.some((row: any) => {
        const hasDatabaseId = (row.id && typeof row.id === 'number') || 
          (row.uuid && typeof row.uuid === 'string' && row.uuid.length > 10) ||
          (row.id && typeof row.id === 'string' && row.id.length > 10 && !row.id.startsWith('cost-code-') && !row.id.startsWith('new-row-') && !row.id.startsWith('row-'))
        const hasAdvanceAmount = (row.advanceAmount !== null && row.advanceAmount !== undefined && row.advanceAmount !== 0) ||
          (row.advance_amount !== null && row.advance_amount !== undefined && row.advance_amount !== 0)
        return hasDatabaseId || hasAdvanceAmount
      })
    
    if (costCodeRowsHasSavedData) {
      hasLoadedSavedData.value = true
      console.log('[AdvancePaymentCostCodesTable] costCodeRows has saved data - setting flag and skipping processItems')
      return
    }
    
    // 4. If modelValue is empty but we're waiting for it to load, don't process yet
    // Give the modelValue watcher a chance to run first
    // This handles the case where the modal opens and form data loads asynchronously
    if ((!props.modelValue || props.modelValue.length === 0) && newPoCoUuid && newPoCoType) {
      // Wait multiple ticks to give the modelValue watcher time to load saved data
      // The modelValue watcher runs with flush: 'pre', but async operations might delay it
      await nextTick()
      await nextTick()
      await nextTick()
      
      // Check again after waiting
      const modelValueHasSavedDataNow = Array.isArray(props.modelValue) && props.modelValue.length > 0 && 
        props.modelValue.some((row: any) => {
          const hasDatabaseId = (row.id && typeof row.id === 'number') || 
            (row.uuid && typeof row.uuid === 'string' && row.uuid.length > 10) ||
            (row.id && typeof row.id === 'string' && row.id.length > 10 && !row.id.startsWith('cost-code-') && !row.id.startsWith('new-row-') && !row.id.startsWith('row-'))
          const hasAdvanceAmount = (row.advanceAmount !== null && row.advanceAmount !== undefined && row.advanceAmount !== 0) ||
            (row.advance_amount !== null && row.advance_amount !== undefined && row.advance_amount !== 0)
          return hasDatabaseId || hasAdvanceAmount
        })
      
      if (modelValueHasSavedDataNow || hasLoadedSavedData.value) {
        console.log('[AdvancePaymentCostCodesTable] After waiting, found saved data - skipping processItems')
        hasLoadedSavedData.value = true
        return
      }
      
      // Also check costCodeRows one more time after waiting
      const costCodeRowsHasSavedDataAfterWait = costCodeRows.value.length > 0 && 
        costCodeRows.value.some((row: any) => {
          const hasDatabaseId = (row.id && typeof row.id === 'number') || 
            (row.uuid && typeof row.uuid === 'string' && row.uuid.length > 10) ||
            (row.id && typeof row.id === 'string' && row.id.length > 10 && !row.id.startsWith('cost-code-') && !row.id.startsWith('new-row-') && !row.id.startsWith('row-'))
          const hasAdvanceAmount = (row.advanceAmount !== null && row.advanceAmount !== undefined && row.advanceAmount !== 0) ||
            (row.advance_amount !== null && row.advance_amount !== undefined && row.advance_amount !== 0)
          return hasDatabaseId || hasAdvanceAmount
        })
      
      if (costCodeRowsHasSavedDataAfterWait) {
        console.log('[AdvancePaymentCostCodesTable] After waiting, costCodeRows has saved data - skipping processItems')
        hasLoadedSavedData.value = true
        return
      }
    }
    
    // No saved data found anywhere - safe to process items from PO/CO
    if (newPoCoUuid && newPoCoType) {
      console.log('[AdvancePaymentCostCodesTable] No saved data found - processing items from PO/CO')
      processItems()
    }
  },
  { immediate: false } // Don't run immediately - wait for saved data to load first via modelValue watcher
)

// Watch for external modelValue changes (e.g., when loading existing data)
// IMPORTANT: Use immediate: true and flush: 'pre' to ensure this runs BEFORE other watchers
watch(
  () => props.modelValue,
  async (newValue, oldValue) => {
    // Reset flag when modelValue becomes empty (form closed/reset or switching invoices)
    if (!Array.isArray(newValue) || newValue.length === 0) {
      hasLoadedSavedData.value = false
      costCodeRows.value = []
      lastEmittedValue.value = []
      console.log('[AdvancePaymentCostCodesTable] modelValue cleared - resetting hasLoadedSavedData, costCodeRows, and lastEmittedValue')
      return
    }
    
    // Skip watcher if user is actively editing to prevent overwriting selections
    if (isUserEditing.value) {
      return
    }
    
    // Skip if this is the same value we just emitted (prevent circular updates)
    if (lastEmittedValue.value.length > 0 && 
        JSON.stringify(newValue) === JSON.stringify(lastEmittedValue.value)) {
      return
    }
    
    if (Array.isArray(newValue) && newValue.length > 0) {
      // Set loading state
      isLoadingData.value = true
      
      // Check if this is saved data from database (has database IDs or advance amounts)
      // Use the same strict detection logic as in processItems for consistency
      const isSavedData = newValue.some((row: any) => {
        // Database IDs: numeric id, or uuid string (not generated IDs like 'cost-code-xxx' or 'row-xxx')
        const hasDatabaseId = (row.id && typeof row.id === 'number') || 
          (row.uuid && typeof row.uuid === 'string' && row.uuid.length > 10 && !row.uuid.startsWith('cost-code-') && !row.uuid.startsWith('row-')) ||
          (row.id && typeof row.id === 'string' && row.id.length > 10 && !row.id.startsWith('cost-code-') && !row.id.startsWith('new-row-') && !row.id.startsWith('row-'))
        
        // Advance amounts: non-zero values indicate saved data
        const hasAdvanceAmount = (row.advanceAmount !== null && row.advanceAmount !== undefined && row.advanceAmount !== 0) ||
          (row.advance_amount !== null && row.advance_amount !== undefined && row.advance_amount !== 0)
        
        return hasDatabaseId || hasAdvanceAmount
      })
      
      // CRITICAL: Set flag SYNCHRONOUSLY and IMMEDIATELY before any async operations
      // This prevents race conditions where processItems might run before the flag is set
      if (isSavedData) {
        hasLoadedSavedData.value = true
        console.log('[AdvancePaymentCostCodesTable] Detected saved data in modelValue watcher - SYNCHRONOUSLY setting hasLoadedSavedData = true', {
          rowCount: newValue.length,
          sampleRow: {
            id: newValue[0]?.id,
            idType: typeof newValue[0]?.id,
            uuid: newValue[0]?.uuid,
            uuidType: typeof newValue[0]?.uuid,
            advanceAmount: newValue[0]?.advanceAmount || newValue[0]?.advance_amount,
            hasDatabaseId: (newValue[0]?.id && typeof newValue[0]?.id === 'number') || 
              (newValue[0]?.uuid && typeof newValue[0]?.uuid === 'string' && newValue[0]?.uuid.length > 10),
            hasAdvanceAmount: (newValue[0]?.advanceAmount !== null && newValue[0]?.advanceAmount !== undefined && newValue[0]?.advanceAmount !== 0) ||
              (newValue[0]?.advance_amount !== null && newValue[0]?.advance_amount !== undefined && newValue[0]?.advance_amount !== 0)
          }
        })
      } else {
        // Not saved data - reset flag in case we're switching from saved to new
        hasLoadedSavedData.value = false
        console.log('[AdvancePaymentCostCodesTable] modelValue is not saved data - resetting hasLoadedSavedData = false')
      }
      
      try {
        // NOW fetch cost code configurations and chart of accounts (after flag is set)
        if (props.corporationUuid) {
          await Promise.all([
            fetchCostCodeConfigurations(props.corporationUuid),
            fetchChartOfAccounts(props.corporationUuid)
          ])
        }
      
      // Map database field names to component field names
      // IMPORTANT: Preserve GL account UUID from database - this is the saved value
      console.log('[AdvancePaymentCostCodesTable] Loading modelValue:', {
        rowCount: newValue.length,
        sampleRow: newValue[0],
        allRows: newValue.map((r: any) => ({
          id: r.id || r.uuid,
          cost_code_uuid: r.cost_code_uuid,
          gl_account_uuid: r.gl_account_uuid,
          glAccountUuid: r.glAccountUuid,
          advance_amount: r.advance_amount || r.advanceAmount
        }))
      })
      
      const mappedRows = newValue.map((row: any) => {
        // Preserve GL account from database first (this is the saved value)
        // Check for both snake_case and camelCase field names (database uses snake_case)
        let glAccountUuid = row.gl_account_uuid !== undefined && row.gl_account_uuid !== null 
          ? row.gl_account_uuid 
          : (row.glAccountUuid !== undefined && row.glAccountUuid !== null 
            ? row.glAccountUuid 
            : null)
        
        console.log('[AdvancePaymentCostCodesTable] Mapping row:', {
          rowId: row.id || row.uuid,
          cost_code_uuid: row.cost_code_uuid,
          gl_account_uuid_from_db: row.gl_account_uuid,
          glAccountUuid_from_db: row.glAccountUuid,
          glAccountUuid_after_check: glAccountUuid,
          hasAdvanceAmount: row.advance_amount !== undefined || row.advanceAmount !== undefined
        })
        
        // Only populate from cost code configuration if database value is explicitly null/undefined
        // This ensures saved GL accounts are never overwritten
        if ((glAccountUuid === null || glAccountUuid === undefined) && row.cost_code_uuid) {
          const config = costCodeConfigMap.value.get(row.cost_code_uuid)
          if (config?.gl_account_uuid) {
            console.log('[AdvancePaymentCostCodesTable] Using GL account from cost code config:', config.gl_account_uuid)
            glAccountUuid = config.gl_account_uuid
          }
        }
        
        const mappedRow = {
          id: row.id || row.uuid || `row-${Date.now()}-${Math.random().toString(36).substring(2)}`,
          cost_code_uuid: row.cost_code_uuid || null,
          cost_code_label: row.cost_code_label || null,
          cost_code_number: row.cost_code_number || null,
          cost_code_name: row.cost_code_name || null,
          totalAmount: row.totalAmount || row.total_amount || 0,
          advanceAmount: row.advanceAmount !== undefined ? row.advanceAmount : (row.advance_amount !== undefined ? row.advance_amount : null),
          // Always preserve the GL account UUID from database (saved value)
          gl_account_uuid: glAccountUuid
        }
        
        console.log('[AdvancePaymentCostCodesTable] Mapped row result:', {
          id: mappedRow.id,
          cost_code_uuid: mappedRow.cost_code_uuid,
          gl_account_uuid: mappedRow.gl_account_uuid
        })
        
        return mappedRow
      })
      
      console.log('[AdvancePaymentCostCodesTable] All mapped rows:', mappedRows.map(r => ({
        id: r.id,
        cost_code_uuid: r.cost_code_uuid,
        gl_account_uuid: r.gl_account_uuid
      })))
      
      // Build a set of cost codes that are present in the loaded data
      const presentCostCodeUuids = new Set(
        mappedRows
          .filter(row => row.cost_code_uuid)
          .map(row => row.cost_code_uuid)
      )
      
      // If we have saved removed cost codes from props, use those first
      // Otherwise, if we have a PO/CO selected and we're loading existing data (not processing),
      // identify which cost codes from PO/CO are missing - these are the removed ones
      // This handles backward compatibility for invoices saved before removed cost codes tracking
      if (props.poCoUuid && props.poCoType && !loading.value && costCodeRows.value.length === 0) {
        // If we already have removed cost codes from props, don't try to identify them
        // (they were already loaded from saved data)
        if (removedCostCodes.value.length === 0) {
          try {
            // Extract UUID from "PO:uuid" or "CO:uuid" format
            const uuid = props.poCoUuid.replace(/^(PO|CO):/, '').trim()
            
            // Fetch items to see what cost codes exist in PO/CO
            const items = props.poCoType === 'PO' 
              ? await fetchPOItems(uuid)
              : await fetchCOItems(uuid)
            
            // Get all unique cost code UUIDs from PO/CO items
            const allCostCodeUuids = new Set(
              items
                .map((item: any) => item.cost_code_uuid)
                .filter(Boolean)
            )
            
            // Cost codes that exist in PO/CO but not in the loaded data are removed
            // Group items by cost code to get accurate totals (same as processItems)
            const costCodeMap = new Map<string, {
              cost_code_uuid: string
              cost_code_label: string
              cost_code_number: string
              cost_code_name: string
              totalAmount: number
            }>()
            
            items.forEach((item: any) => {
              const costCodeUuid = item.cost_code_uuid
              if (!costCodeUuid) return
              
              const costCodeLabel = item.cost_code_label || 
                (item.cost_code_number && item.cost_code_name 
                  ? `${item.cost_code_number} ${item.cost_code_name}`.trim()
                  : null)
              
              if (!costCodeLabel) return
              
              const itemTotal = props.poCoType === 'PO'
                ? (item.po_amount || item.po_total || item.total || 0)
                : (item.co_amount || item.co_total || item.total || 0)
              
              if (costCodeMap.has(costCodeUuid)) {
                const existing = costCodeMap.get(costCodeUuid)!
                existing.totalAmount += Number(itemTotal) || 0
              } else {
                costCodeMap.set(costCodeUuid, {
                  cost_code_uuid: costCodeUuid,
                  cost_code_label: costCodeLabel,
                  cost_code_number: item.cost_code_number || '',
                  cost_code_name: item.cost_code_name || '',
                  totalAmount: Number(itemTotal) || 0
                })
              }
            })
            
            // Store removed cost codes with full data - create new array to ensure reactivity
            const newRemovedArray: any[] = [...removedCostCodes.value]
            costCodeMap.forEach((costCode) => {
              if (!presentCostCodeUuids.has(costCode.cost_code_uuid)) {
                // Check if already in array to avoid duplicates
                const alreadyExists = newRemovedArray.some(
                  (cc: any) => cc.cost_code_uuid === costCode.cost_code_uuid
                )
                if (!alreadyExists) {
                  newRemovedArray.push({
                    ...costCode,
                    advanceAmount: null,
                    gl_account_uuid: null,
                    removed_at: new Date().toISOString()
                  })
                }
              }
            })
            removedCostCodes.value = newRemovedArray
            
            // Emit removed cost codes so they can be saved
            if (removedCostCodes.value.length > 0) {
              emitRemovedCostCodes()
            }
          } catch (error) {
            console.error('[AdvancePaymentCostCodesTable] Error identifying removed cost codes:', error)
          }
        }
      }
      
      // Only update if the rows are actually different to avoid infinite loops
      const currentIds = new Set(costCodeRows.value.map(r => r.id))
      const newIds = new Set(mappedRows.map((r: any) => r.id))
      
      // When loading from database, ALWAYS prioritize database GL account values
      // Create a map of current rows by cost_code_uuid to check for existing GL accounts
      // But prioritize database values over component state
      const currentRowsMap = new Map(
        costCodeRows.value.map(row => [row.cost_code_uuid || row.id, row])
      )
      
      // Merge mapped rows - database values take precedence
      const mergedRows = mappedRows.map((newRow: any) => {
        // Database value (newRow.gl_account_uuid) always takes precedence
        // Only use current row's GL account if database doesn't have one AND user was editing
        const currentRow = currentRowsMap.get(newRow.cost_code_uuid || newRow.id)
        
        // If database has a GL account, use it (this is the saved value)
        if (newRow.gl_account_uuid) {
          return newRow
        }
        
        // If database doesn't have one but current row does (user was editing), preserve it
        if (currentRow && currentRow.gl_account_uuid) {
          return {
            ...newRow,
            gl_account_uuid: currentRow.gl_account_uuid
          }
        }
        
        // Otherwise use the new row as-is (may have GL account from cost code config)
        return newRow
      })
      
      // Check if GL accounts were populated (even if IDs are the same)
      const glAccountsPopulated = mergedRows.some((row: any, index: number) => {
        const currentRow = costCodeRows.value[index]
        return row.gl_account_uuid && (!currentRow || currentRow.gl_account_uuid !== row.gl_account_uuid)
      })
      
      // Check if rows are different
      const rowsAreDifferent = currentIds.size !== newIds.size || 
          !Array.from(currentIds).every(id => newIds.has(id)) ||
          mergedRows.some((row: any, index: number) => {
            const currentRow = costCodeRows.value[index]
            if (!currentRow) return true
            // Compare key fields
            return row.cost_code_uuid !== currentRow.cost_code_uuid ||
                   row.gl_account_uuid !== currentRow.gl_account_uuid ||
                   row.advanceAmount !== currentRow.advanceAmount ||
                   row.totalAmount !== currentRow.totalAmount
          })
      
      if (rowsAreDifferent || glAccountsPopulated) {
        console.log('[AdvancePaymentCostCodesTable] Setting costCodeRows with GL accounts:', {
          mergedRowsCount: mergedRows.length,
          localChartOfAccountsCount: localChartOfAccounts.value.length,
          rowsWithGLAccounts: mergedRows.filter((r: any) => r.gl_account_uuid).map((r: any) => ({
            id: r.id,
            cost_code_uuid: r.cost_code_uuid,
            gl_account_uuid: r.gl_account_uuid
          })),
          sampleAccounts: localChartOfAccounts.value.slice(0, 3).map((a: any) => ({
            uuid: a.uuid,
            code: a.code,
            name: a.account_name
          }))
        })
        
        costCodeRows.value = mergedRows
        
        // Store the updated value to prevent circular updates
        lastEmittedValue.value = [...mergedRows]
        
        // Wait for next tick to ensure ChartOfAccountsSelect components have received the accounts
        // This ensures the GL account value can be properly displayed
        await nextTick()
        
        // Emit update to ensure parent component knows about GL account changes
        if (glAccountsPopulated) {
          emit('update:modelValue', costCodeRows.value)
        }
      }
      
      // Data loading complete
      isLoadingData.value = false
      } catch (error) {
        console.error('[AdvancePaymentCostCodesTable] Error loading data:', error)
        isLoadingData.value = false
      }
    } else if (Array.isArray(newValue) && newValue.length === 0 && costCodeRows.value.length > 0) {
      // Only clear if we're not in the middle of processing
      if (!loading.value) {
        costCodeRows.value = []
        // Clear removed cost codes when modelValue is cleared
        // Create new empty array to ensure reactivity
        removedCostCodes.value = []
      }
    }
  },
  { immediate: true, deep: true, flush: 'pre' } // Run immediately and before other watchers to set flag first
)

// Watch for corporation changes to fetch cost code configurations and chart of accounts
watch(
  () => props.corporationUuid,
  async (newCorpUuid, oldCorpUuid) => {
    if (newCorpUuid && newCorpUuid !== oldCorpUuid) {
      // Clear local chart of accounts when corporation changes
      localChartOfAccounts.value = []
      
      // Fetch cost code configurations and chart of accounts when corporation changes
      await Promise.all([
        fetchCostCodeConfigurations(newCorpUuid),
        fetchChartOfAccounts(newCorpUuid)
      ])
      
      // Update GL accounts in existing rows if they're not set
      if (costCodeRows.value.length > 0) {
        const updatedRows = costCodeRows.value.map((row: any) => {
          if (!row.gl_account_uuid && row.cost_code_uuid) {
            const config = costCodeConfigMap.value.get(row.cost_code_uuid)
            if (config?.gl_account_uuid) {
              return {
                ...row,
                gl_account_uuid: config.gl_account_uuid
              }
            }
          }
          return row
        })
        
        // Only update if any GL accounts were populated
        const hasChanges = updatedRows.some((row: any, index: number) => 
          row.gl_account_uuid !== costCodeRows.value[index]?.gl_account_uuid
        )
        
      if (hasChanges) {
        costCodeRows.value = updatedRows
        
        // Wait for next tick to ensure ChartOfAccountsSelect components have received the accounts
        await nextTick()
        
        emit('update:modelValue', costCodeRows.value)
      }
    }
  } else if (!newCorpUuid) {
    // Clear local chart of accounts when corporation is cleared
    localChartOfAccounts.value = []
  }
  },
  { immediate: false }
)

// Initialize
onMounted(async () => {
  // First, check if we have saved data BEFORE doing anything else
  // Use the same detection logic as in processItems for consistency
  const hasSavedData = Array.isArray(props.modelValue) && props.modelValue.length > 0 && 
    props.modelValue.some((row: any) => {
      // Database IDs: numeric id, or uuid string (not generated IDs)
      const hasDatabaseId = (row.id && typeof row.id === 'number') || 
        (row.uuid && typeof row.uuid === 'string' && row.uuid.length > 10 && !row.uuid.startsWith('cost-code-') && !row.uuid.startsWith('row-')) ||
        (row.id && typeof row.id === 'string' && row.id.length > 10 && !row.id.startsWith('cost-code-') && !row.id.startsWith('new-row-') && !row.id.startsWith('row-'))
      
      // Advance amounts: non-zero values indicate saved data
      const hasAdvanceAmount = (row.advanceAmount !== null && row.advanceAmount !== undefined && row.advanceAmount !== 0) ||
        (row.advance_amount !== null && row.advance_amount !== undefined && row.advance_amount !== 0)
      
      return hasDatabaseId || hasAdvanceAmount
    })
  
  if (hasSavedData) {
    // We have saved data - mark it IMMEDIATELY and SYNCHRONOUSLY to prevent processItems from running
    // This must happen before any async operations
    hasLoadedSavedData.value = true
    console.log('[AdvancePaymentCostCodesTable] onMounted: Found saved data - IMMEDIATELY setting hasLoadedSavedData = true to prevent processItems', {
      rowCount: props.modelValue?.length || 0,
      sampleRow: props.modelValue?.[0]
    })
  } else {
    // No saved data - ensure flag is false
    hasLoadedSavedData.value = false
    console.log('[AdvancePaymentCostCodesTable] onMounted: No saved data detected - hasLoadedSavedData = false')
  }
  
  // Set loading state if we have data to load
  if (Array.isArray(props.modelValue) && props.modelValue.length > 0) {
    isLoadingData.value = true
  }
  
  // Fetch cost code configurations and chart of accounts on mount to ensure GL accounts are available
  if (props.corporationUuid) {
    try {
      await Promise.all([
        fetchCostCodeConfigurations(props.corporationUuid),
        fetchChartOfAccounts(props.corporationUuid)
      ])
    } catch (error) {
      console.error('[AdvancePaymentCostCodesTable] Error fetching data on mount:', error)
      isLoadingData.value = false
      return
    }
    
    // If we have existing data in modelValue, populate GL accounts after fetching configs
    // But only if we don't already have saved data (to avoid overwriting)
    if (Array.isArray(props.modelValue) && props.modelValue.length > 0 && !hasSavedData) {
      const updatedRows = costCodeRows.value.map((row: any) => {
        if (!row.gl_account_uuid && row.cost_code_uuid) {
          const config = costCodeConfigMap.value.get(row.cost_code_uuid)
          if (config?.gl_account_uuid) {
            return {
              ...row,
              gl_account_uuid: config.gl_account_uuid
            }
          }
        }
        return row
      })
      
      // Check if any GL accounts were populated
      const hasChanges = updatedRows.some((row: any, index: number) => 
        row.gl_account_uuid !== costCodeRows.value[index]?.gl_account_uuid
      )
      
      if (hasChanges) {
        costCodeRows.value = updatedRows
        
        // Wait for next tick to ensure ChartOfAccountsSelect components have received the accounts
        await nextTick()
        
        emit('update:modelValue', costCodeRows.value)
      }
    }
  }
  
  // If we have a PO/CO selected but no saved data, process items
  // This handles the case for new invoices
  if (props.poCoUuid && props.poCoType && !hasLoadedSavedData.value) {
    console.log('[AdvancePaymentCostCodesTable] onMounted: No saved data, processing items from PO/CO for new invoice')
    processItems()
  }
  
  // Initialize removed cost codes from props if available
  initializeRemovedCostCodes()
})

// Check if any cost code has advance amount exceeding total amount
// This is used for "Against Advance Payment" invoices to prevent over-advancing
const hasOverAdvancedAmount = (row: any): boolean => {
  const advanceAmount = parseFloat(row.advanceAmount || row.advance_amount || '0') || 0
  const totalAmount = parseFloat(row.totalAmount || '0') || 0
  return advanceAmount > totalAmount
}

// Check if any row has over-advanced amount (for validation)
const hasValidationError = computed(() => {
  return costCodeRows.value.some((row: any) => hasOverAdvancedAmount(row))
})

const tableRowsCount = computed(() => costCodeRows.value.length)
const isHydratingRows = computed(() => loading.value || isLoadingData.value)

// Expose validation state for parent component
defineExpose({
  hasValidationError,
  tableRowsCount,
  isHydratingRows
})

// Reset state when component is unmounted (modal/form closed)
onBeforeUnmount(() => {
  hasLoadedSavedData.value = false
  costCodeRows.value = []
  lastEmittedValue.value = []
  console.log('[AdvancePaymentCostCodesTable] Component unmounting - resetting all state')
})
</script>

