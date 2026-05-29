<template>
  <div class="h-screen overflow-y-auto bg-white text-black print:h-auto print:overflow-visible">
    <div class="print:hidden w-full">
      <div class="max-w-5xl mx-auto px-4 pt-4">
        <div class="flex justify-end">
          <UButton color="primary" icon="i-heroicons-printer" @click="printPage">Print</UButton>
        </div>
      </div>
    </div>

    <div class="max-w-5xl mx-auto px-4 py-6 print:px-2 print:py-2">
      <PurchaseOrderPreview
        v-if="printAuthReady"
        :purchase-order-uuid="purchaseOrderId"
        @preview-ready="onPreviewReady"
      />
      <p v-else class="text-sm text-gray-600 p-4">Loading print preview…</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import PurchaseOrderPreview from '~/components/purchaseOrders/PurchaseOrderPreview.vue'
import { hydratePrintAuth } from '~/utils/authToken'

definePageMeta({
  layout: false,
})

const route = useRoute()
const purchaseOrderId = computed(() => route.params.id as string)
const printAuthReady = ref(false)

onMounted(async () => {
  await hydratePrintAuth()
  printAuthReady.value = true
})

const printPage = () => window.print()

function onPreviewReady() {
  setTimeout(() => window.print(), 500)
}

useHead({ title: 'PO Print' })
</script>

<style>
@media print {
  html, body {
    background: #ffffff !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  @page {
    margin: 0.5cm;
  }

  * {
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
}
</style>
