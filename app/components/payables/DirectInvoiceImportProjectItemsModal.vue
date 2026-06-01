<template>
  <UModal
    v-model:open="isOpen"
    :ui="{
      content:
        'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-1rem)] max-w-6xl max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] rounded-lg shadow-lg ring ring-default overflow-hidden',
      body: 'p-4 sm:p-6 max-h-[calc(100dvh-12rem)] overflow-y-auto',
    }"
  >
    <template #header>
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between w-full">
        <div>
          <h3 class="text-base font-semibold text-default">Import preferred items</h3>
          <p class="text-xs text-muted mt-0.5">
            Rows come from <span class="font-mono text-[11px]">cost_code_preferred_items</span> for this project,
            filtered by the selected vendor. Select lines to add as invoice line items.
          </p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <UButton color="neutral" variant="soft" @click="close">Cancel</UButton>
          <UButton
            color="primary"
            :disabled="selectedCount === 0 || loading"
            @click="confirmImport"
          >
            Import{{ selectedCount > 0 ? ` (${selectedCount})` : '' }}
          </UButton>
        </div>
      </div>
    </template>
    <template #body>
      <div v-if="loading" class="py-12 flex justify-center">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin w-8 h-8 text-primary" />
      </div>
      <div v-else-if="loadError" class="text-sm text-error">{{ loadError }}</div>
      <div v-else-if="items.length === 0" class="text-sm text-muted py-8 text-center">
        No preferred items found for this vendor and project. Add or activate items under cost code preferred items and
        set the preferred vendor to match this invoice.
      </div>
      <div v-else class="overflow-x-auto border border-default rounded-lg">
        <table class="min-w-full table-fixed w-full divide-y divide-default text-sm">
          <thead class="bg-muted/20 text-[11px] font-semibold uppercase tracking-wide text-muted">
            <tr>
              <th class="w-10 px-2 py-2 text-left align-middle">
                <UCheckbox
                  :model-value="allSelected"
                  :indeterminate="someSelected && !allSelected"
                  @update:model-value="toggleSelectAll"
                />
              </th>
              <th class="px-2 py-2 text-left">Cost code</th>
              <th class="px-2 py-2 text-left">Category</th>
              <th class="px-2 py-2 text-left">Item type</th>
              <th class="px-2 py-2 text-left">Specification</th>
              <th class="px-2 py-2 text-left">Item</th>
              <th class="px-2 py-2 text-left max-w-[240px]">Description</th>
              <th class="px-2 py-2 text-right">Qty</th>
              <th class="px-2 py-2 text-left">UOM</th>
              <th class="px-2 py-2 text-right">Unit price</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default/60 bg-white dark:bg-gray-900/40">
            <tr
              v-for="(row, idx) in items"
              :key="rowKey(row, idx)"
              class="hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              <td class="px-2 py-2 align-middle">
                <UCheckbox
                  :model-value="selected[idx] ?? false"
                  @update:model-value="(v: boolean) => setRowSelected(idx, v)"
                />
              </td>
              <td class="px-2 py-2 align-middle text-xs min-w-0 break-words">{{ row.cost_code_label || '—' }}</td>
              <td class="px-2 py-2 align-middle text-xs min-w-0 max-w-[140px] break-words" :title="row.item_category_label || undefined">
                {{ row.item_category_label || '—' }}
              </td>
              <td class="px-2 py-2 align-middle text-xs min-w-0 max-w-[140px] break-words" :title="row.item_type_label || undefined">
                {{ row.item_type_label || '—' }}
              </td>
              <td class="px-2 py-2 align-middle font-mono text-xs min-w-0 break-all">{{ row.sequence || row.item_sequence || '—' }}</td>
              <td class="px-2 py-2 align-middle min-w-0 break-words">{{ row.item_name || '—' }}</td>
              <td class="px-2 py-2 align-middle max-w-[240px] min-w-0">
                <p
                  class="text-xs text-left line-clamp-3 whitespace-pre-wrap break-words m-0"
                  :title="descriptionPlainTitle(row.description)"
                >
                  {{ descriptionPlainTitle(row.description) || '—' }}
                </p>
              </td>
              <td class="px-2 py-2 align-middle text-right font-mono">
                {{ formatQty(row) }}
              </td>
              <td class="px-2 py-2 align-middle text-xs">{{ row.unit_label || '—' }}</td>
              <td class="px-2 py-2 align-middle text-right font-mono">
                {{ formatMoney(row.unit_price) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useApiClient } from '~/composables/useApiClient'
import { stripHtmlToPlainText } from '~/utils/getDescriptionPreviewHtml'

/** Mapped row from GET /api/cost-code-preferred-items (see server/api/cost-code-preferred-items/index.get.ts) */
export interface CostCodePreferredItemImportRow {
  uuid: string
  item_uuid: string | null
  cost_code_uuid: string | null
  cost_code_label: string
  item_name: string
  item_type_label?: string
  item_category_label?: string
  /** From cost_code_preferred_items.location_uuid + joined location row */
  location_uuid?: string | null
  location_label?: string
  description: string
  item_sequence: string | null
  sequence: string | null
  unit_price: number
  unit_label: string
  quantity: number
  initial_quantity: number
}

const props = defineProps<{
  open: boolean
  corporationUuid?: string | null
  projectUuid?: string | null
  vendorUuid?: string | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  import: [items: CostCodePreferredItemImportRow[]]
}>()

const isOpen = computed({
  get: () => props.open,
  set: (v: boolean) => emit('update:open', v),
})

const { apiFetch } = useApiClient()
const loading = ref(false)
const items = ref<CostCodePreferredItemImportRow[]>([])
const loadError = ref<string | null>(null)
const selected = ref<boolean[]>([])

const selectedCount = computed(() => selected.value.filter(Boolean).length)

const allSelected = computed(
  () => items.value.length > 0 && selected.value.length === items.value.length && selected.value.every(Boolean)
)

const someSelected = computed(() => selectedCount.value > 0)

function rowKey(row: CostCodePreferredItemImportRow, idx: number) {
  return `${row.uuid}|${row.item_uuid || ''}|${idx}`
}

function descriptionPlainTitle(description: string | undefined) {
  return stripHtmlToPlainText(String(description || '')) || undefined
}

function formatMoney(v: number | undefined) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return '—'
  return Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatQty(row: CostCodePreferredItemImportRow) {
  const q = Number(row.initial_quantity ?? row.quantity ?? 0)
  if (Number.isFinite(q) && q > 0) return q
  return '—'
}

function toggleSelectAll(value: boolean) {
  selected.value = items.value.map(() => value)
}

function setRowSelected(idx: number, value: boolean) {
  const next = [...selected.value]
  next[idx] = value
  selected.value = next
}

async function loadItems() {
  loadError.value = null
  items.value = []
  selected.value = []

  const corp = String(props.corporationUuid || '').trim()
  const project = String(props.projectUuid || '').trim()
  const vendor = String(props.vendorUuid || '').trim()

  if (!corp || !project || !vendor) {
    loadError.value = 'Corporation, project, and vendor are required.'
    return
  }

  loading.value = true
  try {
    const response: any = await apiFetch('/api/cost-code-preferred-items', {
      method: 'GET',
      query: {
        corporation_uuid: corp,
        project_uuid: project,
        vendor_uuid: vendor,
      },
    })
    const r = response as {
      data?: CostCodePreferredItemImportRow[] | { data?: CostCodePreferredItemImportRow[] }
    }
    let raw: CostCodePreferredItemImportRow[] = []
    if (Array.isArray(r?.data)) {
      raw = r.data
    } else if (r?.data && typeof r.data === 'object' && Array.isArray(r.data.data)) {
      raw = r.data.data
    }
    items.value = raw
    selected.value = items.value.map(() => false)
  } catch (err: any) {
    loadError.value = err?.data?.statusMessage || err?.message || 'Failed to load preferred items.'
    items.value = []
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.open, props.corporationUuid, props.projectUuid, props.vendorUuid] as const,
  ([open]) => {
    if (open) {
      loadItems()
    } else {
      items.value = []
      selected.value = []
      loadError.value = null
    }
  },
  { immediate: true }
)

function close() {
  isOpen.value = false
}

function confirmImport() {
  const out: CostCodePreferredItemImportRow[] = []
  items.value.forEach((row, i) => {
    if (selected.value[i]) out.push(row)
  })
  emit('import', out)
  close()
}
</script>
