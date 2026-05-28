<template>
  <div>
    <!-- Cost Code Divisions Table — loading skeleton -->
    <div v-if="divisionsStore.loading">
      <div class="relative overflow-auto rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div class="bg-gray-50 dark:bg-gray-700">
          <div class="grid grid-cols-6 gap-4 px-2 py-2 text-sm font-bold border-b border-gray-200 dark:border-gray-600">
            <div v-for="i in 6" :key="i" class="flex items-center gap-2">
              <USkeleton class="h-4 w-20" />
            </div>
          </div>
        </div>
        <div class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          <div v-for="i in 6" :key="i" class="grid grid-cols-6 gap-4 px-2 py-2">
            <USkeleton v-for="j in 6" :key="j" class="h-4 w-full" />
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="filteredDivisions.length">
      <UTable
        ref="table"
        sticky
        v-model:pagination="pagination"
        v-model:column-pinning="columnPinning"
        v-model:sorting="sorting"
        :pagination-options="paginationOptions"
        :data="filteredDivisions"
        :columns="columns"
        class="max-h-[70vh] overflow-auto"
      />
      <div v-if="shouldShowPagination(filteredDivisions.length).value" class="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-600">Show:</span>
          <USelect v-model="pagination.pageSize" :items="pageSizeOptions" icon="i-heroicons-list-bullet" size="sm" variant="outline" class="w-32" @change="updatePageSize(table)" />
        </div>
        <UPagination v-bind="getPaginationProps(table)" />
        <div class="text-sm text-gray-600">
          {{ getPageInfo(table, 'divisions').value }}
        </div>
      </div>
    </div>

    <div v-else class="text-center py-12">
      <div class="text-gray-400 mb-4">
        <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <p class="text-gray-500 text-lg font-medium">No cost code divisions found</p>
      <p class="text-gray-400 text-sm">Get started by adding your first division</p>
    </div>

    <!-- Add / Edit / View Division Modal -->
    <UModal
      v-model:open="showModal"
      :title="isViewMode ? 'View Division' : editingUuid ? 'Edit Division' : 'Add New Division'"
      description="Configure division details for your cost code structure."
      @update:open="onModalClose"
    >
      <template #body>
        <div class="flex flex-col space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Division Number <span class="text-red-500">*</span></label>
            <UInput
              v-model="form.division_number"
              variant="subtle"
              placeholder="e.g., 01, 02, 10"
              class="w-full"
              :readonly="isViewMode"
              @keydown="numericOnly"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Division Name <span class="text-red-500">*</span></label>
            <UInput v-model="form.division_name" variant="subtle" placeholder="e.g., General Requirements, Sitework" class="w-full" :readonly="isViewMode" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Division Order <span class="text-red-500">*</span></label>
            <SharedOrderSelect v-model="form.division_order" placeholder="Select display order" size="sm" :max-order="100" :disabled="isViewMode" />
            <p class="text-xs text-gray-500 mt-1">Select the display order for this division (1-100)</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <UTextarea v-model="form.description" variant="subtle" placeholder="Optional description" class="w-full" :rows="3" :readonly="isViewMode" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <UCheckbox v-model="form.is_active" label="Active" class="text-sm" :disabled="isViewMode" />
              <p class="text-xs text-gray-500 mt-1">Inactive divisions won't appear in selection lists</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">&nbsp;</label>
              <UCheckbox v-model="form.exclude_in_estimates_and_reports" label="Use as other costs" class="text-sm" :disabled="isViewMode" />
              <p class="text-xs text-gray-500 mt-1">When checked, it will be included in other costs.</p>
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <template v-if="isViewMode">
            <UButton color="neutral" variant="solid" @click="showModal = false">Close</UButton>
          </template>
          <template v-else>
            <UButton color="error" variant="soft" @click="showModal = false">Cancel</UButton>
            <UButton color="primary" :loading="saving" @click="submitItem">
              {{ editingUuid ? 'Update' : 'Add' }}
            </UButton>
          </template>
        </div>
      </template>
    </UModal>

    <!-- Delete Confirmation Modal -->
    <UModal v-model:open="showDeleteModal" title="Confirm Delete Division" description="This action cannot be undone.">
      <template #body>
        <div class="flex flex-col space-y-4">
          <div class="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <svg class="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h3 class="text-lg font-medium text-red-800">Delete Division</h3>
              <p class="text-sm text-red-700">
                Are you sure you want to delete this division{{ divisionToDelete && getConfigurationsForDivision(divisionToDelete.uuid!).length > 0 ? ' and all its associated cost code configurations' : '' }}?
              </p>
            </div>
          </div>
          <div v-if="divisionToDelete" class="bg-gray-50 p-4 rounded-lg">
            <div class="grid grid-cols-2 gap-2 text-sm">
              <span class="text-gray-500">Number:</span><span class="font-mono font-medium">{{ divisionToDelete.division_number }}</span>
              <span class="text-gray-500">Name:</span><span class="font-medium">{{ divisionToDelete.division_name }}</span>
              <span class="text-gray-500">Order:</span><span>{{ divisionToDelete.division_order }}</span>
              <span class="text-gray-500">Status:</span><span>{{ divisionToDelete.is_active ? 'Active' : 'Inactive' }}</span>
            </div>
          </div>
          <div v-if="divisionToDelete && getConfigurationsForDivision(divisionToDelete.uuid!).length > 0" class="bg-red-50 border border-red-200 p-4 rounded-lg">
            <p class="text-sm text-red-700">
              <strong>Warning:</strong> This division has {{ getConfigurationsForDivision(divisionToDelete.uuid!).length }} cost code configuration(s) associated with it. Deleting this division may affect those configurations.
            </p>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="secondary" variant="soft" @click="showDeleteModal = false">Cancel</UButton>
          <UButton color="error" :loading="deleting" @click="confirmDelete">
            {{ deleting ? 'Deleting...' : 'Delete Division' }}
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h, watch, onMounted, useTemplateRef, resolveComponent } from 'vue'
import { useCostCodeDivisionsStore } from '~/stores/costCodeDivisions'
import { useCostCodeConfigurationsStore } from '~/stores/costCodeConfigurations'
import { useCorporationStore } from '~/stores/corporations'
import { useTableStandard } from '~/composables/useTableStandard'
import type { TableColumn } from '@nuxt/ui'
import type { Column } from '@tanstack/vue-table'

