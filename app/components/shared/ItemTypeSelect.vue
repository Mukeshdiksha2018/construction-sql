<template>
  <USelectMenu
    v-model="selectedItemType"
    :items="itemTypeOptions"
    :filter-fields="['label', 'description', 'searchText']"
    :placeholder="placeholder"
    :searchable="searchable"
    :searchable-placeholder="searchablePlaceholder"
    :size="size"
    :class="className"
    :disabled="disabled"
    :variant="variant"
    :ui="menuUi"
    value-key="value"
    :trailing-icon="variant ? undefined : undefined"
    @update:model-value="handleSelection"
  >
    <template #default>
      <slot name="default" :option="selectedItemTypeObject">
        <span
          class="flex-1 whitespace-normal text-left"
          :class="{ 'text-muted': !selectedItemTypeObject }"
        >
          <template v-if="selectedItemTypeObject">
            <template v-if="isAllOption(selectedItemTypeObject)">
              <span class="font-semibold text-default">{{ selectedItemTypeObject.label }}</span>
            </template>
            <template v-else>
              <span class="font-medium">{{ selectedItemTypeObject.label }}</span>
            </template>
          </template>
          <template v-else>
            {{ placeholder }}
          </template>
        </span>
      </slot>
    </template>
    <template #trailing="{ open }">
      <slot name="trailing" :open="open">
      </slot>
    </template>
    <template #item-label="{ item }">
      <div
        v-if="isAllOption(item)"
        class="rounded-md -mx-1 px-2 py-1.5 bg-amber-50 dark:bg-amber-900/25 ring-1 ring-amber-200/80 dark:ring-amber-800/50 font-semibold text-highlighted whitespace-normal text-left"
      >
        {{ item.label }}
      </div>
      <div v-else class="flex items-center justify-between w-full">
        <div class="flex items-center gap-2 flex-1">
          <span class="font-medium whitespace-normal break-words text-left">
            {{ item.label }}
          </span>
          <span v-if="item.description" class="text-xs text-muted">
            {{ item.description }}
          </span>
        </div>
      </div>
    </template>
  </USelectMenu>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useItemTypesStore } from '~/stores/itemTypes'

// Props
interface Props {
  modelValue?: string | { uuid?: string | null } | null
  placeholder?: string
  searchable?: boolean
  searchablePlaceholder?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  disabled?: boolean
  corporationUuid?: string
  projectUuid?: string
  category?: string
  itemDivisionUuid?: string
  externalItemTypes?: any[]
  ui?: any
  variant?: 'outline' | 'none' | 'ghost' | 'soft' | 'subtle'
  includeAllOption?: boolean
  allOptionLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Search item type...',
  searchable: true,
  searchablePlaceholder: 'Type to search...',
  size: 'sm',
  className: 'w-full',
  disabled: false,
  externalItemTypes: undefined,
  variant: undefined,
  includeAllOption: false,
  allOptionLabel: 'All',
})

type ItemTypeOption = {
  label: string
  value: string
  description: string
  id: string | number
  searchText: string
  isAllOption?: boolean
}

const normalizeModelValue = (value: Props['modelValue']): string | undefined => {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && typeof value.uuid === 'string') {
    return value.uuid
  }
  if (value == null) return undefined
  return String(value)
}

const isAllOption = (option: any): boolean => {
  return option?.isAllOption === true || option?.value === '__ALL__'
}

const defaultUi = computed(() => ({
  ...(props.variant ? { trigger: 'flex w-full justify-between gap-2 text-left' } : {}),
  content: 'max-h-60 min-w-full w-max',
  item: {
    base: 'whitespace-normal break-words',
    label: 'whitespace-normal break-words text-left',
  },
}))

const menuUi = computed(() => {
  const incoming = props.ui ?? {}
  const incomingItem = (incoming as any).item ?? {}
  return {
    ...defaultUi.value,
    ...incoming,
    item: {
      ...defaultUi.value.item,
      ...incomingItem,
    },
  }
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: string | undefined]
  'change': [itemType: any]
}>()

// Store
const itemTypesStore = useItemTypesStore()

// Local state
const selectedItemType = ref<string | undefined>(
  normalizeModelValue(props.modelValue),
)
const selectedItemTypeObject = ref<ItemTypeOption | undefined>(undefined)

const formatItemTypeLabel = (itemType: any) => {
  const specType = String(itemType?.spec_type ?? '').trim()
  const itemTypeName = String(itemType?.item_type ?? '').trim()
  if (specType && itemTypeName) return `${specType} - ${itemTypeName}`
  return itemTypeName || specType || ''
}

// Computed — use external list if provided, otherwise fall back to store
const itemTypeOptions = computed(() => {
  let list: any[] = []

  if (props.externalItemTypes && Array.isArray(props.externalItemTypes)) {
    list = props.externalItemTypes.filter((it: any) => it.is_active)
  }
  else {
    list = itemTypesStore.getActiveItemTypes(props.corporationUuid)
  }

  if (props.category) {
    list = list.filter((it: any) => it.category === props.category)
  }
  if (props.itemDivisionUuid) {
    list = list.filter((it: any) => it.item_division_uuid === props.itemDivisionUuid)
  }

  const mappedRaw: ItemTypeOption[] = list.map((itemType: any) => ({
    label: formatItemTypeLabel(itemType) || itemType.item_type || itemType.uuid,
    value: itemType.uuid,
    description: itemType.description || '',
    id: itemType.id,
    searchText: `${itemType.spec_type || ''} ${itemType.item_type || ''} ${itemType.description || ''} ${itemType.uuid}`.toLowerCase(),
  }))

  // Deduplicate by UUID
  const mapped: ItemTypeOption[] = Array.from(
    new Map(mappedRaw.map(opt => [opt.value, opt])).values(),
  )

  if (props.includeAllOption) {
    return [
      {
        label: props.allOptionLabel,
        value: '__ALL__',
        description: '',
        isAllOption: true,
        id: '__ALL__',
        searchText: props.allOptionLabel.toLowerCase(),
      },
      ...mapped,
    ]
  }
  return mapped
})

