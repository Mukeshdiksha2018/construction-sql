<template>
  <div>
    <div class="flex justify-end items-center mb-4">
      <div class="mr-1">
        <UInput
          v-model="globalFilter"
          placeholder="Search PO instructions..."
          icon="i-heroicons-magnifying-glass"
          variant="subtle"
          size="xs"
        />
      </div>
      <UButton
        icon="i-material-symbols-add-rounded"
        size="xs"
        color="primary"
        variant="solid"
        @click="openModal"
      >
        Add PO Instruction
      </UButton>
    </div>

    <div v-if="poInstructionsStore.loading">
      <div class="relative overflow-auto rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div class="bg-gray-50 dark:bg-gray-700">
          <div class="grid grid-cols-4 gap-4 px-2 py-2 text-sm font-bold text-gray-800 dark:text-gray-200 tracking-wider border-b border-gray-200 dark:border-gray-600">
            <div class="flex items-center gap-2">
              <USkeleton class="h-4 w-4 rounded" />
              <USkeleton class="h-4 w-24" />
            </div>
            <div class="col-span-2 flex items-center gap-2">
              <USkeleton class="h-4 w-4 rounded" />
              <USkeleton class="h-4 w-16" />
            </div>
            <div class="flex items-center justify-center">
              <USkeleton class="h-4 w-16" />
            </div>
          </div>
        </div>
        <div class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          <div v-for="i in 5" :key="i">
            <div class="grid grid-cols-4 gap-4 px-2 py-1 text-xs">
              <div><USkeleton class="h-4 w-32" /></div>
              <div class="col-span-2"><USkeleton class="h-4 w-48" /></div>
              <div class="flex justify-end gap-1">
                <USkeleton class="h-6 w-6 rounded" />
                <USkeleton class="h-6 w-6 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="poInstructionsStore.error">
      <p class="text-red-500">
        Error: {{ poInstructionsStore.error }}
      </p>
    </div>

    <div v-else-if="!corporationId" class="text-center py-12">
      <p class="text-muted">
        Select a corporation to manage PO instructions.
      </p>
    </div>

    <div v-else-if="filteredPOInstructions.length">
      <UTable
        ref="table"
        v-model:pagination="pagination"
        v-model:column-pinning="columnPinning"
        :pagination-options="paginationOptions"
        :data="filteredPOInstructions"
        :columns="columns"
        v-model:global-filter="globalFilter"
        sticky
        class="max-h-[70vh] overflow-auto"
      />

      <div
        v-if="shouldShowPagination"
        class="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4"
      >
        <div class="flex items-center gap-2">
          <span class="text-sm text-muted">Show:</span>
          <USelect
            v-model="pagination.pageSize"
            :items="pageSizeOptions"
            icon="i-heroicons-list-bullet"
            size="sm"
            variant="outline"
            class="w-32"
            @change="updatePageSize"
          />
        </div>
        <UPagination
          :default-page="(table?.tableApi?.getState().pagination.pageIndex || 0) + 1"
          :items-per-page="table?.tableApi?.getState().pagination.pageSize"
          :total="table?.tableApi?.getFilteredRowModel().rows.length"
          @update:page="(p: number) => table?.tableApi?.setPageIndex(p - 1)"
        />
        <div class="text-sm text-muted">
          Showing
          {{ (table?.tableApi?.getState().pagination.pageIndex || 0) * (table?.tableApi?.getState().pagination.pageSize || 10) + 1 }}
          to
          {{ Math.min(((table?.tableApi?.getState().pagination.pageIndex || 0) + 1) * (table?.tableApi?.getState().pagination.pageSize || 10), table?.tableApi?.getFilteredRowModel().rows.length || 0) }}
          of
          {{ table?.tableApi?.getFilteredRowModel().rows.length || 0 }}
          PO instructions
        </div>
      </div>
    </div>

    <p v-else class="text-muted text-center py-12">
      No PO instructions found.
    </p>

    <UModal
      v-model:open="showModal"
      :title="editingPOInstruction ? 'Edit PO Instruction' : 'Add New PO Instruction'"
      description="Configure PO instruction details."
      :ui="modalUi"
      @update:open="closeModal"
    >
      <template #body>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-default mb-2">
              Corporation <span class="text-red-500">*</span>
            </label>
            <div class="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 text-sm">
              <UIcon name="i-heroicons-building-office-2" class="text-gray-500 w-4 h-4" />
              <span class="text-default font-medium">{{ corporationName }}</span>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-default mb-2">
              PO Instruction Name <span class="text-red-500">*</span>
            </label>
            <UInput
              v-model="form.po_instruction_name"
              variant="subtle"
              placeholder="Enter PO instruction name"
              size="md"
              class="w-full"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-default mb-2">
              Instruction <span class="text-red-500">*</span>
            </label>
            <UTextarea
              v-model="form.instruction"
              variant="subtle"
              placeholder="Enter detailed instruction"
              size="md"
              :rows="4"
              class="w-full"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-default mb-2">
              Status <span class="text-red-500">*</span>
            </label>
            <USelect
              v-model="form.status"
              :items="statusOptions"
              variant="subtle"
              placeholder="Select status"
              size="md"
              class="w-full"
            />
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="outline" @click="closeModal">
            Cancel
          </UButton>
          <UButton
            color="primary"
            :loading="saving"
            :disabled="!isFormValid"
            @click="savePOInstruction"
          >
            {{ editingPOInstruction ? 'Update' : 'Save' }} PO Instruction
          </UButton>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="showDeleteModal">
      <template #header>
        <div class="flex items-center justify-between w-full">
          <h3 class="text-base font-semibold text-red-600">
            Delete PO Instruction
          </h3>
          <UButton icon="i-heroicons-x-mark" size="xs" variant="solid" color="neutral" @click="closeDeleteModal" />
        </div>
      </template>

      <template #body>
        <div class="space-y-4">
          <div class="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-6 h-6 text-red-600 flex-shrink-0" />
            <div>
              <p class="font-medium text-red-800 dark:text-red-200">
                Are you sure you want to delete this PO instruction?
              </p>
              <p class="text-sm text-red-600 dark:text-red-300 mt-1">
                This action cannot be undone.
              </p>
            </div>
          </div>

          <div v-if="poInstructionToDelete" class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 class="font-medium text-default mb-2">
              PO Instruction Details:
            </h4>
            <div class="space-y-1 text-sm">
              <div><span class="text-muted">Name:</span> <span class="font-medium">{{ poInstructionToDelete.po_instruction_name }}</span></div>
              <div><span class="text-muted">Status:</span> <span class="font-medium">{{ poInstructionToDelete.status }}</span></div>
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex items-center justify-end gap-2">
          <UButton variant="solid" color="neutral" @click="closeDeleteModal">
            Cancel
          </UButton>
          <UButton
            variant="solid"
            color="error"
            :loading="isDeleting"
            @click="confirmDeletePOInstruction"
          >
            Delete PO Instruction
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, ref, resolveComponent, useTemplateRef, watch } from 'vue'
import { getPaginationRowModel } from '@tanstack/vue-table'
import type { TableColumn } from '@nuxt/ui'
import { useCorporationStore } from '~/stores/corporations'
import { usePOInstructionsStore, type POInstruction } from '~/stores/poInstructions'

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UTooltip = resolveComponent('UTooltip')

