<template>
  <POItemsTableWithEstimates
    v-bind="forwardedProps"
    @add-row="emit('add-row', $event)"
    @remove-row="emit('remove-row', $event)"
    @cost-code-change="emit('cost-code-change', $event)"
    @category-change="emit('category-change', $event)"
    @item-division-change="emit('item-division-change', $event)"
    @location-change="emit('location-change', $event)"
    @item-type-change="emit('item-type-change', $event)"
    @sequence-change="emit('sequence-change', $event)"
    @item-change="emit('item-change', $event)"
    @approval-checks-change="emit('approval-checks-change', $event)"
    @model-number-change="emit('model-number-change', $event)"
    @uom-change="emit('uom-change', $event)"
    @po-unit-price-change="emit('po-unit-price-change', $event)"
    @po-quantity-change="emit('po-quantity-change', $event)"
    @po-total-change="emit('po-total-change', $event)"
    @description-change="emit('description-change', $event)"
    @edit-selection="emit('edit-selection')"
  >
    <template v-if="$slots.actions" #actions="slotProps">
      <slot name="actions" v-bind="slotProps" />
    </template>
  </POItemsTableWithEstimates>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import POItemsTableWithEstimates from '~/components/purchaseOrders/POItemsTableWithEstimates.vue'
import type { PoCurrencyCode } from '~/utils/poCurrencyConversion'

interface PurchaseOrderItemDisplay {
  id?: string | number
  name?: string
  description?: string
  item_uuid?: string | null
  cost_code_uuid?: string | null
  cost_code_label?: string
  cost_code_number?: string
  cost_code_name?: string
  division_name?: string
  item_type_uuid?: string | null
  item_type_label?: string
  sequence?: string
  model_number?: string
  location_uuid?: string | null
  unit?: string
  unit_uuid?: string | null
  unit_label?: string
  quantity?: number | string | null
  unit_price?: number | string | null
  total?: number | string | null
  location?: string
  approval_checks?: string[]
  po_unit_price?: string | number | null
  po_quantity?: string | number | null
  po_total?: string | number | null
  options?: Array<{
    label?: string
    value?: string
    short_name?: string
    description?: string
    unit?: string
    unit_price?: number | string | null
    [key: string]: any
  }>
}

const props = withDefaults(defineProps<{
  title?: string
  description?: string
  items: PurchaseOrderItemDisplay[]
  loading?: boolean
  error?: string | null
  loadingMessage?: string
  emptyMessage?: string
  corporationUuid?: string
  projectUuid?: string
  scopedItemTypes?: any[]
  scopedCostCodeConfigurations?: any[]
  scopedLocations?: any[]
  readonly?: boolean
  showEditSelection?: boolean
  hideApprovalChecks?: boolean
  hideLocation?: boolean
  hideModelNumber?: boolean
  poCurrencyConversionEnabled?: boolean
  poCurrencyFrom?: PoCurrencyCode
  poCurrencyTo?: PoCurrencyCode
  poConversionRate?: number
}>(), {
  title: 'PO Items',
  description: '',
  items: () => [],
  loading: false,
  error: null,
  loadingMessage: 'Loading items…',
  emptyMessage: 'No items found.',
  corporationUuid: undefined,
  projectUuid: undefined,
  scopedItemTypes: undefined,
  scopedCostCodeConfigurations: undefined,
  scopedLocations: undefined,
  readonly: false,
  showEditSelection: false,
  hideApprovalChecks: false,
  hideLocation: false,
  hideModelNumber: false,
  poCurrencyConversionEnabled: false,
  poCurrencyFrom: 'CAD',
  poCurrencyTo: 'USD',
  poConversionRate: 1,
})

const emit = defineEmits<{
  (e: 'add-row', index: number): void
  (e: 'remove-row', index: number): void
  (e: 'cost-code-change', payload: { index: number; value: string | null; option?: any }): void
  (e: 'category-change', payload: { index: number; value: string | null }): void
  (e: 'item-division-change', payload: { index: number; value: string | null; option?: any }): void
  (e: 'location-change', payload: { index: number; value: string | null; option?: any }): void
  (e: 'item-type-change', payload: { index: number; value: string | null; option?: any }): void
  (e: 'sequence-change', payload: { index: number; value: string | null; option?: any }): void
  (e: 'item-change', payload: { index: number; value: string | null; option?: any }): void
  (e: 'approval-checks-change', payload: { index: number; value: string[]; rawItem?: unknown }): void
  (e: 'model-number-change', payload: { index: number; value: string }): void
  (e: 'uom-change', payload: { index: number; value: string | null; option?: any }): void
  (e: 'po-unit-price-change', payload: { index: number; value: string | number | null | undefined; numericValue: number; computedTotal: number }): void
  (e: 'po-quantity-change', payload: { index: number; value: string | number | null | undefined; numericValue: number; computedTotal: number }): void
  (e: 'po-total-change', payload: { index: number; value: number }): void
  (e: 'description-change', payload: { index: number; value: string }): void
  (e: 'edit-selection'): void
}>()

const forwardedProps = computed(() => {
  return {
    ...props,
    itemColumnWidthClass: 'w-2/12',
    showEstimateValues: false,
  };
})
</script>
