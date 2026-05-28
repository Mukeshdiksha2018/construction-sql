<template>
  <div class="rounded-xl border border-default bg-white dark:bg-gray-900/40 shadow-sm overflow-hidden">
    <div class="flex items-center justify-between gap-4 px-4 py-3 border-b border-default/70 bg-gray-50 dark:bg-gray-800">
      <div>
        <h3 class="text-sm font-semibold text-default uppercase tracking-wide">
          Return Items
        </h3>
        <p v-if="hasItems" class="text-[11px] text-muted mt-1">
          Enter the return quantity for each item.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <UButton
          v-if="removedItems.length > 0 && !readonly"
          icon="i-heroicons-arrow-path"
          size="sm"
          color="neutral"
          variant="outline"
          @click="openRemovedItemsModal"
        >
          Show Removed Items ({{ removedItems.length }})
        </UButton>
        <div v-if="hasItems" class="text-[11px] font-medium text-muted uppercase tracking-wide">
          {{ filteredItems.length }} items
        </div>
      </div>
    </div>

    <div v-if="error" class="px-4 py-3 text-xs text-error-700 bg-error-50/80 dark:bg-error-900/20 border-b border-error-200">
      {{ error }}
    </div>

    <div v-else-if="loading" class="px-4 py-6 text-sm text-muted text-center">
      {{ loadingMessage }}
    </div>

    <div v-else-if="hasItems">
      <div class="hidden md:block">
        <table class="min-w-full table-fixed divide-y divide-default/60">
          <thead class="bg-muted/20 text-[11px] font-semibold uppercase tracking-wide text-muted">
            <tr>
              <th class="w-[160px] px-4 py-2 text-left">Cost Codes</th>
              <th class="w-[140px] px-4 py-2 text-left">Category</th>
              <th class="w-[120px] px-4 py-2 text-left">Type</th>
              <th class="w-[120px] px-4 py-2 text-left">Specification</th>
              <th class="w-[170px] px-4 py-2 text-left">Item</th>
              <th v-if="props.showLocationColumn" class="w-[150px] px-4 py-2 text-left">Location</th>
              <th class="w-[220px] px-4 py-2 text-left">Description</th>
              <th class="w-[140px] px-4 py-2 text-left">Model Number</th>
              <th class="w-[110px] px-4 py-2 text-right">Unit Price</th>
              <th class="w-[90px] px-4 py-2 text-right">UOM</th>
              <th class="w-[90px] px-4 py-2 text-right">{{ quantityColumnLabel }}</th>
              <th class="w-[120px] px-4 py-2 text-right">Return Qty</th>
              <th class="w-[120px] px-4 py-2 text-right">Total</th>
              <th v-if="!readonly" class="w-[100px] px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default/60 text-sm text-default">
            <tr
              v-for="(item, index) in filteredItems"
              :key="item.id ?? index"
              :class="[
                'align-middle transition-colors duration-150',
                activeRowIndex === index ? 'bg-primary-50/40 dark:bg-primary-900/20' : '',
                isItemOverReturn(item, index) ? 'bg-error-50/80 dark:bg-error-900/20 border-l-4 border-error-500' : ''
              ]"
            >
              <td class="px-3 py-2 align-middle">
                <div class="text-xs text-default whitespace-normal break-words">
                  <div v-if="item.cost_code_label" class="font-medium">
                    {{ item.cost_code_label }}
                  </div>
                  <div v-else-if="item.cost_code_number || item.cost_code_name" class="font-medium">
                    {{ [item.cost_code_number, item.cost_code_name].filter(Boolean).join(' ') }}
                  </div>
                  <div v-else class="text-muted">
                    —
                  </div>
                </div>
              </td>
              <td class="px-3 py-2 align-middle">
                <div class="text-xs text-default">
                  <div class="font-medium truncate">
                    {{ getCategoryLabel(item.category || '') }}
                  </div>
                </div>
              </td>
              <td class="px-3 py-2 align-middle">
                <div class="text-xs leading-tight">
                  <div class="text-[11px] text-muted">
                    {{ getItemSpecTypeLabel(item) }}
                  </div>
                  <div class="font-medium text-default">
                    {{ getItemTypeNameLabel(item) }}<span v-if="item.item_type_code" class="text-muted"> ({{ item.item_type_code }})</span>
                  </div>
                </div>
              </td>
              <td class="px-3 py-2 align-middle text-xs text-default">
                {{ item.sequence_label || '—' }}
              </td>
              <td class="px-3 py-2 align-middle">
                <div class="text-xs font-medium text-default truncate">
                  {{ item.item_name || '—' }}
                </div>
              </td>
              <td v-if="props.showLocationColumn" class="px-3 py-2 text-left align-middle">
                <div class="text-xs text-default">
                  {{ getLocationDisplayLabel(item) || '—' }}
                </div>
              </td>
              <td class="px-3 py-2 align-middle">
                <textarea
                  :value="descriptionPlainText(item.description)"
                  readonly
                  rows="2"
                  class="block w-full min-w-0 min-h-[52px] max-h-40 overflow-y-auto rounded-md border border-default/60 bg-white/80 dark:bg-gray-900/40 px-2 py-1 text-xs text-default resize-y cursor-default"
                />
              </td>
              <td class="px-3 py-2 align-middle text-xs text-default">
                {{ item.model_number || '—' }}
              </td>
              <td class="px-3 py-2 text-right align-middle">
                <div class="inline-flex items-center justify-end gap-1 rounded-md border border-default bg-background px-3 py-1.5 font-mono text-sm">
                  <span class="text-xs font-semibold text-default">{{ currencySymbolText }}</span>
                  <span>{{ formatCurrencyInput(item.unit_price) }}</span>
                </div>
              </td>
              <td class="px-3 py-2 text-right align-middle font-mono text-xs uppercase text-default">
                {{ item.unit_label || '—' }}
              </td>
              <td class="px-3 py-2 text-right align-middle font-mono text-sm text-default">
                {{ formatQuantity(item.ordered_quantity ?? item.po_quantity ?? item.co_quantity ?? 0) }}
              </td>
              <td class="px-3 py-2 text-right align-middle">
                <div class="flex flex-col gap-1">
                  <UInput
                    :model-value="getReturnInputValue(item, index)"
                    size="xs"
                    inputmode="decimal"
                    :class="[
                      'w-full max-w-[130px] text-right font-mono',
                      isItemOverReturn(item, index) ? 'border-error-500 focus:ring-error-500' : ''
                    ]"
                    :color="isItemOverReturn(item, index) ? 'error' : 'primary'"
                    :disabled="props.readonly"
                    @focus="setActiveRow(index)"
                    @blur="clearActiveRow(index)"
                    @update:model-value="(value) => emitReturnQuantityChange(index, value)"
                  />
                  <div v-if="!props.editingReturnNote && !props.readonly && item.max_return_quantity !== null && item.max_return_quantity !== undefined" class="text-[10px] font-mono"
                    :class="getRemainingQuantityClass(item, index)">
                    <span v-if="getRemainingQuantity(item, index) >= 0">
                      Remaining: {{ formatQuantity(getRemainingQuantity(item, index)) }}
                    </span>
                    <span v-else>
                      Over by: {{ formatQuantity(Math.abs(getRemainingQuantity(item, index))) }}
                    </span>
                  </div>
                </div>
              </td>
              <td class="px-3 py-2 text-right align-middle">
                <div class="inline-flex items-center justify-end gap-1 rounded-md border border-default bg-background px-3 py-1.5 font-mono text-sm">
                  <span class="text-xs font-semibold text-default">{{ currencySymbolText }}</span>
                  <span>{{ formatCurrencyInput(computeRowTotal(item, index)) }}</span>
                </div>
              </td>
              <td v-if="!readonly" class="px-3 py-2 text-right align-middle">
                <slot name="actions" :item="item" :index="index">
                  <div class="flex justify-end gap-2">
                    <UButton
                      icon="i-heroicons-minus"
                      variant="soft"
                      color="error"
                      size="xs"
                      class="shrink-0"
                      @click.stop="handleRemoveRow(index)"
                    />
                  </div>
                </slot>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="md:hidden divide-y divide-default/60">
        <div
          v-for="(item, index) in filteredItems"
          :key="item.id ?? index"
          :class="[
            'px-4 py-4 space-y-3 transition-colors duration-150',
            activeRowIndex === index ? 'bg-primary-50/30 dark:bg-primary-900/10' : ''
          ]"
        >
          <div class="space-y-2">
            <span class="text-[11px] uppercase tracking-wide text-muted/80">Cost Code</span>
            <div class="text-xs text-default whitespace-normal break-words">
              <div v-if="item.cost_code_label" class="font-medium">
                {{ item.cost_code_label }}
              </div>
              <div v-else-if="item.cost_code_number || item.cost_code_name" class="font-medium">
                {{ [item.cost_code_number, item.cost_code_name].filter(Boolean).join(' ') }}
              </div>
              <div v-else class="text-muted">
                —
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 text-xs text-default">
            <div class="col-span-2 flex flex-col gap-1">
              <span class="block text-[11px] uppercase tracking-wide text-muted/80">Category</span>
              <div>
                <span class="font-medium">{{ getCategoryLabel(item.category || '') }}</span>
              </div>
            </div>
            <div v-if="props.showLocationColumn" class="col-span-2 flex flex-col gap-1">
              <span class="block text-[11px] uppercase tracking-wide text-muted/80">Location</span>
              <span class="text-xs text-default">
                {{ getLocationDisplayLabel(item) || '—' }}
              </span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="block text-[11px] uppercase tracking-wide text-muted/80">Type</span>
              <span class="text-[11px] text-muted">{{ getItemSpecTypeLabel(item) }}</span>
              <span class="font-semibold">
                {{ getItemTypeNameLabel(item) }}<span v-if="item.item_type_code" class="text-muted"> ({{ item.item_type_code }})</span>
              </span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="block text-[11px] uppercase tracking-wide text-muted/80">Specification</span>
              <span>{{ item.sequence_label || '—' }}</span>
            </div>
            <div class="col-span-2 flex flex-col gap-1">
              <span class="block text-[11px] uppercase tracking-wide text-muted/80">Item</span>
              <span class="font-semibold">{{ item.item_name || '—' }}</span>
            </div>
            <div class="col-span-2 flex flex-col gap-1">
              <span class="block text-[11px] uppercase tracking-wide text-muted/80">Description</span>
              <textarea
                :value="descriptionPlainText(item.description)"
                readonly
                rows="2"
                class="block w-full min-h-[52px] max-h-40 overflow-y-auto rounded-md border border-default/60 bg-white/80 dark:bg-gray-900/40 px-2 py-1 text-xs text-default resize-y cursor-default"
              />
            </div>
            <div class="flex flex-col gap-1">
              <span class="block text-[11px] uppercase tracking-wide text-muted/80">Model Number</span>
              <span>{{ item.model_number || '—' }}</span>
            </div>
            <div class="flex flex-col gap-1 items-end text-right">
              <span class="block text-[11px] uppercase tracking-wide text-muted/80">Unit Price</span>
              <span class="font-mono text-sm">
                {{ currencySymbolText }} {{ formatCurrencyInput(item.unit_price) }}
              </span>
            </div>
            <div class="flex flex-col gap-1 items-end text-right">
              <span class="block text-[11px] uppercase tracking-wide text-muted/80">UOM</span>
              <span class="font-mono text-xs uppercase">
                {{ item.unit_label || '—' }}
              </span>
            </div>
            <div class="flex flex-col gap-1 items-end text-right">
              <span class="block text-[11px] uppercase tracking-wide text-muted/80">{{ quantityColumnLabel }}</span>
              <span class="font-mono text-sm">
                {{ formatQuantity(item.ordered_quantity ?? item.po_quantity ?? item.co_quantity ?? 0) }}
              </span>
            </div>
            <div class="flex flex-col gap-1 items-end text-right">
              <span class="block text-[11px] uppercase tracking-wide text-muted/80">Return Qty</span>
              <div class="flex flex-col gap-1 w-full">
                <UInput
                  :model-value="getReturnInputValue(item, index)"
                  size="xs"
                  inputmode="decimal"
                  :class="[
                    'text-right font-mono',
                    isItemOverReturn(item, index) ? 'border-error-500 focus:ring-error-500' : ''
                  ]"
                  :color="isItemOverReturn(item, index) ? 'error' : 'primary'"
                  :disabled="props.readonly"
                  @focus="setActiveRow(index)"
                  @blur="clearActiveRow(index)"
                  @update:model-value="(value) => emitReturnQuantityChange(index, value)"
                />
                <div v-if="!props.editingReturnNote && !props.readonly && item.max_return_quantity !== null && item.max_return_quantity !== undefined" class="text-[10px] font-mono"
                  :class="getRemainingQuantityClass(item, index)">
                  <span v-if="getRemainingQuantity(item, index) >= 0">
                    Remaining: {{ formatQuantity(getRemainingQuantity(item, index)) }}
                  </span>
                  <span v-else>
                    Over by: {{ formatQuantity(Math.abs(getRemainingQuantity(item, index))) }}
                  </span>
                </div>
              </div>
            </div>
            <div class="col-span-2 flex flex-col gap-1 items-end text-right">
              <span class="block text-[11px] uppercase tracking-wide text-muted/80">Total</span>
              <span class="font-mono text-sm">
                {{ currencySymbolText }} {{ formatCurrencyInput(computeRowTotal(item, index)) }}
              </span>
            </div>
          </div>

          <div v-if="!readonly" class="flex justify-end gap-2 pt-2">
            <slot name="actions" :item="item" :index="index">
              <UButton
                icon="i-heroicons-minus"
                variant="soft"
                color="error"
                size="xs"
                @click.stop="handleRemoveRow(index)"
              />
            </slot>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="px-4 py-6 text-sm text-muted text-center">
      {{ emptyMessage }}
    </div>

    <!-- Removed Return Items Modal -->
    <UModal v-model:open="removedItemsModalOpen">
      <template #header>
        <div class="flex items-center justify-between w-full">
          <h3 class="text-base font-semibold">Removed Return Items</h3>
          <UButton icon="i-heroicons-x-mark" size="xs" variant="solid" color="neutral" @click="closeRemovedItemsModal" />
        </div>
      </template>
      <template #body>
        <div v-if="removedItemsList.length" class="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          <div
            v-for="(item, index) in removedItemsList"
            :key="item.uuid || item.id || item.base_item_uuid || `removed-${index}`"
            class="p-3 border border-default rounded-lg bg-elevated/40 dark:bg-elevated/20 flex flex-col gap-2"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0 flex-1">
                <div class="text-sm font-semibold text-default">
                  {{ item.item_name || item.description || `Item ${index + 1}` }}
                </div>
                <div class="text-xs text-muted mt-1 space-x-2">
                  <span v-if="item.cost_code_label || item.cost_code_number">
                    Cost Code: {{ item.cost_code_label || `${item.cost_code_number} ${item.cost_code_name}`.trim() }}
                  </span>
                </div>
                <div class="text-xs text-muted mt-1 space-x-2">
                  <span v-if="item.return_quantity !== null && item.return_quantity !== undefined">
                    Return Qty: {{ item.return_quantity }}
                  </span>
                  <span v-if="item.unit_price !== null && item.unit_price !== undefined">
                    Unit: {{ formatCurrency(item.unit_price) }}
                  </span>
                </div>
                <div v-if="item.removed_at" class="text-[11px] text-muted mt-1">
                  Removed: {{ formatRemovedDate(item.removed_at) }}
                </div>
              </div>
              <div class="flex flex-col items-end gap-2 shrink-0">
                <div class="text-sm font-mono text-default">
                  {{ formatCurrency(item.return_total || 0) }}
                </div>
                <UButton size="xs" color="primary" variant="solid" @click="restoreRemovedItem(index)">
                  Restore
                </UButton>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="py-6 text-sm text-muted text-center">
          No removed items available.
        </div>
      </template>
      <template #footer>
        <div class="flex justify-between w-full">
          <UButton color="neutral" variant="soft" @click="closeRemovedItemsModal">
            Close
          </UButton>
          <UButton
            v-if="removedItemsList.length"
            color="primary"
            variant="solid"
            icon="i-heroicons-arrow-uturn-left"
            @click="restoreAllRemovedItems"
          >
            Restore All
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, watch, ref, nextTick, onMounted } from 'vue'
import { useCurrencyFormat } from '~/composables/useCurrencyFormat'
import { DateFormatter } from '@internationalized/date'
import { useLocationsStore } from '~/stores/locations'
import { useItemTypesStore } from '~/stores/itemTypes'
import { getCategoryLabel } from '~/constants/itemCategories'

