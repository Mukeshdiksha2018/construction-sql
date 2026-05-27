<template>
  <USelectMenu
    :model-value="selectedOption"
    :items="options"
    :loading="store.loading"
    :disabled="disabled || store.loading"
    :placeholder="placeholder"
    :size="size"
    :class="className"
    value-key="value"
    label-key="label"
    searchable
    :searchable-placeholder="searchablePlaceholder"
    @update:model-value="handleSelection"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useCostCodeConfigurationsStore } from '~/stores/costCodeConfigurations'

interface Props {
  modelValue?: string
  placeholder?: string
  searchablePlaceholder?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  disabled?: boolean
  corporationUuid?: string
  excludeUuid?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select parent cost code...',
  searchablePlaceholder: 'Search cost codes...',
  size: 'sm',
  className: 'w-full',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | undefined]
  'change': [item: any]
}>()

const store = useCostCodeConfigurationsStore()
const selectedValue = ref<string | undefined>(props.modelValue)
const selectedOption = ref<any>(undefined)

const options = computed(() => {
  const active = store.getActiveConfigurations(props.corporationUuid)
  return active
    .filter((c: any) => c.uuid !== props.excludeUuid)
    .map((c: any) => ({ label: c.name || c.cost_code, value: c.uuid, costCode: c }))
})

const optionsMap = computed(() => new Map(options.value.map(o => [o.value, o])))

const updateSelected = () => {
  selectedOption.value = selectedValue.value ? optionsMap.value.get(selectedValue.value) || undefined : undefined
}

const handleSelection = (val: any) => {
  if (val) {
    const value = typeof val === 'string' ? val : val.value
    selectedValue.value = value
    emit('update:modelValue', value)
    emit('change', optionsMap.value.get(value) || val)
  } else {
    selectedValue.value = undefined
    selectedOption.value = undefined
    emit('update:modelValue', undefined)
  }
}

watch(() => props.modelValue, v => { selectedValue.value = v; updateSelected() })
watch(options, () => updateSelected(), { immediate: true })
</script>
