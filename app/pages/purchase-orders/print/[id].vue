<template>
  <div class="min-h-screen bg-white">
    <ClientOnly>
      <div v-if="loading" class="flex items-center justify-center min-h-screen">
        <div class="text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p class="text-gray-600">Loading purchase order...</p>
        </div>
      </div>
      <div v-else-if="error" class="flex items-center justify-center min-h-screen">
        <p class="text-red-600">{{ error }}</p>
      </div>
      <div v-else-if="purchaseOrder" ref="printRef">
        <PurchaseOrderPreview :purchase-order="purchaseOrder" />
      </div>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import PurchaseOrderPreview from '~/components/purchaseOrders/PurchaseOrderPreview.vue'

definePageMeta({
  layout: false,
})

const route = useRoute()
const id = computed(() => route.params.id as string)

const purchaseOrder = ref<any>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const printRef = ref<HTMLElement | null>(null)

onMounted(async () => {
  try {
    const response = await $fetch<any>(`/api/purchase-order-forms/${id.value}`)
    purchaseOrder.value = response?.data ?? null
    if (!purchaseOrder.value) {
      error.value = 'Purchase order not found'
    }
  } catch (err: any) {
    error.value = err?.statusMessage || err?.message || 'Failed to load purchase order'
  } finally {
    loading.value = false
    await nextTick()
    if (!error.value) {
      setTimeout(() => window.print(), 500)
    }
  }
})

useHead({ title: `PO Print` })
</script>
