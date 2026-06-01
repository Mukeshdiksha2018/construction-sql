<template>
  <UModal
    v-model:open="modalOpen"
    :fullscreen="true"
    :ui="{ content: 'w-full', body: 'sm:p-6 flex-1 overflow-y-auto p-4' }"
  >
    <template #header>
      <div class="flex items-center justify-between w-full gap-4">
        <div class="flex items-center gap-4 flex-shrink-0">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ modalTitle }}
          </h3>
          <p v-if="embeddedCostCodeLabel" class="text-xs text-muted truncate max-w-md">
            {{ embeddedCostCodeLabel }}
          </p>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          <UButton color="neutral" variant="soft" @click="closeModal">Cancel</UButton>
          <UButton color="primary" :loading="isSaving" :disabled="isSaving" @click="saveItem">
            {{ editingItemLabel === 'Edit Item' ? 'Update' : 'Save' }}
          </UButton>
        </div>
      </div>
    </template>

    <template #body>
      <div class="space-y-3">
        <!-- Top row: Corporation (locked) + Project + Category + Item Type -->
        <div class="flex flex-wrap items-start gap-2">
          <!-- Corporation (always locked to selected corp) -->
          <div class="w-64 flex-shrink-0">
            <label class="block text-sm font-medium text-default mb-1">
              Corporation <span class="text-red-500">*</span>
            </label>
            <SharedCorporationSelect
              :model-value="selectedCorporationId"
              disabled
              size="sm"
              class="w-full"
              :show-icon="false"
              :show-legal-name="false"
            />
          </div>

          <!-- Project -->
          <div class="w-72 flex-shrink-0">
            <label class="block text-sm font-medium text-default mb-1">
              Project <span class="text-red-500">*</span>
            </label>
            <SharedProjectSelect
              :model-value="itemForm.project_uuid"
              placeholder="Select project"
              size="sm"
              :corporation-uuid="corpId"
              class="w-full"
              :disabled="projectSelectDisabled"
              @change="handleProjectChange"
            />
          </div>

          <!-- Item Category -->
          <div class="w-48 flex-shrink-0">
            <label class="block text-sm font-medium text-default mb-1">
              Item Category <span class="text-red-500">*</span>
            </label>
            <SharedItemCategorySelect
              v-model="itemForm.item_category"
              placeholder="Select category"
              size="sm"
              class="w-full"
              @change="handleCategoryChange"
            />
          </div>

          <!-- Item Type -->
          <div class="w-64 flex-shrink-0">
            <label class="flex items-center gap-1 text-sm font-medium text-default mb-1">
              Item Type <span class="text-red-500">*</span>
              <UTooltip text="Add New Item Type">
                <UButton
                  icon="i-heroicons-plus-solid"
                  size="2xs"
                  color="primary"
                  variant="solid"
                  :disabled="!itemForm.item_category"
                  @click="openQuickAddItemType"
                />
              </UTooltip>
            </label>
            <SharedItemTypeSelect
              :model-value="itemForm.item_type_uuid"
              placeholder="Select item type"
              size="sm"
              :corporation-uuid="corpId"
              :disabled="!itemForm.item_category"
              class="w-full"
              @change="handleItemTypeChange"
            />
          </div>
        </div>

        <!-- Items Table -->
        <div v-if="canShowItemsTable" class="mt-6">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-sm font-semibold text-default flex items-center gap-2">
              <UIcon name="i-heroicons-cube" class="w-4 h-4" />
              Items under this Item Type
            </h4>
            <UButton size="xs" color="primary" variant="solid" icon="i-heroicons-plus-solid" @click="addEmptyRow">
              Add Row
            </UButton>
          </div>

          <!-- Items UTable -->
          <UTable
            :data="itemRows"
            :columns="tableColumns"
            sticky
            :column-pinning="{ left: [], right: ['actions'] }"
            class="table-fixed text-xs"
            :ui="{
              base: 'min-w-[1800px] w-full',
              th: 'text-[11px] font-semibold uppercase tracking-wide text-muted',
              td: 'align-middle',
            }"
          />

          <div v-if="itemRows.length === 0" class="text-center py-6 text-gray-400 text-sm">
            Click "Add Row" to start adding items
          </div>
        </div>

        <div v-else class="mt-6">
          <p class="text-xs text-gray-400">
            Select a Corporation, Project, Item Category and Item Type to view and add items.
          </p>
        </div>
      </div>
    </template>
  </UModal>

  <!-- Quick Add Item Type Modal -->
  <UModal v-model:open="showQuickAddItemType" :ui="{ wrapper: 'max-w-3xl', body: 'p-6' }">
    <template #header>
      <div class="flex items-center justify-between w-full">
        <h3 class="text-base font-semibold">Add New Item Type</h3>
        <UButton icon="i-heroicons-x-mark" size="xs" variant="solid" color="neutral" @click="showQuickAddItemType = false" />
      </div>
    </template>
    <template #body>
      <form class="space-y-4">
        <SharedItemTypeFormFields :form="quickItemTypeForm as any" />
      </form>
    </template>
    <template #footer>
      <div class="flex items-center justify-end gap-2">
        <UButton variant="solid" color="neutral" @click="showQuickAddItemType = false">Cancel</UButton>
        <UButton
          variant="solid"
          color="primary"
          :disabled="!isQuickItemTypeValid || isCreatingItemType"
          :loading="isCreatingItemType"
          @click="saveQuickItemType"
        >
          Create Item Type
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount, h, resolveComponent } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { useCorporationStore } from '~/stores/corporations'
import { useItemTypesStore } from '~/stores/itemTypes'
import { usePreferredItemsStore } from '~/stores/preferredItems'

