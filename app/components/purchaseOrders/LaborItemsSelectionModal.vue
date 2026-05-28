<template>
  <UModal v-model:open="isOpen" :title="title" description="Select labor cost codes to import into the purchase order" fullscreen>
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
        <p class="text-sm">No labor cost codes available to import.</p>
        <p class="text-xs mt-2" v-if="isFromEstimate">
          Please make sure an estimate exists for this project with labor amounts.
        </p>
        <p class="text-xs mt-2" v-else>
          Please make sure cost codes are configured for the selected corporation.
        </p>
      </div>

      <UTable
        v-else
        :data="items"
        :columns="tableColumns"
      />
    </template>

    <template #footer>
      <div class="flex items-center justify-between w-full">
        <div class="text-sm text-muted">
          {{ selectedLineItemsCount }} of {{ items.length }} items selected
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
            :disabled="selectedLineItemsCount === 0"
            @click="handleConfirm"
          >
            Import {{ selectedLineItemsCount }} Item{{ selectedLineItemsCount !== 1 ? 's' : '' }}
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

interface LaborItem {
  id?: string
  uuid?: string
  cost_code_uuid?: string
  cost_code_label?: string
  cost_code_number?: string
  cost_code_name?: string
  cost_code_description?: string
  cost_code?: string
  labor_budgeted_amount?: number
  po_amount?: number
  [key: string]: any
}

interface Props {
  open?: boolean
  items?: LaborItem[]
  title?: string
  preselectedItems?: LaborItem[]
  showLaborBudgeted?: boolean
  isFromEstimate?: boolean
  showLocationColumn?: boolean
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'confirm', selectedItems: LaborItem[]): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  items: () => [],
  title: 'Select Labor Cost Codes to Import',
  preselectedItems: () => [],
  showLaborBudgeted: false,
  isFromEstimate: false,
  showLocationColumn: false,
})

const emit = defineEmits<Emits>()

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

const selectedItems = ref<Set<string>>(new Set())

// Helper to get a unique ID for each item.
// For location-wise projects a single cost code appears once per location,
// so we combine cost_code_uuid + location_uuid to keep rows independent.
const getItemId = (item: LaborItem, index: number): string => {
  const base = item.cost_code_uuid || item.uuid || item.id || ''
  const loc = item.location_uuid || ''
  if (base && loc) return `${base}::${loc}`
  return base || `labor-item-${index}`
}

// Select items when modal opens
watch(() => props.open, (newValue) => {
  console.log('[LaborItemsModal] Modal open changed:', newValue, 'Items count:', props.items.length);
  if (newValue && props.items.length > 0) {
    // If preselectedItems are provided, use those; otherwise select all
    if (props.preselectedItems && props.preselectedItems.length > 0) {
      // Build a set of composite keys from preselected items so that
      // location-wise rows are matched individually, not by cost code alone.
      const preselectedKeys = new Set(
        props.preselectedItems.map((item) => {
          const base = item.cost_code_uuid || item.uuid || item.id || ''
          const loc = item.location_uuid || ''
          return base && loc ? `${base}::${loc}` : base
        }).filter(Boolean)
      );

      const itemIds = props.items
        .map((item, index) => {
          const itemId = getItemId(item, index);
          return preselectedKeys.has(itemId) ? itemId : null;
        })
        .filter((id): id is string => id !== null);

      selectedItems.value = new Set(itemIds);
    } else {
      // Select all items by default
      const itemIds = props.items.map((item, index) => getItemId(item, index));
      console.log('[LaborItemsModal] Selecting all items:', itemIds);
      selectedItems.value = new Set(itemIds);
    }
  }
}, { immediate: true })

// Watch items prop changes
watch(() => props.items, (newItems) => {
  console.log('[LaborItemsModal] Items changed:', newItems.length, 'items');
  if (newItems.length > 0 && newItems[0]) {
    console.log('[LaborItemsModal] First item:', newItems[0]);
    console.log('[LaborItemsModal] First item keys:', Object.keys(newItems[0]));
  }
}, { immediate: true, deep: true })

const selectedLineItemsCount = computed(() => {
  return props.items.reduce((count, item, index) => {
    const itemId = getItemId(item, index)
    return count + (selectedItems.value.has(itemId) ? 1 : 0)
  }, 0)
})

const allSelected = computed(() => {
  return props.items.length > 0 && selectedLineItemsCount.value === props.items.length
})

