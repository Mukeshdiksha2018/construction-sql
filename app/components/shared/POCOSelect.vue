<template>
  <div>
    <div :class="[className, 'relative']">
      <!-- Button to open modal -->
      <UButton
        :disabled="props.disabled || optionsLoading || !props.projectUuid || !props.vendorUuid"
        :size="size"
        :class="[
          'w-full',
          showValidationError && hasValidationError
            ? 'ring-2 ring-red-500 dark:ring-red-400'
            : '',
        ]"
        variant="outline"
        color="neutral"
        @click="openModal"
      >
        <span class="pr-6">{{ buttonDisplayLabel }}</span>
      </UButton>
      <!-- Clear button if something is selected -->
      <button
        v-if="selectedOption && !props.disabled"
        type="button"
        class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full p-1 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors z-10"
        @click.stop="clearSelection"
      >
        <UIcon name="i-heroicons-x-mark" class="w-4 h-4 text-gray-500 dark:text-gray-400" />
      </button>
    </div>

    <!-- Modal with table -->
    <UModal
      v-model:open="showModal"
      :fullscreen="isFullscreenModal"
      :ui="{
        content: isFullscreenModal ? 'w-screen h-screen max-w-none max-h-none' : 'max-w-6xl'
      }"
    >
      <template #header>
        <div class="flex items-center justify-between w-full">
          <h3 class="text-base font-semibold">{{ modalTitle }}</h3>
          <UButton
            icon="i-heroicons-x-mark"
            size="xs"
            variant="solid"
            color="neutral"
            @click="closeModal"
          />
        </div>
      </template>
      <template #body>
        <div class="space-y-4">
          <!-- Search -->
          <div>
            <UInput
              v-model="searchFilter"
              :placeholder="showOnlyPOs ? 'Search by PO number, vendor...' : showOnlyCOs ? 'Search by CO number, vendor...' : 'Search by PO/CO number, vendor...'"
              icon="i-heroicons-magnifying-glass"
              variant="subtle"
              size="sm"
              class="w-full"
            />
          </div>

          <!-- Loading state -->
          <div v-if="isModalContentLoading" class="text-center py-12">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p class="mt-2 text-xs text-gray-500">{{ modalLoadingMessage }}</p>
          </div>

          <!-- Table -->
          <div v-else-if="filteredOptions.length > 0">
            <UTable
              :data="filteredOptions"
              :columns="tableColumns"
              class="w-full text-xs poco-select-table"
            />
          </div>

          <!-- Empty state -->
          <div v-else class="text-center py-12">
            <UIcon name="i-heroicons-document-text" class="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p class="text-gray-500 text-lg">{{ showOnlyPOs ? 'No Purchase Order found' : showOnlyCOs ? 'No Change Order found' : 'No PO/CO found' }}</p>
            <p class="text-gray-400 text-xs mt-2">
              {{ showOnlyPOs 
                ? 'No approved, completed, or partially received purchase orders available for this vendor and project'
                : showOnlyCOs
                ? 'No approved, completed, or partially received change orders available for this vendor and project'
                : 'No approved, completed, or partially received purchase orders or change orders available for this vendor and project'
              }}
            </p>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, h, resolveComponent } from 'vue'
import { useCurrencyFormat } from '~/composables/useCurrencyFormat'
import { useDateFormat } from '~/composables/useDateFormat'
import {
  amountInPoToCurrency,
  computeLaborBalanceToBeInvoicedForDisplay,
} from '~/utils/poCurrencyConversion'
import {
  computeMaterialBalanceToBeInvoicedFromItems,
  isMaterialOrderType,
} from '~/utils/materialBalanceToBeInvoiced'
import type { TableColumn } from '@nuxt/ui'

// Props
interface Props {
  modelValue?: string
  /** When the current PO/CO is omitted from the list (e.g. zero balance filter), still show this label on the button */
  modelValueFallbackLabel?: string
  placeholder?: string
  searchablePlaceholder?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  disabled?: boolean
  projectUuid?: string
  corporationUuid?: string
  vendorUuid?: string
  showInvoiceSummary?: boolean // Show advance paid, invoiced value, and balance columns
  showOnlyPOs?: boolean // Only show Purchase Orders (hide Change Orders)
  showOnlyCOs?: boolean // Only show Change Orders (hide Purchase Orders)
  fullscreen?: boolean // Force modal to open in fullscreen mode
  required?: boolean
  /** When true, show required-field styling after the parent form enables validation UI */
  showValidationError?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  searchablePlaceholder: 'Search PO/CO...',
  size: 'sm',
  className: 'w-full',
  disabled: false,
  showInvoiceSummary: false,
  showOnlyPOs: false,
  showOnlyCOs: false,
  fullscreen: false,
  modelValueFallbackLabel: undefined,
  required: false,
  showValidationError: false,
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: string | undefined]
  'change': [order: any]
}>()

const hasValidationError = computed(() => {
  if (!props.required || props.disabled) return false
  return !String(props.modelValue || '').trim()
})

