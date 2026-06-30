<template>
  <div
    class="flex flex-col gap-0.5"
    :class="align === 'right' ? 'items-end text-right' : 'items-start text-left'"
  >
    <div :class="rowClass">
      <PoCurrencyFlag
        v-if="currencyIndicator === 'flag'"
        :currency="fromCurrency"
        size="0.65em"
        class="shrink-0"
      />
      <span
        v-else
        :class="labelClass"
        aria-hidden="true"
      >{{ fromCurrency }}</span>
      <span class="whitespace-nowrap" data-testid="po-dual-currency-primary">
        {{ formatPoCurrency(fromAmount, fromCurrency) }}
      </span>
    </div>
    <div :class="rowClass">
      <PoCurrencyFlag
        v-if="currencyIndicator === 'flag'"
        :currency="toCurrency"
        size="0.65em"
        class="shrink-0"
      />
      <span
        v-else
        :class="labelClass"
        aria-hidden="true"
      >{{ toCurrency }}</span>
      <span class="whitespace-nowrap" data-testid="po-dual-currency-secondary">
        {{ formatPoCurrency(toAmount, toCurrency) }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import PoCurrencyFlag from '~/components/shared/PoCurrencyFlag.vue'
import {
  convertPoCurrency,
  formatPoCurrency,
  roundPoCurrencyValue,
  type PoCurrencyCode,
} from '~/utils/poCurrencyConversion'

const props = withDefaults(
  defineProps<{
    amount: number | string | null | undefined
    fromCurrency?: PoCurrencyCode
    toCurrency?: PoCurrencyCode
    conversionRate?: number | string | null | undefined
    align?: 'left' | 'right'
    currencyIndicator?: 'flag' | 'text'
  }>(),
  {
    fromCurrency: 'CAD',
    toCurrency: 'USD',
    conversionRate: 1,
    align: 'right',
    currencyIndicator: 'flag',
  }
)

const fromAmount = computed(() => roundPoCurrencyValue(props.amount))
const toAmount = computed(() =>
  convertPoCurrency(fromAmount.value, props.conversionRate)
)

const rowClass =
  'flex items-center gap-1 text-xs text-default leading-tight tracking-tight'
const labelClass = 'text-xs font-semibold uppercase shrink-0'
</script>
