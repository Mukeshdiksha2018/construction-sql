<template>
  <USelectMenu
    v-model="selectedProjectTypeObject"
    :items="projectTypeOptions"
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
import { useProjectTypesStore } from '~/stores/projectTypes'

interface Props {
  modelValue?: string
  projectTypes?: Array<{ uuid: string; name: string; description?: string | null; color?: string | null }>
  projectTypesLoading?: boolean
  placeholder?: string
  searchable?: boolean
  searchablePlaceholder?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  projectTypes: () => [],
  projectTypesLoading: false,
  placeholder: 'Select project type...',
  searchable: true,
  searchablePlaceholder: 'Type to search...',
  size: 'sm',
  className: 'w-full',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | undefined]
  'change': [projectType: any]
}>()

const projectTypesStore = useProjectTypesStore()
const selectedProjectType = ref<string | undefined>(props.modelValue)
const selectedProjectTypeObject = ref<any>(undefined)

const projectTypeOptions = computed(() => {
  const hasInjected = Array.isArray(props.projectTypes) && props.projectTypes.length > 0
  const activeProjectTypes = hasInjected ? props.projectTypes : projectTypesStore.getActiveProjectTypes
  return activeProjectTypes.map(pt => ({
    label: pt.name,
    value: pt.uuid,
    description: pt.description,
    color: pt.color,
    searchText: `${pt.name} ${pt.description || ''}`.toLowerCase(),
  }))
})

const projectTypeOptionsMap = computed(() => new Map(projectTypeOptions.value.map(pt => [pt.value, pt])))

const updateSelectedObject = () => {
  selectedProjectTypeObject.value = selectedProjectType.value
    ? projectTypeOptionsMap.value.get(selectedProjectType.value) || undefined
    : undefined
}

const handleSelection = (projectType: any) => {
  if (projectType) {
    const uuidValue = typeof projectType === 'string' ? projectType : projectType.value
    if (uuidValue) {
      selectedProjectType.value = uuidValue
      emit('update:modelValue', uuidValue)
      emit('change', projectType)
    }
  } else {
    selectedProjectType.value = undefined
    emit('update:modelValue', undefined)
  }
}

watch(() => props.modelValue, v => { selectedProjectType.value = v; updateSelectedObject() })
watch(projectTypeOptions, () => updateSelectedObject(), { immediate: true })
watch(selectedProjectType, () => updateSelectedObject())

const loading = computed(() => (props.projectTypesLoading ? true : projectTypesStore.loading))

if ((!props.projectTypes || props.projectTypes.length === 0) && projectTypesStore.projectTypes.length === 0) {
  projectTypesStore.fetchProjectTypes()
}
</script>
