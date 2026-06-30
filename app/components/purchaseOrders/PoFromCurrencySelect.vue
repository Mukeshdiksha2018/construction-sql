<template>
  <USelectMenu
    :model-value="modelValue"
    :items="currencyOptions"
    value-key="value"
    label-key="label"
    :size="size"
    :class="selectClass"
    :disabled="disabled"
    @update:model-value="handleChange"
  >
    <template #leading>
      <PoCurrencyFlag :currency="modelValue" size="0.7em" />
    </template>
    <template #item="{ item }">
      <div class="flex items-center gap-2">
        <PoCurrencyFlag :currency="item.value" size="0.65em" />
        <span>{{ item.label }}</span>
      </div>
    </template>
  </USelectMenu>
</template>

<script setup lang="ts">
import PoCurrencyFlag from '~/components/shared/PoCurrencyFlag.vue'
import {
  PO_CURRENCY_META,
  PO_SUPPORTED_CURRENCIES,
  type PoCurrencyCode,
} from '~/utils/poCurrencyConversion'

withDefaults(
  defineProps<{
    modelValue?: PoCurrencyCode
    disabled?: boolean
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    selectClass?: string
  }>(),
  {
    modelValue: 'CAD',
    disabled: false,
    size: 'sm',
    selectClass: 'w-full',
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: PoCurrencyCode): void
}>()

const currencyOptions = PO_SUPPORTED_CURRENCIES.map((code) => ({
  value: code,
  label: PO_CURRENCY_META[code].label,
}))

function normalizeCurrencyValue(value: unknown): PoCurrencyCode | null {
  if (value === 'CAD' || value === 'USD') return value
  if (value && typeof value === 'object' && 'value' in value) {
    const next = (value as { value?: unknown }).value
    if (next === 'CAD' || next === 'USD') return next
  }
  return null
}

function handleChange(value: unknown) {
  const next = normalizeCurrencyValue(value)
  if (next) emit('update:modelValue', next)
}
</script>