interface Props {
  modelValue: boolean
  initialEditingItem?: Record<string, unknown> | null
  /** standalone = Items list; embedded = cost code configuration flow */
  mode?: 'standalone' | 'embedded'
  corporationUuid?: string
  costCodeConfigurationUuid?: string
  costCodeLabel?: string
  /** When embedded, allow picking a project (cost code config / list manage items). */
  allowEmbeddedProjectSelect?: boolean
  /** When true with costCodeConfigurationUuid, hide cost code column and lock rows to that config. */
  lockEmbeddedCostCodeSelection?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  initialEditingItem: null,
  mode: 'standalone',
  corporationUuid: '',
  costCodeConfigurationUuid: '',
  costCodeLabel: '',
  allowEmbeddedProjectSelect: true,
  lockEmbeddedCostCodeSelection: true,
})

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'saved'): void
}>()

const corpStore = useCorporationStore()
const itemTypesStore = useItemTypesStore()
const itemsStore = usePreferredItemsStore()
const toast = useToast()

const modalOpen = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

// The CorporationSelect uses corp.id as its value key — pass selectedCorporationId directly
const selectedCorporationId = computed(() => corpStore.selectedCorporationId ?? undefined)
// The corporation's UUID used for API calls is corp.id in this store
const corpId = computed(() => {
  if (props.mode === 'embedded' && props.corporationUuid) {
    return props.corporationUuid
  }
  return corpStore.selectedCorporation?.id ?? ''
})

const lockedCostCodeUuid = computed(() =>
  props.mode === 'embedded' && props.lockEmbeddedCostCodeSelection && props.costCodeConfigurationUuid
    ? String(props.costCodeConfigurationUuid).trim().toLowerCase()
    : '',
)

const projectSelectDisabled = computed(() => {
  if (!corpId.value) return true
  if (props.mode === 'embedded' && !props.allowEmbeddedProjectSelect) return true
  return false
})

const embeddedCostCodeLabel = computed(() => {
  if (props.mode !== 'embedded' || !props.costCodeLabel) return ''
  return props.costCodeLabel
})

const modalTitle = computed(() => {
  if (props.mode === 'embedded' && props.costCodeLabel) {
    return props.initialEditingItem ? 'Edit Preferred Items' : 'Add Preferred Items'
  }
  return editingItemLabel.value
})

const showCostCodeColumn = computed(() => !lockedCostCodeUuid.value)

// ── Form state ──────────────────────────────────────────────────────────────
const itemForm = ref({
  project_uuid: '',
  item_category: '',
  item_type_uuid: '',
})

