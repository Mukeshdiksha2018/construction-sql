<template>
  <UModal v-model:open="isOpen" :title="title" description="Select items to import from item master" fullscreen>
    <template #header>
      <div class="flex items-center gap-2">
        <UButton
          icon="i-heroicons-check-circle"
          color="primary"
          variant="soft"
          size="sm"
          @click="handleSelectAll"
        >
          Select All
        </UButton>
        <UButton
          icon="i-heroicons-x-circle"
          color="error"
          variant="soft"
          size="sm"
          @click="handleDeselectAll"
        >
          Deselect All
        </UButton>
      </div>
    </template>

    <template #body>
      <div v-if="items.length === 0" class="px-4 py-8 text-center text-muted">
        <p class="text-sm">No preferred items available to import.</p>
        <p class="text-xs mt-2">Please make sure preferred items are configured for the selected project or corporation.</p>
      </div>

      <div v-else class="overflow-auto" style="height: calc(100vh - 200px); min-height: 500px;">
        <!-- Items Table - Show all items in a flat list -->
        <div class="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
              All Active Items
            </h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {{ filteredItems.length }} item{{ filteredItems.length !== 1 ? 's' : '' }} available
            </p>
          </div>
        </div>
        
        <UTable
          :data="filteredItems"
          :columns="tableColumns"
        />
      </div>
    </template>

    <template #footer>
      <div class="flex items-center justify-between w-full">
        <div class="text-sm text-muted">
          {{ selectedItems.size }} of {{ items.length }} items selected
        </div>
        <div class="flex items-center gap-2">
          <UButton
            color="neutral"
            variant="outline"
            @click="handleCancel"
          >
            Cancel
          </UButton>
          <UButton
            color="primary"
            :disabled="selectedItems.size === 0"
            @click="handleConfirm"
          >
            Import {{ selectedItems.size }} Item{{ selectedItems.size !== 1 ? 's' : '' }}
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'

const UCheckbox = resolveComponent('UCheckbox')
const UPopover = resolveComponent('UPopover')

interface MasterItem {
  id?: string
  uuid?: string
  item_uuid?: string // New field for preferred items
  cost_code_uuid?: string
  cost_code_label?: string
  cost_code_number?: string // New field for preferred items
  cost_code_name?: string
  cost_code_description?: string
  cost_code?: string
  item_type_label?: string
  item_type_name?: string // New field for preferred items
  item_type?: string
  item_label?: string
  item_name?: string
  item_description?: string
  description?: string
  po_description?: string
  po_unit_price?: number
  unit_price?: number
  uom?: string
  unit_label?: string // New field for preferred items
  unit?: string // New field for preferred items
  po_quantity?: number
  quantity?: number
  sequence?: string // New field for preferred items
  item_sequence?: string // New field for preferred items
  seq?: string
  display_metadata?: {
    cost_code_uuid?: string
    cost_code_label?: string
    cost_code_number?: string
    cost_code_name?: string
    item_label?: string
    item_name?: string
    item_description?: string
    po_description?: string
    [key: string]: any
  }
  metadata?: {
    cost_code_uuid?: string
    [key: string]: any
  }
  [key: string]: any
}

interface Props {
  open?: boolean
  items?: MasterItem[]
  title?: string
  preselectedItems?: MasterItem[]
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'confirm', selectedItems: MasterItem[]): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  items: () => [],
  title: 'Select Items to Import from Master',
  preselectedItems: () => []
})

const emit = defineEmits<Emits>()

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

const selectedItems = ref<Set<string>>(new Set())

// Helper to get a unique ID for each item
const getItemId = (item: MasterItem, index: number): string => {
  // Use item_uuid first, then other ID fields, fallback to index
  return item.item_uuid || item.uuid || item.id || `master-item-${index}`
}

// Helper to get cost code label from item (for display in table)
const getCostCodeLabel = (item: MasterItem): string => {
  const display = item.display_metadata || {}
  const costCodeLabel = display.cost_code_label || item.cost_code_label
  const costCodeNumber = display.cost_code_number || item.cost_code_number
  const costCodeName = display.cost_code_name || item.cost_code_name
  
  if (costCodeLabel) return costCodeLabel
  if (costCodeNumber || costCodeName) {
    return [costCodeNumber, costCodeName]
      .filter((segment: string | undefined) => String(segment || '').trim().length > 0)
      .join(' ')
      .trim()
  }
  return item.cost_code_description || item.cost_code || 'Unknown Cost Code'
}

