<template>
  <USelectMenu
    v-model="selectedProjectObject"
    :items="projectOptions"
    :filter-fields="['label', 'searchText']"
    :placeholder="placeholder"
    :searchable="searchable"
    :searchable-placeholder="searchablePlaceholder"
    :size="size"
    :class="className"
    :disabled="disabled || loading"
    :loading="loading"
    :ui="menuUi"
    value-key="value"
    label-key="label"
    clearable
    @update:model-value="handleSelection"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useProjectsStore } from '~/stores/projects'

interface Props {
  modelValue?: string
  placeholder?: string
  searchable?: boolean
  searchablePlaceholder?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  disabled?: boolean
  corporationUuid?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select project...',
  searchable: true,
  searchablePlaceholder: 'Type to search...',
  size: 'sm',
  className: 'w-full',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | undefined]
  'change': [project: any]
}>()

const projectsStore = useProjectsStore()
const selectedProject = ref<string | undefined>(props.modelValue)
const selectedProjectObject = ref<any>(undefined)
const loading = ref(false)

const menuUi = { content: 'max-h-60 min-w-full w-max' }

const projectOptions = computed(() => {
  const projects = projectsStore.projects || []
  return projects.map((p: any) => ({
    label: p.project_name || p.name || 'Unnamed Project',
    value: p.uuid,
    project: p,
    searchText: `${p.project_name || ''} ${p.project_number || ''} ${p.uuid}`.toLowerCase(),
  }))
})

const projectOptionsMap = computed(() => new Map(projectOptions.value.map(p => [p.value, p])))

const updateSelectedObject = () => {
  selectedProjectObject.value = selectedProject.value
    ? projectOptionsMap.value.get(selectedProject.value) || undefined
    : undefined
}

const handleSelection = (project: any) => {
  if (!project) {
    selectedProject.value = undefined
    selectedProjectObject.value = undefined
    emit('update:modelValue', undefined)
    emit('change', undefined)
    return
  }
  const value = typeof project === 'string' ? project : project.value
  if (value) {
    selectedProject.value = value
    updateSelectedObject()
    emit('update:modelValue', value)
    emit('change', projectOptionsMap.value.get(value) || project)
  }
}

watch(() => props.modelValue, v => { selectedProject.value = v; updateSelectedObject() })
watch(projectOptions, () => updateSelectedObject(), { immediate: true })

watch(() => props.corporationUuid, async v => {
  if (v) {
    loading.value = true
    try { await projectsStore.fetchProjects(v) } finally { loading.value = false }
  }
}, { immediate: true })
</script>
