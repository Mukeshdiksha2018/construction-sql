<template>
  <div :class="className">
    <UPopover v-if="corporationUuid" v-model:open="isPopoverOpen" :disabled="disabled">
      <UButton
        :disabled="disabled || configurationsStore.loading || !corporationUuid"
        :size="size"
        :class="className"
        variant="outline"
        :loading="configurationsStore.loading"
        class="flex items-start justify-between gap-2 min-h-0"
      >
        <span class="flex-1 text-left whitespace-normal break-words min-w-0">
          {{ selectedCostCodeLabel || (!corporationUuid ? 'Select corporation first' : placeholder) }}
        </span>
        <UIcon
          name="i-heroicons-chevron-down-20-solid"
          class="transition-transform duration-200 shrink-0 mt-0.5"
          :class="{ 'rotate-180': isPopoverOpen }"
        />
      </UButton>

      <template #content>
        <!-- min-w-max lets the panel grow to fit the longest label; cap at 32rem -->
        <div class="min-w-[18rem] max-w-[40rem] max-h-96 flex flex-col">
          <!-- Search -->
          <div class="p-2 border-b border-default">
            <UInput
              v-model="searchQuery"
              :placeholder="searchablePlaceholder"
              icon="i-heroicons-magnifying-glass"
              size="sm"
              class="w-full"
              autofocus
            />
          </div>

          <!-- Tree -->
          <div class="flex-1 overflow-auto p-2">
            <UTree
              :items="filteredTreeItems"
              :size="size"
              :get-key="(item: any) => item.id || item.label"
              :model-value="selectedCostCode"
              @select="handleTreeSelect"
            >
              <template #item-label="{ item }">
                <div
                  class="flex items-center justify-between w-full cursor-pointer"
                  :class="{ 'cursor-default': (item as any).disabled || ((item as any).children && (item as any).children.length > 0) }"
                  @click.stop="handleItemClick(item)"
                >
                  <div class="flex items-center gap-2 min-w-0 flex-1">
                    <!-- No truncate — let the popover grow to show full text -->
                    <span class="whitespace-normal break-words font-medium">{{ item.label }}</span>
                    <UBadge
                      v-if="(item as any).status"
                      :color="(item as any).status_color"
                      variant="soft"
                      size="xs"
                    >
                      {{ (item as any).status }}
                    </UBadge>
                  </div>
                </div>
              </template>
            </UTree>

            <div
              v-if="searchQuery && filteredTreeItems.length === 0"
              class="text-center py-4 text-sm text-muted"
            >
              No cost codes found matching "{{ searchQuery }}"
            </div>
          </div>
        </div>
      </template>
    </UPopover>

    <!-- Shown when no corporation is selected yet -->
    <UInput
      v-else
      :model-value="selectedCostCodeLabel"
      :disabled="disabled || configurationsStore.loading || !corporationUuid"
      :placeholder="!corporationUuid ? 'Select corporation first' : placeholder"
      :size="size"
      :class="[className, 'whitespace-normal break-words']"
      readonly
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useCostCodeConfigurationsStore } from '~/stores/costCodeConfigurations'
import type { TreeItem } from '@nuxt/ui'
import type { TreeItemSelectEvent } from 'reka-ui'

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  modelValue?: string
  placeholder?: string
  searchablePlaceholder?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  disabled?: boolean
  corporationUuid?: string
  /** Optionally inject pre-fetched configurations (skips store fetch) */
  externalConfigurations?: any[]
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Search and select cost code',
  searchablePlaceholder: 'Search cost codes...',
  size: 'sm',
  className: 'w-full',
  disabled: false,
})

// ── Emits ─────────────────────────────────────────────────────────────────────

const emit = defineEmits<{
  'update:modelValue': [value: string | undefined]
  'change': [costCode: any]
}>()

// ── Store ─────────────────────────────────────────────────────────────────────

const configurationsStore = useCostCodeConfigurationsStore()

