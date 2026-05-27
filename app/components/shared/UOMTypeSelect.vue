<template>
  <USelectMenu
    v-model="selectedOption"
    :items="options"
    :placeholder="placeholder"
    :size="size"
    :class="className"
    :disabled="disabled || loading"
    :loading="loading"
    value-key="value"
    label-key="label"
    searchable
    :searchable-placeholder="searchablePlaceholder"
    @update:model-value="handleSelection"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface Props {
  modelValue?: string
  placeholder?: string
  searchablePlaceholder?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select UOM type...',
  searchablePlaceholder: 'Search types...',
  size: 'sm',
  className: 'w-full',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | undefined]
  'change': [type: any]
}>()

const uomTypes = ref<any[]>([])
const loading = ref(false)
const selectedOption = ref<any>(undefined)

const options = computed(() =>
  uomTypes.value.map(t => ({ label: t.name || t.type_name, value: t.uuid || t.id, type: t }))
)

const handleSelection = (val: any) => {
  if (val) {
    const value = typeof val === 'string' ? val : val.value
    selectedOption.value = options.value.find(o => o.value === value) || undefined
    emit('update:modelValue', value)
    emit('change', selectedOption.value)
  } else {
    selectedOption.value = undefined
    emit('update:modelValue', undefined)
  }
}

onMounted(async () => {
  loading.value = true
  try {
    const response = await $fetch<{ data: any[] }>('/api/uom-types', { credentials: 'include' })
    uomTypes.value = response?.data ?? []
  } catch { uomTypes.value = [] } finally { loading.value = false }
  if (props.modelValue) {
    selectedOption.value = options.value.find(o => o.value === props.modelValue) || undefined
  }
})
</script>
