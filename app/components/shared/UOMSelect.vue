<template>
  <div>
    <USelectMenu
      :model-value="selectedOption"
      :items="filteredOptions"
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useUOMStore } from '~/stores/uom'

interface Props {
  modelValue?: string
  placeholder?: string
  searchablePlaceholder?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  disabled?: boolean
  corporationUuid?: string
  uomTypeUuid?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select UOM...',
  searchablePlaceholder: 'Search UOM...',
  size: 'sm',
  className: 'w-full',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | undefined]
  'change': [uom: any]
}>()

const uomStore = useUOMStore()
const selectedValue = ref<string | undefined>(props.modelValue)
const selectedOption = ref<any>(undefined)
const loading = ref(false)

const options = computed(() => {
  const active = uomStore.getActiveUOM(props.corporationUuid)
  return active.map((u: any) => ({
    label: `${u.name}${u.short_name && u.short_name !== u.name ? ` (${u.short_name})` : ''}`,
    value: u.uuid,
    uom: u,
  }))
})

const filteredOptions = computed(() =>
  props.uomTypeUuid
    ? options.value.filter((o: any) => o.uom?.uom_type_uuid === props.uomTypeUuid)
    : options.value
)

const optionsMap = computed(() => new Map(filteredOptions.value.map(o => [o.value, o])))

const updateSelectedObject = () => {
  selectedOption.value = selectedValue.value ? optionsMap.value.get(selectedValue.value) || undefined : undefined
}

const handleSelection = (val: any) => {
  if (val) {
    const value = typeof val === 'string' ? val : val.value
    selectedValue.value = value
    emit('update:modelValue', value)
    emit('change', optionsMap.value.get(value) || val)
  }
  else {
    selectedValue.value = undefined
    selectedOption.value = undefined
    emit('update:modelValue', undefined)
  }
}

// Trigger initial fetch (uses store cache — only hits the API once per session)
onMounted(async () => {
  if (!uomStore.loaded) {
    loading.value = true
    try { await uomStore.fetchUOM(props.corporationUuid) }
    finally { loading.value = false }
  }
})

watch(() => props.modelValue, v => { selectedValue.value = v; updateSelectedObject() })
watch(filteredOptions, () => updateSelectedObject(), { immediate: true })

// Re-fetch only when the corporation actually changes (rare, but keeps parity with original)
watch(() => props.corporationUuid, async (v, prev) => {
  if (v && v !== prev) {
    loading.value = true
    try { await uomStore.fetchUOM(v) }
    finally { loading.value = false }
  }
})
</script>
