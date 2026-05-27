<template>
  <div class="flex flex-col gap-1">
    <label v-if="label" class="block text-sm font-medium text-default mb-1">{{ label }}</label>
    <USelectMenu
      v-model="selectedObject"
      :items="categoryOptions"
      :placeholder="placeholder"
      :size="size"
      :class="className"
      :disabled="disabled"
      :ui="menuUi"
      value-key="value"
      label-key="label"
      @update:model-value="handleSelection"
    >
      <template #item-label="{ item }">
        <div
          :class="item.value === '__ALL__' || item.isAllOption
            ? 'rounded-md -mx-1 px-2 py-1.5 bg-gray-100 dark:bg-gray-700 font-semibold text-highlighted'
            : ''"
          class="whitespace-normal break-words text-left"
        >
          {{ item.label }}
        </div>
      </template>
      <template #default>
        <span class="flex-1 whitespace-normal break-words text-left" :class="{ 'text-muted': !selectedObject }">
          <template v-if="selectedObject">{{ selectedObject.label }}</template>
          <template v-else>{{ placeholder }}</template>
        </span>
      </template>
    </USelectMenu>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { CATEGORY_OPTIONS } from '~/constants/itemCategories'

interface Props {
  modelValue?: string
  label?: string
  placeholder?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  disabled?: boolean
  includeAllOption?: boolean
  allOptionLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select category...',
  size: 'sm',
  className: 'w-full',
  disabled: false,
  includeAllOption: false,
  allOptionLabel: 'All',
})

const emit = defineEmits<{
  'update:modelValue': [value: string | undefined]
  'change': [category: { value: string; label: string } | undefined]
}>()

const categoryOptions = computed(() => {
  const base = [...CATEGORY_OPTIONS]
  if (!props.includeAllOption) return base
  return [{ value: '__ALL__', label: props.allOptionLabel, isAllOption: true }, ...base]
})

const selectedObject = ref<{ value: string; label: string; isAllOption?: boolean } | undefined>(undefined)

const menuUi = {
  content: 'max-h-60 min-w-full w-max',
  item: { base: 'whitespace-normal break-words', label: 'whitespace-normal break-words text-left' },
}

const optionsMap = computed(() => {
  const map = new Map<string, any>()
  for (const o of categoryOptions.value) map.set(o.value, o)
  return map
})

function updateSelectedObject() {
  if (!props.modelValue) {
    selectedObject.value = props.includeAllOption
      ? categoryOptions.value.find(o => o.value === '__ALL__') ?? undefined
      : undefined
    return
  }
  selectedObject.value = optionsMap.value.get(props.modelValue) ?? undefined
}

function handleSelection(item: any) {
  if (!item) {
    selectedObject.value = props.includeAllOption ? categoryOptions.value.find(o => o.value === '__ALL__') ?? undefined : undefined
    emit('update:modelValue', undefined)
    emit('change', undefined)
    return
  }
  const value = typeof item === 'string' ? item : item.value
  if (value === '__ALL__' || (typeof item === 'object' && item.isAllOption)) {
    selectedObject.value = categoryOptions.value.find(o => o.value === '__ALL__') ?? undefined
    emit('update:modelValue', undefined)
    emit('change', undefined)
    return
  }
  const label = typeof item === 'object' ? item.label : optionsMap.value.get(value)?.label ?? value
  emit('update:modelValue', value)
  emit('change', { value, label })
}

watch(() => props.modelValue, () => updateSelectedObject(), { immediate: true })
</script>