interface ItemRow {
  uuid?: string
  item_sequence: string
  item_name: string
  description: string
  model_number: string
  unit_price: string | number
  uom_uuid: string
  cost_code_configuration_uuid: string
  preferred_vendor_uuid: string
  location_uuid: string
  initial_quantity: string | number
  as_of_date: string
  reorder_point: string | number
  maximum_limit: string | number
  status: string
}

const itemRows = ref<ItemRow[]>([])
const isSaving = ref(false)

const editingItemLabel = computed(() => props.initialEditingItem ? 'Edit Item' : 'Add Item')

const canShowItemsTable = computed(() =>
  !!corpId.value
  && !!itemForm.value.project_uuid
  && !!itemForm.value.item_category
  && !!itemForm.value.item_type_uuid,
)

// ── TipTap Description Editor ────────────────────────────────────────────────
const activeDescriptionRow = ref<number | null>(null)

const descEditor = useEditor({
  content: '',
  extensions: [StarterKit],
  editorProps: {
    attributes: { class: 'prose prose-sm dark:prose-invert max-w-none min-h-[140px] focus:outline-none' },
  },
  onUpdate: ({ editor }) => {
    const html = editor.getHTML()
    if (activeDescriptionRow.value !== null && itemRows.value[activeDescriptionRow.value]) {
      itemRows.value[activeDescriptionRow.value].description = html
    }
  },
})

function plainText(html: string | null | undefined): string {
  if (!html) return ''
  if (typeof window === 'undefined') return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  const div = document.createElement('div')
  div.innerHTML = html
  return (div.textContent || div.innerText || '').replace(/\s+/g, ' ').trim()
}

function openDescriptionEditor(idx: number) {
  activeDescriptionRow.value = idx
  const html = itemRows.value[idx]?.description || ''
  descEditor.value?.commands.setContent(html)
}

function closeDescriptionEditor() {
  activeDescriptionRow.value = null
}

onBeforeUnmount(() => {
  try { descEditor.value?.destroy() } catch { /* no-op */ }
})

// ── Components resolved for use inside h() render functions ─────────────────
const _UInput = resolveComponent('UInput')
const _UTextarea = resolveComponent('UTextarea')
const _UPopover = resolveComponent('UPopover')
const _UButton = resolveComponent('UButton')
const _USwitch = resolveComponent('USwitch')
const _SharedUOMSelect = resolveComponent('SharedUOMSelect')
const _SharedCostCodeSelect = resolveComponent('SharedCostCodeSelect')
const _SharedVendorSelect = resolveComponent('SharedVendorSelect')
const _SharedLocationSelect = resolveComponent('SharedLocationSelect')