// ── Local state ───────────────────────────────────────────────────────────────

const selectedCostCode = ref<string | undefined>(props.modelValue)
const selectedCostCodeOption = ref<any>(undefined)
const isPopoverOpen = ref(false)
const searchQuery = ref('')

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, 'error' | 'warning' | 'info' | 'success' | 'primary' | 'secondary' | 'neutral'> = {
  Active: 'success',
  Inactive: 'error',
  Draft: 'warning',
  Pending: 'warning',
  Approved: 'success',
  Rejected: 'error',
}

function getStatusColor(status: string): typeof STATUS_COLORS[string] {
  return STATUS_COLORS[status] ?? 'neutral'
}

/** Natural sort so "1.10" comes after "1.9", not before. */
function naturalSort(a: string, b: string): number {
  const re = /(\d+|[^\d]+)/g
  const aParts = a.match(re) ?? []
  const bParts = b.match(re) ?? []
  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const ap = aParts[i] ?? ''
    const bp = bParts[i] ?? ''
    const an = parseInt(ap, 10)
    const bn = parseInt(bp, 10)
    if (!Number.isNaN(an) && !Number.isNaN(bn)) {
      if (an !== bn) return an - bn
    }
    else {
      const cmp = ap.localeCompare(bp)
      if (cmp !== 0) return cmp
    }
  }
  return 0
}

// ── Active configurations ─────────────────────────────────────────────────────

const activeConfigurations = computed(() => {
  if (props.externalConfigurations && Array.isArray(props.externalConfigurations)) {
    return props.externalConfigurations.filter((c: any) => c.is_active)
  }
  if (!props.corporationUuid) return []
  return configurationsStore.getActiveConfigurations(props.corporationUuid)
})

const costCodeMap = computed(() => {
  const map = new Map<string, any>()
  activeConfigurations.value.forEach((c: any) => map.set(c.uuid, c))
  return map
})

// ── Tree builder ──────────────────────────────────────────────────────────────

function buildTree(): TreeItem[] {
  const configs = activeConfigurations.value
  const childrenMap = new Map<string, any[]>()
  const roots: any[] = []

  for (const c of configs) {
    if (!c.parent_cost_code_uuid) {
      roots.push(c)
    }
    else {
      if (!childrenMap.has(c.parent_cost_code_uuid)) childrenMap.set(c.parent_cost_code_uuid, [])
      childrenMap.get(c.parent_cost_code_uuid)!.push(c)
    }
  }

  function toTreeItem(c: any): TreeItem {
    const kids = childrenMap.get(c.uuid) ?? []
    const hasKids = kids.length > 0
    const status = c.is_active ? 'Active' : 'Inactive'
    const item: TreeItem = {
      label: `${c.cost_code_number} – ${c.cost_code_name}`,
      disabled: hasKids,         // parent nodes are not selectable
      defaultExpanded: hasKids,  // parent nodes start expanded
      costCode: c,
      status,
      status_color: getStatusColor(status),
      id: c.uuid,
    }
    if (hasKids) {
      item.children = kids
        .sort((a: any, b: any) => naturalSort(a.cost_code_number ?? '', b.cost_code_number ?? ''))
        .map(toTreeItem)
    }
    return item
  }

  return roots
    .sort((a, b) => naturalSort(a.cost_code_number ?? '', b.cost_code_number ?? ''))
    .map(toTreeItem)
}

const treeItems = computed<TreeItem[]>(() => {
  if (!props.corporationUuid || activeConfigurations.value.length === 0) return []
  return buildTree()
})

const treeItemsMap = computed(() => {
  const map = new Map<string, TreeItem>()
  function flatten(items: TreeItem[]) {
    for (const item of items) {
      if ((item as any).id) map.set((item as any).id, item)
      if (item.children) flatten(item.children)
    }
  }
  flatten(treeItems.value)
  return map
})

// ── Filtered tree (search) ────────────────────────────────────────────────────