interface ReturnNoteItemDisplay {
  id?: string | number
  base_item_uuid?: string | null
  cost_code_uuid?: string | null
  cost_code_label?: string | null
  cost_code_number?: string | null
  cost_code_name?: string | null
  category?: string | null
  division_name?: string | null
  item_division_uuid?: string | null
  item_type_uuid?: string | null
  item_type_code?: string | null
  item_type_label?: string | null
  sequence_label?: string | null
  item_uuid?: string | null
  item_name?: string | null
  description?: string | null
  model_number?: string | null
  unit_uuid?: string | null
  unit_label?: string | null
  unit_price?: number | null
  ordered_quantity?: number | null
  po_quantity?: number | null
  co_quantity?: number | null
  return_quantity?: number | null
  return_total?: number | null
  max_return_quantity?: number | null
  location_uuid?: string | null
  location_label?: string | null
}

const props = withDefaults(defineProps<{
  items: ReturnNoteItemDisplay[]
  loading?: boolean
  error?: string | null
  loadingMessage?: string
  emptyMessage?: string
  corporationUuid?: string | null
  returnType?: 'purchase_order' | 'change_order' | 'from_inventory'
  readonly?: boolean
  showLocationColumn?: boolean
  removedReturnItems?: any[]
  overReturnItems?: any[]
  editingReturnNote?: boolean
}>(), {
  items: () => [],
  loading: false,
  readonly: false,
  editingReturnNote: false,
  error: null,
  loadingMessage: 'Loading items…',
  overReturnItems: () => [],
  emptyMessage: 'No return items found.',
  corporationUuid: null,
  returnType: 'purchase_order',
  showLocationColumn: true,
  removedReturnItems: () => [],
})

