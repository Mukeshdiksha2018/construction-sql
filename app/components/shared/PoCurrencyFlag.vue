<template>
  <span
    v-if="flagSvg"
    class="po-currency-flag inline-block align-middle leading-none overflow-hidden"
    :style="flagStyle"
    role="img"
    :aria-label="ariaLabel"
    :data-testid="testId"
    :data-country-code="resolvedCountryCode"
    v-html="flagSvg"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import caFlag from 'country-flag-icons/string/3x2/CA'
import usFlag from 'country-flag-icons/string/3x2/US'
import {
  PO_CURRENCY_META,
  type PoCurrencyCode,
} from '~/utils/poCurrencyConversion'

const FLAG_BY_COUNTRY: Record<string, string> = {
  CA: caFlag,
  US: usFlag,
}

const props = withDefaults(
  defineProps<{
    currency?: PoCurrencyCode
    countryCode?: string
    size?: string
    testId?: string
  }>(),
  {
    size: '0.875em',
    testId: 'po-currency-flag',
  }
)

const resolvedCountryCode = computed(() => {
  const explicit = String(props.countryCode ?? '').trim().toUpperCase()
  if (explicit) return explicit
  if (props.currency) {
    return PO_CURRENCY_META[props.currency]?.countryCode ?? ''
  }
  return ''
})

const flagSvg = computed(() => FLAG_BY_COUNTRY[resolvedCountryCode.value] ?? '')

const flagStyle = computed(() => ({
  width: `calc(${props.size} * 1.5)`,
  height: props.size,
}))

const ariaLabel = computed(() => {
  if (props.currency) {
    return PO_CURRENCY_META[props.currency].label
  }
  return resolvedCountryCode.value
})
</script>

<style scoped>
.po-currency-flag :deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
