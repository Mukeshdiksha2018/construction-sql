<template>
  <USelectMenu
    v-model="selectedSequenceValue"
    :items="sequenceOptions"
    :filter-fields="['label', 'short_name', 'searchText']"
    :placeholder="placeholder"
    :searchable="searchable"
    :searchable-placeholder="searchablePlaceholder"
    :size="size"
    :class="className"
    :disabled="disabled"
    variant="outline"
    :ui="menuUi"
    value-key="value"
    :trailing-icon="undefined"
    @update:model-value="handleSelection"
  >
    <template #default>
      <span
        class="flex-1 whitespace-normal text-left"
        :class="{ 'text-muted': !currentOption }"
      >
        {{ displayTriggerLabel }}
      </span>
    </template>
    <template #trailing="{ open }">
      <UIcon
        name="i-heroicons-chevron-down-20-solid"
        class="transition-transform duration-200"
        :class="{ 'rotate-180': open }"
      />
    </template>
    <template #item-label="{ item }">
      <div class="flex min-w-0 flex-col text-left">
        <span class="font-medium text-default truncate">
          {{ item.label }}
        </span>
        <span
          v-if="item.subtitle"
          class="text-[11px] text-muted uppercase tracking-wide truncate"
        >
          {{ item.subtitle }}
        </span>
      </div>
    </template>
  </USelectMenu>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useCostCodeConfigurationsStore } from '~/stores/costCodeConfigurations'
import { useEstimateCreationStore } from '~/stores/estimateCreation'

interface SequenceOption {
  label: string
  value: string
  subtitle?: string
  raw?: any
  searchText?: string
}

interface ExternalItemOption {
  label?: string
  value?: string
  item_name?: string
  uuid?: string
  short_name?: string
  description?: string
  unit?: string
  unit_price?: number | string | null
  item_sequence?: string
  sequence?: string
  [key: string]: any
}

const props = withDefaults(defineProps<{
  modelValue?: string
  placeholder?: string
  searchable?: boolean
  searchablePlaceholder?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  disabled?: boolean
  corporationUuid?: string
  projectUuid?: string
  costCodeUuid?: string
  itemTypeUuid?: string
  category?: string
  itemDivisionUuid?: string
  items?: ExternalItemOption[]
  ui?: any
  useEstimateCreationStore?: boolean
  excludeItemUuids?: string[]
}>(), {
  placeholder: 'Select sequence',
  searchable: true,
  searchablePlaceholder: 'Search sequences...',
  size: 'sm',
  className: 'w-full',
  disabled: false,
  items: () => [],
  useEstimateCreationStore: false,
  excludeItemUuids: () => [],
})

const emit = defineEmits<{
  'update:modelValue': [value: string | undefined]
  change: [payload: { value: string | undefined; option?: SequenceOption }]
}>()

const configurationsStore = useCostCodeConfigurationsStore()
const estimateCreationStore = useEstimateCreationStore()

const selectedSequenceValue = ref<string | undefined>(
  props.modelValue != null && String(props.modelValue).trim() !== ''
    ? String(props.modelValue).trim()
    : undefined,
)
const fetchedConfig = ref<CostCodeConfigurationLike | null>(null)
const fetchingConfig = ref(false)

const defaultUi = {
  trigger: 'flex w-full justify-between gap-2 text-left',
  content: 'max-h-60 min-w-full w-max',
}

const menuUi = computed(() => ({
  ...defaultUi,
  ...(props.ui ?? {}),
}))

const providedItems = computed<ExternalItemOption[]>(() =>
  Array.isArray(props.items) ? props.items : [],
)

const selectOptionIdentity = (item: Record<string, any>): string => {
  const iu = item.item_uuid
  if (iu != null && String(iu).trim() !== '') return String(iu).trim()
  const val = item.value
  if (val != null && String(val).trim() !== '') return String(val).trim()
  const u = item.uuid
  if (u != null && String(u).trim() !== '') return String(u).trim()
  return ''
}

type CostCodeConfigurationLike = {
  preferred_items?: ExternalItemOption[]
  uuid?: string
  cost_code_number?: string
  cost_code_name?: string
}