const emit = defineEmits<{
  (e: 'cost-code-change', payload: { index: number; value: string | null; option?: any }): void
  (e: 'return-quantity-change', payload: {
    index: number
    value: string | number | null | undefined
    numericValue: number
    computedTotal: number
  }): void
  (e: 'add-row', index: number): void
  (e: 'remove-row', index: number): void
  (e: 'update:removed-return-items', value: any[]): void
  (e: 'restore-item', item: any): void
  (e: 'restore-all-items'): void
}>()

const { formatCurrency, currencySymbol } = useCurrencyFormat()
const locationsStore = useLocationsStore()
const itemTypesStore = useItemTypesStore()

const locationsByUuid = computed(() => {
  const all = (locationsStore.getAll as any) || (locationsStore as any).locations || []
  const map = new Map<string, any>()
  if (Array.isArray(all)) {
    all.forEach((loc: any) => {
      if (loc?.uuid) map.set(loc.uuid, loc)
    })
  }
  return map
})

const isUuidLike = (value: any) => {
  if (typeof value !== 'string') return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

const getLocationDisplayLabel = (item: ReturnNoteItemDisplay): string => {
  const raw = (item?.location_label ?? '') as string
  if (raw && !isUuidLike(raw)) return raw
  const uuid = item?.location_uuid as string | undefined
  if (uuid && locationsByUuid.value.has(uuid)) {
    const loc = locationsByUuid.value.get(uuid)
    if (loc) {
      return loc.location_code ? `${loc.location_name} (${loc.location_code})` : (loc.location_name || '')
    }
  }
  return raw || ''
}

const getResolvedItemType = (item: ReturnNoteItemDisplay) => {
  const uuid = String(item?.item_type_uuid || '').trim()
  if (!uuid) return null
  return itemTypesStore.getItemTypeById(uuid)
}

const getItemSpecTypeLabel = (item: ReturnNoteItemDisplay): string => {
  const resolved = getResolvedItemType(item)
  const specType = String(resolved?.spec_type ?? '').trim()
  return specType || '—'
}

const getItemTypeNameLabel = (item: ReturnNoteItemDisplay): string => {
  const resolved = getResolvedItemType(item)
  const typeFromStore = String(resolved?.item_type ?? '').trim()
  const typeFromItem = String(item?.item_type_label ?? '').trim()
  return typeFromStore || typeFromItem || '—'
}

const stripHtml = (value: string): string =>
  value
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const decodeHtmlEntities = (text: string): string => {
  if (typeof document === 'undefined') {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&nbsp;/g, ' ')
  }
  const el = document.createElement('textarea')
  el.innerHTML = text
  return el.value
}