const shouldShowLocationColumn = computed(() => {
  if (props.showLocationColumn) return true
  return props.items.some((item) => {
    const locationUuid = String(item.location_uuid || '').trim()
    const locationLabel = String(item.location_label || '').trim()
    return !!locationUuid || !!locationLabel
  })
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

const getPriorCommittedPoAmount = (item: LaborItem): number => {
  const raw =
    item.metadata?.prior_committed_po_amount ??
    item.prior_committed_po_amount ??
    0
  const n = typeof raw === 'string' ? parseFloat(raw) : Number(raw ?? 0)
  return Number.isFinite(n) ? n : 0
}

/** Unallocated estimate labor after other POs (not this line’s default PO amount). */
const getRemainingAmount = (item: LaborItem): number => {
  const budgeted = typeof item.labor_budgeted_amount === 'string'
    ? parseFloat(item.labor_budgeted_amount)
    : Number(item.labor_budgeted_amount ?? 0)
  const safeBudgeted = Number.isFinite(budgeted) ? budgeted : 0
  const prior = getPriorCommittedPoAmount(item)
  return safeBudgeted - prior
}

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
  console.log('[LaborItemsModal] Confirming selection:', selected.length, 'items');
  emit('confirm', selected)
  isOpen.value = false
}

const handleCancel = () => {
  emit('cancel')
  isOpen.value = false
}

// Table columns configuration
const tableColumns = computed<TableColumn<LaborItem>[]>(() => {
  const columns: TableColumn<LaborItem>[] = [
    {
      accessorKey: 'checkbox',
      header: () => h(UCheckbox, {
        modelValue: allSelected.value,
        'onUpdate:modelValue': handleToggleAll,
      }),
      enableSorting: false,
      meta: { class: { th: 'w-16 px-4 py-2 text-left', td: 'px-4 py-3 align-middle' } },
      cell: ({ row }: { row: { original: LaborItem; index: number } }) => {
        const item = row.original
        const index = props.items.indexOf(item)
        const itemId = getItemId(item, index >= 0 ? index : row.index)
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
      meta: { class: { th: 'w-48 px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted', td: 'px-4 py-3 align-middle' } },
      cell: ({ row }: { row: { original: LaborItem } }) => {
        const item = row.original
        return h('div', [
          h('div', { class: 'text-xs font-medium truncate' }, 
            item.cost_code_label || item.cost_code_description || item.cost_code_number || item.cost_code || '-'
          ),
          item.cost_code_number && item.cost_code_name ? h('div', { class: 'text-[11px] text-muted uppercase tracking-wide mt-1' },
            `${item.cost_code_number} · ${item.cost_code_name}`
          ) : null
        ])
      }
    }
  ]

  if (shouldShowLocationColumn.value) {
    columns.push({
      accessorKey: 'location',
      header: 'Location',
      enableSorting: false,
      meta: { class: { th: 'w-40 px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted', td: 'px-4 py-3 align-middle text-left' } },
      cell: ({ row }: { row: { original: LaborItem } }) => {
        const item = row.original
        return h(
          'div',
          { class: 'text-xs' },
          item.location_label || item.location_uuid || '-'
        )
      }
    })
  }

  if (props.showLaborBudgeted) {
    columns.push({
      accessorKey: 'labor_budgeted_amount',
      header: 'Labor Budgeted Amount',
      enableSorting: false,
      meta: { class: { th: 'w-32 px-4 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-muted', td: 'px-4 py-3 align-middle text-right' } },
      cell: ({ row }: { row: { original: LaborItem } }) => {
        return h('div', { class: 'text-xs font-mono' }, formatCurrency(row.original.labor_budgeted_amount || 0))
      }
    })
  }

  columns.push({
    accessorKey: 'po_amount',
    header: 'PO Amount',
    enableSorting: false,
    meta: { class: { th: 'w-32 px-4 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-muted', td: 'px-4 py-3 align-middle text-right' } },
    cell: ({ row }: { row: { original: LaborItem } }) => {
      return h('div', { class: 'text-xs font-mono' }, formatCurrency(getPriorCommittedPoAmount(row.original)))
    }
  })

  if (props.showLaborBudgeted) {
    columns.push({
      accessorKey: 'remaining_amount',
      header: 'Remaining Amount',
      enableSorting: false,
      meta: { class: { th: 'w-32 px-4 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-muted', td: 'px-4 py-3 align-middle text-right' } },
      cell: ({ row }: { row: { original: LaborItem } }) => {
        return h('div', { class: 'text-xs font-mono' }, formatCurrency(getRemainingAmount(row.original)))
      }
    })
  }

  return columns
})
</script>