interface Props {
  globalFilter?: string
  showHeader?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  globalFilter: '',
  showHeader: true,
})

defineEmits<{ 'update:globalFilter': [value: string] }>()

const divisionsStore = useCostCodeDivisionsStore()
const configurationsStore = useCostCodeConfigurationsStore()
const corporationStore = useCorporationStore()
const toast = useToast()

const UButton = resolveComponent('UButton')
const UTooltip = resolveComponent('UTooltip')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const { pagination, paginationOptions, pageSizeOptions, updatePageSize, shouldShowPagination, getPaginationProps, getPageInfo } = useTableStandard()
const table = useTemplateRef<any>('table')

const columnPinning = ref({ left: [], right: ['actions'] })
const sorting = ref([])

function getHeader(column: Column<any>, label: string) {
  const isSorted = column.getIsSorted()
  return h(UDropdownMenu, { content: { align: 'start' }, 'aria-label': 'Sort options', items: [
    { label: 'Asc', type: 'checkbox', icon: 'i-lucide-arrow-up-narrow-wide', checked: isSorted === 'asc', onSelect: () => isSorted === 'asc' ? column.clearSorting() : column.toggleSorting(false) },
    { label: 'Desc', icon: 'i-lucide-arrow-down-wide-narrow', type: 'checkbox', checked: isSorted === 'desc', onSelect: () => isSorted === 'desc' ? column.clearSorting() : column.toggleSorting(true) },
  ] }, () => h(UButton, { color: 'neutral', variant: 'ghost', label, icon: isSorted ? (isSorted === 'asc' ? 'i-lucide-arrow-up-narrow-wide' : 'i-lucide-arrow-down-wide-narrow') : 'i-lucide-arrow-up-down', class: '-mx-2.5 data-[state=open]:bg-elevated', 'aria-label': `Sort by ${label}` }))
}

// Form state
const showModal = ref(false)
const isViewMode = ref(false)
const editingUuid = ref<string | null>(null)
const saving = ref(false)
const form = ref({
  division_number: '',
  division_name: '',
  division_order: 1,
  description: '',
  is_active: true,
  exclude_in_estimates_and_reports: false,
})

