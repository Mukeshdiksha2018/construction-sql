<template>
  <div class="h-screen overflow-y-auto bg-white text-black print:h-auto print:overflow-visible">
    <div class="print:hidden w-full">
      <div class="max-w-5xl mx-auto px-4 pt-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <PoPreviewCurrencyPrintBar
            v-if="currencyBarFields"
            v-model:print-in-to-currency="printInToCurrency"
            :rate-summary="currencyBarFields.rateSummary"
            :from-currency="currencyBarFields.fromCurrency"
            :to-currency="currencyBarFields.toCurrency"
          />
          <div v-else class="flex-1" />
          <UButton color="primary" icon="i-heroicons-printer" @click="printPage">Print</UButton>
        </div>
      </div>
    </div>

    <div class="max-w-5xl mx-auto px-4 py-6 print:px-2 print:py-2">
      <PurchaseOrderPreview
        v-if="printAuthReady"
        ref="previewRef"
        v-model:print-in-to-currency="printInToCurrency"
        hide-currency-print-controls
        :purchase-order-uuid="purchaseOrderId"
        @preview-ready="onPreviewReady"
      />
      <p v-else class="text-sm text-gray-600 p-4">Loading print preview…</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import PurchaseOrderPreview from '~/components/purchaseOrders/PurchaseOrderPreview.vue'
import PoPreviewCurrencyPrintBar from '~/components/purchaseOrders/PoPreviewCurrencyPrintBar.vue'
import { usePrintPreviewCurrencyBar } from '~/composables/usePrintPreviewCurrencyBar'
import { hydratePrintAuth } from '~/utils/authToken'

definePageMeta({
  layout: false,
})

const route = useRoute()
const purchaseOrderId = computed(() => route.params.id as string)
const printAuthReady = ref(false)
const previewRef = ref<InstanceType<typeof PurchaseOrderPreview> | null>(null)
const { printInToCurrency, currencyBarFields } = usePrintPreviewCurrencyBar(previewRef)

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
    height: auto !important;
    overflow: visible !important;
  }

  #__nuxt,
  #__layout,
  #__app {
    height: auto !important;
    overflow: visible !important;
  }

  .min-h-screen,
  .h-screen,
  .overflow-y-auto,
  .overflow-hidden,
  .max-h-full,
  .h-full,
  .min-h-0 {
    height: auto !important;
    min-height: auto !important;
    max-height: none !important;
    overflow: visible !important;
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
