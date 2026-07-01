<template>
  <div class="space-y-6">
    <div
      v-if="listCorporationUuid"
      class="flex justify-between items-center gap-4"
    >
      <UInput
        v-model="searchFilter"
        placeholder="Search special instructions..."
        icon="i-heroicons-magnifying-glass"
        class="flex-1 max-w-md"
      />
      <UButton
        icon="i-heroicons-plus"
        color="primary"
        @click="openAddModal"
      >
        Add Special Instruction
      </UButton>
    </div>

    <div v-if="loading && specialInstructions.length === 0" class="flex justify-center items-center py-12">
      <div class="text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
        <p class="text-gray-600">
          Loading special instructions...
        </p>
      </div>
    </div>

    <UAlert
      v-else-if="error"
      color="error"
      variant="soft"
      :title="error"
    />

    <div v-else-if="!listCorporationUuid" class="text-center py-12">
      <UIcon name="i-heroicons-document-text" class="w-16 h-16 mx-auto mb-4 text-gray-400" />
      <p class="text-gray-600 font-medium mb-2">
        No corporation selected
      </p>
      <p class="text-sm text-gray-500 mb-4">
        Select a corporation in the app header to view and manage special instructions.
      </p>
    </div>

    <div v-else-if="filteredSpecialInstructions.length === 0" class="text-center py-12">
      <UIcon name="i-heroicons-document-text" class="w-16 h-16 mx-auto mb-4 text-gray-400" />
      <p class="text-gray-600 font-medium mb-2">
        {{ searchFilter ? 'No special instructions found' : 'No special instructions yet' }}
      </p>
      <p class="text-sm text-gray-500 mb-4">
        {{ searchFilter ? 'Try adjusting your search' : 'Get started by adding your first special instruction' }}
      </p>
      <UButton
        v-if="!searchFilter"
        icon="i-heroicons-plus"
        color="primary"
        @click="openAddModal"
      >
        Add Special Instruction
      </UButton>
    </div>

    <UTable
      v-else
      :data="filteredSpecialInstructions"
      :columns="columns"
      class="w-full"
    />

    <UModal
      v-model:open="showModal"
      :close="{ color: 'neutral', variant: 'solid' }"
      :ui="{
        content:
          'top-0 left-0 right-0 bottom-0 translate-x-0 translate-y-0 w-screen h-screen max-w-none max-h-none rounded-none shadow-lg ring-0 overflow-hidden flex flex-col',
        body: 'flex-1 flex flex-col min-h-0 overflow-hidden p-0',
        header: 'px-4 sm:px-6 py-4 border-b border-default flex-shrink-0',
        footer: 'px-4 sm:px-6 py-4 border-t border-default flex-shrink-0',
      }"
      @update:open="(open: boolean) => { if (!open) resetForm() }"
    >
      <template #header>
        <h3 class="text-base font-semibold text-highlighted">
          {{ isEditing ? 'Edit Special Instruction' : 'Add Special Instruction' }}
        </h3>
      </template>

      <template #body>
        <SpecialInstructionFormBody
          :form-state="formState"
          :show-corporation-project-row="true"
          :scope-disabled="false"
          :corporation-disabled="isEditing"
          :editor-sync-open="showModal"
          fill-container
        />
      </template>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="outline" @click="closeModal">
            Cancel
          </UButton>
          <UButton
            color="primary"
            :loading="submitting"
            :disabled="
              !formState.name.trim() ||
                !formState.content.trim() ||
                !String(formState.corporation_uuid).trim() ||
                !String(formState.project_uuid).trim()
            "
            @click="handleSubmit"
          >
            {{ isEditing ? 'Update' : 'Save' }} Special Instruction
          </UButton>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="showDeleteModal" title="Delete Special Instruction">
      <template #body>
        <p class="text-gray-700 dark:text-gray-300">
          Are you sure you want to delete <strong>{{ selectedItem?.name }}</strong>? This action cannot be undone.
        </p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="outline" @click="showDeleteModal = false">
            Cancel
          </UButton>
          <UButton
            color="error"
            :loading="deleting"
            @click="handleDelete"
          >
            Delete
          </UButton>
        </div>
      </template>
    </UModal>

    <UModal
      v-model:open="showPreviewModal"
      title="Special Instruction Details"
      description="View complete information about this special instruction"
      :ui="{
        content: 'max-w-4xl',
        body: 'max-h-[70vh] overflow-y-auto',
      }"
    >
      <template #body>
        <div v-if="previewItem" class="space-y-6">
          <div>
            <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Name
            </label>
            <div class="flex items-center gap-2">
              <p class="text-base font-semibold text-gray-900 dark:text-gray-100">
                {{ previewItem.name }}
              </p>
              <UBadge
                :color="previewItem.isActive ? 'success' : 'neutral'"
                variant="soft"
                size="sm"
              >
                {{ previewItem.isActive ? 'Active' : 'Inactive' }}
              </UBadge>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Corporation
              </label>
              <p class="text-sm text-gray-800 dark:text-gray-200 break-all">
                {{ previewCorporationLabel }}
              </p>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Project
              </label>
              <p class="text-sm text-gray-800 dark:text-gray-200">
                {{ previewItem.project_name || previewItem.project_id || previewItem.project_uuid }}
              </p>
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              Content
            </label>
            <div
              class="prose prose-sm dark:prose-invert max-w-none p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              v-html="previewItem.content"
            />
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="outline" @click="showPreviewModal = false">
            Close
          </UButton>
          <UButton
            color="primary"
            icon="tdesign:edit-filled"
            @click="() => { showPreviewModal = false; if (previewItem) openEditModal(previewItem); }"
          >
            Edit Special Instruction
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, reactive, ref, resolveComponent, watch } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import SpecialInstructionFormBody from '~/components/configurations/SpecialInstructionFormBody.vue'
import { useCorporationStore } from '~/stores/corporations'
import { useSpecialInstructionsStore, type SpecialInstruction } from '~/stores/specialInstructions'

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UTooltip = resolveComponent('UTooltip')

