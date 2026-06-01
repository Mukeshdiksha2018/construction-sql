<template>
  <div class="preferred-items-from-master-section">
    <POItemsFromItemMaster
      v-bind="tableBind"
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
    </POItemsFromItemMaster>

    <PurchaseOrdersMasterItemsSelectionModal
      v-model:open="modalOpen"
      :items="masterItems"
      :preselected-items="masterPreselectedItems"
      :title="masterModalTitle"
      @confirm="emit('master-confirm', $event)"
      @cancel="emit('master-cancel')"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import POItemsFromItemMaster from '~/components/purchaseOrders/POItemsFromItemMaster.vue'
import PurchaseOrdersMasterItemsSelectionModal from '~/components/purchaseOrders/PurchaseOrdersMasterItemsSelectionModal.vue'

defineOptions({ name: 'PreferredItemsFromMasterSection' })

const props = withDefaults(
  defineProps<{
    items: any[]
    loading?: boolean
    error?: string | null
    title?: string
    description?: string
    loadingMessage?: string
    emptyMessage?: string
    corporationUuid?: string
    projectUuid?: string
    scopedItemTypes?: any[]
    scopedCostCodeConfigurations?: any[]
    readonly?: boolean
    showEditSelection?: boolean
    hideApprovalChecks?: boolean
    hideLocation?: boolean
    hideModelNumber?: boolean
    masterItems: any[]
    masterPreselectedItems?: any[]
    masterModalTitle?: string
  }>(),
  {
    loading: false,
    error: null,
    title: 'Items',
    description: '',
    loadingMessage: 'Loading items…',
    emptyMessage: 'No items found.',
    corporationUuid: undefined,
    projectUuid: undefined,
    scopedItemTypes: undefined,
    scopedCostCodeConfigurations: undefined,
    readonly: false,
    showEditSelection: false,
    hideApprovalChecks: false,
    hideLocation: false,
    hideModelNumber: false,
    masterItems: () => [],
    masterPreselectedItems: () => [],
    masterModalTitle: 'Select Items to Import from Master',
  },
)

const modalOpen = defineModel<boolean>('masterImportOpen', { default: false })

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
  (e: 'master-confirm', selected: any[]): void
  (e: 'master-cancel'): void
}>()

const tableBind = computed(() => ({
  items: props.items,
  loading: props.loading,
  error: props.error,
  title: props.title,
  description: props.description,
  loadingMessage: props.loadingMessage,
  emptyMessage: props.emptyMessage,
  corporationUuid: props.corporationUuid,
  projectUuid: props.projectUuid,
  scopedItemTypes: props.scopedItemTypes,
  scopedCostCodeConfigurations: props.scopedCostCodeConfigurations,
  readonly: props.readonly,
  showEditSelection: props.showEditSelection,
  hideApprovalChecks: props.hideApprovalChecks,
  hideLocation: props.hideLocation,
  hideModelNumber: props.hideModelNumber,
}))
</script>
