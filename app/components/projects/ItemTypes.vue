<template>
  <div class="space-y-4">
    <!-- Loading skeleton -->
    <div v-if="itemTypesStore.loading">
      <div class="relative overflow-auto rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div class="bg-gray-50 dark:bg-gray-700">
          <div class="grid grid-cols-5 gap-4 px-2 py-2 text-sm font-bold text-gray-800 dark:text-gray-200 tracking-wider border-b border-gray-200 dark:border-gray-600">
            <div v-for="i in 4" :key="i" class="flex items-center gap-2">
              <USkeleton class="h-4 w-4 rounded" />
              <USkeleton class="h-4 w-20" />
            </div>
            <div class="flex items-center justify-center">
              <USkeleton class="h-4 w-16" />
            </div>
          </div>
        </div>
        <div class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          <div v-for="i in 5" :key="i" class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
            <div class="grid grid-cols-5 gap-4 px-2 py-1 text-xs text-gray-900 dark:text-gray-100">
              <div v-for="j in 4" :key="j" class="flex items-center">
                <USkeleton class="h-4 w-20" />
              </div>
              <div class="flex items-center justify-end gap-1">
                <USkeleton class="h-6 w-6 rounded" />
                <USkeleton class="h-6 w-6 rounded" />
                <USkeleton class="h-6 w-6 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="itemTypesStore.error">
      <UAlert
        icon="i-heroicons-exclamation-triangle"
        color="error"
        variant="soft"
        :title="itemTypesStore.error"
        description="Please try refreshing the page or contact support if the issue persists."
      />
    </div>

    <div v-else-if="filteredItemTypes.length && isReady">
      <UTable
        ref="table"
        sticky
        v-model:pagination="pagination"
        v-model:column-pinning="columnPinning"
        :pagination-options="paginationOptions"
        :data="filteredItemTypes as any[]"
        :columns="columns"
        v-model:selected="selectedItemTypes"
        :selectable="true"
        class="max-h-[70vh] overflow-auto"
      />

      <div v-if="shouldShowPagination(filteredItemTypes.length).value" class="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-600">Show:</span>
          <USelect
            v-model="pagination.pageSize"
            :items="pageSizeOptions"
            icon="i-heroicons-list-bullet"
            size="sm"
            variant="outline"
            class="w-32"
            @change="updatePageSize(table)"
          />
        </div>
        <UPagination v-bind="getPaginationProps(table)" />
        <div class="text-sm text-gray-600">
          {{ getPageInfo(table, 'item types').value }}
        </div>
      </div>
    </div>

    <div v-else-if="isReady" class="text-center py-12">
      <div class="text-gray-400 mb-4">
        <UIcon name="i-heroicons-tag" class="w-12 h-12 mx-auto" />
      </div>
      <p class="text-gray-500 text-lg">No item types found</p>
      <p class="text-gray-400 text-sm mb-6">
        {{ props.globalFilter ? 'No item types match your search criteria' : 'Create your first item type to get started' }}
      </p>
      <UButton v-if="!props.globalFilter" icon="i-heroicons-plus" @click="openAddModal">
        Add Item Type
      </UButton>
    </div>

    <!-- Add Modal -->
    <UModal v-model:open="showAddModal" :ui="{ wrapper: 'max-w-4xl', body: 'p-6' }">
      <template #header>
        <div class="flex items-center justify-between w-full">
          <h3 class="text-base font-semibold">Add New Item Type</h3>
          <UButton icon="i-heroicons-x-mark" size="xs" variant="solid" color="neutral" @click="closeAddModal" />
        </div>
      </template>
      <template #body>
        <form class="space-y-4">
          <SharedItemTypeFormFields :form="itemTypeForm as any" />
        </form>
      </template>
      <template #footer>
        <div class="flex items-center justify-end gap-2">
          <UButton variant="solid" color="neutral" @click="closeAddModal">Cancel</UButton>
          <UButton
            variant="solid"
            color="primary"
            :disabled="!isFormValid || isCreating"
            :loading="isCreating"
            @click="saveItemType"
          >
            Create Item Type
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Edit Modal -->
    <UModal v-model:open="showEditModal" :ui="{ wrapper: 'max-w-4xl', body: 'p-6' }">
      <template #header>
        <div class="flex items-center justify-between w-full">
          <h3 class="text-base font-semibold">Edit Item Type</h3>
          <UButton icon="i-heroicons-x-mark" size="xs" variant="solid" color="neutral" @click="closeEditModal" />
        </div>
      </template>
      <template #body>
        <form class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-default mb-1">
                Item Category <span class="text-red-500">*</span>
              </label>
              <SharedItemCategorySelect
                v-model="editForm.category"
                placeholder="Select category"
                size="sm"
                class="w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-default mb-1">
                Spec Type <span class="text-red-500">*</span>
              </label>
              <UInput v-model="editForm.spec_type" placeholder="Enter spec type" size="sm" class="w-full" />
            </div>
            <div>
              <label class="block text-sm font-medium text-default mb-1">
                Item Type <span class="text-red-500">*</span>
              </label>
              <UInput v-model="editForm.item_type" placeholder="Enter item type name" size="sm" class="w-full" />
            </div>
            <div>
              <label class="block text-sm font-medium text-default mb-1">Description</label>
              <UTextarea v-model="editForm.description" placeholder="Enter description" size="sm" class="w-full" :rows="3" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-default mb-1">Active</label>
            <UCheckbox v-model="editForm.is_active" label="Active" class="text-sm" />
          </div>
        </form>
      </template>
      <template #footer>
        <div class="flex items-center justify-end gap-2">
          <UButton variant="solid" color="neutral" @click="closeEditModal">Cancel</UButton>
          <UButton
            variant="solid"
            color="primary"
            :disabled="!isEditFormValid || isUpdating"
            :loading="isUpdating"
            @click="updateItemType"
          >
            Update Item Type
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- View Modal -->
    <UModal v-model:open="showViewModal" :ui="{ wrapper: 'max-w-4xl', body: 'p-6' }">
      <template #header>
        <div class="flex items-center justify-between w-full">
          <h3 class="text-base font-semibold">View Item Type</h3>
          <UButton icon="i-heroicons-x-mark" size="xs" variant="solid" color="neutral" @click="closeViewModal" />
        </div>
      </template>
      <template #body>
        <form class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-default mb-1">Item Category</label>
              <SharedItemCategorySelect v-model="viewForm.category" placeholder="—" size="sm" class="w-full" :disabled="true" />
            </div>
            <div>
              <label class="block text-sm font-medium text-default mb-1">Spec Type</label>
              <UInput v-model="viewForm.spec_type" size="sm" class="w-full" :disabled="true" />
            </div>
            <div>
              <label class="block text-sm font-medium text-default mb-1">Item Type</label>
              <UInput v-model="viewForm.item_type" size="sm" class="w-full" :disabled="true" />
            </div>
            <div>
              <label class="block text-sm font-medium text-default mb-1">Description</label>
              <UTextarea v-model="viewForm.description" size="sm" class="w-full" :rows="3" :disabled="true" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-default mb-1">Active</label>
            <UCheckbox v-model="viewForm.is_active" label="Active" class="text-sm" :disabled="true" />
          </div>
        </form>
      </template>
      <template #footer>
        <div class="flex items-center justify-end gap-2">
          <UButton variant="solid" color="neutral" @click="closeViewModal">Close</UButton>
        </div>
      </template>
    </UModal>

    <!-- Delete Modal -->
    <UModal v-model:open="showDeleteModal">
      <template #header>
        <div class="flex items-center justify-between w-full">
          <h3 class="text-base font-semibold text-red-600">Delete Item Type</h3>
          <UButton icon="i-heroicons-x-mark" size="xs" variant="solid" color="neutral" @click="closeDeleteModal" />
        </div>
      </template>
      <template #body>
        <div class="space-y-4">
          <div class="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-6 h-6 text-red-600 flex-shrink-0" />
            <div>
              <p class="font-medium text-red-800 dark:text-red-200">Are you sure you want to delete this item type?</p>
              <p class="text-sm text-red-600 dark:text-red-300 mt-1">This action cannot be undone.</p>
            </div>
          </div>
          <div v-if="itemTypeToDelete" class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 class="font-medium text-gray-900 dark:text-white mb-2">Item Type Details:</h4>
            <div class="space-y-1 text-sm">
              <div><span class="text-gray-600 dark:text-gray-400">Name:</span> <span class="font-medium">{{ itemTypeToDelete.item_type }}</span></div>
              <div><span class="text-gray-600 dark:text-gray-400">Category:</span> <span class="font-medium">{{ getCategoryLabel(itemTypeToDelete.category ?? '') }}</span></div>
              <div><span class="text-gray-600 dark:text-gray-400">Spec Type:</span> <span class="font-medium">{{ itemTypeToDelete.spec_type || '—' }}</span></div>
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex items-center justify-end gap-2">
          <UButton variant="solid" color="neutral" @click="closeDeleteModal">Cancel</UButton>
          <UButton variant="solid" color="error" :loading="isDeleting" @click="confirmDelete">Delete Item Type</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, h, useTemplateRef, resolveComponent } from 'vue'
