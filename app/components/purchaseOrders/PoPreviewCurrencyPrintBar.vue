<template>
  <div
    class="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md border border-primary-200 bg-primary-50 px-3 py-2 dark:border-primary-800 dark:bg-primary-900/20"
    data-testid="po-preview-currency-print-bar"
  >
    <div class="text-sm text-primary-900 dark:text-primary-100">
      <span class="font-medium">Print amounts in</span>
      <span class="text-xs text-primary-700 dark:text-primary-300 ml-2">
        {{ rateSummary }}
      </span>
    </div>
    <div class="flex items-center gap-2 shrink-0">
      <span
        class="flex items-center gap-1 text-xs font-medium whitespace-nowrap"
        :class="!printInToCurrency ? 'text-primary-800 dark:text-primary-100' : 'text-muted'"
      >
        <PoCurrencyFlag :currency="fromCurrency" size="0.75em" />
        {{ fromCurrency }}
      </span>
      <USwitch
        v-model="printInToCurrency"
        size="sm"
        data-testid="currency-print-switch"
      />
      <span
        class="flex items-center gap-1 text-xs font-medium whitespace-nowrap"
        :class="printInToCurrency ? 'text-primary-800 dark:text-primary-100' : 'text-muted'"
      >
        <PoCurrencyFlag :currency="toCurrency" size="0.75em" />
        {{ toCurrency }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import PoCurrencyFlag from '~/components/shared/PoCurrencyFlag.vue'
import type { PoCurrencyCode } from '~/utils/poCurrencyConversion'

defineProps<{
  rateSummary: string
  fromCurrency: PoCurrencyCode
  toCurrency: PoCurrencyCode
}>()

const printInToCurrency = defineModel<boolean>('printInToCurrency', { default: false })
</script>