const storeItems = computed<ExternalItemOption[]>(() => {
  if (!props.corporationUuid) return []

  if (props.useEstimateCreationStore) {
    const activeConfigs = estimateCreationStore.getActiveConfigurations || []
    const allItems: ExternalItemOption[] = []
    if (Array.isArray(activeConfigs)) {
      activeConfigs.forEach((config: any) => {
        if (Array.isArray(config.preferred_items) && config.preferred_items.length > 0) {
          config.preferred_items.forEach((item: any) => {
            if (
              (!props.projectUuid || item.project_uuid === props.projectUuid)
              && (item.status === 'Active' || item.status === undefined || item.status === null)
            ) {
              allItems.push({
                ...item,
                cost_code_configuration_uuid: config.uuid,
                cost_code_number: config.cost_code_number,
                cost_code_name: config.cost_code_name,
              })
            }
          })
        }
      })
    }
    return allItems
  }

  const allConfigs = configurationsStore.getConfigurationsByCorporation(props.corporationUuid) || []
  const globalAllItems: ExternalItemOption[] = []
  allConfigs.forEach((config: any) => {
    if (Array.isArray(config.preferred_items) && config.preferred_items.length > 0) {
      config.preferred_items.forEach((item: any) => {
        if (
          (!props.projectUuid || item.project_uuid === props.projectUuid)
          && (item.status === 'Active' || item.status === undefined || item.status === null)
        ) {
          globalAllItems.push({
            ...item,
            cost_code_configuration_uuid: config.uuid,
            cost_code_number: config.cost_code_number,
            cost_code_name: config.cost_code_name,
          })
        }
      })
    }
  })
  return globalAllItems
})

const sequenceOptions = computed<SequenceOption[]>(() => {
  const providedItemsMap = new Map<string, any>()
  providedItems.value.forEach((item: any) => {
    const key = selectOptionIdentity(item)
    if (key) providedItemsMap.set(key, item)
  })

  const excludedUuidsSet = new Set(
    (props.excludeItemUuids || []).map((uuid: string) => String(uuid).toLowerCase()),
  )

  const filteredProvidedItems = providedItems.value.filter((item: any) => {
    const key = selectOptionIdentity(item)
    const keyLower = key.toLowerCase()
    const isCurrentValue = props.modelValue && String(props.modelValue).trim().toLowerCase() === keyLower
    return !excludedUuidsSet.has(keyLower) || isCurrentValue
  })

  const mergedItems: ExternalItemOption[] = [...filteredProvidedItems]
  storeItems.value.forEach((item: any) => {
    const key = selectOptionIdentity(item)
    const keyLower = key.toLowerCase()
    const isCurrentValue = props.modelValue && String(props.modelValue).trim().toLowerCase() === keyLower
    if (key && !providedItemsMap.has(key) && (!excludedUuidsSet.has(keyLower) || isCurrentValue)) {
      mergedItems.push(item)
    }
  })

  const filteredSource = mergedItems.filter((item) => {
    if (item.is_active === false) return false

    if (props.itemTypeUuid) {
      const itemItemTypeUuid = (item as any).item_type_uuid
      if (!itemItemTypeUuid) return false
      if (String(itemItemTypeUuid).toLowerCase() !== String(props.itemTypeUuid).toLowerCase()) return false
    }

    if (props.category) {
      const itemCat = (item as any).item_category ?? (item as any).category
      if (itemCat != null && itemCat !== '' && String(itemCat) !== String(props.category)) return false
    }
    if (props.itemDivisionUuid) {
      const itemDiv = (item as any).item_division_uuid
      if (itemDiv != null && itemDiv !== '' && String(itemDiv).toLowerCase() !== String(props.itemDivisionUuid).toLowerCase()) return false
    }

    if (props.projectUuid) {
      const itemProjectUuid = item.project_uuid
      if (itemProjectUuid && itemProjectUuid !== props.projectUuid) return false
    }

    return true
  })

  const normalized = filteredSource
    .map((item) => {
      const seqRaw = item.item_sequence || item.sequence
      const seq = seqRaw != null && String(seqRaw).trim() !== '' ? String(seqRaw).trim() : ''
      const identity = selectOptionIdentity(item)
      if (!identity) return null

      const value = String(identity)
      const displayName = (item.item_name || item.name || '').trim()
      const label = seq || displayName || value

      const costCodeNumber = (item as any).cost_code_number
      const costCodeName = (item as any).cost_code_name
      const subtitleParts: string[] = []
      if (displayName) subtitleParts.push(displayName)
      if (costCodeNumber || costCodeName) {
        subtitleParts.push([costCodeNumber, costCodeName].filter(Boolean).join(' • '))
      }
      const subtitle = subtitleParts.length > 0 ? subtitleParts.join(' • ') : undefined

      return {
        label,
        value,
        subtitle,
        raw: item,
        searchText: `${label} ${subtitle || ''}`.toLowerCase(),
      } as SequenceOption & { searchText: string }
    })
    .filter((o): o is SequenceOption & { searchText: string } => o !== null)

  const seen = new Set<string>()
  const unique: SequenceOption[] = []
  normalized.forEach((option) => {
    if (!seen.has(option.value)) {
      seen.add(option.value)
      unique.push(option)
    }
  })
  return unique
})

