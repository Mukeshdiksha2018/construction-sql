<template>
  <USelectMenu
    v-model="selectedCorporationObject"
    :items="corporationOptions"
    :filter-fields="['label', 'searchText']"
    :placeholder="placeholder"
    :searchable="searchable"
    :searchable-placeholder="searchablePlaceholder"
    :size="size"
    :class="className"
    :disabled="computedDisabled"
    :loading="corporationStore.loading"
    value-key="value"
    :ui="menuUi"
    @update:model-value="handleSelection"
  >
    <template #default>
      <div v-if="selectedCorporationObject" class="flex items-center gap-2 truncate">
        <UIcon v-if="showIcon" name="ri:building-fill" class="w-4 h-4 flex-shrink-0" />
        <span class="truncate">
          {{ selectedCorporationObject.corporation_name }}
          <template v-if="showLegalName && selectedCorporationObject.legal_name && selectedCorporationObject.legal_name.trim()">
            - ({{ selectedCorporationObject.legal_name }})
          </template>
        </span>
      </div>
      <span v-else class="text-muted">
        {{ hasAccessibleCorporations ? placeholder : 'No corporations accessible' }}
      </span>
    </template>
    <template #item-label="{ item }">
      <div class="flex items-center gap-2 w-full">
        <UIcon v-if="showIcon" name="ri:building-fill" class="w-4 h-4 text-primary flex-shrink-0" />
        <div class="flex flex-col min-w-0 flex-1">
          <span class="font-medium text-sm truncate">{{ item.corporation_name }}</span>
          <span v-if="showLegalName && item.legal_name && item.legal_name.trim()" class="text-xs text-muted truncate">{{ item.legal_name }}</span>
        </div>
      </div>
    </template>
  </USelectMenu>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useCorporationStore } from '~/stores/corporations'

interface Props {
  modelValue?: string
  placeholder?: string
  searchable?: boolean
  searchablePlaceholder?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  disabled?: boolean
  showIcon?: boolean
  showLegalName?: boolean
  ui?: any
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Search corporation...',
  searchable: true,
  searchablePlaceholder: 'Type to search corporations...',
  size: 'sm',
  className: 'w-full',
  disabled: false,
  showIcon: true,
  showLegalName: true,
})

const menuUi = computed(() => ({
  content: 'max-h-80 min-w-full w-max max-w-xl',
  ...(props.ui || {}),
}))

const emit = defineEmits<{
  'update:modelValue': [value: string | undefined]
  'change': [corporation: any]
}>()

const corporationStore = useCorporationStore()
const selectedCorporation = ref<string | undefined>(props.modelValue)
const selectedCorporationObject = ref<any>(undefined)

const hasAccessibleCorporations = computed(() => corporationStore.corporations.length > 0)
const computedDisabled = computed(() => props.disabled || !hasAccessibleCorporations.value)

const corporationOptions = computed(() =>
  corporationStore.corporations.map(corp => ({
    label: corp.legalName && corp.legalName.trim()
      ? `${corp.name} - (${corp.legalName})`
      : corp.name,
    value: corp.id,
    corporation_name: corp.name,
    legal_name: corp.legalName,
    searchText: `${corp.name} ${corp.legalName || ''} ${corp.id}`.toLowerCase(),
  }))
)

const corporationOptionsMap = computed(() => new Map(corporationOptions.value.map(c => [c.value, c])))

const updateSelectedCorporationObject = () => {
  selectedCorporationObject.value = selectedCorporation.value
    ? corporationOptionsMap.value.get(selectedCorporation.value) || undefined
    : undefined
}

const handleSelection = (corporation: any) => {
  if (!corporation) {
    selectedCorporation.value = undefined
    selectedCorporationObject.value = undefined
    emit('update:modelValue', undefined)
    emit('change', undefined)
    return
  }
  const resolvedValue = typeof corporation === 'string'
    ? corporation
    : corporation.value ?? corporation.uuid ?? corporation.id ?? undefined
  if (!resolvedValue) return
  selectedCorporation.value = resolvedValue
  const option = corporationOptionsMap.value.get(resolvedValue)
  selectedCorporationObject.value = option || (typeof corporation === 'object' ? corporation : { value: resolvedValue })
  emit('update:modelValue', resolvedValue)
  emit('change', selectedCorporationObject.value)
}

watch(() => props.modelValue, v => { selectedCorporation.value = v; updateSelectedCorporationObject() })
watch(corporationOptions, () => updateSelectedCorporationObject(), { immediate: true })
watch(selectedCorporation, () => updateSelectedCorporationObject())
</script>