const itemTypeOptionsMap = computed(() => {
  const map = new Map<string | undefined, ItemTypeOption>(
    itemTypeOptions.value.map(it => [it.value, it]),
  )
  if (props.includeAllOption) {
    const allOpt = itemTypeOptions.value.find(o => o.value === '__ALL__')
    if (allOpt) map.set(undefined as any, allOpt)
  }
  return map
})

const updateSelectedObject = () => {
  if (!selectedItemType.value) {
    if (props.includeAllOption) {
      selectedItemTypeObject.value = itemTypeOptions.value.find(o => o.value === '__ALL__') ?? undefined
    }
    else {
      selectedItemTypeObject.value = undefined
    }
    return
  }

  let found = itemTypeOptionsMap.value.get(selectedItemType.value)

  // Try full store if not in filtered list
  if (!found) {
    const all = itemTypesStore.getActiveItemTypes(props.corporationUuid)
    const it = all.find((t: any) => t.uuid === selectedItemType.value)
    if (it) {
      found = {
        label: formatItemTypeLabel(it) || it.item_type || it.uuid,
        value: it.uuid,
        description: it.description || '',
        id: it.id,
        searchText: `${it.spec_type || ''} ${it.item_type || ''} ${it.description || ''} ${it.uuid}`.toLowerCase(),
      }
    }
  }

  // Try by UUID without corporation context
  if (!found && selectedItemType.value) {
    const it = itemTypesStore.getItemTypeById(selectedItemType.value)
    if (it) {
      found = {
        label: formatItemTypeLabel(it) || (it as any).item_type || (it as any).uuid,
        value: (it as any).uuid,
        description: (it as any).description || '',
        id: (it as any).id,
        searchText: `${(it as any).spec_type || ''} ${(it as any).item_type || ''} ${(it as any).description || ''} ${(it as any).uuid}`.toLowerCase(),
      }
    }
  }

  // Synthetic fallback so we never show a raw UUID
  if (!found && selectedItemType.value) {
    const v = String(selectedItemType.value)
    found = { label: v, value: v, description: '', id: v, searchText: v.toLowerCase() }
  }

  selectedItemTypeObject.value = found || undefined
}

const handleSelection = (itemType: ItemTypeOption | string | Record<string, any> | undefined) => {
  if (!itemType) {
    selectedItemType.value = undefined
    if (props.includeAllOption) updateSelectedObject()
    else selectedItemTypeObject.value = undefined
    emit('update:modelValue', undefined)
    emit('change', undefined)
    return
  }

  const asObj = typeof itemType === 'object' && itemType ? (itemType as Record<string, any>) : undefined
  const resolvedValue
    = typeof itemType === 'string'
      ? itemType
      : asObj
        ? asObj.value ?? asObj.uuid ?? asObj.id ?? undefined
        : undefined

  if (resolvedValue === '__ALL__' || asObj?.isAllOption) {
    selectedItemType.value = undefined
    updateSelectedObject()
    emit('update:modelValue', undefined)
    emit('change', undefined)
    return
  }

  if (!resolvedValue) return

  selectedItemType.value = resolvedValue
  emit('update:modelValue', resolvedValue)

  const option
    = typeof itemType === 'object' && itemType
      ? itemType
      : itemTypeOptionsMap.value.get(resolvedValue) || { value: resolvedValue }

  emit('change', option)
}

const realItemTypeOptions = computed(() =>
  itemTypeOptions.value.filter(opt => opt.value !== '__ALL__'),
)

function maybeAutoSelectSingleItemType() {
  if (props.disabled) return
  if (!props.externalItemTypes && itemTypesStore.loading) return
  if (realItemTypeOptions.value.length !== 1) return
  const only = realItemTypeOptions.value[0]
  if (!only) return
  if (selectedItemType.value === only.value) return
  if (props.modelValue != null && props.modelValue !== '') return
  handleSelection(only)
}

// Watchers
watch(() => props.modelValue, (newValue) => {
  selectedItemType.value = normalizeModelValue(newValue)
  updateSelectedObject()
})

watch(
  () => [itemTypeOptions.value, itemTypesStore.loading, itemTypesStore.itemTypes, props.disabled] as const,
  () => {
    updateSelectedObject()
    maybeAutoSelectSingleItemType()
  },
  { immediate: true },
)

watch(selectedItemType, () => {
  updateSelectedObject()
})

watch(
  () => [props.corporationUuid, props.projectUuid] as const,
  async ([corpUuid]) => {
    if (props.externalItemTypes) return
    if (typeof window === 'undefined') return
    if (itemTypesStore.loading) return

    const hasOptionsForThisCorp = itemTypeOptions.value.length > 0
    if (hasOptionsForThisCorp) return

    const hasCachedData = itemTypesStore.hasCachedData(corpUuid)
    const existingItems = itemTypesStore.getActiveItemTypes(corpUuid)
    const hasStoreData = existingItems.length > 0

    if (hasCachedData || hasStoreData) return

    try {
      await itemTypesStore.fetchItemTypes(corpUuid)
    }
    catch (error) {
      console.error('[ItemTypeSelect] Failed to fetch item types', error)
    }
  },
  { immediate: true },
)
</script>