// ── Table column definitions ──────────────────────────────────────────────────
const tableColumns = computed(() => {
  const cols = [
  {
    accessorKey: 'item_sequence',
    header: () => h('span', { class: 'inline-flex items-center gap-1' }, ['Spec ', h('span', { class: 'text-red-500' }, '*')]),
    enableSorting: false,
    meta: { class: { th: 'w-[8%] px-3 py-2', td: 'w-[8%] p-2 align-middle' } },
    cell: ({ row }: any) => h(_UInput, {
      modelValue: itemRows.value[row.index]?.item_sequence ?? '',
      size: 'xs',
      class: 'w-full',
      placeholder: 'Spec',
      'onUpdate:modelValue': (v: string) => { if (itemRows.value[row.index]) itemRows.value[row.index].item_sequence = v },
    }),
  },
  {
    accessorKey: 'item_name',
    header: () => h('span', { class: 'inline-flex items-center gap-1' }, ['Item Name ', h('span', { class: 'text-red-500' }, '*')]),
    enableSorting: false,
    meta: { class: { th: 'w-[13%] px-3 py-2', td: 'w-[13%] p-2 align-middle' } },
    cell: ({ row }: any) => h(_UTextarea, {
      modelValue: itemRows.value[row.index]?.item_name ?? '',
      rows: 2,
      size: 'xs',
      class: 'w-full text-xs min-h-[56px] max-h-24 h-14 resize-none overflow-y-auto',
      placeholder: 'Enter item name',
      'onUpdate:modelValue': (v: string) => { if (itemRows.value[row.index]) itemRows.value[row.index].item_name = v },
    }),
  },
  {
    accessorKey: 'description',
    header: 'Description',
    enableSorting: false,
    meta: { class: { th: 'w-[13%] px-3 py-2', td: 'w-[13%] p-2 align-middle' } },
    cell: ({ row }: any) => {
      const isOpen = activeDescriptionRow.value === row.index
      return h(_UPopover, {
        open: isOpen,
        'onUpdate:open': (v: boolean) => { if (!v && activeDescriptionRow.value === row.index) closeDescriptionEditor() },
        content: { side: 'top', align: 'start' },
        ui: { content: 'w-[600px] p-3' },
      }, {
        default: () => h(_UTextarea, {
          modelValue: plainText(itemRows.value[row.index]?.description ?? ''),
          rows: 2,
          size: 'xs',
          class: 'w-full text-xs min-h-[56px] max-h-24 h-14 resize-none overflow-y-auto cursor-text',
          placeholder: 'Click to edit description',
          readonly: true,
          onClick: () => openDescriptionEditor(row.index),
        }),
        content: () => h('div', { class: 'space-y-2' }, [
          h('div', { class: 'text-xs font-medium text-gray-500' }, 'Rich Text Description'),
          h('div', { class: 'border border-gray-200 dark:border-gray-700 rounded-md' }, [
            h('div', { class: 'border-b border-gray-200 dark:border-gray-700 p-2 flex flex-wrap gap-1' }, [
              h(_UButton, { icon: 'i-lucide-bold', size: 'xs', variant: 'ghost', color: 'neutral', onClick: () => descEditor.value?.chain().focus().toggleBold().run() }),
              h(_UButton, { icon: 'i-lucide-italic', size: 'xs', variant: 'ghost', color: 'neutral', onClick: () => descEditor.value?.chain().focus().toggleItalic().run() }),
              h(_UButton, { icon: 'i-lucide-list', size: 'xs', variant: 'ghost', color: 'neutral', onClick: () => descEditor.value?.chain().focus().toggleBulletList().run() }),
              h(_UButton, { icon: 'i-lucide-list-ordered', size: 'xs', variant: 'ghost', color: 'neutral', onClick: () => descEditor.value?.chain().focus().toggleOrderedList().run() }),
            ]),
            h('div', { class: 'p-3 min-h-[160px] max-h-[260px] overflow-y-auto' }, [
              h(EditorContent, { editor: descEditor.value }),
            ]),
          ]),
          h('div', { class: 'flex justify-end' }, [
            h(_UButton, { size: 'xs', color: 'primary', label: 'Done', onClick: () => closeDescriptionEditor() }),
          ]),
        ]),
      })
    },
  },
  {
    accessorKey: 'model_number',
    header: 'Model #',
    enableSorting: false,
    meta: { class: { th: 'w-[7%] px-3 py-2', td: 'w-[7%] p-2 align-middle' } },
    cell: ({ row }: any) => h(_UInput, {
      modelValue: itemRows.value[row.index]?.model_number ?? '',
      size: 'xs',
      class: 'w-full',
      placeholder: 'Model #',
      'onUpdate:modelValue': (v: string) => { if (itemRows.value[row.index]) itemRows.value[row.index].model_number = v },
    }),
  },
  {
    accessorKey: 'unit_price',
    header: () => h('span', { class: 'inline-flex items-center gap-1' }, ['Unit Cost ', h('span', { class: 'text-red-500' }, '*')]),
    enableSorting: false,
    meta: { class: { th: 'w-[7%] px-3 py-2', td: 'w-[7%] p-2 align-middle' } },
    cell: ({ row }: any) => h('div', { class: 'relative' }, [
      h(_UInput, {
        modelValue: itemRows.value[row.index]?.unit_price ?? '',
        type: 'number',
        step: '0.01',
        min: '0',
        placeholder: '0.00',
        size: 'xs',
        class: 'w-full pl-5',
        'onUpdate:modelValue': (v: string | number) => { if (itemRows.value[row.index]) itemRows.value[row.index].unit_price = v },
      }),
      h('span', { class: 'absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none' }, '$'),
    ]),
  },
  {
    accessorKey: 'uom_uuid',
    header: 'UOM',
    enableSorting: false,
    meta: { class: { th: 'w-[7%] px-3 py-2', td: 'w-[7%] p-2 align-middle' } },
    cell: ({ row }: any) => h(_SharedUOMSelect, {
      modelValue: itemRows.value[row.index]?.uom_uuid ?? '',
      placeholder: 'Select UOM',
      size: 'xs',
      className: 'w-full',
      'onUpdate:modelValue': (v: string | undefined) => { if (itemRows.value[row.index]) itemRows.value[row.index].uom_uuid = v || '' },
    }),
  },
  {
    accessorKey: 'location_uuid',
    header: 'Location',
    enableSorting: false,
    meta: { class: { th: 'w-[10%] px-3 py-2', td: 'w-[10%] p-2 align-middle' } },
    cell: ({ row }: any) => h(_SharedLocationSelect, {
      modelValue: itemRows.value[row.index]?.location_uuid ?? '',
      placeholder: 'Select location',
      size: 'xs',
      className: 'w-full',
      'onUpdate:modelValue': (v: string | undefined) => { if (itemRows.value[row.index]) itemRows.value[row.index].location_uuid = v || '' },
    }),
  },
  {
    accessorKey: 'preferred_vendor_uuid',
    header: 'Preferred Vendor',
    enableSorting: false,
    meta: { class: { th: 'w-[10%] px-3 py-2', td: 'w-[10%] p-2 align-middle' } },
    cell: ({ row }: any) => h(_SharedVendorSelect, {
      modelValue: itemRows.value[row.index]?.preferred_vendor_uuid ?? '',
      placeholder: 'Select vendor',
      size: 'xs',
      className: 'w-full',
      corporationUuid: corpId.value,
      'onUpdate:modelValue': (v: string | undefined) => { if (itemRows.value[row.index]) itemRows.value[row.index].preferred_vendor_uuid = v || '' },
    }),
  },
  ...(showCostCodeColumn.value
    ? [{
        accessorKey: 'cost_code_configuration_uuid',
        header: () => h('span', { class: 'inline-flex items-center gap-1' }, ['Cost Code ', h('span', { class: 'text-red-500' }, '*')]),
        enableSorting: false,
        meta: { class: { th: 'w-[10%] px-3 py-2', td: 'w-[10%] p-2 align-middle' } },
        cell: ({ row }: any) => h(_SharedCostCodeSelect, {
          modelValue: itemRows.value[row.index]?.cost_code_configuration_uuid ?? '',
          placeholder: 'Select cost code',
          size: 'xs',
          corporationUuid: corpId.value,
          class: 'w-full',
          onChange: (v: unknown) => {
            if (itemRows.value[row.index]) {
              const uuid = typeof v === 'string' ? v : (v as Record<string, string>)?.value ?? ''
              itemRows.value[row.index].cost_code_configuration_uuid = uuid
            }
          },
        }),
      }]
    : []),
  {
    accessorKey: 'initial_quantity',
    header: 'Initial QTY',
    enableSorting: false,
    meta: { class: { th: 'w-[6%] px-3 py-2', td: 'w-[6%] p-2 align-middle' } },
    cell: ({ row }: any) => h(_UInput, {
      modelValue: itemRows.value[row.index]?.initial_quantity ?? '',
      type: 'number',
      step: '0.01',
      min: '0',
      placeholder: '0',
      size: 'xs',
      class: 'w-full',
      'onUpdate:modelValue': (v: string | number) => { if (itemRows.value[row.index]) itemRows.value[row.index].initial_quantity = v },
    }),
  },
  {
    accessorKey: 'as_of_date',
    header: 'As of Date',
    enableSorting: false,
    meta: { class: { th: 'w-[7%] px-3 py-2', td: 'w-[7%] p-2 align-middle' } },
    cell: ({ row }: any) => h(_UInput, {
      modelValue: localDate(itemRows.value[row.index]?.as_of_date),
      type: 'date',
      size: 'xs',
      class: 'w-full',
      'onUpdate:modelValue': (v: string) => { if (itemRows.value[row.index]) itemRows.value[row.index].as_of_date = v || '' },
    }),
  },
  {
    accessorKey: 'reorder_point',
    header: 'Reorder Pt',
    enableSorting: false,
    meta: { class: { th: 'w-[6%] px-3 py-2', td: 'w-[6%] p-2 align-middle' } },
    cell: ({ row }: any) => h(_UInput, {
      modelValue: itemRows.value[row.index]?.reorder_point ?? '',
      type: 'number',
      step: '0.01',
      min: '0',
      placeholder: '0',
      size: 'xs',
      class: 'w-full',
      'onUpdate:modelValue': (v: string | number) => { if (itemRows.value[row.index]) itemRows.value[row.index].reorder_point = v },
    }),
  },
  {
    accessorKey: 'maximum_limit',
    header: 'Max Limit',
    enableSorting: false,
    meta: { class: { th: 'w-[6%] px-3 py-2', td: 'w-[6%] p-2 align-middle' } },
    cell: ({ row }: any) => h(_UInput, {
      modelValue: itemRows.value[row.index]?.maximum_limit ?? '',
      type: 'number',
      step: '0.01',
      min: '0',
      placeholder: '0',
      size: 'xs',
      class: 'w-full',
      'onUpdate:modelValue': (v: string | number) => { if (itemRows.value[row.index]) itemRows.value[row.index].maximum_limit = v },
    }),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    enableSorting: false,
    meta: { class: { th: 'w-[80px] px-3 py-2', td: 'w-[80px] p-2 align-middle' } },
    cell: ({ row }: any) => h('div', { class: 'flex items-center gap-2' }, [
      h(_USwitch, {
        modelValue: itemRows.value[row.index]?.status === 'Active',
        size: 'sm',
        'onUpdate:modelValue': (v: boolean) => { if (itemRows.value[row.index]) itemRows.value[row.index].status = v ? 'Active' : 'Inactive' },
      }),
      h('span', { class: 'text-xs text-gray-500' }, itemRows.value[row.index]?.status ?? 'Active'),
    ]),
  },
  {
    id: 'actions',
    header: '',
    enableSorting: false,
    meta: { class: { th: 'w-[44px] px-1 py-2 sticky right-0 z-10', td: 'w-[44px] p-1 align-middle sticky right-0 bg-white dark:bg-gray-900' } },
    cell: ({ row }: any) => h('div', { class: 'flex justify-center' }, [
      h(_UButton, {
        icon: 'mingcute:delete-fill',
        size: 'xs',
        color: 'error',
        variant: 'soft',
        onClick: () => itemRows.value.splice(row.index, 1),
      }),
    ]),
  },
]
  return cols
})

