<template>
  <CadUsdDualAmountDisplay
    v-if="aggregated.showDual"
    :cad-amount="aggregated.cadTotal"
    :usd-amount="aggregated.usdFromTotal"
    currency-indicator="text"
    align="right"
  />
  <span v-else>{{ formatCurrency(aggregated.cadTotal) }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import CadUsdDualAmountDisplay from '~/components/shared/CadUsdDualAmountDisplay.vue'
import { useCurrencyFormat } from '~/composables/useCurrencyFormat'
import {
  aggregateVendorPoAmount,
  type ReportOrderCurrencyRow,
  type VendorPoAmountField,
} from '~/utils/reportPoCurrencyDisplay'

const props = defineProps<{
  orders: Array<ReportOrderCurrencyRow & Record<string, unknown>>
  field: VendorPoAmountField
}>()

const { formatCurrency } = useCurrencyFormat()

const aggregated = computed(() =>
  aggregateVendorPoAmount(props.orders, props.field)
)
</script>
