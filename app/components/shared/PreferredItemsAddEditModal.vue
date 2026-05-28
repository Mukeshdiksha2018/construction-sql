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
            {{ editingItemLabel }}
          </h3>
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

          <!-- Scrollable table wrapper -->
          <div class="overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            <table class="min-w-[1400px] w-full text-xs">
              <thead class="bg-gray-50 dark:bg-gray-800 text-[11px] font-semibold uppercase tracking-wide text-gray-500 sticky top-0 z-10">
                <tr>
                  <th class="px-3 py-2 text-left w-24">Spec *</th>
                  <th class="px-3 py-2 text-left w-40">Item Name *</th>
                  <th class="px-3 py-2 text-left w-44">Description</th>
                  <th class="px-3 py-2 text-left w-28">Model #</th>
                  <th class="px-3 py-2 text-left w-28">Unit Cost *</th>
                  <th class="px-3 py-2 text-left w-36">UOM</th>
                  <th class="px-3 py-2 text-left w-40">Cost Code</th>
                  <th class="px-3 py-2 text-left w-24">Initial QTY</th>
                  <th class="px-3 py-2 text-left w-32">As of Date</th>
                  <th class="px-3 py-2 text-left w-24">Reorder Pt</th>
                  <th class="px-3 py-2 text-left w-24">Max Limit</th>
                  <th class="px-3 py-2 text-left w-28">Status</th>
                  <th class="px-1 py-2 text-right w-10 sticky right-0 bg-gray-50 dark:bg-gray-800 z-20"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                <tr v-for="(row, idx) in itemRows" :key="idx" class="align-top">
                  <!-- Spec -->
                  <td class="px-2 py-1.5">
                    <UInput v-model="row.item_sequence" size="xs" placeholder="Spec" class="w-full" />
                  </td>
                  <!-- Item Name -->
                  <td class="px-2 py-1.5">
                    <UTextarea
                      v-model="row.item_name"
                      size="xs"
                      placeholder="Enter item name"
                      :rows="2"
                      class="w-full text-xs resize-none"
                    />
                  </td>
                  <!-- Description (TipTap popover) -->
                  <td class="px-2 py-1.5">
                    <UPopover
                      :open="activeDescriptionRow === idx"
                      :content="{ side: 'top', align: 'start' }"
                      :ui="{ content: 'w-[600px] p-3' }"
                      @update:open="(v) => { if (!v && activeDescriptionRow === idx) closeDescriptionEditor() }"
                    >
                      <UTextarea
                        :model-value="plainText(row.description)"
                        size="xs"
                        placeholder="Click to edit description"
                        :rows="2"
                        class="w-full text-xs resize-none cursor-text"
                        readonly
                        @click="openDescriptionEditor(idx)"
                      />
                      <template #content>
                        <div class="space-y-2">
                          <div class="text-xs font-medium text-gray-500">Rich Text Description</div>
                          <div class="border border-gray-200 dark:border-gray-700 rounded-md">
                            <div class="border-b border-gray-200 dark:border-gray-700 p-2 flex flex-wrap gap-1">
                              <UButton icon="i-lucide-bold" size="xs" variant="ghost" color="neutral" @click="descEditor?.chain().focus().toggleBold().run()" />
                              <UButton icon="i-lucide-italic" size="xs" variant="ghost" color="neutral" @click="descEditor?.chain().focus().toggleItalic().run()" />
                              <UButton icon="i-lucide-list" size="xs" variant="ghost" color="neutral" @click="descEditor?.chain().focus().toggleBulletList().run()" />
                              <UButton icon="i-lucide-list-ordered" size="xs" variant="ghost" color="neutral" @click="descEditor?.chain().focus().toggleOrderedList().run()" />
                            </div>
                            <div class="p-3 min-h-[160px] max-h-[260px] overflow-y-auto">
                              <EditorContent :editor="descEditor" />
                            </div>
                          </div>
                          <div class="flex justify-end">
                            <UButton size="xs" color="primary" label="Done" @click="closeDescriptionEditor" />
                          </div>
                        </div>
                      </template>
                    </UPopover>
                  </td>
                  <!-- Model # -->
                  <td class="px-2 py-1.5">
                    <UInput v-model="row.model_number" size="xs" placeholder="Model #" class="w-full" />
                  </td>
                  <!-- Unit Cost -->
                  <td class="px-2 py-1.5">
                    <div class="relative">
                      <UInput
                        v-model="row.unit_price"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        size="xs"
                        class="w-full pl-5"
                      />
                      <span class="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                    </div>
                  </td>
                  <!-- UOM -->
                  <td class="px-2 py-1.5">
                    <SharedUOMSelect
                      :model-value="row.unit"
                      placeholder="Select UOM"
                      size="xs"
                      class-name="w-full"
                      @update:model-value="(v: string | undefined) => { row.unit = v || '' }"
                    />
                  </td>
                  <!-- Cost Code -->
                  <td class="px-2 py-1.5">
                    <SharedCostCodeSelect
                      :model-value="row.cost_code_configuration_uuid"
                      placeholder="Select cost code"
                      size="xs"
                      :corporation-uuid="corpId"
                      class="w-full"
                      @change="(v: unknown) => { const uuid = typeof v === 'string' ? v : (v as Record<string, string>)?.value ?? ''; row.cost_code_configuration_uuid = uuid }"
                    />
                  </td>
                  <!-- Initial QTY -->
                  <td class="px-2 py-1.5">
                    <UInput
                      v-model="row.initial_quantity"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0"
                      size="xs"
                      class="w-full"
                    />
                  </td>
                  <!-- As of Date -->
                  <td class="px-2 py-1.5">
                    <UInput
                      :model-value="localDate(row.as_of_date)"
                      type="date"
                      size="xs"
                      class="w-full"
                      @update:model-value="(v: string) => row.as_of_date = v || ''"
                    />
                  </td>
                  <!-- Reorder Point -->
                  <td class="px-2 py-1.5">
                    <UInput v-model="row.reorder_point" type="number" step="0.01" min="0" placeholder="0" size="xs" class="w-full" />
                  </td>
                  <!-- Max Limit -->
                  <td class="px-2 py-1.5">
                    <UInput v-model="row.maximum_limit" type="number" step="0.01" min="0" placeholder="0" size="xs" class="w-full" />
                  </td>
                  <!-- Status -->
                  <td class="px-2 py-1.5">
                    <div class="flex items-center gap-2">
                      <USwitch
                        :model-value="row.status === 'Active'"
                        size="sm"
                        @update:model-value="(v: boolean) => row.status = v ? 'Active' : 'Inactive'"
                      />
                      <span class="text-xs text-gray-500">{{ row.status }}</span>
                    </div>
                  </td>
                  <!-- Delete -->
                  <td class="px-1 py-1.5 text-right sticky right-0 bg-white dark:bg-gray-900 z-10">
                    <UButton
                      icon="mingcute:delete-fill"
                      size="xs"
                      color="error"
                      variant="soft"
                      @click="itemRows.splice(idx, 1)"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

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
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { useCorporationStore } from '~/stores/corporations'
import { useItemTypesStore } from '~/stores/itemTypes'
import { usePreferredItemsStore } from '~/stores/preferredItems'

interface Props {
  modelValue: boolean
  initialEditingItem?: Record<string, unknown> | null
}

const props = withDefaults(defineProps<Props>(), {
  initialEditingItem: null,
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
const corpId = computed(() => corpStore.selectedCorporation?.id ?? '')

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
  unit: string
  cost_code_configuration_uuid: string
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
    unit: '',
    cost_code_configuration_uuid: '',
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
      const response = await $fetch<{ data: Record<string, unknown>[] }>(
        `/api/preferred-items?corporation_uuid=${corpUuid}&project_uuid=${projectUuid}&item_type_uuid=${itemTypeUuid}`,
      )
      itemRows.value = (response?.data || []).map(r => ({
        uuid: String(r.uuid || ''),
        item_sequence: String(r.item_sequence || ''),
        item_name: String(r.item_name || ''),
        description: String(r.description || ''),
        model_number: String(r.model_number || ''),
        unit_price: r.unit_price != null ? r.unit_price : '',
        unit: String(r.unit || ''),
        cost_code_configuration_uuid: String(r.cost_code_configuration_uuid || ''),
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
          unit: r.unit || null,
          cost_code_configuration_uuid: r.cost_code_configuration_uuid || null,
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
        item_category: String(item.category || ''),
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
