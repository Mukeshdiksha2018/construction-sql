<template>
  <USelectMenu
    :model-value="selectedOption"
    :items="options"
    :loading="store.loading"
    :disabled="disabled || store.loading"
    :placeholder="placeholder"
    :size="size"
    :class="className"
    variant="outline"
    value-key="value"
    searchable
    :searchable-placeholder="searchablePlaceholder"
    :ui="menuUi"
    @update:model-value="handleSelection"
    :trailing-icon="undefined"
    label-key="label"
  >
    <template #item-label="{ item }">
      <div
        :class="item.value === '__ALL__' || item.isAllOption
          ? 'rounded-md -mx-1 px-2 py-1.5 bg-gray-100 dark:bg-gray-700 font-semibold text-highlighted'
          : ''"
        class="whitespace-normal text-left"
      >
        {{ item.label }}
      </div>
    </template>
    <template #default>
      <span
        class="flex-1 whitespace-normal text-left"
        :class="{ 'text-muted': !selectedOption }"
      >
        {{ triggerLabel }}
      </span>
    </template>
    <template #trailing="{ open }">
      <UIcon
        name="i-heroicons-chevron-down-20-solid"
        class="transition-transform duration-200"
        :class="{ 'rotate-180': open }"
      />
    </template>
  </USelectMenu>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useLocationsStore } from '~/stores/locations'

interface Props {
  modelValue?: string
  placeholder?: string
  searchablePlaceholder?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  disabled?: boolean
  disabledValues?: string[]
  includeAllOption?: boolean
  allOptionLabel?: string
  projectUuid?: string
  locations?: any[]
  activeOnly?: boolean
  refreshFromApi?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select location',
  searchablePlaceholder: 'Search locations...',
  size: 'sm',
  className: 'w-full',
  disabled: false,
  disabledValues: () => [],
  includeAllOption: false,
  allOptionLabel: 'All',
  activeOnly: false,
  refreshFromApi: false,
})

const emit = defineEmits<{ 'update:modelValue': [value: string | undefined]; 'change': [loc: any] }>()

const store = useLocationsStore()
const selectedValue = ref<string | undefined>(props.modelValue)
const selectedOption = ref<any>(undefined)

const options = computed(() => {
  const usingProvided = Array.isArray(props.locations)
  const storeList = props.activeOnly ? (store.getActive || []) : (store.getAll || [])
  const sourceList = usingProvided ? props.locations : storeList
  const list = (sourceList as any[])
    .filter((l: any) => {
      if (usingProvided) return true
      if (!props.projectUuid) return true
      return String(l?.project_uuid || '') === String(props.projectUuid)
    })
    .slice()
    .sort((a: any, b: any) => String(a?.location_name ?? '').localeCompare(String(b?.location_name ?? ''), undefined, { sensitivity: 'base' }))
  const disabledSet = new Set((props.disabledValues || []).filter(Boolean))
  const locationOptions = list.map((l: any) => ({
    label: l.location_code ? `${l.location_name} (${l.location_code})` : l.location_name,
    value: l.uuid,
    location: l,
    disabled: disabledSet.has(l.uuid),
  }))
  if (props.includeAllOption) {
    return [
      { label: props.allOptionLabel, value: '__ALL__', location: null, isAllOption: true, disabled: false },
      ...locationOptions,
    ]
  }
  return locationOptions
})

const optionsMap = computed(() => {
  const map = new Map(options.value.map(o => [o.value, o]))
  if (props.includeAllOption) {
    const allOpt = options.value.find(o => o.value === '__ALL__')
    if (allOpt) map.set(undefined as any, allOpt)
  }
  return map
})

const updateSelectedObject = () => {
  if (!selectedValue.value) {
    selectedOption.value = props.includeAllOption
      ? options.value.find(o => o.value === '__ALL__') || undefined
      : undefined
  } else {
    selectedOption.value = optionsMap.value.get(selectedValue.value) || undefined
  }
}

const menuUi = computed(() => ({
  trigger: 'flex w-full justify-between gap-2 text-left',
  content: 'max-h-60 min-w-full w-max',
}))

const triggerLabel = computed(() => selectedOption.value?.label ?? props.placeholder)

const handleSelection = (payload: any) => {
  if (payload) {
    const value = typeof payload === 'string' ? payload : (payload.value ?? payload.uuid ?? payload.id)
    if (value === '__ALL__' || (typeof payload === 'object' && payload?.isAllOption)) {
      selectedValue.value = undefined
      updateSelectedObject()
      emit('update:modelValue', undefined)
      emit('change', undefined)
      return
    }
    if (value) {
      selectedValue.value = value
      emit('update:modelValue', value)
      const option = typeof payload === 'object' ? payload : optionsMap.value.get(value)
      emit('change', option || undefined)
    } else {
      selectedValue.value = undefined
      selectedOption.value = props.includeAllOption ? updateSelectedObject() : undefined
      emit('update:modelValue', undefined)
      emit('change', undefined)
    }
  } else {
    selectedValue.value = undefined
    if (props.includeAllOption) updateSelectedObject()
    else selectedOption.value = undefined
    emit('update:modelValue', undefined)
    emit('change', undefined)
  }
}

watch(() => props.modelValue, v => { selectedValue.value = v; updateSelectedObject() }, { immediate: true })
watch(options, () => updateSelectedObject(), { immediate: true })
watch(selectedValue, () => updateSelectedObject())

if (typeof window !== 'undefined' && !Array.isArray(props.locations)) {
  const allLocations = store.getAll || []
  if (!allLocations.length) store.fetchLocations().catch(() => {})
}
</script>