const toast = useToast()
const corporationStore = useCorporationStore()
const specialInstructionsStore = useSpecialInstructionsStore()

const searchFilter = ref('')
const submitting = ref(false)
const deleting = ref(false)
const showModal = ref(false)
const showDeleteModal = ref(false)
const showPreviewModal = ref(false)
const isEditing = ref(false)
const selectedItem = ref<SpecialInstruction | null>(null)
const previewItem = ref<SpecialInstruction | null>(null)

const formState = reactive({
  name: '',
  content: '',
  isActive: 'Active' as 'Active' | 'Inactive' | '',
  corporation_uuid: '' as string,
  project_uuid: '' as string,
})

const listCorporationUuid = computed(
  () => String(corporationStore.selectedCorporation?.uuid ?? '').trim(),
)

async function refreshList() {
  const cid = listCorporationUuid.value
  if (cid) {
    await specialInstructionsStore.fetchList({ corporation_uuid: cid })
  }
  else {
    specialInstructionsStore.clearItems()
  }
}

watch(
  () => corporationStore.selectedCorporationId,
  () => {
    void refreshList()
  },
)

const loading = computed(() => specialInstructionsStore.loading)
const error = computed(() => specialInstructionsStore.error)

const specialInstructions = computed(() => {
  const storeData = specialInstructionsStore.items
  return Array.isArray(storeData) ? [...storeData] : []
})

const filteredSpecialInstructions = computed(() => {
  const data = specialInstructions.value
  if (!data.length) return []
  if (!searchFilter.value.trim()) return data

  const searchTerm = searchFilter.value.toLowerCase().trim()
  return data.filter((row) => {
    const searchableFields = [
      row.name || '',
      row.content ? row.content.replace(/<[^>]*>/g, '') : '',
      row.project_name || '',
      row.project_id || '',
      row.isActive ? 'active' : 'inactive',
    ]
    return searchableFields.some(field => field.toLowerCase().includes(searchTerm))
  })
})

const previewCorporationLabel = computed(() => {
  const uuid = previewItem.value?.corporation_uuid
  if (!uuid) return ''
  const c = corporationStore.corporations?.find(
    (x: { uuid?: string }) => String(x.uuid) === String(uuid),
  )
  return (
    (c as { corporation_name?: string; legal_name?: string } | undefined)?.corporation_name
    || (c as { corporation_name?: string; legal_name?: string } | undefined)?.legal_name
    || uuid
  )
})

