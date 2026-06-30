<template>
  <span
    v-if="resolvedCountryCode"
    :class="flagClass"
    :style="flagStyle"
    role="img"
    :aria-label="ariaLabel"
    :data-testid="testId"
    :data-country-code="resolvedCountryCode"
  />
</template>

<script setup lang="ts">
import 'country-flag-icons/3x2/flags.css'
import { computed } from 'vue'
import {
  PO_CURRENCY_META,
  type PoCurrencyCode,
} from '~/utils/poCurrencyConversion'

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

const flagClass = computed(() =>
  resolvedCountryCode.value ? `flag:${resolvedCountryCode.value}` : ''
)

const flagStyle = computed(() => ({
  '--CountryFlagIcon-height': props.size,
}))

const ariaLabel = computed(() => {
  if (props.currency) {
    return PO_CURRENCY_META[props.currency].label
  }
  return resolvedCountryCode.value
})
</script>