const corpStore = useCorporationStore()
const poInstructionsStore = usePOInstructionsStore()
const toast = useToast()

const showModal = ref(false)
const showDeleteModal = ref(false)
const editingPOInstruction = ref<POInstruction | null>(null)
const poInstructionToDelete = ref<POInstruction | null>(null)
const saving = ref(false)
const isDeleting = ref(false)
const globalFilter = ref('')

const form = ref({
  po_instruction_name: '',
  instruction: '',
  status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
})

const statusOptions = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
]

const pagination = ref({ pageIndex: 0, pageSize: 10 })
const columnPinning = ref({ left: [] as string[], right: ['actions'] })
const paginationOptions = ref({ getPaginationRowModel: getPaginationRowModel() })
const table = useTemplateRef<{ tableApi?: {
  getState: () => { pagination: { pageIndex: number, pageSize: number } }
  getFilteredRowModel: () => { rows: unknown[] }
  setPageIndex: (n: number) => void
  setPageSize: (n: number) => void
} }>('table')

const pageSizeOptions = [
  { label: '10 per page', value: 10 },
  { label: '25 per page', value: 25 },
  { label: '50 per page', value: 50 },
  { label: '100 per page', value: 100 },
]

const modalUi = {
  content: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-1rem)] max-w-2xl max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] rounded-lg shadow-lg ring ring-default overflow-hidden',
  body: 'p-4 sm:p-6 max-h-[calc(100dvh-12rem)] overflow-y-auto',
}