// ── Row helpers ──────────────────────────────────────────────────────────────
function localDate(iso: string | null | undefined): string {
  if (!iso) return ''
  return iso.includes('T') ? iso.split('T')[0] : iso
}

function addEmptyRow() {
  itemRows.value.push({
    item_sequence: '',
    item_name: '',
    description: '',
    model_number: '',
    unit_price: '',
    uom_uuid: '',
    cost_code_configuration_uuid: lockedCostCodeUuid.value || '',
    preferred_vendor_uuid: '',
    location_uuid: '',
    initial_quantity: '',
    as_of_date: '',
    reorder_point: '',
    maximum_limit: '',
    status: 'Active',
  })
}

// ── Handlers ─────────────────────────────────────────────────────────────────
function handleProjectChange(project: unknown) {
  const uuid = typeof project === 'string' ? project : (project as Record<string, string>)?.value ?? ''
  const prev = itemForm.value.project_uuid
  if (prev !== uuid) {
    itemForm.value.item_type_uuid = ''
    itemRows.value = []
  }
  itemForm.value.project_uuid = uuid
}

function handleCategoryChange(cat: unknown) {
  const value = typeof cat === 'string' ? cat : (cat as Record<string, string>)?.value ?? ''
  itemForm.value.item_category = value
  itemForm.value.item_type_uuid = ''
  itemRows.value = []
}