import { useItemTypesStore } from '~/stores/itemTypes'
import { useCorporationStore } from '~/stores/corporations'
import { getCategoryLabel } from '~/constants/itemCategories'
import { useTableStandard } from '~/composables/useTableStandard'
import { useDateFormat } from '~/composables/useDateFormat'
import { usePermissions } from '~/composables/usePermissions'
import type { TableColumn } from '@nuxt/ui'

const UButton = resolveComponent('UButton')
const UTooltip = resolveComponent('UTooltip')

interface Props {
  globalFilter?: string
}
const props = withDefaults(defineProps<Props>(), { globalFilter: '' })

const corpStore = useCorporationStore()
const itemTypesStore = useItemTypesStore()
const { hasPermission, isReady } = usePermissions()
const { formatDate } = useDateFormat()

const {
  pagination,
  paginationOptions,
  pageSizeOptions,
  updatePageSize,
  getPaginationProps,
  getPageInfo,
  shouldShowPagination,
} = useTableStandard()

const selectedItemTypes = ref<unknown[]>([])
const columnPinning = ref({ left: [], right: ['actions'] })
const table = useTemplateRef<unknown>('table')

const showAddModal = ref(false)
const showEditModal = ref(false)
const showViewModal = ref(false)
const showDeleteModal = ref(false)