const filteredTreeItems = computed<TreeItem[]>(() => {
  if (!searchQuery.value.trim()) return treeItems.value
  const q = searchQuery.value.toLowerCase().trim()

  function filter(items: TreeItem[]): TreeItem[] {
    return items
      .map((item) => {
        const label = (item.label ?? '').toLowerCase()
        const num = ((item as any).costCode?.cost_code_number ?? '').toLowerCase()
        const name = ((item as any).costCode?.cost_code_name ?? '').toLowerCase()
        if (label.includes(q) || num.includes(q) || name.includes(q)) return item
        if (item.children?.length) {
          const filtered = filter(item.children)
          if (filtered.length) return { ...item, children: filtered }
        }
        return null
      })
      .filter((x): x is TreeItem => x !== null)
  }

  return filter(treeItems.value)
})

// ── Selected label ────────────────────────────────────────────────────────────

const selectedCostCodeLabel = computed(() => {
  if (!selectedCostCode.value) return ''
  const c = costCodeMap.value.get(selectedCostCode.value)
  return c ? `${c.cost_code_number} – ${c.cost_code_name}` : ''
})

// ── Selection handlers ────────────────────────────────────────────────────────

function selectCostCode(config: any) {
  const uuid = config.uuid
  selectedCostCode.value = uuid
  selectedCostCodeOption.value = {
    label: `${config.cost_code_number} – ${config.cost_code_name}`,
    value: uuid,
    costCode: config,
    status: config.is_active ? 'Active' : 'Inactive',
    status_color: getStatusColor(config.is_active ? 'Active' : 'Inactive'),
  }
  emit('update:modelValue', uuid)
  emit('change', selectedCostCodeOption.value)
  isPopoverOpen.value = false
}

function handleItemClick(item: TreeItem) {
  if ((item as any).disabled || item.children?.length) return
  const config = (item as any).costCode
  if (config?.uuid) selectCostCode(config)
}

function handleTreeSelect(e: TreeItemSelectEvent<TreeItem>, item: TreeItem) {
  if ((item as any).disabled || item.children?.length) {
    e.preventDefault()
    return
  }
  const config = (item as any).costCode
  if (config?.uuid) {
    e.preventDefault()
    selectCostCode(config)
  }
}

// ── Data loading ──────────────────────────────────────────────────────────────

async function ensureData(uuid?: string) {
  if (!uuid || props.externalConfigurations) return
  try {
    await configurationsStore.fetchConfigurations(uuid)
  }
  catch { /* handled inside store */ }
}

onMounted(() => ensureData(props.corporationUuid))

watch(() => props.corporationUuid, (v) => ensureData(v))

// ── Sync modelValue ───────────────────────────────────────────────────────────

watch(() => props.modelValue, (v) => {
  if (selectedCostCode.value === v) return
  selectedCostCode.value = v
  if (!v) {
    selectedCostCodeOption.value = undefined
    return
  }
  const c = costCodeMap.value.get(v)
  if (c) {
    selectedCostCodeOption.value = {
      label: `${c.cost_code_number} – ${c.cost_code_name}`,
      value: c.uuid,
      costCode: c,
      status: c.is_active ? 'Active' : 'Inactive',
      status_color: getStatusColor(c.is_active ? 'Active' : 'Inactive'),
    }
  }
}, { immediate: true })

// Sync selected option when tree items are (re)built
watch(treeItems, () => {
  if (!selectedCostCode.value) return
  const item = treeItemsMap.value.get(selectedCostCode.value)
  if (item) {
    selectedCostCodeOption.value = {
      label: item.label,
      value: (item as any).costCode?.uuid,
      costCode: (item as any).costCode,
      status: (item as any).status,
      status_color: (item as any).status_color,
    }
  }
}, { immediate: true })

// Clear search when popover closes
watch(isPopoverOpen, (open) => {
  if (!open) searchQuery.value = ''
  if (open && props.disabled) isPopoverOpen.value = false
})
</script>
