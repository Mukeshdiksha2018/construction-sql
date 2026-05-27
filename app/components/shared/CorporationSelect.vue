<template>
  <USelectMenu
    v-model="selectedOption"
    :items="selectItems"
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
      <div v-if="selectedOption" class="flex items-center gap-2 truncate">
        <UIcon v-if="showIcon" name="i-heroicons-building-office-2" class="w-4 h-4 flex-shrink-0" />
        <span class="truncate">{{ selectedOption.label }}</span>
      </div>
      <span v-else class="text-muted">
        {{ hasCorporations ? placeholder : 'No corporations available' }}
      </span>
    </template>

    <template #item-label="{ item }">
      <div class="flex items-center gap-2 w-full min-w-0">
        <UIcon v-if="showIcon" name="i-heroicons-building-office-2" class="w-4 h-4 text-primary flex-shrink-0" />
        <div class="flex flex-col min-w-0 flex-1">
          <span class="font-medium text-sm truncate">{{ item.name }}</span>
          <span
            v-if="showLegalName && item.legalName && item.legalName !== item.name"
            class="text-xs text-muted truncate"
          >
            {{ item.legalName }}
          </span>
        </div>
      </div>
    </template>
  </USelectMenu>
</template>

<script setup lang="ts">
import type { Corporation } from '~/stores/corporations'

interface CorporationSelectItem {
  label: string
  value: string
  name: string
  legalName: string
  searchText: string
}

interface Props {
  modelValue?: string | null
  placeholder?: string
  searchable?: boolean
  searchablePlaceholder?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  disabled?: boolean
  showIcon?: boolean
  showLegalName?: boolean
  ui?: Record<string, unknown>
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select corporation',
  searchable: true,
  searchablePlaceholder: 'Search corporations...',
  size: 'sm',
  className: 'w-full',
  disabled: false,
  showIcon: true,
  showLegalName: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
  'change': [corporation: Corporation | null]
}>()

const corporationStore = useCorporationStore()

const menuUi = computed(() => ({
  content: 'max-h-80 min-w-full w-max max-w-xl',
  ...(props.ui || {}),
}))

const selectedOption = ref<CorporationSelectItem | undefined>(undefined)

const selectItems = computed<CorporationSelectItem[]>(() =>
  corporationStore.corporations.map((corp) => {
    const hasDistinctLegal = corp.legalName && corp.legalName !== corp.name
    return {
      label: hasDistinctLegal ? `${corp.name} (${corp.legalName})` : corp.name,
      value: corp.id,
      name: corp.name,
      legalName: corp.legalName,
      searchText: `${corp.name} ${corp.legalName} ${corp.id}`.toLowerCase(),
    }
  }),
)

const selectItemsByValue = computed(
  () => new Map(selectItems.value.map(item => [item.value, item])),
)

const hasCorporations = computed(() => corporationStore.hasCorporations)

const computedDisabled = computed(
  () => props.disabled || corporationStore.loading || !hasCorporations.value,
)

function handleSelection(option: CorporationSelectItem | string | null | undefined) {
  if (!option) {
    selectedOption.value = undefined
    emit('update:modelValue', null)
    emit('change', null)
    corporationStore.setSelectedCorporation(null)
    return
  }

  const value = typeof option === 'string' ? option : option.value
  const resolved = selectItemsByValue.value.get(value)

  if (!resolved) return

  selectedOption.value = resolved
  emit('update:modelValue', value)
  corporationStore.setSelectedCorporation(value)
  emit('change', corporationStore.corporations.find(c => c.id === value) ?? null)
}

function syncFromModelValue(value?: string | null) {
  if (!value) {
    selectedOption.value = undefined
    return
  }
  selectedOption.value = selectItemsByValue.value.get(value)
}

watch(() => props.modelValue, (value) => {
  syncFromModelValue(value)
  if (value) {
    corporationStore.setSelectedCorporation(value)
  }
}, { immediate: true })

watch(selectItems, () => {
  syncFromModelValue(props.modelValue)
}, { immediate: true })
</script>