const itemTypeForm = ref({ category: '', spec_type: '', item_type: '', description: '', is_active: true })
const editForm = ref({ uuid: '', category: '', spec_type: '', item_type: '', description: '', is_active: true })
const viewForm = ref({ category: '', spec_type: '', item_type: '', description: '', is_active: true })
const itemTypeToDelete = ref<{ uuid: string; item_type: string; category: string; spec_type?: string } | null>(null)

const isCreating = ref(false)
const isUpdating = ref(false)
const isDeleting = ref(false)

const isFormValid = computed(() =>
  !!itemTypeForm.value.category?.trim()
  && !!itemTypeForm.value.spec_type?.trim()
  && !!itemTypeForm.value.item_type?.trim(),
)

const isEditFormValid = computed(() =>
  !!editForm.value.category?.trim()
  && !!editForm.value.spec_type?.trim()
  && !!editForm.value.item_type?.trim(),
)

const filteredItemTypes = computed(() => {
  const corpUuid = String(corpStore.selectedCorporation?.uuid || '')
  let filtered = itemTypesStore.itemTypes.filter((it) => {
    if (!corpUuid) return true
    const corp = String(it.corporation_uuid || '')
    return !corp || corp === corpUuid
  })
  filtered = Array.from(new Map(filtered.map(it => [it.uuid, it])).values())

  if (props.globalFilter?.trim()) {
    const q = props.globalFilter.toLowerCase()
    filtered = filtered.filter(
      it => it.item_type.toLowerCase().includes(q)
        || (it.spec_type || '').toLowerCase().includes(q)
        || (it.description || '').toLowerCase().includes(q)
        || getCategoryLabel(it.category).toLowerCase().includes(q),
    )
  }
  return filtered
})