// PO/CO options fetched fresh from the DB (scoped to corporation + project + vendor),
// instead of relying on the corporation-wide paginated stores which cap recent rows.
const fetchedPurchaseOrders = ref<any[]>([])
const fetchedChangeOrders = ref<any[]>([])
const optionsLoading = ref(false)
const optionsError = ref<string | null>(null)

const loadPoCoOptions = async () => {
  const corporationUuid = props.corporationUuid
  const projectUuid = props.projectUuid
  const vendorUuid = props.vendorUuid

  if (!corporationUuid || !projectUuid || !vendorUuid) {
    fetchedPurchaseOrders.value = []
    fetchedChangeOrders.value = []
    return
  }

  const type = props.showOnlyPOs ? 'po' : props.showOnlyCOs ? 'co' : 'both'
  optionsLoading.value = true
  optionsError.value = null

  try {
    const response = await $fetch<{
      data: { purchaseOrders: any[]; changeOrders: any[] }
    }>('/api/payables/po-co-options', {
      query: {
        corporation_uuid: corporationUuid,
        project_uuid: projectUuid,
        vendor_uuid: vendorUuid,
        type,
      },
    })
    fetchedPurchaseOrders.value = Array.isArray(response?.data?.purchaseOrders)
      ? response.data.purchaseOrders
      : []
    fetchedChangeOrders.value = Array.isArray(response?.data?.changeOrders)
      ? response.data.changeOrders
      : []
  } catch (error: any) {
    console.error('[POCOSelect] Error loading PO/CO options:', error)
    optionsError.value = error?.message || 'Failed to load options'
    fetchedPurchaseOrders.value = []
    fetchedChangeOrders.value = []
  } finally {
    optionsLoading.value = false
  }
}

const { formatCurrency, formatNumber } = useCurrencyFormat()
const { formatDate } = useDateFormat()

