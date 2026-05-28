<template>
  <div class="px-2 py-2 bg-gray-50 dark:bg-gray-900/50">
    <div v-if="loading" class="flex items-center justify-center py-4">
      <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin text-primary" />
      <span class="ml-2 text-[10px] text-gray-600 dark:text-gray-400">Loading items...</span>
    </div>
    
    <div v-else-if="error" class="text-center py-2">
      <p class="text-[10px] text-red-600 dark:text-red-400">{{ error }}</p>
    </div>
    
    <div v-else-if="!items || items.length === 0" class="text-center py-2">
      <p class="text-[10px] text-gray-500 dark:text-gray-400">No items found</p>
    </div>
    
    <div v-else class="w-full">
      <table class="w-full border-collapse text-xs table-fixed" style="table-layout: fixed;">
        <colgroup>
          <col style="width: 7%;">
          <col style="width: 5%;">
          <col style="width: 8%;">
          <col style="width: 7%;">
          <col style="width: 7%;">
          <col style="width: 5%;">
          <col style="width: 5%;">
          <col style="width: 6%;">
          <col style="width: 6%;">
          <col style="width: 6%;">
          <col style="width: 6%;">
          <col style="width: 6%;">
          <col style="width: 6%;">
          <col style="width: 6%;">
        </colgroup>
        <thead>
          <tr class="bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700">
            <th class="px-1.5 py-1 text-left font-bold text-xs text-gray-900 dark:text-gray-100 border-r border-gray-300 dark:border-gray-700">Category</th>
            <th class="px-1.5 py-1 text-left font-bold text-xs text-gray-900 dark:text-gray-100 border-r border-gray-300 dark:border-gray-700">Type</th>
            <th class="px-1.5 py-1 text-left font-bold text-xs text-gray-900 dark:text-gray-100 border-r border-gray-300 dark:border-gray-700">Spec</th>
            <th class="px-1.5 py-1 text-left font-bold text-xs text-gray-900 dark:text-gray-100 border-r border-gray-300 dark:border-gray-700">Item</th>
            <th class="px-1.5 py-1 text-left font-bold text-xs text-gray-900 dark:text-gray-100 border-r border-gray-300 dark:border-gray-700">Location</th>
            <th class="px-1.5 py-1 text-right font-bold text-xs text-gray-900 dark:text-gray-100 border-r border-gray-300 dark:border-gray-700">Quantity</th>
            <th class="px-1.5 py-1 text-right font-bold text-xs text-gray-900 dark:text-gray-100 border-r border-gray-300 dark:border-gray-700">Unit Cost</th>
            <th class="px-1.5 py-1 text-right font-bold text-xs text-gray-900 dark:text-gray-100 border-r border-gray-300 dark:border-gray-700">Goods Amount</th>
            <th class="px-1.5 py-1 text-right font-bold text-xs text-gray-900 dark:text-gray-100 border-r border-gray-300 dark:border-gray-700">Freight</th>
            <th class="px-1.5 py-1 text-right font-bold text-xs text-gray-900 dark:text-gray-100 border-r border-gray-300 dark:border-gray-700">Packaging</th>
            <th class="px-1.5 py-1 text-right font-bold text-xs text-gray-900 dark:text-gray-100 border-r border-gray-300 dark:border-gray-700">Customs & Duties</th>
            <th class="px-1.5 py-1 text-right font-bold text-xs text-gray-900 dark:text-gray-100 border-r border-gray-300 dark:border-gray-700">Other Amount</th>
            <th class="px-1.5 py-1 text-right font-bold text-xs text-gray-900 dark:text-gray-100 border-r border-gray-300 dark:border-gray-700">Taxes</th>
            <th class="px-1.5 py-1 text-right font-bold text-xs text-gray-900 dark:text-gray-100">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(item, index) in items"
            :key="item.uuid || item.id || index"
            class="border-b border-gray-200 dark:border-gray-700"
          >
            <td class="px-1.5 py-1 text-left text-gray-700 dark:text-gray-300 truncate border-r border-gray-200 dark:border-gray-700">
              {{ getCategory(item) }}
            </td>
            <td class="px-1.5 py-1 text-left text-gray-700 dark:text-gray-300 truncate border-r border-gray-200 dark:border-gray-700">
              {{ getItemType(item) }}
            </td>
            <td class="px-1.5 py-1 text-left text-gray-700 dark:text-gray-300 truncate border-r border-gray-200 dark:border-gray-700">
              {{ getSpec(item) }}
            </td>
            <td class="px-1.5 py-1 text-left text-gray-700 dark:text-gray-300 truncate border-r border-gray-200 dark:border-gray-700">
              {{ getItemName(item) }}
            </td>
            <td class="px-1.5 py-1 text-left text-gray-700 dark:text-gray-300 truncate border-r border-gray-200 dark:border-gray-700">
              {{ getLocationName(item) }}
            </td>
            <td class="px-1.5 py-1 text-right text-gray-700 dark:text-gray-300 truncate border-r border-gray-200 dark:border-gray-700">
              {{ formatQuantity(item.po_quantity || item.quantity || 0) }}
            </td>
            <td class="px-1.5 py-1 text-right text-gray-700 dark:text-gray-300 font-mono truncate border-r border-gray-200 dark:border-gray-700">
              {{ formatCurrencyCompact(item.po_unit_price || item.unit_price || 0) }}
            </td>
            <td class="px-1.5 py-1 text-right text-gray-700 dark:text-gray-300 font-mono truncate border-r border-gray-200 dark:border-gray-700">
              {{ formatCurrencyCompact(item.po_total || item.total || getGoodsAmount(item)) }}
            </td>
            <td 
              v-if="index === 0"
              :rowspan="items.length"
              class="px-1.5 py-1 text-center text-gray-700 dark:text-gray-300 font-mono align-middle border-r border-gray-200 dark:border-gray-700"
              style="vertical-align: middle;"
            >
              {{ formatCurrencyCompact(totalFreightAmount, true) }}
            </td>
            <td 
              v-if="index === 0"
              :rowspan="items.length"
              class="px-1.5 py-1 text-center text-gray-700 dark:text-gray-300 font-mono align-middle border-r border-gray-200 dark:border-gray-700"
              style="vertical-align: middle;"
            >
              {{ formatCurrencyCompact(totalPackingAmount, true) }}
            </td>
            <td 
              v-if="index === 0"
              :rowspan="items.length"
              class="px-1.5 py-1 text-center text-gray-700 dark:text-gray-300 font-mono align-middle border-r border-gray-200 dark:border-gray-700"
              style="vertical-align: middle;"
            >
              {{ formatCurrencyCompact(totalCustomsAmount, true) }}
            </td>
            <td 
              v-if="index === 0"
              :rowspan="items.length"
              class="px-1.5 py-1 text-center text-gray-700 dark:text-gray-300 font-mono align-middle border-r border-gray-200 dark:border-gray-700"
              style="vertical-align: middle;"
            >
              {{ formatCurrencyCompact(totalOtherAmount, true) }}
            </td>
            <td 
              v-if="index === 0"
              :rowspan="items.length"
              class="px-1.5 py-1 text-center text-gray-700 dark:text-gray-300 font-mono align-middle border-r border-gray-200 dark:border-gray-700"
              style="vertical-align: middle;"
            >
              {{ formatCurrencyCompact(totalTaxesAmount, true) }}
            </td>
            <td 
              v-if="index === 0"
              :rowspan="items.length"
              class="px-1.5 py-1 text-right text-gray-700 dark:text-gray-300 font-mono font-semibold align-middle"
              style="vertical-align: middle;"
            >
              {{ formatCurrencyCompact(totalAmount, true) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { usePurchaseOrderResourcesStore } from '~/stores/purchaseOrderResources'
import { useItemTypesStore } from '~/stores/itemTypes'
import { useLocationsStore } from '~/stores/locations'
import { useItemDivisionsStore } from '~/stores/itemDivisions'
import { useCurrencyFormat } from '~/composables/useCurrencyFormat'
import { getCategoryLabel } from '~/constants/itemCategories'

interface Props {
  poUuid: string
  poData?: any
}

const props = defineProps<Props>()

const purchaseOrderResourcesStore = usePurchaseOrderResourcesStore()
const itemTypesStore = useItemTypesStore()
const locationsStore = useLocationsStore()
const itemDivisionsStore = useItemDivisionsStore()
const { formatCurrency } = useCurrencyFormat()

const items = ref<any[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const masterSpecByItemUuid = ref<Map<string, string>>(new Map())
const masterSpecByTypeAndName = ref<Map<string, string>>(new Map())
const estimateSpecByItemUuid = ref<Map<string, string>>(new Map())
const estimateSpecByTypeAndName = ref<Map<string, string>>(new Map())
const loadedSpecLookupKey = ref('')

const formatQuantity = (qty: number) => {
  if (typeof qty !== 'number' || isNaN(qty)) return '0'
  return qty.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

const formatCurrencyCompact = (amount: number, showEmpty: boolean = false) => {
  if (amount === 0 && !showEmpty) return ''
  const formatted = formatCurrency(amount)
  // Ensure format matches "$ X.XX" with space after dollar sign
  // Intl.NumberFormat typically returns "$16.54", we need "$ 16.54"
  if (formatted.startsWith('$') && !formatted.startsWith('$ ')) {
    return formatted.replace('$', '$ ')
  }
  return formatted
}

const normalizeText = (value: unknown) => String(value || '').trim().toLowerCase()
const buildTypeNameKey = (itemTypeUuid: unknown, itemName: unknown) =>
  `${normalizeText(itemTypeUuid)}::${normalizeText(itemName)}`
const toSequenceString = (value: unknown): string => {
  if (value === null || value === undefined) return ''
  const s = String(value).trim()
  return s
}

const isUuidLike = (value: any) => {
  if (typeof value !== 'string') return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

const resolveLocationFromStore = (uuid?: string | null) => {
  if (!uuid) return null
  const loc = locationsStore.getByUuid(uuid)
  if (!loc) return null
  const name = loc.location_name
  const code = loc.location_code
  if (name && code) return `${name} (${code})`
  if (name) return name
  if (code) return String(code)
  return null
}

const getItemType = (item: any) => {
  // Check item fields first, then metadata, then lookup from store (for consistency)
  // Skip empty/corrupted values
  const candidates = [
    item?.item_type_label,
    item?.display_metadata?.item_type_label,
    item?.metadata?.item_type_label,
    item?.item_type,
    item?.type
  ].filter(candidate => candidate && candidate.trim() !== '' && candidate !== '—')

  // If we found a label, return it
  if (candidates[0]) {
    return candidates[0]
  }

  // If we have an item_type_uuid but no label, look it up from the store
  if (item?.item_type_uuid && itemTypesStore.itemTypes.length > 0) {
    const itemType = itemTypesStore.itemTypes.find((it: any) => it.uuid === item.item_type_uuid)
    if (itemType?.item_type) {
      return itemType.item_type
    }
  }

  return '—'
}

// Category and division from item_types → item_divisions (parity with stock-report, not cost-code)
const getCategory = (item: any) => {
  const typeUuid = item?.item_type_uuid || item?.display_metadata?.item_type_uuid || item?.metadata?.item_type_uuid
  if (typeUuid && itemTypesStore.itemTypes?.length) {
    const it = itemTypesStore.getItemTypeById?.(typeUuid) ?? itemTypesStore.itemTypes.find((t: any) => t.uuid === typeUuid)
    if (it?.category) return getCategoryLabel(String(it.category))
  }
  const raw = item?.category || item?.item_category || ''
  return raw ? getCategoryLabel(String(raw)) : '—'
}

const getDivisionName = (item: any) => {
  const typeUuid = item?.item_type_uuid || item?.display_metadata?.item_type_uuid || item?.metadata?.item_type_uuid
  if (typeUuid && itemTypesStore.itemTypes?.length) {
    const it = itemTypesStore.getItemTypeById?.(typeUuid) ?? itemTypesStore.itemTypes.find((t: any) => t.uuid === typeUuid)
    if (it) {
      const divUuid = it.item_division_uuid
      if (divUuid && itemDivisionsStore.itemDivisions?.length) {
        const division = itemDivisionsStore.itemDivisions.find((d: any) => d.uuid === divUuid)
        if (division?.division_name) return division.division_name
      }
      return '—' // type found; use item_division from type only, not cost-code
    }
  }
  if (item?.item_division_uuid && itemDivisionsStore.itemDivisions?.length) {
    const division = itemDivisionsStore.itemDivisions.find((d: any) => d.uuid === item.item_division_uuid)
    if (division?.division_name) return division.division_name
  }
  return item?.division_name || '—'
}

// Spec = sequence number (parity with stock-report), not model_number
const formatSequenceForSpec = (v: string | number | null | undefined): string => {
  if (v === null || v === undefined) return ''
  const s = String(v).trim()
  if (!s) return ''
  if (typeof v === 'number') return String(v).padStart(3, '0')
  return s
}

const getSpec = (item: any) => {
  const seq =
    item?.item_sequence ??
    item?.sequence ??
    item?.metadata?.sequence ??
    item?.metadata?.item_sequence ??
    item?.display_metadata?.sequence ??
    item?.display_metadata?.item_sequence ??
    item?.sequence_label
  const formatted = formatSequenceForSpec(seq)
  if (formatted) return formatted

  const includeMode = String(props.poData?.include_items || '').toUpperCase()
  const itemUuid = String(item?.item_uuid || item?.uuid || '').trim()
  const itemTypeUuid =
    item?.item_type_uuid ??
    item?.metadata?.item_type_uuid ??
    item?.display_metadata?.item_type_uuid ??
    null
  const typeNameKey = buildTypeNameKey(itemTypeUuid, item?.item_name || item?.name)

  if (includeMode === 'IMPORT_ITEMS_FROM_MASTER') {
    if (itemUuid) {
      const byUuid = masterSpecByItemUuid.value.get(itemUuid)
      if (byUuid) return byUuid
    }
    if (typeNameKey !== '::') {
      const byTypeName = masterSpecByTypeAndName.value.get(typeNameKey)
      if (byTypeName) return byTypeName
    }
  } else if (includeMode === 'IMPORT_ITEMS_FROM_ESTIMATE') {
    if (itemUuid) {
      const byUuid = estimateSpecByItemUuid.value.get(itemUuid)
      if (byUuid) return byUuid
    }
    if (typeNameKey !== '::') {
      const byTypeName = estimateSpecByTypeAndName.value.get(typeNameKey)
      if (byTypeName) return byTypeName
    }
  }

  return '—'
}

const getLocationName = (item: any) => {
  const uuidCandidate =
    item?.location_uuid ??
    item?.metadata?.location_uuid ??
    item?.display_metadata?.location_uuid ??
    null

  // Prefer UUID-based resolution.
  const fromUuid = resolveLocationFromStore(
    typeof uuidCandidate === 'string' ? uuidCandidate : null
  )
  if (fromUuid) return fromUuid

  // Sometimes the location is stored only as a UUID-like string in location_label / location.
  const rawLocationLabel =
    item?.location_label ??
    item?.location_display ??
    item?.metadata?.location_display ??
    item?.metadata?.location_name ??
    item?.display_metadata?.location_label ??
    item?.display_metadata?.location_display ??
    item?.location ??
    null

  if (typeof rawLocationLabel === 'string' && isUuidLike(rawLocationLabel)) {
    const fromUuidLike = resolveLocationFromStore(rawLocationLabel)
    if (fromUuidLike) return fromUuidLike
    // If we can't resolve, show the raw uuid-like string (better than blank).
    return rawLocationLabel
  }

  const labelCandidate =
    item?.location_label ??
    item?.metadata?.location_label ??
    item?.location_display ??
    item?.metadata?.location_display ??
    null

  if (typeof labelCandidate === 'string' && labelCandidate.trim() !== '') {
    return labelCandidate
  }

  if (typeof item?.location === 'string' && item.location.trim() !== '') {
    return item.location
  }

  return '—'
}

const getItemName = (item: any) => {
  // Always use item_name from the database - no fallbacks
  // The API returns raw database data - item_name is a direct column in purchase_order_items_list table
  if (item?.item_name && typeof item.item_name === 'string') {
    // Trim whitespace for display, but return the item_name as-is from database
    return item.item_name.trim() || '—'
  }
  
  // If item_name is missing or empty, show '—'
  return '—'
}

const getGoodsAmount = (item: any) => {
  const qty = item.po_quantity || item.quantity || 0
  const price = item.po_unit_price || item.unit_price || 0
  return qty * price
}

const getFreightAmount = (item: any) => {
  // If item has freight amount stored, use it
  if (item.freight_amount != null) {
    return parseFloat(item.freight_amount) || 0
  }
  
  // Calculate freight amount based on PO's freight charges
  if (!props.poData) return 0
  
  // Check multiple possible field names (including financial_breakdown)
  const freightPercentage = parseFloat(
    props.poData.freight_charges_percentage ?? 
    props.poData.financial_breakdown?.charges?.freight?.percentage ?? 
    0
  )
  const freightAmount = parseFloat(
    props.poData.freight_charges_amount ?? 
    props.poData.financial_breakdown?.charges?.freight?.amount ?? 
    0
  )
  const goodsAmount = getGoodsAmount(item)
  const totalGoods = items.value.length > 0 
    ? items.value.reduce((sum, i) => sum + getGoodsAmount(i), 0)
    : goodsAmount
  
  if (totalGoods === 0) return 0
  
  if (freightPercentage > 0) {
    return (goodsAmount * freightPercentage) / 100
  }
  
  if (freightAmount > 0 && totalGoods > 0) {
    return (goodsAmount / totalGoods) * freightAmount
  }
  
  return 0
}

const getPackingAmount = (item: any) => {
  // If item has packing amount stored, use it
  if (item.packing_amount != null) {
    return parseFloat(item.packing_amount) || 0
  }
  
  // Calculate packing amount based on PO's packing charges
  if (!props.poData) return 0
  
  // Check multiple possible field names (including financial_breakdown)
  const packingPercentage = parseFloat(
    props.poData.packing_charges_percentage ?? 
    props.poData.financial_breakdown?.charges?.packing?.percentage ?? 
    0
  )
  const packingAmount = parseFloat(
    props.poData.packing_charges_amount ?? 
    props.poData.financial_breakdown?.charges?.packing?.amount ?? 
    0
  )
  const goodsAmount = getGoodsAmount(item)
  const totalGoods = items.value.length > 0 
    ? items.value.reduce((sum, i) => sum + getGoodsAmount(i), 0)
    : goodsAmount
  
  if (totalGoods === 0) return 0
  
  if (packingPercentage > 0) {
    return (goodsAmount * packingPercentage) / 100
  }
  
  if (packingAmount > 0 && totalGoods > 0) {
    return (goodsAmount / totalGoods) * packingAmount
  }
  
  return 0
}

const getCustomsAmount = (item: any) => {
  // If item has customs amount stored, use it
  if (item.customs_amount != null || item.custom_duties_amount != null) {
    return parseFloat(item.customs_amount || item.custom_duties_amount) || 0
  }
  
  // Calculate customs & duties based on PO's custom duties charges
  if (!props.poData) return 0
  
  // Check multiple possible field names (similar to how other parts of codebase handle this)
  const customsPercentage = parseFloat(
    props.poData.custom_duties_charges_percentage ?? 
    props.poData.custom_duties_percentage ?? 
    props.poData.financial_breakdown?.charges?.custom_duties?.percentage ?? 
    0
  )
  const customsAmount = parseFloat(
    props.poData.custom_duties_charges_amount ?? 
    props.poData.custom_duties_amount ?? 
    props.poData.financial_breakdown?.charges?.custom_duties?.amount ?? 
    0
  )
  const goodsAmount = getGoodsAmount(item)
  const totalGoods = items.value.length > 0
    ? items.value.reduce((sum, i) => sum + getGoodsAmount(i), 0)
    : goodsAmount
  
  if (totalGoods === 0) return 0
  
  if (customsPercentage > 0) {
    return (goodsAmount * customsPercentage) / 100
  }
  
  if (customsAmount > 0 && totalGoods > 0) {
    return (goodsAmount / totalGoods) * customsAmount
  }
  
  return 0
}

const getOtherAmount = (item: any) => {
  // If item has other amount stored, use it
  if (item.other_amount != null) {
    return parseFloat(item.other_amount) || 0
  }
  
  // Calculate other charges based on PO's other charges
  if (!props.poData) return 0
  
  // Check multiple possible field names (including financial_breakdown)
  const otherPercentage = parseFloat(
    props.poData.other_charges_percentage ?? 
    props.poData.financial_breakdown?.charges?.other?.percentage ?? 
    0
  )
  const otherAmount = parseFloat(
    props.poData.other_charges_amount ?? 
    props.poData.financial_breakdown?.charges?.other?.amount ?? 
    0
  )
  const goodsAmount = getGoodsAmount(item)
  const totalGoods = items.value.length > 0
    ? items.value.reduce((sum, i) => sum + getGoodsAmount(i), 0)
    : goodsAmount
  
  if (totalGoods === 0) return 0
  
  if (otherPercentage > 0) {
    return (goodsAmount * otherPercentage) / 100
  }
  
  if (otherAmount > 0 && totalGoods > 0) {
    return (goodsAmount / totalGoods) * otherAmount
  }
  
  return 0
}

const getTaxesAmount = (item: any) => {
  // If item has taxes amount stored, use it
  if (item.taxes_amount != null || item.tax_amount != null) {
    return parseFloat(item.taxes_amount || item.tax_amount) || 0
  }
  
  // Calculate taxes based on PO's tax charges
  if (!props.poData) return 0
  
  const tax1Percentage = parseFloat(props.poData.sales_tax_1_percentage || 0)
  const tax2Percentage = parseFloat(props.poData.sales_tax_2_percentage || 0)
  const goodsAmount = getGoodsAmount(item)
  
  // Only include charges that are taxable
  // Check multiple possible field names for taxable flags
  const freightTaxable = props.poData.freight_charges_taxable ?? props.poData.financial_breakdown?.charges?.freight?.taxable ?? false
  const packingTaxable = props.poData.packing_charges_taxable ?? props.poData.financial_breakdown?.charges?.packing?.taxable ?? false
  const customsTaxable = props.poData.custom_duties_charges_taxable ?? props.poData.custom_duties_taxable ?? props.poData.financial_breakdown?.charges?.custom_duties?.taxable ?? false
  const otherTaxable = props.poData.other_charges_taxable ?? props.poData.financial_breakdown?.charges?.other?.taxable ?? false
  
  const freightAmount = freightTaxable ? getFreightAmount(item) : 0
  const packingAmount = packingTaxable ? getPackingAmount(item) : 0
  const customsAmount = customsTaxable ? getCustomsAmount(item) : 0
  const otherAmount = otherTaxable ? getOtherAmount(item) : 0
  
  const taxableAmount = goodsAmount + freightAmount + packingAmount + customsAmount + otherAmount
  const tax1 = (taxableAmount * tax1Percentage) / 100
  const tax2 = (taxableAmount * tax2Percentage) / 100
  
  return tax1 + tax2
}

const getItemTotal = (item: any) => {
  const goodsAmount = getGoodsAmount(item)
  const freightAmount = getFreightAmount(item)
  const packingAmount = getPackingAmount(item)
  const customsAmount = getCustomsAmount(item)
  const otherAmount = getOtherAmount(item)
  const taxesAmount = getTaxesAmount(item)
  
  return goodsAmount + freightAmount + packingAmount + customsAmount + otherAmount + taxesAmount
}

const totalFreightAmount = computed(() => {
  return items.value.reduce((sum, item) => sum + getFreightAmount(item), 0)
})

const totalPackingAmount = computed(() => {
  return items.value.reduce((sum, item) => sum + getPackingAmount(item), 0)
})

const totalCustomsAmount = computed(() => {
  return items.value.reduce((sum, item) => sum + getCustomsAmount(item), 0)
})

const totalOtherAmount = computed(() => {
  return items.value.reduce((sum, item) => sum + getOtherAmount(item), 0)
})

const totalTaxesAmount = computed(() => {
  return items.value.reduce((sum, item) => sum + getTaxesAmount(item), 0)
})

const totalAmount = computed(() => {
  return items.value.reduce((sum, item) => sum + getItemTotal(item), 0)
})

const fetchItems = async () => {
  loading.value = true
  error.value = null

  try {
    // Always fetch from API as the source of truth (like PurchaseOrderForm and POItemsTableWithEstimates)
    if (!props.poUuid) {
      error.value = 'PO UUID is required'
      return
    }

    await ensureSpecLookups()
    console.log('[POBreakdown] [fetchItems] Fetching items for PO:', props.poUuid)
    const fetchedItems = await purchaseOrderResourcesStore.fetchPurchaseOrderItems(props.poUuid)
    console.log('[POBreakdown] [fetchItems] Fetched items:', {
      count: fetchedItems?.length || 0,
      items: fetchedItems?.slice(0, 2).map(item => ({
        id: item.id,
        uuid: item.uuid,
        item_name: item.item_name,
        description: item.description,
        metadata: item.metadata,
        item_type_label: item.item_type_label
      }))
    })
    items.value = Array.isArray(fetchedItems) ? fetchedItems : []
  } catch (err: any) {
    console.error('[POBreakdown] Failed to fetch PO items:', err)
    error.value = err?.message || 'Failed to load PO items'
    items.value = []
  } finally {
    loading.value = false
  }
}

const resolveEstimateUuid = async (): Promise<string | null> => {
  const fromPo =
    props.poData?.estimate_uuid ??
    props.poData?.metadata?.estimate_uuid ??
    props.poData?.display_metadata?.estimate_uuid ??
    null
  const direct = String(fromPo || '').trim()
  if (direct) return direct

  const corporationUuid = String(props.poData?.corporation_uuid || '').trim()
  const projectUuid = String(props.poData?.project_uuid || '').trim()
  if (!corporationUuid || !projectUuid) return null

  try {
    const response: any = await $fetch('/api/estimates', {
      method: 'GET',
      query: { corporation_uuid: corporationUuid },
    })
    const rows = Array.isArray(response?.data) ? response.data : []
    const candidates = rows.filter((row: any) => {
      if (String(row?.project_uuid || '') !== projectUuid) return false
      return String(row?.status || '').toLowerCase() === 'approved'
    })
    if (!candidates.length) return null
    candidates.sort((a: any, b: any) => {
      const aDate = new Date(a?.estimate_date || a?.created_at || 0).getTime()
      const bDate = new Date(b?.estimate_date || b?.created_at || 0).getTime()
      return bDate - aDate
    })
    return String(candidates[0]?.uuid || '').trim() || null
  } catch {
    return null
  }
}

const ensureSpecLookups = async () => {
  const includeMode = String(props.poData?.include_items || '').toUpperCase()
  const corporationUuid = String(props.poData?.corporation_uuid || '').trim()
  const projectUuid = String(props.poData?.project_uuid || '').trim()
  const lookupKey = `${includeMode}::${corporationUuid}::${projectUuid}::${String(props.poData?.estimate_uuid || '')}`

  if (lookupKey === loadedSpecLookupKey.value) return

  masterSpecByItemUuid.value = new Map()
  masterSpecByTypeAndName.value = new Map()
  estimateSpecByItemUuid.value = new Map()
  estimateSpecByTypeAndName.value = new Map()
  loadedSpecLookupKey.value = lookupKey

  if (!corporationUuid || !projectUuid) return

  if (includeMode === 'IMPORT_ITEMS_FROM_MASTER') {
    try {
      const response: any = await $fetch('/api/cost-code-preferred-items', {
        method: 'GET',
        query: {
          corporation_uuid: corporationUuid,
          project_uuid: projectUuid,
        },
      })
      const rows = Array.isArray(response?.data) ? response.data : []
      const byUuid = new Map<string, string>()
      const byTypeName = new Map<string, string>()
      for (const row of rows) {
        const seq = toSequenceString(row?.item_sequence ?? row?.sequence)
        if (!seq) continue
        const rowUuid = String(row?.uuid || '').trim()
        if (rowUuid && !byUuid.has(rowUuid)) byUuid.set(rowUuid, seq)
        const typeNameKey = buildTypeNameKey(row?.item_type_uuid, row?.item_name)
        if (typeNameKey !== '::' && !byTypeName.has(typeNameKey)) {
          byTypeName.set(typeNameKey, seq)
        }
      }
      masterSpecByItemUuid.value = byUuid
      masterSpecByTypeAndName.value = byTypeName
    } catch {
      // ignore lookup failures and keep graceful fallback
    }
    return
  }

  if (includeMode === 'IMPORT_ITEMS_FROM_ESTIMATE') {
    const estimateUuid = await resolveEstimateUuid()
    if (!estimateUuid) return
    try {
      const response: any = await $fetch('/api/estimate-line-items', {
        method: 'GET',
        query: {
          corporation_uuid: corporationUuid,
          project_uuid: projectUuid,
          estimate_uuid: estimateUuid,
        },
      })
      const rows = Array.isArray(response?.data) ? response.data : []
      const byUuid = new Map<string, string>()
      const byTypeName = new Map<string, string>()
      for (const row of rows) {
        const materialItems = Array.isArray(row?.material_items) ? row.material_items : []
        for (const item of materialItems) {
          const seq = toSequenceString(item?.item_sequence ?? item?.sequence)
          if (!seq) continue
          const itemUuid = String(item?.item_uuid || item?.uuid || '').trim()
          if (itemUuid && !byUuid.has(itemUuid)) byUuid.set(itemUuid, seq)
          const itemTypeUuid =
            item?.item_type?.uuid ??
            item?.item_types?.uuid ??
            item?.item_type_uuid ??
            null
          const itemName =
            item?.preferred_item?.item_name ??
            item?.item_name ??
            item?.name ??
            ''
          const typeNameKey = buildTypeNameKey(itemTypeUuid, itemName)
          if (typeNameKey !== '::' && !byTypeName.has(typeNameKey)) {
            byTypeName.set(typeNameKey, seq)
          }
        }
      }
      estimateSpecByItemUuid.value = byUuid
      estimateSpecByTypeAndName.value = byTypeName
    } catch {
      // ignore lookup failures and keep graceful fallback
    }
  }
}

watch(() => props.poUuid, () => {
  if (props.poUuid) {
    fetchItems()
  }
}, { immediate: true })

watch(() => props.poData?.corporation_uuid, (newCorpUuid) => {
  if (newCorpUuid && process.client) {
    itemTypesStore.fetchItemTypes(newCorpUuid)
    itemDivisionsStore.fetchItemDivisions(newCorpUuid)
  }
}, { immediate: true })

onMounted(() => {
  if (props.poUuid) {
    fetchItems()
  }
  if (props.poData?.corporation_uuid && process.client) {
    itemTypesStore.fetchItemTypes(props.poData.corporation_uuid)
    itemDivisionsStore.fetchItemDivisions(props.poData.corporation_uuid)
  }
  locationsStore.fetchLocations()
})
</script>