const descriptionPlainText = (value: string | null | undefined): string => {
  const raw = String(value ?? '').trim()
  if (!raw) return '—'
  const stripped = stripHtml(raw)
  const decoded = decodeHtmlEntities(stripped)
  return decoded.trim() || '—'
}

const currencySymbolText = computed(() => currencySymbol.value || '')
const corporationUuid = computed(() => props.corporationUuid)
const quantityColumnLabel = computed(() => {
  if (props.returnType === 'change_order') return 'CO Qty'
  if (props.returnType === 'from_inventory') return 'Return Qty'
  return 'PO Qty'
})

// Helper function to parse numeric input
const parseNumericInput = (value: any): number => {
  if (value === null || value === undefined || value === '') return 0
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const normalized = String(value).replace(/,/g, '').trim()
  if (!normalized) return 0
  const numeric = Number(normalized)
  return Number.isFinite(numeric) ? numeric : 0
}

// Filter items: when editing existing return note, hide items with zero or empty return_quantity
// When creating new return note, show all items
const filteredItems = computed(() => {
  if (!Array.isArray(props.items)) return []
  
  // If creating new return note (not editing), show all items
  if (!props.editingReturnNote) {
    return props.items
  }
  
  // If editing existing return note, filter out items with zero or empty return_quantity
  return props.items.filter((item) => {
    const returnQty = item.return_quantity
    // Keep items that have a non-zero, non-null, non-undefined return_quantity
    return returnQty !== null && 
           returnQty !== undefined && 
           returnQty !== '' && 
           parseNumericInput(returnQty) > 0
  })
})