const formatQty = (value: number | undefined | null): string => {
  if (value === null || value === undefined) return '-'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (!Number.isFinite(num)) return '-'
  return formatNumber(num, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

type InvoiceSummaryAmounts = {
  advancePaid: number
  advancePaidNet?: number
  invoicedValue: number
  holdbackBalanceToBeInvoiced: number
  balanceToBeInvoiced: number
  totalOrderValue?: number
  holdbackReleased?: number
  poQuantity?: number
  coQuantity?: number
  invoicedQuantity?: number
  qtyRemainingToBeInvoiced?: number
}

const displayAmountForOrder = (
  order: Record<string, unknown> | null | undefined,
  amount: number | null | undefined
): number => amountInPoToCurrency(amount, order)

const resolveBalanceToBeInvoicedForDisplay = (
  order: Record<string, unknown>,
  orderType: string | undefined,
  summary: InvoiceSummaryAmounts,
  items: any[]
): number => {
  if (!isMaterialOrderType(orderType)) {
    return computeLaborBalanceToBeInvoicedForDisplay(order, {
      totalOrderValue: summary.totalOrderValue ?? 0,
      advancePaidNet: summary.advancePaidNet ?? 0,
      invoicedValue: summary.invoicedValue,
      holdbackReleased: summary.holdbackReleased ?? 0,
      holdbackBalanceToBeInvoiced: summary.holdbackBalanceToBeInvoiced,
      fallbackBalance: summary.balanceToBeInvoiced,
    })
  }

  let balance: number

  if ((summary.invoicedQuantity ?? 0) > 0) {
    balance = summary.balanceToBeInvoiced
  } else if (!items.length) {
    balance = summary.balanceToBeInvoiced
  } else {
    const computed = computeMaterialBalanceToBeInvoicedFromItems({
      lineItems: items,
    })
    balance = computed ?? summary.balanceToBeInvoiced
  }

  return displayAmountForOrder(order, balance)
}

const mapInvoiceSummaryForDisplay = (
  order: Record<string, unknown>,
  summary: InvoiceSummaryAmounts,
  items: any[] = [],
  orderType?: string
): InvoiceSummaryAmounts => ({
  advancePaid: summary.advancePaid,
  invoicedValue: summary.invoicedValue,
  holdbackBalanceToBeInvoiced: summary.holdbackBalanceToBeInvoiced,
  balanceToBeInvoiced: resolveBalanceToBeInvoicedForDisplay(
    order,
    orderType,
    summary,
    items
  ),
  poQuantity: summary.poQuantity,
  coQuantity: summary.coQuantity,
  invoicedQuantity: summary.invoicedQuantity,
  qtyRemainingToBeInvoiced: summary.qtyRemainingToBeInvoiced,
})

// Resolve components for table columns
const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')

// Local state
const selectedOrder = ref<string | undefined>(props.modelValue)
const selectedOption = ref<any>(undefined)

/** Button text: resolved option, else fallback when PO/CO is filtered out of the list, else hints */
const buttonDisplayLabel = computed(() => {
  if (selectedOption.value) return selectedOption.value.number
  if (props.modelValue && props.modelValueFallbackLabel) {
    return props.modelValueFallbackLabel
  }
  if (!props.projectUuid) return 'Select project first'
  if (!props.vendorUuid) return 'Select vendor first'
  return props.placeholder
})

const showModal = ref(false)
const searchFilter = ref('')
const modalPrefetchLoading = ref(false)
const itemsCache = ref<Map<string, { items: any[], totalQuantity: number }>>(new Map())
const loadingItems = ref<Set<string>>(new Set())
const cacheUpdateTrigger = ref(0) // Trigger for reactivity
const invoiceSummaryCache = ref<Map<string, {
  advancePaid: number
  invoicedValue: number
  holdbackBalanceToBeInvoiced: number
  balanceToBeInvoiced: number
  // Quantity summary (only populated for CO invoice-summary endpoint)
  poQuantity?: number
  coQuantity?: number
  invoicedQuantity?: number
  qtyRemainingToBeInvoiced?: number
}>>(new Map())
const loadingInvoiceSummaries = ref<Set<string>>(new Set())
const isAdvancePaymentPicker = computed(() => props.showInvoiceSummary && !props.showOnlyPOs && !props.showOnlyCOs)
const isFullscreenModal = computed(() => props.fullscreen || isAdvancePaymentPicker.value)
const modalTitle = computed(() => {
  if (props.showOnlyPOs) return 'Select Purchase Order'
  if (props.showOnlyCOs) return 'Select Change Order'
  return 'Select PO/CO'
})
const isModalContentLoading = computed(
  () => optionsLoading.value || modalPrefetchLoading.value
)
const modalLoadingMessage = computed(() => {
  if (props.showOnlyCOs) return 'Loading change orders...'
  if (props.showOnlyPOs) return 'Loading purchase orders...'
  return 'Loading PO/CO data...'
})

// Table columns configuration - computed to conditionally show invoice summary columns
const tableColumns = computed<TableColumn<any>[]>(() => {
  const baseColumns: TableColumn<any>[] = [
    {
      accessorKey: 'number',
      header: 'PO/CO Number',
      enableSorting: false,
      cell: ({ row }: any) => {
        const option = row.original
        return h('div', { class: 'flex items-center gap-2 flex-wrap' }, [
          h('span', { class: 'font-medium text-xs' }, option.number),
          h(UBadge as any, {
            color: option.status_color,
            variant: 'solid',
            size: 'xs'
          }, () => option.status),
          h(UBadge as any, {
            color: option.type_color,
            variant: 'soft',
            size: 'xs'
          }, () => option.type_label)
        ])
      }
    },
    {
      accessorKey: 'formattedDate',
      header: 'PO Date',
      enableSorting: false,
      cell: ({ row }: any) => h('div', { class: 'text-xs' }, row.original.formattedDate)
    },
    {
      accessorKey: 'totalItems',
      header: 'No of Items',
      enableSorting: false,
      cell: ({ row }: any) => h('div', { class: 'text-xs font-medium' }, row.original.totalItems)
    },
    {
      accessorKey: 'formattedAvgRate',
      header: 'Avg Rate',
      enableSorting: false,
      cell: ({ row }: any) => h('div', { class: 'text-xs font-medium' }, row.original.formattedAvgRate)
    }
  ]

  // Add invoice summary columns if showInvoiceSummary is true (for both POs and COs)
  if (props.showInvoiceSummary) {
    baseColumns.push(
      {
        accessorKey: 'formattedAdvancePaid',
        header: 'Advance Paid',
        enableSorting: false,
        cell: ({ row }: any) => {
          const option = row.original
          // Show for both POs and COs
          if (option.invoiceSummary) {
            return h('div', { class: 'text-xs font-medium' }, formatCurrency(option.invoiceSummary.advancePaid))
          }
          return h('div', { class: 'text-xs' }, '-')
        }
      },
      {
        accessorKey: 'formattedInvoicedValue',
        header: 'Invoiced Value',
        enableSorting: false,
        cell: ({ row }: any) => {
          const option = row.original
          // Show for both POs and COs
          if (option.invoiceSummary) {
            return h('div', { class: 'text-xs font-medium' }, formatCurrency(option.invoiceSummary.invoicedValue))
          }
          return h('div', { class: 'text-xs' }, '-')
        }
      },
      {
        accessorKey: 'formattedHoldbackBalanceToBeInvoiced',
        header: 'Balance to be Invoiced (Holdback)',
        enableSorting: false,
        cell: ({ row }: any) => {
          const option = row.original
          if (option.invoiceSummary) {
            return h('div', { class: 'text-xs font-medium' }, formatCurrency(option.invoiceSummary.holdbackBalanceToBeInvoiced))
          }
          return h('div', { class: 'text-xs' }, '-')
        }
      },
      {
        accessorKey: 'formattedBalanceToBeInvoiced',
        header: 'Balance to be Invoiced',
        enableSorting: false,
        cell: ({ row }: any) => {
          const option = row.original
          // Show for both POs and COs
          if (option.invoiceSummary) {
            return h('div', { class: 'text-xs font-semibold text-primary-600 dark:text-primary-400' }, formatCurrency(option.invoiceSummary.balanceToBeInvoiced))
          }
          return h('div', { class: 'text-xs' }, '-')
        }
      }
    )

    // Quantity columns (only in the "against PO" or "against CO" picker modal)
    if (props.showOnlyCOs) {
      baseColumns.push(
        {
          accessorKey: 'formattedCoQuantity',
          header: 'CO Qty',
          enableSorting: false,
          cell: ({ row }: any) => {
            const option = row.original
            if (option.invoiceSummary) {
              return h('div', { class: 'text-xs font-medium' }, formatQty(option.invoiceSummary.coQuantity))
            }
            return h('div', { class: 'text-xs' }, '-')
          }
        },
        {
          accessorKey: 'formattedInvoicedQuantity',
          header: 'Qty Invoiced',
          enableSorting: false,
          cell: ({ row }: any) => {
            const option = row.original
            if (option.invoiceSummary) {
              return h('div', { class: 'text-xs font-medium' }, formatQty(option.invoiceSummary.invoicedQuantity))
            }
            return h('div', { class: 'text-xs' }, '-')
          }
        },
        {
          accessorKey: 'formattedQtyRemainingToBeInvoiced',
          header: 'Qty Remaining to be Invoiced',
          enableSorting: false,
          cell: ({ row }: any) => {
            const option = row.original
            if (option.invoiceSummary) {
              return h(
                'div',
                { class: 'text-xs font-semibold text-primary-600 dark:text-primary-400' },
                formatQty(option.invoiceSummary.qtyRemainingToBeInvoiced)
              )
            }
            return h('div', { class: 'text-xs' }, '-')
          }
        }
      )
    } else if (props.showOnlyPOs) {
      baseColumns.push(
        {
          accessorKey: 'formattedPoQuantity',
          header: 'PO Qty',
          enableSorting: false,
          cell: ({ row }: any) => {
            const option = row.original
            if (option.invoiceSummary) {
              return h('div', { class: 'text-xs font-medium' }, formatQty(option.invoiceSummary.poQuantity))
            }
            return h('div', { class: 'text-xs' }, '-')
          }
        },
        {
          accessorKey: 'formattedInvoicedQuantity',
          header: 'Qty Invoiced',
          enableSorting: false,
          cell: ({ row }: any) => {
            const option = row.original
            if (option.invoiceSummary) {
              return h('div', { class: 'text-xs font-medium' }, formatQty(option.invoiceSummary.invoicedQuantity))
            }
            return h('div', { class: 'text-xs' }, '-')
          }
        },
        {
          accessorKey: 'formattedQtyRemainingToBeInvoiced',
          header: 'Qty Remaining to be Invoiced',
          enableSorting: false,
          cell: ({ row }: any) => {
            const option = row.original
            if (option.invoiceSummary) {
              return h(
                'div',
                { class: 'text-xs font-semibold text-primary-600 dark:text-primary-400' },
                formatQty(option.invoiceSummary.qtyRemainingToBeInvoiced)
              )
            }
            return h('div', { class: 'text-xs' }, '-')
          }
        }
      )
    }
  }

  // Add remaining columns
  baseColumns.push(
    {
      accessorKey: 'formattedAmount',
      header: 'Total PO Value',
      enableSorting: false,
      cell: ({ row }: any) => h('div', { class: 'text-xs font-semibold text-primary-600 dark:text-primary-400' }, row.original.formattedAmount)
    },
    {
      accessorKey: 'vendorName',
      header: 'Vendor',
      enableSorting: false,
      cell: ({ row }: any) => h('div', { class: 'text-xs break-words max-w-[180px]' }, row.original.vendorName)
    },
    {
      accessorKey: 'action',
      header: 'Action',
      enableSorting: false,
      cell: ({ row }: any) => {
        const option = row.original
        return h('div', { class: 'flex justify-center' }, [
          h(UButton as any, {
            color: 'primary',
            size: 'sm',
            onClick: () => selectAndPayAdvance(option)
          }, () => props.showInvoiceSummary ? 'Create Invoice' : 'Pay Advance')
        ])
      }
    }
  )

  return baseColumns
})

// Allowed statuses for PO/CO selection
const allowedStatuses = ['Approved', 'Completed', 'Partially_Received', 'partially_received']

const shouldHideOrderFromPicker = (
  orderType: string | undefined,
  invoiceSummary: {
    balanceToBeInvoiced?: number
    qtyRemainingToBeInvoiced?: number
  } | null,
  optionValue: string,
  currentModelValue: string | undefined
): boolean => {
  if (!invoiceSummary) return false
  if (currentModelValue === optionValue) return false

  const normalizedType = String(orderType ?? '').toUpperCase()
  if (normalizedType === 'LABOR') {
    return (invoiceSummary.balanceToBeInvoiced ?? 0) <= 0
  }
  if (normalizedType === 'MATERIAL') {
    return (invoiceSummary.qtyRemainingToBeInvoiced ?? 0) <= 0
  }
  return false
}

// Helper function to check if status is allowed
const isStatusAllowed = (status: string | undefined): boolean => {
  if (!status) return false
  return allowedStatuses.includes(status)
}

// Helper function to get status color
const getStatusColor = (status: string): "error" | "warning" | "info" | "success" | "primary" | "secondary" | "neutral" => {
  const statusColors: Record<string, "error" | "warning" | "info" | "success" | "primary" | "secondary" | "neutral"> = {
    'Draft': 'neutral',
    'Ready': 'warning',
    'Approved': 'success',
    'Rejected': 'error',
    'Completed': 'info',
    'Partially_Received': 'info',
    'partially_received': 'info'
  };
  return statusColors[status] || 'neutral';
};

// Helper function to fetch PO items
const fetchPOItems = async (poUuid: string): Promise<{ items: any[], totalQuantity: number }> => {
  const cacheKey = `PO:${poUuid}`
  
  // Check cache first
  if (itemsCache.value.has(cacheKey)) {
    return itemsCache.value.get(cacheKey)!
  }
  
  // Check if already loading
  if (loadingItems.value.has(cacheKey)) {
    return { items: [], totalQuantity: 0 }
  }
  
  loadingItems.value.add(cacheKey)
  
  try {
    const response = await $fetch<{ data: any[] }>(`/api/purchase-order-items?purchase_order_uuid=${poUuid}`)
    const items = Array.isArray(response?.data) ? response.data : []
    
    let totalQuantity = 0
    items.forEach((item: any) => {
      const qty = item.po_quantity || item.quantity || 0
      totalQuantity += Number(qty) || 0
    })
    
    const result = { items, totalQuantity }
    itemsCache.value.set(cacheKey, result)
    cacheUpdateTrigger.value++ // Trigger reactivity
    return result
  } catch (error) {
    console.error(`[POCOSelect] Error fetching PO items for ${poUuid}:`, error)
    return { items: [], totalQuantity: 0 }
  } finally {
    loadingItems.value.delete(cacheKey)
  }
}

// Helper function to fetch PO invoice summary
const fetchPOInvoiceSummary = async (poUuid: string, forceRefresh: boolean = false): Promise<{
  advancePaid: number
  advancePaidNet: number
  invoicedValue: number
  holdbackBalanceToBeInvoiced: number
  balanceToBeInvoiced: number
  totalOrderValue: number
  holdbackReleased: number
  poQuantity?: number
  invoicedQuantity?: number
  qtyRemainingToBeInvoiced?: number
} | null> => {
  const cacheKey = `PO_SUMMARY:${poUuid}`
  
  // Check cache first (unless forcing refresh)
  if (!forceRefresh && invoiceSummaryCache.value.has(cacheKey)) {
    return invoiceSummaryCache.value.get(cacheKey)!
  }
  
  // Check if already loading
  if (loadingInvoiceSummaries.value.has(cacheKey)) {
    return null
  }
  
  loadingInvoiceSummaries.value.add(cacheKey)
  
  try {
    const response = await $fetch<{ data: any }>(`/api/purchase-orders/invoice-summary?purchase_order_uuid=${poUuid}`)
    const summary = response?.data
    
    if (summary) {
      const result = {
        // "Advance Paid" column: total advance invoice amount including sales taxes (API: advance_paid_including_taxes)
        advancePaid: summary.advance_paid_including_taxes ?? summary.advance_paid ?? 0,
        advancePaidNet: summary.advance_paid ?? 0,
        invoicedValue: summary.invoiced_value || 0,
        holdbackBalanceToBeInvoiced: summary.holdback_balance_to_be_invoiced || 0,
        balanceToBeInvoiced: summary.balance_to_be_invoiced || 0,
        totalOrderValue: summary.total_po_value || 0,
        holdbackReleased: summary.holdback_released || 0,
        poQuantity: summary.total_po_quantity || 0,
        invoicedQuantity: summary.invoiced_quantity || 0,
        qtyRemainingToBeInvoiced: summary.qty_remaining_to_be_invoiced || 0
      }
      invoiceSummaryCache.value.set(cacheKey, result)
      cacheUpdateTrigger.value++ // Trigger reactivity
      return result
    }
    
    return null
  } catch (error) {
    console.error(`[POCOSelect] Error fetching PO invoice summary for ${poUuid}:`, error)
    return null
  } finally {
    loadingInvoiceSummaries.value.delete(cacheKey)
  }
}

// Helper function to fetch CO invoice summary
const fetchCOInvoiceSummary = async (coUuid: string, forceRefresh: boolean = false): Promise<{
  advancePaid: number
  advancePaidNet: number
  invoicedValue: number
  holdbackBalanceToBeInvoiced: number
  balanceToBeInvoiced: number
  totalOrderValue: number
  holdbackReleased: number
  coQuantity?: number
  invoicedQuantity?: number
  qtyRemainingToBeInvoiced?: number
} | null> => {
  const cacheKey = `CO_SUMMARY:${coUuid}`
  
  // Check cache first (unless forcing refresh)
  if (!forceRefresh && invoiceSummaryCache.value.has(cacheKey)) {
    return invoiceSummaryCache.value.get(cacheKey)!
  }
  
  // Check if already loading
  if (loadingInvoiceSummaries.value.has(cacheKey)) {
    return null
  }
  
  loadingInvoiceSummaries.value.add(cacheKey)
  
  try {
    const response = await $fetch<{ data: any }>(`/api/change-orders/invoice-summary?change_order_uuid=${coUuid}`)
    const summary = response?.data
    
    if (summary) {
      const result = {
        advancePaid: summary.advance_paid_including_taxes ?? summary.advance_paid ?? 0,
        advancePaidNet: summary.advance_paid ?? 0,
        invoicedValue: summary.invoiced_value || 0,
        holdbackBalanceToBeInvoiced: summary.holdback_balance_to_be_invoiced || 0,
        balanceToBeInvoiced: summary.balance_to_be_invoiced || 0,
        totalOrderValue: summary.total_co_value || 0,
        holdbackReleased: summary.holdback_released || 0,
        coQuantity: summary.total_co_quantity || 0,
        invoicedQuantity: summary.invoiced_quantity || 0,
        qtyRemainingToBeInvoiced: summary.qty_remaining_to_be_invoiced || 0
      }
      invoiceSummaryCache.value.set(cacheKey, result)
      cacheUpdateTrigger.value++ // Trigger reactivity
      return result
    }
    
    return null
  } catch (error) {
    console.error(`[POCOSelect] Error fetching CO invoice summary for ${coUuid}:`, error)
    return null
  } finally {
    loadingInvoiceSummaries.value.delete(cacheKey)
  }
}

// Helper function to fetch CO items
const fetchCOItems = async (coUuid: string): Promise<{ items: any[], totalQuantity: number }> => {
  const cacheKey = `CO:${coUuid}`
  
  // Check cache first
  if (itemsCache.value.has(cacheKey)) {
    return itemsCache.value.get(cacheKey)!
  }
  
  // Check if already loading
  if (loadingItems.value.has(cacheKey)) {
    return { items: [], totalQuantity: 0 }
  }
  
  loadingItems.value.add(cacheKey)
  
  try {
    const response = await $fetch<{ data: any[] }>(`/api/change-order-items?change_order_uuid=${coUuid}`)
    const items = Array.isArray(response?.data) ? response.data : []
    
    let totalQuantity = 0
    items.forEach((item: any) => {
      const qty = item.co_quantity || item.quantity || 0
      totalQuantity += Number(qty) || 0
    })
    
    const result = { items, totalQuantity }
    itemsCache.value.set(cacheKey, result)
    cacheUpdateTrigger.value++ // Trigger reactivity
    return result
  } catch (error) {
    console.error(`[POCOSelect] Error fetching CO items for ${coUuid}:`, error)
    return { items: [], totalQuantity: 0 }
  } finally {
    loadingItems.value.delete(cacheKey)
  }
}

// Combined PO/CO options computed property
const poCoOptions = computed(() => {
  // Access cacheUpdateTrigger to make this reactive to cache changes
  const _ = cacheUpdateTrigger.value
  // Also access invoiceSummaryCache to make it reactive
  if (props.showInvoiceSummary) {
    invoiceSummaryCache.value.size // Access to trigger reactivity
  }
  
  if (!props.projectUuid || !props.corporationUuid || !props.vendorUuid) {
    return [];
  }

  const currentModelValue = props.modelValue

  const options: any[] = [];
  
  // Filter and add Purchase Orders (only if not showing only COs).
  // Rows are already scoped to corporation + project + vendor + allowed status by the API.
  if (!props.showOnlyCOs) {
    const filteredPOs = fetchedPurchaseOrders.value.filter(po =>
      isStatusAllowed(po.status)
    );

  filteredPOs.forEach(po => {
    const poNumber = po.po_number || 'Unnamed PO';
    const vendorName = po.vendor_name || 'Unknown Vendor';
    const amount = displayAmountForOrder(po, po.total_po_amount || 0);
    const formattedAmount = formatCurrency(amount);
    
    // Get items from cache or use po_items if available
    const cacheKey = `PO:${po.uuid}`
    let poItems: any[] = []
    let totalQuantity = 0
    
    if (itemsCache.value.has(cacheKey)) {
      const cached = itemsCache.value.get(cacheKey)!
      poItems = cached.items
      totalQuantity = cached.totalQuantity
    } else if (Array.isArray(po.po_items) && po.po_items.length > 0) {
      // Use items if they're already loaded
      poItems = po.po_items
      poItems.forEach((item: any) => {
        const qty = item.po_quantity || item.quantity || 0
        totalQuantity += Number(qty) || 0
      })
    } else {
      // Trigger async fetch (will update on next render)
      if (showModal.value && po.uuid) {
        fetchPOItems(po.uuid)
      }
    }
    
    const totalItems = poItems.length
    let avgRate = 0
    if (totalQuantity > 0 && amount > 0) {
      avgRate = amount / totalQuantity
    }
    const formattedAvgRate = formatCurrency(avgRate);
    
    // Format date
    const poDate = po.entry_date || po.created_at || '';
    const formattedDate = formatDate(poDate);
    
    // Get invoice summary if showInvoiceSummary is enabled (for filtering based on remaining balance)
    // Only use cached data - fetching happens in openModal to avoid infinite loops
    let invoiceSummary = null
    if (props.showInvoiceSummary) {
      const summaryCacheKey = `PO_SUMMARY:${po.uuid}`
      if (invoiceSummaryCache.value.has(summaryCacheKey)) {
        const rawSummary = invoiceSummaryCache.value.get(summaryCacheKey)!
        if (
          shouldHideOrderFromPicker(
            po.po_type,
            rawSummary,
            `PO:${po.uuid}`,
            currentModelValue
          )
        ) {
          return
        }
        invoiceSummary = mapInvoiceSummaryForDisplay(po, rawSummary, poItems, po.po_type)
      }
    }

    options.push({
      label: poNumber,
      value: `PO:${po.uuid}`, // Prefix with PO: to distinguish from CO
      order: po,
      number: poNumber,
      vendorName: vendorName,
      formattedAmount: formattedAmount,
      formattedDate: formattedDate || 'N/A',
      totalItems: totalItems,
      avgRate: avgRate,
      formattedAvgRate: formattedAvgRate,
      status: po.status || 'Draft',
      status_color: getStatusColor(po.status || 'Draft'),
      type: 'PO',
      type_label: 'PO',
      type_color: 'primary',
      invoiceSummary: invoiceSummary, // Add invoice summary data
      searchText: `${po.po_number || ''} ${po.vendor_name || ''} ${po.uuid || ''}`.toLowerCase()
    });
    });
  }
  
  // Filter and add Change Orders (only if showOnlyPOs is false and showOnlyCOs is true or both are false).
  // Rows are already scoped to corporation + project + vendor + allowed status by the API.
  if (!props.showOnlyPOs || props.showOnlyCOs) {
    const filteredCOs = fetchedChangeOrders.value.filter(co =>
      isStatusAllowed(co.status)
    );

  filteredCOs.forEach(co => {
    const coNumber = co.co_number || 'Unnamed CO';
    const vendorName = co.vendor_name || 'Unknown Vendor';
    const amount = displayAmountForOrder(co, co.total_co_amount || 0);
    const formattedAmount = formatCurrency(amount);
    
    // Get items from cache or use co_items if available
    const cacheKey = `CO:${co.uuid}`
    let coItems: any[] = []
    let totalQuantity = 0
    
    if (itemsCache.value.has(cacheKey)) {
      const cached = itemsCache.value.get(cacheKey)!
      coItems = cached.items
      totalQuantity = cached.totalQuantity
    } else if (Array.isArray(co.co_items) && co.co_items.length > 0) {
      // Use items if they're already loaded
      coItems = co.co_items
      coItems.forEach((item: any) => {
        const qty = item.co_quantity || item.quantity || 0
        totalQuantity += Number(qty) || 0
      })
    } else {
      // Trigger async fetch (will update on next render)
      if (showModal.value && co.uuid) {
        fetchCOItems(co.uuid)
      }
    }
    
    const totalItems = coItems.length
    let avgRate = 0
    if (totalQuantity > 0 && amount > 0) {
      avgRate = amount / totalQuantity
    }
    const formattedAvgRate = formatCurrency(avgRate);
    
    // Format date
    const coDate = co.created_date || '';
    const formattedDate = formatDate(coDate);
    
    // Get invoice summary if showInvoiceSummary is enabled (for filtering based on remaining balance)
    // Only use cached data - fetching happens in openModal to avoid infinite loops
    let invoiceSummary = null
    if (props.showInvoiceSummary) {
      const summaryCacheKey = `CO_SUMMARY:${co.uuid}`
      if (invoiceSummaryCache.value.has(summaryCacheKey)) {
        const rawSummary = invoiceSummaryCache.value.get(summaryCacheKey)!
        if (
          shouldHideOrderFromPicker(
            co.co_type,
            rawSummary,
            `CO:${co.uuid}`,
            currentModelValue
          )
        ) {
          return
        }
        invoiceSummary = mapInvoiceSummaryForDisplay(co, rawSummary, coItems, co.co_type)
      }
    }

    options.push({
      label: coNumber,
      value: `CO:${co.uuid}`, // Prefix with CO: to distinguish from PO
      order: co,
      number: coNumber,
      vendorName: vendorName,
      formattedAmount: formattedAmount,
      formattedDate: formattedDate || 'N/A',
      totalItems: totalItems,
      avgRate: avgRate,
      formattedAvgRate: formattedAvgRate,
      status: co.status || 'Draft',
      status_color: getStatusColor(co.status || 'Draft'),
      type: 'CO',
      type_label: 'CO',
      type_color: 'secondary',
      invoiceSummary: invoiceSummary, // Add invoice summary data
      searchText: `${co.co_number || ''} ${co.vendor_name || ''} ${co.uuid || ''}`.toLowerCase()
    });
    });
  }
  
  // Sort by number (PO/CO number)
  return options.sort((a, b) => {
    const aNum = a.number || '';
    const bNum = b.number || '';
    return aNum.localeCompare(bNum);
  });
});

// Filtered options based on search
const filteredOptions = computed(() => {
  if (!searchFilter.value.trim()) {
    return poCoOptions.value
  }
  
  const searchTerm = searchFilter.value.toLowerCase().trim()
  return poCoOptions.value.filter(option => {
    return option.searchText.includes(searchTerm) ||
           option.number.toLowerCase().includes(searchTerm) ||
           option.vendorName.toLowerCase().includes(searchTerm)
  })
})

// Create a Map for fast O(1) lookup of options by value
const optionsMap = computed(() => {
  return new Map(poCoOptions.value.map(option => [option.value, option]))
})

// Find the selected option object for display
const updateSelectedObject = () => {
  if (!selectedOrder.value) {
    selectedOption.value = undefined
  } else {
    selectedOption.value = optionsMap.value.get(selectedOrder.value) || undefined
  }
}

// Helper to get PO/CO rows visible in the picker (already scoped by the API).
const getFilteredOrdersForModal = () => {
  const pos = !props.showOnlyCOs
    ? fetchedPurchaseOrders.value.filter((po) => isStatusAllowed(po.status))
    : []

  const cos =
    !props.showOnlyPOs || props.showOnlyCOs
      ? fetchedChangeOrders.value.filter((co) => isStatusAllowed(co.status))
      : []

  return { pos, cos }
}

// Modal methods
const openModal = async () => {
  if (props.disabled || optionsLoading.value || !props.projectUuid || !props.vendorUuid) {
    return
  }

  showModal.value = true
  searchFilter.value = ''
  modalPrefetchLoading.value = true

  try {
    // Always load a fresh, fully-scoped PO/CO list straight from the DB.
    await loadPoCoOptions()

    const fetchPromises: Promise<any>[] = []
    const { pos: filteredPOs, cos: filteredCOs } = getFilteredOrdersForModal()

    filteredPOs.forEach((po) => {
      if (po.uuid && (!Array.isArray(po.po_items) || po.po_items.length === 0)) {
        fetchPromises.push(fetchPOItems(po.uuid))
      }
      if (props.showInvoiceSummary && po.uuid) {
        fetchPromises.push(fetchPOInvoiceSummary(po.uuid, true))
      }
    })

    filteredCOs.forEach((co) => {
      if (co.uuid && (!Array.isArray(co.co_items) || co.co_items.length === 0)) {
        fetchPromises.push(fetchCOItems(co.uuid))
      }
      if (props.showInvoiceSummary && co.uuid) {
        fetchPromises.push(fetchCOInvoiceSummary(co.uuid, true))
      }
    })

    await Promise.all(fetchPromises)
  } finally {
    modalPrefetchLoading.value = false
  }
}

const closeModal = () => {
  showModal.value = false
  searchFilter.value = ''
  modalPrefetchLoading.value = false
}

const clearSelection = () => {
  selectedOrder.value = undefined
  selectedOption.value = undefined
  emit('update:modelValue', undefined)
  emit('change', undefined)
}

const selectAndPayAdvance = (option: any) => {
  selectedOrder.value = option.value
  selectedOption.value = option
  emit('update:modelValue', option.value)
  emit('change', option)
  closeModal()
}

// Methods
const handleSelection = (order: any) => {
  if (typeof order === 'string') {
    selectedOrder.value = order
    emit('update:modelValue', order)
    const option = optionsMap.value.get(order)
    if (option) {
      emit('change', option)
    } else {
      emit('change', undefined)
    }
    return
  }

  if (order && typeof order === 'object') {
    const value = order.value ?? order.uuid ?? order.id
    if (value) {
      selectedOrder.value = value
      emit('update:modelValue', value)
      emit('change', order)
      return
    }
  }

  selectedOrder.value = undefined
  emit('update:modelValue', undefined)
  emit('change', undefined)
}

// Watchers
watch(() => props.modelValue, (newValue) => {
  selectedOrder.value = newValue
  updateSelectedObject()
})

watch(poCoOptions, () => {
  updateSelectedObject()
}, { immediate: true })

watch(selectedOrder, () => {
  updateSelectedObject()
})

// Clear any stale selection and cached options when the scope changes.
// Fresh options are loaded lazily when the modal is opened (see openModal).
watch(
  [() => props.projectUuid, () => props.corporationUuid, () => props.vendorUuid],
  ([newProjectUuid, newCorpUuid, newVendorUuid], [oldProjectUuid, oldCorpUuid, oldVendorUuid]) => {
    if (
      (newProjectUuid !== oldProjectUuid ||
        newCorpUuid !== oldCorpUuid ||
        newVendorUuid !== oldVendorUuid) &&
      (oldProjectUuid || oldCorpUuid || oldVendorUuid)
    ) {
      selectedOrder.value = undefined
      selectedOption.value = undefined
      emit('update:modelValue', undefined)
      // Drop cached rows so the next open re-fetches for the new scope.
      fetchedPurchaseOrders.value = []
      fetchedChangeOrders.value = []
    }
  }
)

defineExpose({
  hasValidationError,
})
</script>

<style scoped>
.poco-select-table :deep(table) {
  width: 100%;
  table-layout: fixed;
}

.poco-select-table :deep(th),
.poco-select-table :deep(td) {
  white-space: normal !important;
  overflow-wrap: anywhere;
  word-break: break-word;
}

/* Helps avoid long headers forcing the table to grow wider than the container */
.poco-select-table :deep(thead th) {
  font-size: 0.725rem; /* ~10px */
  line-height: 1;
  white-space: pre-line;
  overflow-wrap: anywhere;
  word-break: break-word;
  max-width: 160px;
}
</style>

