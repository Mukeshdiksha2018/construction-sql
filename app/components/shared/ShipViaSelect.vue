<template>
  <USelectMenu
    :model-value="selectedOption"
    :items="options"
    :loading="store.loading"
    :disabled="disabled || store.loading"
    :placeholder="placeholder"
    :size="size"
    :class="className"
    value-attribute="value"
    option-attribute="label"
    searchable
    :searchable-placeholder="searchablePlaceholder"
    @update:model-value="handleSelection"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useFreightStore } from '~/stores/freight'

interface Props {
  modelValue?: string
  placeholder?: string
  searchablePlaceholder?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select ship via...',
  searchablePlaceholder: 'Search...',
  size: 'sm',
  className: 'w-full',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | undefined]
  'change': [freight: any]
}>()

const store = useFreightStore()
const selectedValue = ref<string | undefined>(props.modelValue)
const selectedOption = ref<any>(undefined)

const options = computed(() =>
  (store.getActiveFreight || []).map(f => ({ label: f.freight_name, value: f.uuid, freight: f }))
)

const optionsMap = computed(() => new Map(options.value.map(o => [o.value, o])))

const updateSelected = () => {
  selectedOption.value = selectedValue.value ? optionsMap.value.get(selectedValue.value) || undefined : undefined
}

const handleSelection = (opt: any) => {
  if (opt) {
    const id = opt.value ?? opt?.freight?.uuid
    selectedValue.value = id
    emit('update:modelValue', id)
    emit('change', opt)
  } else {
    selectedValue.value = undefined
    emit('update:modelValue', undefined)
  }
}

watch(() => props.modelValue, v => { selectedValue.value = v; updateSelected() })
watch(options, () => updateSelected(), { immediate: true })

if (!store.getAllFreight?.length) store.fetchFreight().catch(() => {})
</script>