// Map from filtered index to original index in props.items
// This is needed because emits use original indices
const filteredToOriginalIndexMap = computed(() => {
  const map = new Map<number, number>()
  if (!Array.isArray(props.items)) return map
  
  // If creating new return note (not editing), indices match 1:1
  if (!props.editingReturnNote) {
    props.items.forEach((_, index) => {
      map.set(index, index)
    })
    return map
  }
  
  // If editing existing return note, map filtered indices to original indices
  let filteredIndex = 0
  props.items.forEach((item, originalIndex) => {
    const returnQty = item.return_quantity
    // Only map items that pass the filter
    if (returnQty !== null && 
        returnQty !== undefined && 
        returnQty !== '' && 
        parseNumericInput(returnQty) > 0) {
      map.set(filteredIndex, originalIndex)
      filteredIndex++
    }
  })
  
  return map
})

const hasItems = computed(() => Array.isArray(filteredItems.value) && filteredItems.value.length > 0)

// Check if an item has validation error (return quantity exceeds max)
const isItemOverReturn = (item: ReturnNoteItemDisplay, filteredIndex: number): boolean => {
  if (!Array.isArray(props.overReturnItems) || props.overReturnItems.length === 0) {
    return false
  }
  
  // Map filtered index to original index for matching
  const originalIndex = filteredToOriginalIndexMap.value.get(filteredIndex) ?? filteredIndex
  
  // Check if this item is in the overReturnItems array
  // Match by item UUID or by index if UUID is not available
  const itemUuid = item.uuid || item.base_item_uuid || item.item_uuid
  if (itemUuid) {
    return props.overReturnItems.some((overItem: any) => {
      const overItemUuid = overItem.uuid || overItem.base_item_uuid || overItem.item_uuid
      return overItemUuid && String(overItemUuid).trim().toLowerCase() === String(itemUuid).trim().toLowerCase()
    })
  }
  
  // Fallback: match by original index
  return props.overReturnItems.some((overItem: any) => overItem.index === originalIndex)
}

