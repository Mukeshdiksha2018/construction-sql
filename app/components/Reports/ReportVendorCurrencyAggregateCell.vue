<template>
  <CadUsdDualAmountDisplay
    v-if="aggregate.showDual"
    :cad-amount="aggregate.cadTotal"
    :usd-amount="aggregate.usdFromTotal"
    currency-indicator="text"
    align="right"
  />
  <span v-else>{{ formatCurrency(aggregate.cadTotal) }}</span>
</template>

<script setup lang="ts">
import CadUsdDualAmountDisplay from '~/components/shared/CadUsdDualAmountDisplay.vue'
import { useCurrencyFormat } from '~/composables/useCurrencyFormat'
import type { VendorPoAmountAggregate } from '~/utils/reportPoCurrencyDisplay'

defineProps<{
  aggregate: VendorPoAmountAggregate
}>()

const { formatCurrency } = useCurrencyFormat()
</script>
