<template>
  <div>
    <div class="flex justify-end items-center mb-4 gap-2">
      <div class="flex-1 max-w-sm">
        <UInput
          v-model="globalFilter"
          placeholder="Search credit days..."
          icon="i-heroicons-magnifying-glass"
          variant="subtle"
          size="xs"
          class="w-full"
        />
      </div>
      <USelect
        v-model="statusFilter"
        :items="statusFilterOptions"
        size="xs"
        class="w-36"
      />
      <UButton
        icon="i-heroicons-plus"
        color="primary"
        size="xs"
        @click="openModal"
      >
        Add Credit Days
      </UButton>
    </div>

    <div v-if="store.loading && !store.items.length">
      <div class="text-center py-12">
        <div class="text-gray-400 mb-4">
          <UIcon name="i-heroicons-arrow-path" class="w-12 h-12 mx-auto animate-spin" />
        </div>
        <p class="text-gray-500 text-lg">
          Loading credit days...
        </p>
      </div>
    </div>

    <div v-else-if="store.error && !filteredItems.length">
      <UAlert
        icon="i-heroicons-exclamation-triangle"
        color="error"
        variant="soft"
        :title="store.error"
      />
    </div>

    <div v-else-if="filteredItems.length">
      <UTable
        ref="table"
        sticky
        v-model:pagination="pagination"
        v-model:column-pinning="columnPinning"
        v-model:global-filter="globalFilter"
        :pagination-options="paginationOptions"
        :data="filteredItems"
        :columns="columns"
        class="max-h-[70vh] overflow-auto"
      />

      <div
        v-if="shouldShowPagination(filteredItems.length).value"
        class="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4"
      >
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
          {{ getPageInfo(table, 'credit days').value }}
        </div>
      </div>
    </div>

    <div v-else class="text-center py-12">
      <div class="text-gray-400 mb-4">
        <UIcon name="i-heroicons-calendar-days" class="w-12 h-12 mx-auto" />
      </div>
      <p class="text-gray-500 text-lg">
        No credit days found
      </p>
      <p class="text-gray-400 text-sm mb-6">
        Create your first credit days term to get started
      </p>
      <UButton
        icon="i-heroicons-plus"
        @click="openModal"
      >
        Add Credit Days
      </UButton>
    </div>

    <UModal
      v-model:open="showModal"
      :title="editing ? 'Edit Credit Days' : 'Add Credit Days'"
      description="Configure payment term name and number of days."
      :ui="modalUi"
      @update:open="onModalOpenChange"
    >
      <template #body>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-default mb-2">
              Name <span class="text-red-500">*</span>
            </label>
            <UInput
              v-model="form.name"
              variant="subtle"
              placeholder="e.g. Net 30"
              size="md"
              maxlength="50"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-default mb-2">
              Number of days <span class="text-red-500">*</span>
            </label>
            <UInput
              v-model.number="form.interval_days"
              type="number"
              min="0"
              step="1"
              variant="subtle"
              placeholder="Days"
              size="md"
              class="w-full"
            />
          </div>
          <div>
            <label class="flex items-center gap-2 cursor-pointer">
              <USwitch v-model="form.active" color="primary" />
              <span class="text-sm font-medium text-default">Active</span>
            </label>
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
            @click="save"
          >
            {{ editing ? 'Update' : 'Save' }} Credit Days
          </UButton>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="showDeleteModal" :ui="{ footer: 'hidden' }">
      <template #header>
        <div class="flex items-center justify-between w-full gap-4">
          <h3 class="text-lg font-semibold text-default">
            Delete Credit Days
          </h3>
          <div class="flex items-center gap-2">
            <UButton color="neutral" variant="soft" @click="showDeleteModal = false">
              Cancel
            </UButton>
            <UButton color="error" :loading="deleting" @click="confirmDelete">
              Delete Credit Days
            </UButton>
          </div>
        </div>
      </template>
      <template #body>
        <p class="text-sm text-muted">
          The credit days term will be marked deleted in Nimble (Status = 3). Existing vendors keep their credit days reference.
        </p>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, ref, resolveComponent, useTemplateRef } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { useTableStandard } from '~/composables/useTableStandard'
import { useCreditDaysOptions } from '~/composables/useCreditDaysOptions'
import { useCreditDaysStore, type NimbleCreditDays } from '~/stores/creditDays'

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UTooltip = resolveComponent('UTooltip')

const store = useCreditDaysStore()
const toast = useToast()
const { refreshCreditDaysOptions } = useCreditDaysOptions()

const {
  pagination,
  paginationOptions,
  pageSizeOptions,
  updatePageSize,
  getPaginationProps,
  getPageInfo,
  shouldShowPagination,
} = useTableStandard()

const showModal = ref(false)
const showDeleteModal = ref(false)
const editing = ref<NimbleCreditDays | null>(null)
const itemToDelete = ref<NimbleCreditDays | null>(null)
const saving = ref(false)
const deleting = ref(false)
const globalFilter = ref('')
const statusFilter = ref<'all' | 'active' | 'inactive'>('active')

const statusFilterOptions = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
]

const form = ref({
  name: '',
  interval_days: 30,
  active: true,
})

const columnPinning = ref({ left: [] as string[], right: ['actions'] })
const table = useTemplateRef('table')

const modalUi = {
  content: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-1rem)] max-w-lg max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] rounded-lg shadow-lg ring ring-default overflow-hidden',
  body: 'p-4 sm:p-6 max-h-[calc(100dvh-12rem)] overflow-y-auto',
}