// Calculate remaining quantity after subtracting return quantity from max_return_quantity
const getRemainingQuantity = (item: ReturnNoteItemDisplay, filteredIndex: number): number => {
  const maxReturnQty = item.max_return_quantity !== null && item.max_return_quantity !== undefined
    ? parseNumericInput(item.max_return_quantity)
    : null
  
  // If max_return_quantity is not set, return 0 (no validation)
  if (maxReturnQty === null) {
    return 0
  }
  
  // Map filtered index to original index for drafts lookup
  const originalIndex = filteredToOriginalIndexMap.value.get(filteredIndex) ?? filteredIndex
  const draft = drafts[originalIndex]
  let currentReturnQty = 0
  
  if (draft && draft.touched) {
    currentReturnQty = parseNumericInput(draft.returnInput)
  } else {
    currentReturnQty = parseNumericInput(item.return_quantity ?? 0)
  }
  
  const remaining = maxReturnQty - currentReturnQty
  return remaining
}

// Get CSS class for remaining quantity display
const getRemainingQuantityClass = (item: ReturnNoteItemDisplay, filteredIndex: number): string => {
  const remaining = getRemainingQuantity(item, filteredIndex)
  const maxReturnQty = item.max_return_quantity !== null && item.max_return_quantity !== undefined
    ? parseNumericInput(item.max_return_quantity)
    : null
  
  if (maxReturnQty === null) {
    return 'text-muted'
  }
  
  if (remaining < 0) {
    return 'text-error-600 dark:text-error-400'
  } else if (remaining === 0) {
    return 'text-warning-600 dark:text-warning-400'
  } else if (maxReturnQty > 0 && remaining <= maxReturnQty * 0.1) {
    return 'text-warning-500 dark:text-warning-500'
  } else {
    return 'text-muted'
  }
}

