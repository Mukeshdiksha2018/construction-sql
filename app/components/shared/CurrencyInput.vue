<template>
  <div class="relative inline-flex items-center justify-end rounded-md border border-default bg-background dark:bg-gray-900/60 px-3 py-1.5 text-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/40 transition-colors">
    <span class="text-xs font-semibold text-default shrink-0">{{ currencySymbolText }}</span>
    <input
      :value="modelValue"
      :type="type"
      :inputmode="inputmode"
      :disabled="disabled"
      :placeholder="computedPlaceholder"
      :class="[
        'min-w-[2ch] bg-transparent text-right font-mono leading-none outline-none border-none focus:outline-none',
        sizeClasses,
        disabled ? 'cursor-not-allowed opacity-75' : '',
      ]"
      :style="{ width: inputWidth }"
      @input="handleInput"
      @focus="handleFocus"
      @blur="handleBlur"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, unref } from 'vue'
import { useCurrencyFormat } from '~/composables/useCurrencyFormat'

interface Props {
  modelValue?: string | number | null
  type?: string
  inputmode?: 'search' | 'email' | 'text' | 'decimal' | 'tel' | 'url' | 'none' | 'numeric'
  disabled?: boolean
  placeholder?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  corporationUuid?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  type: 'text',
  inputmode: 'decimal',
  disabled: false,
  placeholder: undefined,
  size: 'sm',
  corporationUuid: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
}>()

const { currencySymbol } = useCurrencyFormat()
const currencySymbolText = computed(() => unref(currencySymbol) || '')

const sizeClasses = computed(() => {
  const map: Record<string, string> = { xs: 'text-xs', sm: 'text-sm', md: 'text-sm', lg: 'text-sm', xl: 'text-base' }
  return map[props.size] || map.sm
})

const inputWidth = computed(() => {
  const str = String(props.modelValue || '')
  return `${Math.max(8, str.length + 1)}ch`
})

const computedPlaceholder = computed(() => {
  if (props.placeholder !== undefined && props.placeholder !== null) return props.placeholder
  const hasValue = props.modelValue !== null && props.modelValue !== undefined && String(props.modelValue).trim() !== ''
  return hasValue ? '' : '0.00'
})

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  let value = target.value.replace(/[^0-9.]/g, '')
  const parts = value.split('.')
  if (parts.length > 2) value = parts[0] + '.' + parts.slice(1).join('')
  if (target.value !== value) target.value = value
  emit('update:modelValue', value)
}

const handleFocus = (event: FocusEvent) => emit('focus', event)
const handleBlur = (event: FocusEvent) => emit('blur', event)
</script>

<style scoped>
input { font-variant-numeric: tabular-nums; }
</style>