const corporationId = computed(() => corpStore.selectedCorporationId || '')
const corporationName = computed(() => corpStore.selectedCorporation?.name || 'N/A')

const filteredPOInstructions = computed(() => {
  const corpId = corporationId.value
  if (!corpId) return []
  const list = poInstructionsStore.getPOInstructionsByCorporation(corpId)
  if (!globalFilter.value.trim()) return list
  const search = globalFilter.value.toLowerCase().trim()
  return list.filter((po) => {
    const fields = [
      po.po_instruction_name || '',
      po.instruction || '',
      po.status || '',
    ]
    return fields.some(f => f.toLowerCase().includes(search))
  })
})

const shouldShowPagination = computed(() => filteredPOInstructions.value.length > 10)
const isFormValid = computed(() => {
  return form.value.po_instruction_name.trim() !== ''
    && form.value.instruction.trim() !== ''
})

const columns: TableColumn<POInstruction>[] = [
  {
    accessorKey: 'po_instruction_name',
    header: 'PO Instruction Name',
    enableSorting: false,
    meta: { style: { th: 'width: 25%; min-width: 200px;', td: 'width: 25%; min-width: 200px;' } },
    cell: ({ row }) => h('div', { class: 'font-medium text-default' }, row.original.po_instruction_name),
  },
  {
    accessorKey: 'instruction',
    header: 'Instruction',
    enableSorting: false,
    meta: { style: { th: 'width: 45%; max-width: 400px;', td: 'width: 45%; max-width: 400px;' } },
    cell: ({ row }) => {
      const text = row.original.instruction || ''
      if (text.length > 80) {
        return h(UTooltip, { text }, () => h('div', { class: 'text-default text-sm truncate cursor-help', style: 'max-width: 380px;' }, text))
      }
      return h('div', { class: 'text-default text-sm truncate', style: 'max-width: 380px;' }, text)
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    enableSorting: false,
    meta: { style: { th: 'width: 15%;', td: 'width: 15%;' } },
    cell: ({ row }) => {
      const status = row.original.status
      return h(UBadge, { color: status === 'ACTIVE' ? 'success' : 'neutral', variant: 'soft', size: 'sm' }, () =>
        status === 'ACTIVE' ? 'Active' : 'Inactive')
    },
  },
  {
    accessorKey: 'actions',
    header: 'Actions',
    enableSorting: false,
    enableHiding: false,
    meta: { class: { th: 'text-right sticky right-0 z-10 w-24', td: 'text-right sticky right-0 w-24' } },
    cell: ({ row }) => {
      const btns = [
        h(UTooltip, { text: 'Edit PO Instruction' }, () => [
          h(UButton, {
            icon: 'i-lucide-pencil',
            size: 'xs',
            color: 'secondary',
            variant: 'soft',
            onClick: () => editPOInstruction(row.original),
          }),
        ]),
        h(UTooltip, { text: 'Delete PO Instruction' }, () => [
          h(UButton, {
            icon: 'i-lucide-trash-2',
            size: 'xs',
            color: 'error',
            variant: 'soft',
            onClick: () => deletePOInstruction(row.original),
          }),
        ]),
      ]
      return h('div', { class: 'flex justify-end gap-1' }, btns)
    },
  },
]

function resetForm() {
  form.value = {
    po_instruction_name: '',
    instruction: '',
    status: 'ACTIVE',
  }
}

function openModal() {
  if (!corporationId.value) {
    toast.add({
      title: 'No Corporation Selected',
      description: 'Please select a corporation first',
      color: 'error',
    })
    return
  }
  editingPOInstruction.value = null
  resetForm()
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingPOInstruction.value = null
  resetForm()
}

function editPOInstruction(poInstruction: POInstruction) {
  editingPOInstruction.value = poInstruction
  form.value = {
    po_instruction_name: poInstruction.po_instruction_name,
    instruction: poInstruction.instruction,
    status: poInstruction.status,
  }
  showModal.value = true
}

async function savePOInstruction() {
  if (!isFormValid.value) {
    toast.add({
      title: 'Validation Error',
      description: 'Please fill in all required fields',
      color: 'error',
    })
    return
  }

  if (!corporationId.value) {
    toast.add({
      title: 'Error',
      description: 'No corporation selected',
      color: 'error',
    })
    return
  }

  saving.value = true
  try {
    if (editingPOInstruction.value) {
      await poInstructionsStore.updatePOInstruction(editingPOInstruction.value.uuid, {
        po_instruction_name: form.value.po_instruction_name,
        instruction: form.value.instruction,
        status: form.value.status,
      })
      toast.add({
        title: 'Success',
        description: 'PO instruction updated successfully',
        color: 'success',
      })
    }
    else {
      await poInstructionsStore.createPOInstruction(corporationId.value, {
        corporation_uuid: corporationId.value,
        po_instruction_name: form.value.po_instruction_name,
        instruction: form.value.instruction,
        status: form.value.status,
      })
      toast.add({
        title: 'Success',
        description: 'PO instruction added successfully',
        color: 'success',
      })
    }
    closeModal()
  }
  catch (error: unknown) {
    const err = error as { data?: { statusMessage?: string }, message?: string }
    toast.add({
      title: 'Error',
      description: err?.data?.statusMessage || err?.message || 'Failed to save PO instruction',
      color: 'error',
    })
  }
  finally {
    saving.value = false
  }
}

function deletePOInstruction(poInstruction: POInstruction) {
  poInstructionToDelete.value = poInstruction
  showDeleteModal.value = true
}

function closeDeleteModal() {
  showDeleteModal.value = false
  poInstructionToDelete.value = null
  isDeleting.value = false
}

async function confirmDeletePOInstruction() {
  if (!poInstructionToDelete.value) return

  isDeleting.value = true
  try {
    await poInstructionsStore.deletePOInstruction(poInstructionToDelete.value.uuid)
    toast.add({
      title: 'Success',
      description: 'PO instruction deleted successfully',
      color: 'success',
    })
    closeDeleteModal()
  }
  catch (error: unknown) {
    const err = error as { data?: { statusMessage?: string }, message?: string }
    toast.add({
      title: 'Error',
      description: err?.data?.statusMessage || err?.message || 'Failed to delete PO instruction',
      color: 'error',
    })
  }
  finally {
    isDeleting.value = false
  }
}

function updatePageSize(newSize: { value?: number } | number) {
  const size = typeof newSize === 'object' ? (newSize.value ?? 10) : newSize
  table.value?.tableApi?.setPageSize(size)
}

watch(
  () => corporationId.value,
  (newCorporationId) => {
    if (newCorporationId) {
      poInstructionsStore.fetchPOInstructions(newCorporationId)
    }
  },
  { immediate: true },
)

onMounted(() => {
  if (corporationId.value) {
    poInstructionsStore.fetchPOInstructions(corporationId.value)
  }
})
</script>