function handleItemTypeChange(itemType: unknown) {
  const uuid = typeof itemType === 'string' ? itemType : (itemType as Record<string, string>)?.value ?? ''
  itemForm.value.item_type_uuid = uuid
}

// ── Load existing rows when combination is selected ───────────────────────────
watch(
  () => [corpId.value, itemForm.value.project_uuid, itemForm.value.item_type_uuid],
  async ([corpUuid, projectUuid, itemTypeUuid]) => {
    if (!corpUuid || !projectUuid || !itemTypeUuid) {
      itemRows.value = []
      return
    }
    try {
      let url = `/api/preferred-items?corporation_uuid=${encodeURIComponent(corpUuid)}&project_uuid=${encodeURIComponent(projectUuid)}&item_type_uuid=${encodeURIComponent(itemTypeUuid)}`
      if (lockedCostCodeUuid.value) {
        url += `&cost_code_configuration_uuid=${encodeURIComponent(lockedCostCodeUuid.value)}`
      }
      const response = await $fetch<{ data: Record<string, unknown>[] }>(url)
      itemRows.value = (response?.data || []).map(r => ({
        uuid: String(r.uuid || ''),
        item_sequence: String(r.item_sequence || ''),
        item_name: String(r.item_name || ''),
        description: String(r.description || ''),
        model_number: String(r.model_number || ''),
        unit_price: r.unit_price != null ? r.unit_price : '',
        uom_uuid: String(r.uom_uuid || ''),
        cost_code_configuration_uuid: String(r.cost_code_configuration_uuid || lockedCostCodeUuid.value || ''),
        preferred_vendor_uuid: String(r.preferred_vendor_uuid || ''),
        location_uuid: String(r.location_uuid || ''),
        initial_quantity: r.initial_quantity != null ? r.initial_quantity : '',
        as_of_date: r.as_of_date ? localDate(String(r.as_of_date)) : '',
        reorder_point: r.reorder_point != null ? r.reorder_point : '',
        maximum_limit: r.maximum_limit != null ? r.maximum_limit : '',
        status: String(r.status || 'Active'),
      })) as ItemRow[]
    }
    catch {
      itemRows.value = []
    }
  },
)

