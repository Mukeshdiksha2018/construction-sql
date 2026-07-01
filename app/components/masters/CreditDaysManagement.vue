<template>
  <div>
    <div class="flex justify-end items-center mb-4 gap-2">
      <div class="mr-1 flex-1 max-w-sm">
        <UInput
          v-model="globalFilter"
          placeholder="Search credit days..."
          icon="i-heroicons-magnifying-glass"
          variant="subtle"
          size="xs"
        />
      </div>
      <USelect
        v-model="statusFilter"
        :items="statusFilterOptions"
        size="xs"
        class="w-36"
      />
      <UButton
        icon="i-material-symbols-add-rounded"
        size="xs"
        color="primary"
        variant="solid"
        @click="openModal"
      >
        Add Credit Days
      </UButton>
    </div>

    <div v-if="store.loading && !store.items.length">
      <div class="relative overflow-auto rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div class="bg-gray-50 dark:bg-gray-700">
          <div class="grid grid-cols-4 gap-4 px-2 py-2 text-sm font-bold text-gray-800 dark:text-gray-200 tracking-wider border-b border-gray-200 dark:border-gray-600">
            <div class="flex items-center gap-2">
              <USkeleton class="h-4 w-24" />
            </div>
            <div class="flex items-center gap-2">
              <USkeleton class="h-4 w-16" />
            </div>
            <div class="flex items-center gap-2">
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
              <div><USkeleton class="h-4 w-40" /></div>
              <div><USkeleton class="h-4 w-12" /></div>
              <div><USkeleton class="h-4 w-16" /></div>
              <div class="flex justify-end gap-1">
                <USkeleton class="h-6 w-6 rounded" />
                <USkeleton class="h-6 w-6 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="store.error && !filteredItems.length">
      <p class="text-red-500">
        Error: {{ store.error }}
      </p>
    </div>

    <div v-else-if="filteredItems.length">
      <UTable
        ref="table"
        v-model:pagination="pagination"
        v-model:column-pinning="columnPinning"
        v-model:global-filter="globalFilter"
        sticky
        :pagination-options="paginationOptions"
        :data="filteredItems"
        :columns="columns"
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
          credit days
        </div>
      </div>
    </div>

    <p v-else class="text-muted text-center py-12">
      No credit days found.
    </p>

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
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, ref, resolveComponent, useTemplateRef } from 'vue'
import { getPaginationRowModel } from '@tanstack/vue-table'
import type { TableColumn } from '@nuxt/ui'
import { useCreditDaysOptions } from '~/composables/useCreditDaysOptions'
import { useCreditDaysStore, type NimbleCreditDays } from '~/stores/creditDays'

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UTooltip = resolveComponent('UTooltip')

const store = useCreditDaysStore()
const toast = useToast()
const { refreshCreditDaysOptions } = useCreditDaysOptions()

const showModal = ref(false)
const editing = ref<NimbleCreditDays | null>(null)
const saving = ref(false)
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

const shouldShowPagination = computed(() => filteredItems.value.length > 10)

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
    cell: ({ row }) => h('div', { class: 'text-default text-sm font-medium' }, row.original.name),
  },
  {
    accessorKey: 'interval_days',
    header: 'Days',
    enableSorting: false,
    cell: ({ row }) => h('div', { class: 'text-default text-sm font-mono' }, String(row.original.interval_days)),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    enableSorting: false,
    cell: ({ row }) => {
      const config = statusConfig(row.original)
      return h(UBadge, { color: config.color, variant: 'soft', size: 'sm' }, () => config.label)
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
        h(UTooltip, { text: 'Edit Credit Days' }, () => [
          h(UButton, {
            icon: 'i-lucide-pencil',
            size: 'xs',
            color: 'secondary',
            variant: 'soft',
            onClick: () => edit(row.original),
          }),
        ]),
        h(UTooltip, { text: 'Delete Credit Days' }, () => [
          h(UButton, {
            icon: 'i-lucide-trash-2',
            size: 'xs',
            color: 'error',
            variant: 'soft',
            onClick: () => remove(row.original),
          }),
        ]),
      ]
      return h('div', { class: 'flex justify-end gap-1' }, btns)
    },
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

async function remove(item: NimbleCreditDays) {
  try {
    await store.deleteCreditDays(item.credit_days_id)
    await refreshDropdownCache()
    toast.add({ title: 'Success', description: 'Credit days deleted successfully', color: 'success' })
  }
  catch (e: unknown) {
    toast.add({ title: 'Error', description: getErrorMessage(e), color: 'error' })
  }
}

function updatePageSize(newSize: { value?: number } | number) {
  const size = typeof newSize === 'object' ? (newSize.value ?? 10) : newSize
  table.value?.tableApi?.setPageSize(size)
}

onMounted(() => {
  store.fetchCreditDays(true)
})
</script>
