<template>
  <div
    class="flex flex-col gap-0.5"
    :class="align === 'right' ? 'items-end text-right' : 'items-start text-left'"
  >
    <div :class="rowClass">
      <PoCurrencyFlag
        v-if="currencyIndicator === 'flag'"
        currency="CAD"
        size="0.65em"
        class="shrink-0"
      />
      <span
        v-else
        :class="labelClass"
        aria-hidden="true"
      >CAD</span>
      <span class="whitespace-nowrap" data-testid="po-dual-currency-primary">
        {{ formatPoCurrency(cadAmount, 'CAD') }}
      </span>
    </div>
    <div :class="rowClass">
      <PoCurrencyFlag
        v-if="currencyIndicator === 'flag'"
        currency="USD"
        size="0.65em"
        class="shrink-0"
      />
      <span
        v-else
        :class="labelClass"
        aria-hidden="true"
      >USD</span>
      <span class="whitespace-nowrap" data-testid="po-dual-currency-secondary">
        {{ formatPoCurrency(usdAmount, 'USD') }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import PoCurrencyFlag from '~/components/shared/PoCurrencyFlag.vue'
import { formatPoCurrency } from '~/utils/poCurrencyConversion'

withDefaults(
  defineProps<{
    cadAmount: number
    usdAmount: number
    align?: 'left' | 'right'
    currencyIndicator?: 'flag' | 'text'
  }>(),
  {
    align: 'right',
    currencyIndicator: 'flag',
  }
)

const rowClass =
  'flex items-center gap-1 text-xs text-default leading-tight tracking-tight'
const labelClass = 'text-xs font-semibold uppercase shrink-0'
</script>