// Removed items state
const removedItems = ref<any[]>([])

// Initialize removed items from props
const initializeRemovedItems = () => {
  const propValue = props.removedReturnItems
  if (Array.isArray(propValue)) {
    removedItems.value = propValue.length > 0 ? [...propValue] : []
  } else {
    removedItems.value = []
  }
}

// Watch for prop changes - this ensures reactivity when parent updates
watch(
  () => props.removedReturnItems,
  (newRemovedItems) => {
    const newArray = Array.isArray(newRemovedItems) ? newRemovedItems : []
    // Always create a new array reference to ensure Vue reactivity
    // This ensures the button shows when items are removed
    removedItems.value = [...newArray]
  },
  { immediate: true, deep: true }
)

// Computed properties for removed items UI
const removedItemsList = computed(() => {
  return removedItems.value
})

const hasRemovedItems = computed(() => {
  return removedItems.value.length > 0
})

const removedItemsModalOpen = ref(false)

const openRemovedItemsModal = () => {
  removedItemsModalOpen.value = true
}

const closeRemovedItemsModal = () => {
  removedItemsModalOpen.value = false
}

const formatRemovedDate = (dateString: string) => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    const df = new DateFormatter('en-US', { dateStyle: 'medium' })
    return df.format(date)
  } catch {
    return dateString
  }
}

const restoreRemovedItem = (index: number) => {
  if (index < 0 || index >= removedItems.value.length) return
  
  const itemToRestore = removedItems.value[index]
  if (!itemToRestore) return
  
  // Remove from removed items
  removedItems.value = removedItems.value.filter((_, i) => i !== index)
  
  // Emit update to parent
  emit('update:removed-return-items', removedItems.value)
  
  // Emit restore event
  emit('restore-item', itemToRestore)
  
  // Close modal if no more removed items
  if (removedItems.value.length === 0) {
    closeRemovedItemsModal()
  }
}

const restoreAllRemovedItems = () => {
  if (removedItems.value.length === 0) return
  
  // Emit restore all event
  emit('restore-all-items')
  
  // Clear removed items
  removedItems.value = []
  
  // Emit update to parent
  emit('update:removed-return-items', [])
  
  // Close modal
  closeRemovedItemsModal()
}

const drafts = reactive<Record<number, { key: string; returnInput: string; touched: boolean }>>({})
const activeRowIndex = ref<number | null>(null)

const toInputString = (value: any): string => {
  if (value === null || value === undefined) return ''
  return typeof value === 'number' ? String(value) : String(value)
}

const getReturnInputValue = (item: ReturnNoteItemDisplay, filteredIndex: number): string => {
  // Map filtered index to original index for drafts lookup
  const originalIndex = filteredToOriginalIndexMap.value.get(filteredIndex) ?? filteredIndex
  const draft = drafts[originalIndex]
  const itemValue = toInputString(item.return_quantity)
  const draftValue = draft?.returnInput
  const isTouched = draft?.touched ?? false
  
  const result = (isTouched ? draftValue : null) ?? itemValue
  
  return result
}

const quantityFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 4,
})

const formatQuantity = (value: any) => {
  const numeric = parseNumericInput(value)
  return quantityFormatter.format(numeric)
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

const buildDraftKey = (item: ReturnNoteItemDisplay, index: number) => {
  const segments = [
    item.id ?? '',
    item.base_item_uuid ?? '',
    item.cost_code_uuid ?? '',
    item.item_uuid ?? '',
    index,
  ]
  return segments
    .map((segment) => String(segment || '').trim().toUpperCase())
    .filter(Boolean)
    .join('|')
}

watch(
  () => props.items,
  (newItems = []) => {
    newItems.forEach((item, index) => {
      const draftKey = buildDraftKey(item, index)
      const draft = drafts[index]
      const returnInput = toInputString(item.return_quantity)

      if (!draft || draft.key !== draftKey) {
        drafts[index] = {
          key: draftKey,
          returnInput,
          touched: false,
        }
        return
      }

      draft.key = draftKey
      // Always sync from item if draft hasn't been touched by user
      if (!draft.touched) {
        draft.returnInput = returnInput
      }
    })

    Object.keys(drafts).forEach((key) => {
      const idx = Number(key)
      if (!Number.isNaN(idx) && !newItems[idx]) {
        delete drafts[idx]
      }
    })
  },
  { immediate: true, deep: true }
)

const computeRowTotal = (item: ReturnNoteItemDisplay, filteredIndex: number) => {
  // Map filtered index to original index for drafts lookup
  const originalIndex = filteredToOriginalIndexMap.value.get(filteredIndex) ?? filteredIndex
  const draft = drafts[originalIndex]
  const unit = parseNumericInput(item.unit_price)

  // If there's a draft (user is editing), calculate from draft input
  if (draft && draft.touched) {
    const quantityFromDraft = parseNumericInput(draft.returnInput)
    return roundCurrency(unit * quantityFromDraft)
  }

  // Use return_total if available
  if (typeof item.return_total === 'number' && Number.isFinite(item.return_total)) {
    return roundCurrency(item.return_total)
  }

  // Final fallback: Calculate from unit price * return quantity
  const quantity = parseNumericInput(item.return_quantity)
  return roundCurrency(unit * quantity)
}

const roundCurrency = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100

const handleAddRow = (index: number) => {
  emit('add-row', index)
}

const handleRemoveRow = (filteredIndex: number) => {
  // Map filtered index to original index
  const originalIndex = filteredToOriginalIndexMap.value.get(filteredIndex) ?? filteredIndex
  emit('remove-row', originalIndex)
}

const emitCostCodeChange = (filteredIndex: number, value?: string | null, option?: any) => {
  // Map filtered index to original index
  const originalIndex = filteredToOriginalIndexMap.value.get(filteredIndex) ?? filteredIndex
  emit('cost-code-change', { index: originalIndex, value: value ?? null, option })
}

const emitReturnQuantityChange = (filteredIndex: number, value: string | number | null | undefined) => {
  // Map filtered index to original index
  const originalIndex = filteredToOriginalIndexMap.value.get(filteredIndex) ?? filteredIndex
  const item = props.items?.[originalIndex]
  const draft =
    drafts[originalIndex] ||
    (drafts[originalIndex] = {
      key: buildDraftKey(item as ReturnNoteItemDisplay, originalIndex),
      returnInput: toInputString(item?.return_quantity),
      touched: false,
    })

  draft.returnInput = toInputString(value)
  draft.touched = true

  const numericValue = parseNumericInput(draft.returnInput)
  const unitNumeric = parseNumericInput(item?.unit_price)
  const computedTotal = roundCurrency(unitNumeric * numericValue)

  emit('return-quantity-change', {
    index: originalIndex, // Emit original index, not filtered index
    value,
    numericValue,
    computedTotal,
  })
}

const setActiveRow = (index: number | null) => {
  activeRowIndex.value = index
}

const clearActiveRow = (index: number) => {
  if (activeRowIndex.value === index) {
    activeRowIndex.value = null
  }
}

// Initialize removed items on mount
onMounted(() => {
  initializeRemovedItems()
})
</script>

