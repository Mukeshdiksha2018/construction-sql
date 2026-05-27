<template>
  <USelectMenu
    v-model="selectedTermsAndConditionObject"
    :items="termsAndConditionOptions"
    :filter-fields="['label', 'description', 'searchText']"
    :placeholder="placeholder"
    :searchable="searchable"
    :searchable-placeholder="searchablePlaceholder"
    :size="size"
    :class="className"
    :disabled="disabled"
    :loading="loading"
    value-key="value"
    label-key="label"
    @update:model-value="handleSelection"
  >
    <template #default>
      <span class="flex-1 whitespace-normal text-left" :class="{ 'text-muted': !selectedTermsAndConditionObject }">
        {{ displayLabel }}
      </span>
    </template>
    <template #item-label="{ item }">
      <span class="truncate font-medium">{{ item.label }}</span>
    </template>
  </USelectMenu>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTermsAndConditionsStore } from '~/stores/termsAndConditions'

interface Props {
  modelValue?: string
  placeholder?: string
  searchable?: boolean
  searchablePlaceholder?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select terms and conditions...',
  searchable: true,
  searchablePlaceholder: 'Type to search...',
  size: 'sm',
  className: 'w-full',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | undefined]
  'change': [termsAndCondition: any]
}>()

const termsAndConditionsStore = useTermsAndConditionsStore()
const selectedTermsAndCondition = ref<string | undefined>(props.modelValue)
const selectedTermsAndConditionObject = ref<any>(undefined)

const termsAndConditionOptions = computed(() =>
  termsAndConditionsStore.getActiveTermsAndConditions.map(tc => {
    const contentPreview = tc.content ? tc.content.replace(/<[^>]*>/g, '').substring(0, 50) : ''
    return {
      label: tc.name,
      value: tc.uuid,
      description: contentPreview || undefined,
      searchText: `${tc.name} ${contentPreview}`.toLowerCase(),
    }
  })
)

const termsAndConditionOptionsMap = computed(() => new Map(termsAndConditionOptions.value.map(tc => [tc.value, tc])))

const updateSelectedObject = () => {
  selectedTermsAndConditionObject.value = selectedTermsAndCondition.value
    ? termsAndConditionOptionsMap.value.get(selectedTermsAndCondition.value) || undefined
    : undefined
}

const displayLabel = computed(() => selectedTermsAndConditionObject.value?.label || props.placeholder)

const handleSelection = (tc: any) => {
  if (tc) {
    const uuidValue = typeof tc === 'string' ? tc : tc.value
    if (uuidValue) {
      selectedTermsAndCondition.value = uuidValue
      emit('update:modelValue', uuidValue)
      emit('change', tc)
    }
  } else {
    selectedTermsAndCondition.value = undefined
    emit('update:modelValue', undefined)
  }
}

watch(() => props.modelValue, v => { selectedTermsAndCondition.value = v; updateSelectedObject() })
watch(termsAndConditionOptions, () => updateSelectedObject(), { immediate: true })
watch(selectedTermsAndCondition, () => updateSelectedObject())

const loading = computed(() => termsAndConditionsStore.loading)

if (termsAndConditionsStore.termsAndConditions.length === 0) {
  termsAndConditionsStore.fetchTermsAndConditions()
}
</script>