const filteredItems = computed(() => {
  let list = store.getAll.filter(item => item.status !== 3)

  if (statusFilter.value === 'active') {
    list = list.filter(item => item.status === 1)
  }
  else if (statusFilter.value === 'inactive') {
    list = list.filter(item => item.status === 0)
  }

  if (!globalFilter.value.trim()) return list

  const search = globalFilter.value.toLowerCase().trim()
  return list.filter((item) => {
    const fields = [
      item.name,
      String(item.interval_days),
      item.status === 1 ? 'active' : 'inactive',
    ]
    return fields.some(f => f.toLowerCase().includes(search))
  })
})

const isFormValid = computed(() =>
  form.value.name.trim() !== ''
  && Number.isFinite(form.value.interval_days)
  && Number.isInteger(form.value.interval_days)
  && form.value.interval_days >= 0,
)

function statusConfig(item: NimbleCreditDays) {
  if (item.status === 1) return { label: 'Active', color: 'success' as const }
  if (item.status === 0) return { label: 'Inactive', color: 'neutral' as const }
  return { label: item.status_label, color: 'neutral' as const }
}

const columns: TableColumn<NimbleCreditDays>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    enableSorting: false,
    meta: { class: { th: 'text-left min-w-[140px]', td: 'text-left' } },
    cell: ({ row }) => h('div', { class: 'font-medium text-default truncate max-w-[200px]' }, row.original.name),
  },
  {
    accessorKey: 'interval_days',
    header: 'Days',
    enableSorting: false,
    meta: { class: { th: 'text-left min-w-[80px]', td: 'text-left' } },
    cell: ({ row }) => h('div', { class: 'font-mono text-sm' }, String(row.original.interval_days)),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    enableSorting: false,
    meta: { class: { th: 'text-left min-w-[90px]', td: 'text-left' } },
    cell: ({ row }) => {
      const config = statusConfig(row.original)
      return h(UBadge, { color: config.color, variant: 'soft', size: 'sm' }, () => config.label)
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    enableSorting: false,
    meta: { class: { th: 'text-right sticky right-0 z-10 w-32', td: 'text-right sticky right-0 w-32' } },
    cell: ({ row }) => h('div', { class: 'flex justify-end space-x-2' }, [
      h(UTooltip, { text: 'Edit Credit Days' }, () => [
        h(UButton, {
          icon: 'tdesign:edit-filled',
          size: 'xs',
          variant: 'soft',
          color: 'secondary',
          class: 'hover:scale-105 transition-transform',
          onClick: () => edit(row.original),
        }, () => ''),
      ]),
      h(UTooltip, { text: 'Delete Credit Days' }, () => [
        h(UButton, {
          icon: 'mingcute:delete-fill',
          size: 'xs',
          variant: 'soft',
          color: 'error',
          class: 'hover:scale-105 transition-transform',
          onClick: () => openDelete(row.original),
        }, () => ''),
      ]),
    ]),
  },
]

function openModal() {
  editing.value = null
  resetForm()
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editing.value = null
  resetForm()
}

function onModalOpenChange(open: boolean) {
  if (!open) closeModal()
}

function resetForm() {
  form.value = { name: '', interval_days: 30, active: true }
}

function edit(item: NimbleCreditDays) {
  editing.value = item
  form.value = {
    name: item.name,
    interval_days: item.interval_days,
    active: item.status === 1,
  }
  showModal.value = true
}

function openDelete(item: NimbleCreditDays) {
  itemToDelete.value = item
  showDeleteModal.value = true
}

function getErrorMessage(e: unknown): string {
  const fetchError = e as { data?: { statusMessage?: string }, message?: string }
  return fetchError?.data?.statusMessage || fetchError?.message || 'Request failed'
}

async function refreshDropdownCache() {
  await refreshCreditDaysOptions()
}

async function save() {
  if (!isFormValid.value) {
    toast.add({ title: 'Validation Error', description: 'Please fill in all required fields', color: 'error' })
    return
  }
  saving.value = true
  try {
    const payload = {
      name: form.value.name,
      interval_days: form.value.interval_days,
      active: form.value.active,
    }
    if (editing.value) {
      await store.updateCreditDays(editing.value.credit_days_id, payload)
      toast.add({ title: 'Success', description: 'Credit days updated successfully', color: 'success' })
    }
    else {
      await store.createCreditDays(payload)
      toast.add({ title: 'Success', description: 'Credit days added successfully', color: 'success' })
    }
    await refreshDropdownCache()
    closeModal()
  }
  catch (e: unknown) {
    toast.add({ title: 'Error', description: getErrorMessage(e), color: 'error' })
  }
  finally {
    saving.value = false
  }
}

async function confirmDelete() {
  if (!itemToDelete.value) return
  deleting.value = true
  try {
    await store.deleteCreditDays(itemToDelete.value.credit_days_id)
    await refreshDropdownCache()
    toast.add({ title: 'Success', description: 'Credit days deleted successfully', color: 'success' })
    showDeleteModal.value = false
    itemToDelete.value = null
  }
  catch (e: unknown) {
    toast.add({ title: 'Error', description: getErrorMessage(e), color: 'error' })
  }
  finally {
    deleting.value = false
  }
}

onMounted(() => {
  store.fetchCreditDays(true)
})
</script>
