<template>
  <USelectMenu
    :model-value="selectedOption"
    :items="options"
    :loading="storageLocationsStore.loading"
    :disabled="disabled || storageLocationsStore.loading || !corporationUuid"
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
  >
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
import { ref, computed, watch, onMounted } from 'vue'
import { useStorageLocationsStore } from '~/stores/storageLocations'

interface Props {
  modelValue?: string
  corporationUuid?: string
  projectUuid?: string
  placeholder?: string
  searchablePlaceholder?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  disabled?: boolean
  includeAllOption?: boolean
  allOptionLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select receiving location',
  searchablePlaceholder: 'Search storage locations...',
  size: 'sm',
  className: 'w-full',
  disabled: false,
  includeAllOption: false,
  allOptionLabel: 'All Locations'
})

const emit = defineEmits<{ 'update:modelValue': [value: string | undefined], 'change': [loc: any] }>()

const storageLocationsStore = useStorageLocationsStore()

const selectedValue = ref<string | undefined>(props.modelValue)
const selectedOption = ref<any>(undefined)

// Filter storage locations by corporation and optionally by project
const filteredStorageLocations = computed(() => {
  if (!props.corporationUuid) {
    return []
  }

  let locations = storageLocationsStore.storageLocations.filter((loc: any) => {
    // Must match corporation
    if (loc.corporation_uuid !== props.corporationUuid) {
      return false
    }

    // Only show active locations
    if (loc.status !== 'active') {
      return false
    }

    // Filter by project if provided
    if (props.projectUuid) {
      // Include locations that match the project OR have no project (global locations for the corporation)
      return !loc.project_uuid || loc.project_uuid === props.projectUuid
    }

    // If no project filter, show all locations for the corporation (both with and without projects)
    return true
  })

  return locations
})

const options = computed(() => {
  const locationOptions = filteredStorageLocations.value.map((l: any) => ({
    label: l.location_name,
    value: l.uuid,
    location: l
  }))

  // Add "All" option if includeAllOption is true
  if (props.includeAllOption) {
    return [
      {
        label: props.allOptionLabel,
        value: '__ALL__',
        location: null
      },
      ...locationOptions
    ]
  }

  return locationOptions
})

const optionsMap = computed(() => {
  const map = new Map(options.value.map(o => [o.value, o]))
  // Also map undefined to "All" option if includeAllOption is true
  if (props.includeAllOption) {
    const allOption = options.value.find(opt => opt.value === '__ALL__')
    if (allOption) {
      map.set(undefined as any, allOption)
    }
  }
  return map
})

const updateSelectedObject = () => {
  if (!selectedValue.value) {
    if (props.includeAllOption) {
      selectedOption.value = options.value.find(opt => opt.value === '__ALL__') || undefined
    } else {
      selectedOption.value = undefined
    }
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
    const value = typeof payload === 'string'
      ? payload
      : (payload.value ?? payload.uuid ?? payload.id)

    if (value === '__ALL__') {
      // "All" option selected - emit undefined to indicate no specific location filter
      selectedValue.value = undefined
      selectedOption.value = options.value.find(opt => opt.value === '__ALL__') || undefined
      emit('update:modelValue', undefined)
      emit('change', undefined)
    } else if (value) {
      selectedValue.value = value
      emit('update:modelValue', value)
      const option = typeof payload === 'object' ? payload : optionsMap.value.get(value)
      emit('change', option || undefined)
    } else {
      selectedValue.value = undefined
      selectedOption.value = undefined
      emit('update:modelValue', undefined)
      emit('change', undefined)
    }
  } else {
    selectedValue.value = undefined
    selectedOption.value = undefined
    emit('update:modelValue', undefined)
    emit('change', undefined)
  }
}

// Watch for corporation and project changes to fetch storage locations
watch(
  () => props.corporationUuid,
  async (newCorpUuid) => {
    if (newCorpUuid) {
      await storageLocationsStore.fetchStorageLocations(newCorpUuid, false, true)
    }
  },
  { immediate: true }
)

watch(
  () => props.modelValue,
  (newValue) => {
    selectedValue.value = newValue
    updateSelectedObject()
  },
  { immediate: true }
)

watch(
  options,
  () => {
    updateSelectedObject()
  },
  { immediate: true }
)

watch(
  selectedValue,
  () => {
    updateSelectedObject()
  }
)

// Fetch storage locations on mount if corporation is available
onMounted(async () => {
  if (props.corporationUuid) {
    await storageLocationsStore.fetchStorageLocations(props.corporationUuid, false, true)
  }
})
</script>