// ── Validation ────────────────────────────────────────────────────────────────
function validateRows(): string | null {
  if (!itemForm.value.project_uuid) return 'Please select a Project.'
  if (!itemForm.value.item_type_uuid) return 'Please select an Item Type.'
  if (!itemRows.value.length) return 'Please add at least one item row.'
  for (const r of itemRows.value) {
    if (!r.item_name?.trim()) return 'Each row requires an Item Name.'
    if (!r.item_sequence?.trim()) return 'Each row requires a Spec value.'
    const p = parseFloat(String(r.unit_price))
    if (!Number.isFinite(p) || p < 0) return 'Each row requires a valid Unit Cost (≥ 0).'
    // UOM is optional – it's selected from the Nimble dropdown and may be left blank
  }
  return null
}

// ── Save ──────────────────────────────────────────────────────────────────────
async function saveItem() {
  if (isSaving.value) return

  const corpUuid = corpId.value
  if (!corpUuid) {
    toast.add({ title: 'Error', description: 'No corporation selected', color: 'error', icon: 'i-heroicons-x-circle' })
    return
  }

  const err = validateRows()
  if (err) {
    toast.add({ title: 'Validation Error', description: err, color: 'error', icon: 'i-heroicons-x-circle' })
    return
  }

  if (lockedCostCodeUuid.value) {
    const missingCostCode = itemRows.value.some(
      r => !String(r.cost_code_configuration_uuid || '').trim(),
    )
    if (missingCostCode) {
      toast.add({
        title: 'Validation Error',
        description: 'Each row must be linked to this cost code.',
        color: 'error',
        icon: 'i-heroicons-x-circle',
      })
      return
    }
  }

  isSaving.value = true
  try {
    await $fetch('/api/preferred-items/bulk', {
      method: 'POST',
      body: {
        corporation_uuid: corpUuid,
        project_uuid: itemForm.value.project_uuid,
        item_type_uuid: itemForm.value.item_type_uuid,
        rows: itemRows.value.map(r => ({
          ...(r.uuid ? { uuid: r.uuid } : {}),
          item_sequence: r.item_sequence || null,
          item_name: r.item_name,
          description: r.description || null,
          model_number: r.model_number || null,
          unit_price: r.unit_price !== '' && r.unit_price != null ? Number(r.unit_price) : null,
          uom_uuid: r.uom_uuid || null,
          cost_code_configuration_uuid: r.cost_code_configuration_uuid || lockedCostCodeUuid.value || null,
          preferred_vendor_uuid: r.preferred_vendor_uuid || null,
          location_uuid: r.location_uuid || null,
          initial_quantity: r.initial_quantity !== '' && r.initial_quantity != null ? Number(r.initial_quantity) : null,
          as_of_date: r.as_of_date || null,
          reorder_point: r.reorder_point !== '' && r.reorder_point != null ? Number(r.reorder_point) : null,
          maximum_limit: r.maximum_limit !== '' && r.maximum_limit != null ? Number(r.maximum_limit) : null,
          status: r.status || 'Active',
          category: itemForm.value.item_category || null,
        })),
      },
    })

    toast.add({ title: 'Success', description: 'Items saved successfully', color: 'success', icon: 'i-heroicons-check-circle' })
    emit('saved')
    closeModal()
  }
  catch (e: unknown) {
    const msg = ((e as Record<string, unknown>)?.data as Record<string, unknown>)?.statusMessage
      || (e as Error)?.message
      || 'Failed to save items'
    toast.add({ title: 'Error', description: String(msg), color: 'error', icon: 'i-heroicons-x-circle' })
  }
  finally {
    isSaving.value = false
  }
}