const showDeleteModal = ref(false)
const divisionToDelete = ref<any>(null)
const deleting = ref(false)

function numericOnly(event: KeyboardEvent) {
  if (!/[0-9]/.test(event.key) && !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
    event.preventDefault()
  }
}

function resetForm() {
  form.value = { division_number: '', division_name: '', division_order: 1, description: '', is_active: true, exclude_in_estimates_and_reports: false }
  editingUuid.value = null
  isViewMode.value = false
}

function onModalClose(open: boolean) {
  if (!open) resetForm()
}

const filteredDivisions = computed(() => {
  const searchTerm = props.globalFilter?.trim().toLowerCase() || ''
  const list = searchTerm
    ? divisionsStore.divisions.filter(d =>
      [d.division_number, d.division_name, d.description ?? ''].some(f => f.toLowerCase().includes(searchTerm)),
    )
    : [...divisionsStore.divisions]

  return list.slice().sort((a, b) => {
    if (a.division_order !== b.division_order) return (a.division_order ?? 0) - (b.division_order ?? 0)
    return (a.division_name ?? '').localeCompare(b.division_name ?? '')
  })
})

const getConfigurationsForDivision = (divisionUuid: string) =>
  configurationsStore.configurations.filter((c: any) => c.division_uuid === divisionUuid)

const columns: TableColumn<any>[] = [
  { accessorKey: 'division_number', header: ({ column }) => getHeader(column, 'Number'), enableSorting: true, meta: { class: { th: 'text-left', td: 'text-left' } }, cell: ({ row }) => h('div', { class: 'font-mono text-xs text-default' }, row.original.division_number) },
  { accessorKey: 'division_name', header: 'Division Name', enableSorting: false, meta: { class: { th: 'text-left', td: 'text-left' } }, cell: ({ row }) => h('div', { class: 'text-xs text-default' }, row.original.division_name) },
  { accessorKey: 'division_order', header: ({ column }) => getHeader(column, 'Order'), enableSorting: true, meta: { class: { th: 'text-left', td: 'text-left' } }, cell: ({ row }) => h('div', { class: 'text-xs text-default' }, row.original.division_order) },
  { accessorKey: 'description', header: 'Description', enableSorting: false, meta: { class: { th: 'text-left', td: 'text-left' } }, cell: ({ row }) => h('div', { class: 'text-muted max-w-xs truncate text-xs' }, row.original.description || '-') },
  {
    accessorKey: 'is_active', header: 'Status', enableSorting: false, meta: { class: { th: 'text-left', td: 'text-left' } },
    cell: ({ row }) => {
      const isActive = row.original.is_active
      return h('span', { class: `inline-flex items-center px-2 py-1 gap-1 rounded-md text-xs font-medium ${isActive ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}` }, isActive ? 'Active' : 'Inactive')
    },
  },
  {
    accessorKey: 'actions', header: 'Actions', enableSorting: false,
    meta: { class: { th: 'text-right sticky right-0 z-10 w-40', td: 'text-right sticky right-0 w-40' } },
    cell: ({ row }) => {
      return h('div', { class: 'flex justify-end gap-2' }, [
        h(UTooltip, { text: 'View Division' }, () => [h(UButton, { icon: 'i-heroicons-eye-solid', size: 'xs', variant: 'soft', color: 'neutral', class: 'hover:scale-105 transition-transform', onClick: () => viewDivision(row.original) }, () => '')]),
        h(UTooltip, { text: 'Edit Division' }, () => [h(UButton, { icon: 'tdesign:edit-filled', size: 'xs', variant: 'soft', color: 'secondary', class: 'hover:scale-105 transition-transform', onClick: () => editDivision(row.original) }, () => '')]),
        h(UTooltip, { text: 'Delete Division' }, () => [h(UButton, { icon: 'mingcute:delete-fill', size: 'xs', variant: 'soft', color: 'error', class: 'hover:scale-105 transition-transform', onClick: () => triggerDelete(row.original) }, () => '')]),
      ])
    },
  },
]

function openAddModal() {
  resetForm()
  showModal.value = true
}