const columns: TableColumn<unknown>[] = [
  {
    accessorKey: 'category',
    header: 'Category',
    enableSorting: false,
    meta: { class: { th: 'text-left', td: 'text-left' } },
    cell: ({ row }: { row: { original: Record<string, unknown> } }) =>
      h('span', { class: 'text-sm text-default' }, getCategoryLabel(row.original.category as string)),
  },
  {
    accessorKey: 'spec_type',
    header: 'Spec Type',
    enableSorting: false,
    meta: { class: { th: 'text-left', td: 'text-left' } },
    cell: ({ row }: { row: { original: Record<string, unknown> } }) =>
      h('span', { class: 'text-sm text-default' }, String(row.original.spec_type || '—')),
  },
  {
    accessorKey: 'item_type',
    header: 'Item Type',
    enableSorting: false,
    meta: { class: { th: 'text-left', td: 'text-left' } },
    cell: ({ row }: { row: { original: Record<string, unknown> } }) =>
      h('div', { class: 'flex flex-col' }, [
        h('span', { class: 'text-sm font-medium text-default' }, String(row.original.item_type || '')),
        row.original.description ? h('span', { class: 'text-xs text-gray-500' }, String(row.original.description)) : null,
      ].filter(Boolean)),
  },
  {
    accessorKey: 'is_active',
    header: 'Status',
    enableSorting: false,
    meta: { class: { th: 'text-left', td: 'text-left' } },
    cell: ({ row }: { row: { original: Record<string, unknown> } }) => {
      const isActive = Boolean(row.original.is_active)
      const colorClass = isActive ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
      return h('span', { class: `inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${colorClass}` }, isActive ? 'Active' : 'Inactive')
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Created',
    enableSorting: false,
    meta: { class: { th: 'text-left', td: 'text-left' } },
    cell: ({ row }: { row: { original: Record<string, unknown> } }) =>
      h('div', { class: 'text-sm text-gray-600 dark:text-gray-400' }, formatDate(row.original.created_at as string)),
  },
  {
    accessorKey: 'actions',
    header: 'Actions',
    enableSorting: false,
    meta: { class: { th: 'text-right sticky right-0 z-10 w-32', td: 'text-right sticky right-0 w-32' } },
    cell: ({ row }: { row: { original: Record<string, unknown> } }) => {
      const buttons = []
      if (hasPermission('project_items_view')) {
        buttons.push(h(UTooltip, { text: 'View' }, () => [
          h(UButton, { icon: 'i-heroicons-eye-solid', size: 'xs', variant: 'soft', color: 'neutral', onClick: () => openViewModal(row.original) }),
        ]))
      }
      if (hasPermission('project_items_edit')) {
        buttons.push(h(UTooltip, { text: 'Edit' }, () => [
          h(UButton, { icon: 'tdesign:edit-filled', size: 'xs', variant: 'soft', color: 'secondary', onClick: () => openEditModal(row.original) }),
        ]))
      }
      if (hasPermission('project_items_delete')) {
        buttons.push(h(UTooltip, { text: 'Delete' }, () => [
          h(UButton, { icon: 'mingcute:delete-fill', size: 'xs', variant: 'soft', color: 'error', onClick: () => openDeleteModal(row.original) }),
        ]))
      }
      return h('div', { class: 'flex justify-end gap-1' }, buttons)
    },
  },
]

function openAddModal() {
  itemTypeForm.value = { category: '', spec_type: '', item_type: '', description: '', is_active: true }
  showAddModal.value = true
}
function closeAddModal() { showAddModal.value = false }

function openViewModal(it: Record<string, unknown>) {
  viewForm.value = {
    category: String(it.category || ''),
    spec_type: String(it.spec_type || ''),
    item_type: String(it.item_type || ''),
    description: String(it.description || ''),
    is_active: Boolean(it.is_active),
  }
  showViewModal.value = true
}
function closeViewModal() { showViewModal.value = false }

function openEditModal(it: Record<string, unknown>) {
  editForm.value = {
    uuid: String(it.uuid || ''),
    category: String(it.category || ''),
    spec_type: String(it.spec_type || ''),
    item_type: String(it.item_type || ''),
    description: String(it.description || ''),
    is_active: Boolean(it.is_active),
  }
  showEditModal.value = true
}
function closeEditModal() { showEditModal.value = false }

function openDeleteModal(it: Record<string, unknown>) {
  itemTypeToDelete.value = {
    uuid: String(it.uuid || ''),
    item_type: String(it.item_type || ''),
    category: String(it.category || ''),
    spec_type: String(it.spec_type || ''),
  }
  showDeleteModal.value = true
}
function closeDeleteModal() { showDeleteModal.value = false; itemTypeToDelete.value = null }

const toast = useToast()

async function saveItemType() {
  if (!isFormValid.value) {
    toast.add({ title: 'Validation Error', description: 'Please fill in all required fields.', color: 'error', icon: 'i-heroicons-x-circle' })
    return
  }
  isCreating.value = true
  const result = await itemTypesStore.createItemType({
    corporation_uuid: corpStore.selectedCorporation?.uuid || null,
    category: itemTypeForm.value.category,
    spec_type: itemTypeForm.value.spec_type.trim(),
    item_type: itemTypeForm.value.item_type.trim(),
    description: itemTypeForm.value.description?.trim() || null,
    is_active: itemTypeForm.value.is_active,
  })
  isCreating.value = false
  if (result) {
    toast.add({ title: 'Success', description: 'Item type created successfully', color: 'success', icon: 'i-heroicons-check-circle' })
    closeAddModal()
  }
  else {
    toast.add({ title: 'Error', description: itemTypesStore.error || 'Failed to create item type', color: 'error', icon: 'i-heroicons-x-circle' })
  }
}

async function updateItemType() {
  if (!isEditFormValid.value) {
    toast.add({ title: 'Validation Error', description: 'Please fill in all required fields.', color: 'error', icon: 'i-heroicons-x-circle' })
    return
  }
  isUpdating.value = true
  const result = await itemTypesStore.updateItemType({
    uuid: editForm.value.uuid,
    category: editForm.value.category,
    spec_type: editForm.value.spec_type.trim(),
    item_type: editForm.value.item_type.trim(),
    description: editForm.value.description?.trim() || null,
    is_active: editForm.value.is_active,
  })
  isUpdating.value = false
  if (result) {
    toast.add({ title: 'Success', description: 'Item type updated successfully', color: 'success', icon: 'i-heroicons-check-circle' })
    closeEditModal()
  }
  else {
    toast.add({ title: 'Error', description: itemTypesStore.error || 'Failed to update item type', color: 'error', icon: 'i-heroicons-x-circle' })
  }
}

async function confirmDelete() {
  if (!itemTypeToDelete.value) return
  isDeleting.value = true
  const success = await itemTypesStore.deleteItemType(itemTypeToDelete.value.uuid)
  isDeleting.value = false
  if (success) {
    toast.add({ title: 'Success', description: 'Item type deleted successfully', color: 'success', icon: 'i-heroicons-check-circle' })
    closeDeleteModal()
  }
  else {
    toast.add({ title: 'Error', description: itemTypesStore.error || 'Failed to delete item type', color: 'error', icon: 'i-heroicons-x-circle' })
  }
}

watch(
  () => corpStore.selectedCorporation?.uuid,
  (uuid) => { if (uuid) itemTypesStore.fetchItemTypes(uuid) },
  { immediate: true },
)

defineExpose({ openAddModal })
</script>