// Show all items in a flat list (no cost code filtering)
const filteredItems = computed(() => {
  return props.items
})

// Select items when modal opens
watch(() => props.open, (newValue) => {
  if (newValue && props.items.length > 0) {
    if (props.preselectedItems && props.preselectedItems.length > 0) {
      const itemIds = props.items
        .map((item, index) => {
          const itemId = getItemId(item, index);
          const matches = props.preselectedItems.some((preselected) => {
            const preselectedId = preselected.item_uuid || preselected.id || preselected.uuid;
            const currentId = item.item_uuid || item.id || item.uuid;
            return preselectedId && currentId && preselectedId === currentId;
          });
          return matches ? itemId : null;
        })
        .filter((id): id is string => id !== null);
      
      selectedItems.value = new Set(itemIds);
    } else {
      // Start with empty selection - user must select items manually
      selectedItems.value = new Set();
    }
  }
}, { immediate: true })


// Check if all items are selected
const allSelected = computed(() => {
  return props.items.length > 0 && selectedItems.value.size === props.items.length
})

const formatCurrency = (value: number | string | null | undefined): string => {
  const num = typeof value === 'string' ? parseFloat(value) : (value || 0)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

const formatNumber = (value: number | string | null | undefined): string => {
  const num = typeof value === 'string' ? parseFloat(value) : (value || 0)
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

const calculateItemTotal = (item: MasterItem): number => {
  const unitPrice = item.po_unit_price || item.unit_price || 0
  const quantity = item.po_quantity || item.quantity || 0
  return unitPrice * quantity
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const stripHtml = (value: string) =>
  value
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const getDescriptionHtml = (value: unknown) => {
  const raw = String(value || '').trim()
  if (!raw) return '<p>-</p>'
  const looksLikeHtml = /<[a-z][\s\S]*>/i.test(raw)
  if (looksLikeHtml) return raw
  return `<p>${escapeHtml(raw)}</p>`
}

const shouldShowReadMore = (value: unknown) => stripHtml(String(value || '')).length > 120

const handleToggleItem = (itemId: string, selected: boolean) => {
  if (selected) {
    selectedItems.value.add(itemId)
  } else {
    selectedItems.value.delete(itemId)
  }
}

const handleToggleAll = (selected: boolean) => {
  if (selected) {
    handleSelectAll()
  } else {
    handleDeselectAll()
  }
}

const handleSelectAll = () => {
  selectedItems.value = new Set(props.items.map((item, index) => getItemId(item, index)))
}

const handleDeselectAll = () => {
  selectedItems.value = new Set()
}

const handleConfirm = () => {
  const selected = props.items.filter((item, index) => 
    selectedItems.value.has(getItemId(item, index))
  )
  emit('confirm', selected)
  isOpen.value = false
}

const handleCancel = () => {
  emit('cancel')
  isOpen.value = false
}

// Table columns configuration
const tableColumns = computed<TableColumn<MasterItem>[]>(() => [
  {
    accessorKey: 'checkbox',
    header: () => h(UCheckbox, {
      modelValue: allSelected.value,
      'onUpdate:modelValue': handleToggleAll,
    }),
    enableSorting: false,
    meta: { class: { th: 'w-16 px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted', td: 'px-4 py-3 align-middle' } },
    cell: ({ row }: { row: { original: MasterItem; index: number } }) => {
      const item = row.original
      // Find the item in the full items array to get the correct index
      const fullIndex = props.items.findIndex(i => {
        const itemId = getItemId(item, row.index)
        const fullItemId = getItemId(i, props.items.indexOf(i))
        return itemId === fullItemId
      })
      const itemId = getItemId(item, fullIndex >= 0 ? fullIndex : row.index)
      return h(UCheckbox, {
        modelValue: selectedItems.value.has(itemId),
        'onUpdate:modelValue': (value: boolean) => handleToggleItem(itemId, value),
      })
    }
  },
  {
    accessorKey: 'cost_code',
    header: 'Cost Code',
    enableSorting: false,
    meta: { class: { th: 'w-32 px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted', td: 'px-4 py-3 align-middle' } },
    cell: ({ row }: { row: { original: MasterItem; index: number } }) => {
      const item = row.original
      const displayText = getCostCodeLabel(item)
      return h('div', { class: 'text-xs font-medium truncate' }, displayText)
    }
  },
  {
    accessorKey: 'sequence',
    header: 'Sequence',
    enableSorting: false,
    meta: { class: { th: 'w-24 px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted', td: 'px-4 py-3 align-middle' } },
    cell: ({ row }: { row: { original: MasterItem } }) => {
      const item = row.original
      return h('div', { class: 'text-xs truncate' },
        item.sequence || item.seq || item.item_sequence || '-'
      )
    }
  },
  {
    accessorKey: 'item',
    header: 'Item',
    enableSorting: false,
    meta: { class: { th: 'w-48 px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted', td: 'px-4 py-3 align-middle' } },
    cell: ({ row }: { row: { original: MasterItem } }) => {
      const item = row.original
      // For master items from cost_code_preferred_items API: use item_name directly
      // This is the source of truth from the database
      let itemName = ''
      if (item.item_name) {
        // Primary: use item_name from cost_code_preferred_items
        itemName = item.item_name
      } else if (item.name && item.name !== item.description && item.name !== item.po_description) {
        // Fallback: use name if it's not the same as description
        itemName = item.name
      }
      const displayValue = itemName || '-'
      return h('div', { class: 'text-xs font-medium truncate' }, displayValue)
    }
  },
  {
    accessorKey: 'description',
    header: 'Description',
    enableSorting: false,
    meta: { class: { th: 'w-48 px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted', td: 'px-4 py-3 align-middle' } },
    cell: ({ row }: { row: { original: MasterItem } }) => {
      const item = row.original
      // For master items from cost_code_preferred_items API: use description directly
      // This is the source of truth from the database
      let description = ''
      if (item.description) {
        // Primary: use description from cost_code_preferred_items
        description = item.description
      } else if (item.item_description) {
        // Fallback: use item_description if description is not available
        description = item.item_description
      } else if (item.po_description && item.po_description !== item.item_name && item.po_description !== item.name) {
        // Fallback: use po_description if it's not the same as item name
        description = item.po_description
      }
      const html = getDescriptionHtml(description)
      return h('div', { class: 'space-y-1 text-xs text-muted' }, [
        h('div', {
          class: 'prose prose-xs dark:prose-invert max-w-none line-clamp-2 [&_p]:my-0 [&_ul]:my-0 [&_ol]:my-0',
          innerHTML: html,
        }),
        shouldShowReadMore(description)
          ? h(UPopover as any, {
              mode: 'hover',
              openDelay: 120,
              closeDelay: 100,
              content: { side: 'top', align: 'start' },
              ui: { content: 'max-w-md p-3 bg-white dark:bg-gray-900 border border-info/20' },
            }, {
              default: () => h('button', { type: 'button', class: 'text-info text-xs underline underline-offset-2' }, 'Read more...'),
              content: () => h('div', {
                class: 'prose prose-xs dark:prose-invert max-w-none text-xs text-muted',
                innerHTML: html,
              }),
            })
          : null,
      ])
    }
  },
  {
    accessorKey: 'unit_price',
    header: 'Unit Price',
    enableSorting: false,
    meta: { class: { th: 'w-32 px-4 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-muted', td: 'px-4 py-3 align-middle text-right' } },
    cell: ({ row }: { row: { original: MasterItem } }) => {
      const item = row.original
      return h('div', { class: 'text-xs font-mono' },
        formatCurrency(item.po_unit_price || item.unit_price || 0)
      )
    }
  },
  {
    accessorKey: 'uom',
    header: 'UOM',
    enableSorting: false,
    meta: { class: { th: 'w-24 px-4 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-muted', td: 'px-4 py-3 align-middle text-right' } },
    cell: ({ row }: { row: { original: MasterItem } }) => {
      const item = row.original
      return h('div', { class: 'text-xs' },
        item.uom || item.unit_label || item.unit || '-'
      )
    }
  },
  {
    accessorKey: 'total',
    header: 'Total',
    enableSorting: false,
    meta: { class: { th: 'w-32 px-4 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-muted', td: 'px-4 py-3 align-middle text-right' } },
    cell: ({ row }: { row: { original: MasterItem } }) => {
      const item = row.original
      const unitPrice = item.po_unit_price || item.unit_price || 0
      const quantity = item.po_quantity || item.quantity || 0
      const total = unitPrice * quantity
      return h('div', { class: 'text-xs font-mono' },
        formatCurrency(total)
      )
    }
  }
])
</script>
