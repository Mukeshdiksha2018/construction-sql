<template>
  <USelectMenu
    :model-value="selectedOption"
    :items="options"
    :loading="store.loading"
    :disabled="disabled || store.loading"
    :placeholder="placeholder"
    :size="size"
    :class="className"
    value-key="value"
    label-key="label"
    searchable
    :searchable-placeholder="searchablePlaceholder"
    @update:model-value="handleSelection"
  >
    <template #item-label="{ item }">
      <div class="flex flex-col">
        <span class="font-medium">{{ item.label }}</span>
        <span v-if="item.description" class="text-xs text-muted">{{ item.description }}</span>
      </div>
    </template>
  </USelectMenu>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { usePurchaseOrdersStore } from '~/stores/purchaseOrders'
import { useCurrencyFormat } from '~/composables/useCurrencyFormat'
import { useDateFormat } from '~/composables/useDateFormat'

interface Props {
  modelValue?: string
  placeholder?: string
  searchablePlaceholder?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  disabled?: boolean
  corporationUuid?: string
  projectUuid?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select purchase order...',
  searchablePlaceholder: 'Search purchase orders...',
  size: 'sm',
  className: 'w-full',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | undefined]
  'change': [po: any]
}>()

const store = usePurchaseOrdersStore()
const { formatCurrency } = useCurrencyFormat()
const { formatDate } = useDateFormat()
const selectedValue = ref<string | undefined>(props.modelValue)
const selectedOption = ref<any>(undefined)

const options = computed(() =>
  store.purchaseOrders.map((po: any) => ({
    label: po.po_number || po.name || `PO ${po.uuid?.slice(0, 8)}`,
    value: po.uuid,
    description: [
      po.vendor_name,
      po.total_amount !== undefined ? formatCurrency(po.total_amount) : undefined,
      po.created_at ? formatDate(po.created_at) : undefined,
    ].filter(Boolean).join(' · '),
    po,
  }))
)

const optionsMap = computed(() => new Map(options.value.map(o => [o.value, o])))

const updateSelected = () => {
  selectedOption.value = selectedValue.value ? optionsMap.value.get(selectedValue.value) || undefined : undefined
}

const handleSelection = (val: any) => {
  if (val) {
    const value = typeof val === 'string' ? val : val.value
    selectedValue.value = value
    emit('update:modelValue', value)
    emit('change', optionsMap.value.get(value) || val)
  } else {
    selectedValue.value = undefined
    selectedOption.value = undefined
    emit('update:modelValue', undefined)
  }
}

watch(() => props.modelValue, v => { selectedValue.value = v; updateSelected() })
watch(options, () => updateSelected(), { immediate: true })
watch(() => props.corporationUuid, v => {
  if (v) store.fetchPurchaseOrders(v).catch(() => {})
}, { immediate: true })
</script>