function closeModal() {
  emit('update:modelValue', false)
  itemRows.value = []
  itemForm.value = { project_uuid: '', item_category: '', item_type_uuid: '' }
}

// ── Quick Add Item Type ───────────────────────────────────────────────────────
const showQuickAddItemType = ref(false)
const isCreatingItemType = ref(false)
const quickItemTypeForm = ref({
  corporation_uuid: '',
  category: '',
  spec_type: '',
  item_division_uuid: '',
  item_type: '',
  description: '',
  is_active: true,
})

const isQuickItemTypeValid = computed(() =>
  !!quickItemTypeForm.value.category?.trim()
  && !!quickItemTypeForm.value.spec_type?.trim()
  && !!quickItemTypeForm.value.item_type?.trim(),
)

function openQuickAddItemType() {
  quickItemTypeForm.value = {
    corporation_uuid: corpId.value,
    category: itemForm.value.item_category || '',
    spec_type: '',
    item_division_uuid: '',
    item_type: '',
    description: '',
    is_active: true,
  }
  showQuickAddItemType.value = true
}

async function saveQuickItemType() {
  if (!isQuickItemTypeValid.value) {
    toast.add({ title: 'Validation Error', description: 'Please fill in all required fields', color: 'error', icon: 'i-heroicons-x-circle' })
    return
  }
  isCreatingItemType.value = true
  try {
    const result = await itemTypesStore.createItemType({
      corporation_uuid: corpId.value || null,
      category: quickItemTypeForm.value.category,
      spec_type: quickItemTypeForm.value.spec_type.trim(),
      item_division_uuid: quickItemTypeForm.value.item_division_uuid?.trim() || null,
      item_type: quickItemTypeForm.value.item_type.trim(),
      description: quickItemTypeForm.value.description?.trim() || null,
      is_active: quickItemTypeForm.value.is_active,
    })
    if (result) {
      toast.add({ title: 'Success', description: 'Item type created', color: 'success', icon: 'i-heroicons-check-circle' })
      itemForm.value.item_type_uuid = result.uuid
      showQuickAddItemType.value = false
    }
    else {
      toast.add({ title: 'Error', description: itemTypesStore.error || 'Failed to create item type', color: 'error', icon: 'i-heroicons-x-circle' })
    }
  }
  finally {
    isCreatingItemType.value = false
  }
}

// ── Initialise when modal opens with an editing item ─────────────────────────
watch(
  () => [props.modelValue, props.initialEditingItem] as const,
  ([open, item]) => {
    if (!open) return
    if (item) {
      itemForm.value = {
        project_uuid: String(item.project_uuid || ''),
        item_category: String(item.category || item.item_category || ''),
        item_type_uuid: String(item.item_type_uuid || ''),
      }
    }
    else {
      itemForm.value = { project_uuid: '', item_category: '', item_type_uuid: '' }
      itemRows.value = []
    }
  },
  { immediate: false },
)
</script>
