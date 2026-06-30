<template>
  <CadUsdDualAmountDisplay
    v-if="dualAmounts"
    :cad-amount="dualAmounts.cadAmount"
    :usd-amount="dualAmounts.usdAmount"
    currency-indicator="text"
    align="right"
  />
  <span v-else>{{ formatCurrency(amount) }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import CadUsdDualAmountDisplay from '~/components/shared/CadUsdDualAmountDisplay.vue'
import { useCurrencyFormat } from '~/composables/useCurrencyFormat'
import {
  getOrderCurrencyFields,
  showOrderDualCurrency,
  type ReportOrderCurrencyRow,
} from '~/utils/reportPoCurrencyDisplay'
import { resolveDualCurrencyAmounts } from '~/utils/poCurrencyConversion'

const props = defineProps<{
  row: ReportOrderCurrencyRow
  amount: number | null | undefined
}>()

const { formatCurrency } = useCurrencyFormat()

const dualAmounts = computed(() => {
  if (!showOrderDualCurrency(props.row)) return null
  const currency = getOrderCurrencyFields(props.row)
  return resolveDualCurrencyAmounts(
    props.amount,
    currency.currency_from,
    currency.currency_to,
    currency.conversion_rate
  )
})
</script>