const optionsMap = computed(() =>
  new Map<string, SequenceOption>(sequenceOptions.value.map(option => [option.value, option])),
)

const resolveOption = (value?: string) => (value ? optionsMap.value.get(value) : undefined)
const normalizeSelection = (payload?: string | SequenceOption) => {
  if (typeof payload === 'string') return { value: payload, option: resolveOption(payload) }
  const value = payload?.value
  return { value, option: value ? resolveOption(value) ?? payload : payload }
}

const currentOption = computed(() => resolveOption(selectedSequenceValue.value))
const triggerLabel = computed(() => currentOption.value?.label ?? props.placeholder)
const displayTriggerLabel = computed(() => {
  const label = triggerLabel.value ?? ''
  if (!currentOption.value || label.length <= 25) return label
  return `${label.slice(0, 25).trimEnd()}...`
})

const handleSelection = (payload?: string | SequenceOption) => {
  const { value, option } = normalizeSelection(payload)
  selectedSequenceValue.value = value
  emit('update:modelValue', value)
  emit('change', { value, option })
}

watch(
  () => props.modelValue,
  (newValue) => {
    selectedSequenceValue.value
      = newValue != null && String(newValue).trim() !== ''
        ? String(newValue).trim()
        : undefined
  },
)

watch(
  sequenceOptions,
  () => {
    if (!selectedSequenceValue.value) return
    if (sequenceOptions.value.length === 0) return
    const cur = selectedSequenceValue.value
    if (cur && optionsMap.value.has(cur)) return

    nextTick(() => {
      const v = selectedSequenceValue.value
      if (v && sequenceOptions.value.length > 0 && !optionsMap.value.has(v)) {
        selectedSequenceValue.value = undefined
        emit('update:modelValue', undefined)
        emit('change', { value: undefined, option: undefined })
      }
    })
  },
  { immediate: true },
)

const fetchConfigurationFromAPI = async (costCodeUuid: string, corporationUuid: string) => {
  if (fetchingConfig.value) return
  try {
    fetchingConfig.value = true
    const response: any = await $fetch('/api/cost-code-configurations', {
      query: { corporation_uuid: corporationUuid },
    })
    const data = response?.data || response || []
    const config = Array.isArray(data) ? data.find((c: any) => c.uuid === costCodeUuid) : null
    if (config) {
      fetchedConfig.value = {
        ...config,
        preferred_items: config.preferred_items || config.cost_code_preferred_items || [],
      } as CostCodeConfigurationLike
    }
    else {
      fetchedConfig.value = null
    }
  }
  catch (err: any) {
    console.error('[SequenceSelect] Error fetching configuration from API:', err)
    fetchedConfig.value = null
  }
  finally {
    fetchingConfig.value = false
  }
}

watch(
  () => [props.costCodeUuid, props.corporationUuid],
  ([costCodeUuid, corporationUuid]) => {
    if (typeof window === 'undefined') return
    if (!costCodeUuid || !corporationUuid) { fetchedConfig.value = null; return }
    if (props.useEstimateCreationStore) { fetchedConfig.value = null; return }

    const getById = configurationsStore.getConfigurationById
    const config = typeof getById === 'function'
      ? (getById(costCodeUuid) as CostCodeConfigurationLike | undefined)
      : undefined

    if (!config || !Array.isArray(config.preferred_items) || config.preferred_items.length === 0) {
      fetchConfigurationFromAPI(costCodeUuid, corporationUuid)
    }
    else {
      fetchedConfig.value = null
    }
  },
  { immediate: true, deep: true },
)

watch(
  () => props.corporationUuid,
  (newUuid) => {
    if (typeof window === 'undefined') return
    if (!newUuid || props.useEstimateCreationStore) return
    if (configurationsStore.loading) return
    const hasData = configurationsStore.getConfigurationCountByCorporation(newUuid) > 0
    if (!hasData) configurationsStore.fetchConfigurations(newUuid)
  },
  { immediate: true },
)
</script>
