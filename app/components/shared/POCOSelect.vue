<template>
  <div>
    <div class="flex items-center gap-2">
      <UInput
        :model-value="displayLabel"
        :placeholder="placeholder"
        :size="size"
        :class="className"
        readonly
        :disabled="disabled"
        @click="openModal"
      />
      <UButton
        v-if="!disabled"
        color="primary"
        variant="soft"
        size="sm"
        icon="i-heroicons-magnifying-glass"
        @click="openModal"
      />
    </div>

    <UModal v-model:open="showModal" :ui="{ width: 'max-w-4xl' }">
      <template #header>
        <div class="flex items-center justify-between w-full">
          <h3 class="text-base font-semibold">Select Purchase Order / Change Order</h3>
          <UButton icon="i-heroicons-x-mark" size="xs" variant="solid" color="neutral" @click="showModal = false" />
        </div>
      </template>
      <template #body>
        <div class="space-y-4">
          <div class="flex gap-2">
            <UButton
              :color="activeTab === 'po' ? 'primary' : 'neutral'"
              variant="solid"
              size="sm"
              @click="activeTab = 'po'"
            >
              Purchase Orders
            </UButton>
            <UButton
              :color="activeTab === 'co' ? 'primary' : 'neutral'"
              variant="solid"
              size="sm"
              @click="activeTab = 'co'"
            >
              Change Orders
            </UButton>
          </div>
          <UInput v-model="searchQuery" placeholder="Search..." size="sm" class="w-full" icon="i-heroicons-magnifying-glass" />
          <div class="max-h-80 overflow-y-auto">
            <div
              v-for="item in filteredItems"
              :key="item.uuid"
              class="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer rounded-md"
              @click="selectItem(item)"
            >
              <div>
                <p class="font-medium text-sm">{{ item.po_number || item.co_number || item.name }}</p>
                <p v-if="item.vendor_name" class="text-xs text-muted">{{ item.vendor_name }}</p>
              </div>
            </div>
            <p v-if="filteredItems.length === 0" class="text-sm text-muted text-center py-4">No items found</p>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { usePurchaseOrdersStore } from '~/stores/purchaseOrders'
import { useChangeOrdersStore } from '~/stores/changeOrders'

interface Props {
  modelValue?: { uuid?: string; type?: 'PO' | 'CO' } | null
  placeholder?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  disabled?: boolean
  corporationUuid?: string
  projectUuid?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select PO / CO...',
  size: 'sm',
  className: 'w-full',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: { uuid: string; type: 'PO' | 'CO' } | null]
  'change': [item: any]
}>()

const poStore = usePurchaseOrdersStore()
const coStore = useChangeOrdersStore()

const showModal = ref(false)
const activeTab = ref<'po' | 'co'>('po')
const searchQuery = ref('')

const displayLabel = computed(() => {
  if (!props.modelValue?.uuid) return ''
  const { uuid, type } = props.modelValue
  if (type === 'PO') {
    const po = poStore.purchaseOrders.find((p: any) => p.uuid === uuid)
    return po ? (po.po_number || `PO ${uuid.slice(0, 8)}`) : uuid
  }
  const co = coStore.changeOrders.find((c: any) => c.uuid === uuid)
  return co ? (co.co_number || `CO ${uuid.slice(0, 8)}`) : uuid
})

const filteredItems = computed(() => {
  const items = activeTab.value === 'po' ? poStore.purchaseOrders : coStore.changeOrders
  if (!searchQuery.value) return items
  const q = searchQuery.value.toLowerCase()
  return items.filter((item: any) => {
    const label = (item.po_number || item.co_number || item.name || '').toLowerCase()
    return label.includes(q)
  })
})

const openModal = () => { if (!props.disabled) showModal.value = true }

const selectItem = (item: any) => {
  const type: 'PO' | 'CO' = activeTab.value === 'po' ? 'PO' : 'CO'
  emit('update:modelValue', { uuid: item.uuid, type })
  emit('change', { ...item, type })
  showModal.value = false
}

watch(() => props.corporationUuid, v => {
  if (v) {
    poStore.fetchPurchaseOrders(v).catch(() => {})
    coStore.fetchChangeOrders(v).catch(() => {})
  }
}, { immediate: true })
</script>
