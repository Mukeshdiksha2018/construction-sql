<template>
  <USelectMenu
    v-model="selectedServiceTypeObject"
    :items="serviceTypeOptions"
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
  />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useServiceTypesStore } from '~/stores/serviceTypes'

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
  placeholder: 'Select service type...',
  searchable: true,
  searchablePlaceholder: 'Type to search...',
  size: 'sm',
  className: 'w-full',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | undefined]
  'change': [serviceType: any]
}>()

const serviceTypesStore = useServiceTypesStore()
const selectedServiceType = ref<string | undefined>(props.modelValue)
const selectedServiceTypeObject = ref<any>(undefined)

const serviceTypeOptions = computed(() =>
  serviceTypesStore.getActiveServiceTypes.map(st => ({
    label: st.name,
    value: st.uuid,
    description: st.description,
    color: st.color,
    searchText: `${st.name} ${st.description || ''}`.toLowerCase(),
  }))
)

const serviceTypeOptionsMap = computed(() => new Map(serviceTypeOptions.value.map(st => [st.value, st])))

const updateSelectedObject = () => {
  selectedServiceTypeObject.value = selectedServiceType.value
    ? serviceTypeOptionsMap.value.get(selectedServiceType.value) || undefined
    : undefined
}

const handleSelection = (serviceType: any) => {
  if (serviceType) {
    const uuidValue = typeof serviceType === 'string' ? serviceType : serviceType.value
    if (uuidValue) {
      selectedServiceType.value = uuidValue
      emit('update:modelValue', uuidValue)
      emit('change', serviceType)
    }
  } else {
    selectedServiceType.value = undefined
    emit('update:modelValue', undefined)
  }
}

watch(() => props.modelValue, v => { selectedServiceType.value = v; updateSelectedObject() })
watch(serviceTypeOptions, () => updateSelectedObject(), { immediate: true })
watch(selectedServiceType, () => updateSelectedObject())

const loading = computed(() => serviceTypesStore.loading)

if (serviceTypesStore.serviceTypes.length === 0) {
  serviceTypesStore.fetchServiceTypes()
}
</script>