function viewDivision(division: any) {
  isViewMode.value = true
  editingUuid.value = null
  form.value = { division_number: division.division_number, division_name: division.division_name, division_order: division.division_order, description: division.description || '', is_active: division.is_active, exclude_in_estimates_and_reports: division.exclude_in_estimates_and_reports || false }
  showModal.value = true
}

function editDivision(division: any) {
  isViewMode.value = false
  editingUuid.value = division.uuid
  form.value = { division_number: division.division_number, division_name: division.division_name, division_order: division.division_order, description: division.description || '', is_active: division.is_active, exclude_in_estimates_and_reports: division.exclude_in_estimates_and_reports || false }
  showModal.value = true
}

function triggerDelete(division: any) {
  const assoc = getConfigurationsForDivision(division.uuid)
  if (assoc.length > 0) {
    toast.add({ title: 'Cannot Delete Division', description: `This division has ${assoc.length} cost code(s) associated with it. Please reassign or remove them first.`, color: 'error', icon: 'i-heroicons-exclamation-triangle' })
    return
  }
  divisionToDelete.value = division
  showDeleteModal.value = true
}

async function submitItem() {
  if (isViewMode.value) return

  if (!form.value.division_number.trim()) {
    toast.add({ title: 'Validation Error', description: 'Division number is required', color: 'error', icon: 'i-heroicons-exclamation-triangle' })
    return
  }
  if (!form.value.division_name.trim()) {
    toast.add({ title: 'Validation Error', description: 'Division name is required', color: 'error', icon: 'i-heroicons-exclamation-triangle' })
    return
  }
  if (!corporationStore.selectedCorporationId) {
    toast.add({ title: 'Validation Error', description: 'Please select a corporation first', color: 'error', icon: 'i-heroicons-exclamation-triangle' })
    return
  }

  saving.value = true
  try {
    if (editingUuid.value) {
      await divisionsStore.updateDivision(editingUuid.value, form.value)
      toast.add({ title: 'Division updated successfully!', icon: 'i-heroicons-check-circle' })
    }
    else {
      await divisionsStore.createDivision({ ...form.value, corporation_uuid: corporationStore.selectedCorporationId })
      toast.add({ title: 'Division added successfully!', icon: 'i-heroicons-check-circle' })
    }
    showModal.value = false
    resetForm()
  }
  catch (error: any) {
    const msg = error?.data?.statusMessage || error?.message || 'An error occurred while saving'
    toast.add({ title: 'Failed to save division', description: msg, color: 'error', icon: 'i-heroicons-exclamation-triangle' })
  }
  finally {
    saving.value = false
  }
}

async function confirmDelete() {
  if (!divisionToDelete.value) return

  deleting.value = true
  try {
    await divisionsStore.deleteDivision(divisionToDelete.value.uuid)
    toast.add({ title: 'Division deleted successfully!', icon: 'i-heroicons-check-circle' })
    showDeleteModal.value = false
    divisionToDelete.value = null
  }
  catch (error) {
    toast.add({ title: 'Failed to delete division', description: error instanceof Error ? error.message : 'An error occurred', icon: 'i-heroicons-exclamation-triangle' })
  }
  finally {
    deleting.value = false
  }
}

watch(() => pagination.value.pageSize, (size) => table.value?.tableApi?.setPageSize(size))
watch(() => props.globalFilter, () => table.value?.tableApi?.setPageIndex(0))
watch(sorting, () => table.value?.tableApi?.setPageIndex(0))

watch(
  () => corporationStore.selectedCorporationId,
  (uuid) => {
    if (!uuid || process.server) return
    const hasDivisions = divisionsStore.getDivisionCountByCorporation(uuid) > 0
    if (!hasDivisions) divisionsStore.fetchDivisions(uuid, true)
    const hasConfigs = configurationsStore.configurations.some((c: any) => c.corporation_uuid === uuid)
    if (!hasConfigs) configurationsStore.fetchConfigurations(uuid, true)
  },
  { immediate: true },
)

onMounted(() => {
  if (corporationStore.selectedCorporationId) {
    const uuid = corporationStore.selectedCorporationId
    if (divisionsStore.getDivisionCountByCorporation(uuid) === 0) {
      divisionsStore.fetchDivisions(uuid, true)
    }
  }
})

defineExpose({ openAddModal })
</script>