const columns: TableColumn<SpecialInstruction>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    enableSorting: false,
    meta: { class: { th: 'text-left', td: 'text-left' } },
    cell: ({ row }) => h('span', { class: 'font-medium' }, row.original.name),
  },
  {
    accessorKey: 'project_name',
    header: 'Project',
    enableSorting: false,
    meta: { class: { th: 'text-left', td: 'text-left' } },
    cell: ({ row }) => {
      const label = row.original.project_name || row.original.project_id || row.original.project_uuid
      return h('span', { class: 'text-gray-600 dark:text-gray-400 text-sm' }, label || '—')
    },
  },
  {
    accessorKey: 'content',
    header: 'Content Preview',
    enableSorting: false,
    meta: { class: { th: 'text-left', td: 'text-left' } },
    cell: ({ row }) => {
      const preview = row.original.content
        ? `${row.original.content.replace(/<[^>]*>/g, '').substring(0, 100)}...`
        : 'No content'
      return h('span', { class: 'text-gray-600 dark:text-gray-400 text-sm' }, preview)
    },
  },
  {
    accessorKey: 'isActive',
    header: 'Status',
    enableSorting: false,
    meta: { class: { th: 'text-left', td: 'text-left' } },
    cell: ({ row }) => h(UBadge, {
      color: row.original.isActive ? 'success' : 'neutral',
      variant: 'soft',
      size: 'sm',
    }, () => (row.original.isActive ? 'Active' : 'Inactive')),
  },
  {
    accessorKey: 'actions',
    header: 'Actions',
    enableSorting: false,
    meta: { class: { th: 'text-right sticky right-0 z-10 w-32', td: 'text-right sticky right-0 w-32' } },
    cell: ({ row }) => h('div', { class: 'flex justify-end gap-1' }, [
      h(UTooltip, { text: 'View Details' }, () => [
        h(UButton, {
          icon: 'i-heroicons-eye-solid',
          size: 'xs',
          color: 'neutral',
          variant: 'soft',
          onClick: () => viewItem(row.original),
        }),
      ]),
      h(UTooltip, { text: 'Edit Special Instruction' }, () => [
        h(UButton, {
          icon: 'tdesign:edit-filled',
          size: 'xs',
          color: 'secondary',
          variant: 'soft',
          onClick: () => openEditModal(row.original),
        }),
      ]),
      h(UTooltip, { text: 'Delete Special Instruction' }, () => [
        h(UButton, {
          icon: 'mingcute:delete-fill',
          size: 'xs',
          color: 'error',
          variant: 'soft',
          onClick: () => confirmDelete(row.original),
        }),
      ]),
    ]),
  },
]

function openAddModal() {
  isEditing.value = false
  selectedItem.value = null
  resetForm()
  formState.corporation_uuid = String(corporationStore.selectedCorporation?.uuid ?? '').trim()
  formState.project_uuid = ''
  showModal.value = true
}

function openEditModal(row: SpecialInstruction) {
  isEditing.value = true
  selectedItem.value = row
  formState.name = row.name
  formState.content = row.content || ''
  formState.isActive = row.isActive ? 'Active' : 'Inactive'
  formState.corporation_uuid = row.corporation_uuid
  formState.project_uuid = row.project_uuid
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  resetForm()
}

function resetForm() {
  formState.name = ''
  formState.content = ''
  formState.isActive = 'Active'
  formState.corporation_uuid = ''
  formState.project_uuid = ''
}

function getMutationErrorMessage(err: unknown, fallback: string): string {
  const e = err as { data?: { statusMessage?: string }; statusMessage?: string; message?: string }
  return e.data?.statusMessage || e.statusMessage || e.message || fallback
}

async function handleSubmit() {
  submitting.value = true
  try {
    const corp = String(formState.corporation_uuid).trim()
    const proj = String(formState.project_uuid).trim()
    let result: SpecialInstruction | undefined

    if (isEditing.value && selectedItem.value && selectedItem.value.id !== undefined) {
      result = await specialInstructionsStore.updateItem(String(selectedItem.value.id), {
        name: formState.name.trim(),
        content: formState.content,
        isActive: formState.isActive === 'Active',
        corporation_uuid: corp,
        project_uuid: proj,
      })
    }
    else {
      result = await specialInstructionsStore.createItem({
        corporation_uuid: corp,
        project_uuid: proj,
        name: formState.name.trim(),
        content: formState.content,
        isActive: formState.isActive === 'Active',
      })
    }

    if (result) {
      showModal.value = false
      resetForm()
      toast.add({
        title: 'Success',
        description: `Special instruction "${result.name}" saved successfully.`,
        color: 'success',
      })
      await refreshList()
    }
  }
  catch (err: unknown) {
    toast.add({
      title: 'Error',
      description: getMutationErrorMessage(err, 'Failed to save special instruction'),
      color: 'error',
    })
  }
  finally {
    submitting.value = false
  }
}

function viewItem(row: SpecialInstruction) {
  previewItem.value = row
  showPreviewModal.value = true
}

function confirmDelete(row: SpecialInstruction) {
  selectedItem.value = row
  showDeleteModal.value = true
}

async function handleDelete() {
  if (!selectedItem.value || selectedItem.value.id === undefined) return

  const deletedName = selectedItem.value.name || 'Special instruction'
  deleting.value = true
  try {
    await specialInstructionsStore.deleteItem(String(selectedItem.value.id))
    showDeleteModal.value = false
    selectedItem.value = null
    toast.add({
      title: 'Success',
      description: `"${deletedName}" has been deleted successfully.`,
      color: 'success',
    })
    await refreshList()
  }
  catch (err: unknown) {
    toast.add({
      title: 'Error',
      description: getMutationErrorMessage(err, 'Failed to delete special instruction'),
      color: 'error',
    })
  }
  finally {
    deleting.value = false
  }
}

onMounted(() => {
  void refreshList()
})
</script>
