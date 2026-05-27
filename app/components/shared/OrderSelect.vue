<template>
  <USelect
    :model-value="normalizedValue"
    :items="orderOptions"
    :placeholder="placeholder"
    :size="size"
    :class="className"
    :disabled="disabled"
    value-attribute="value"
    option-attribute="label"
    @update:model-value="handleSelection"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue?: number | null
  placeholder?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  disabled?: boolean
  maxOrder?: number
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select order',
  size: 'sm',
  className: 'w-full',
  disabled: false,
  maxOrder: 200,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
  'change': [value: number | null]
}>()

const orderOptions = computed(() =>
  Array.from({ length: props.maxOrder }, (_, i) => ({ label: String(i + 1), value: i + 1 }))
)

const normalizedValue = computed(() => props.modelValue ?? undefined)

const handleSelection = (value: number | undefined) => {
  const v = value ?? null
  emit('update:modelValue', v)
  emit('change', v)
}
</script>
