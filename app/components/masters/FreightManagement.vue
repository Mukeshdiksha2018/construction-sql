<template>
  <div>
    <div class="flex justify-end items-center mb-4">
      <div class="mr-1">
        <UInput
          v-model="globalFilter"
          placeholder="Search freight..."
          icon="i-heroicons-magnifying-glass"
          variant="subtle"
          size="xs"
        />
      </div>
      <UButton
        icon="i-heroicons-plus"
        color="primary"
        size="xs"
        @click="openModal"
      >
        Add Freight
      </UButton>
    </div>

    <div v-if="store.loading">
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
              <div class="col-span-2">
                <USkeleton class="h-4 w-48" />
              </div>
              <div class="flex justify-end gap-1">
                <USkeleton class="h-6 w-6 rounded" />
                <USkeleton class="h-6 w-6 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="store.error">
      <p class="text-red-500">
        Error: {{ store.error }}
      </p>
    </div>

    <div v-else-if="filteredFreight.length">
      <UTable
        ref="table"
        v-model:pagination="pagination"
        v-model:column-pinning="columnPinning"
        v-model:global-filter="globalFilter"
        sticky
        :pagination-options="paginationOptions"
        :data="filteredFreight"
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
          freight services
        </div>
      </div>
    </div>

    <p v-else class="text-muted text-center py-12">
      No freight services found.
    </p>

    <UModal
      v-model:open="showModal"
      :title="editing ? 'Edit Freight' : 'Add New Freight'"
      description="Configure freight service details."
      :ui="modalUi"
      @update:open="onModalOpenChange"
    >
      <template #body>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-default mb-2">
              Freight Name <span class="text-red-500">*</span>
            </label>
            <UInput
              v-model="form.freight_name"
              variant="subtle"
              placeholder="Enter freight name (e.g., FedEx, UPS, DHL)"
              size="md"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-default mb-2">Description</label>
            <UTextarea
              v-model="form.description"
              variant="subtle"
              placeholder="Enter description"
              size="md"
              :rows="4"
              class="w-full"
            />
          </div>
          <div>
            <label class="flex items-center gap-2 cursor-pointer">
              <USwitch v-model="form.active" color="primary" />
              <span class="text-sm font-medium text-default">Active</span>
            </label>
            <p class="text-xs text-muted mt-1">
              Toggle to enable or disable this freight service
            </p>
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
            {{ editing ? 'Update' : 'Save' }} Freight
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
import { useFreightStore, type Freight } from '~/stores/freightGlobal'

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UTooltip = resolveComponent('UTooltip')

const store = useFreightStore()
const toast = useToast()

const showModal = ref(false)
const editing = ref<Freight | null>(null)
const saving = ref(false)
const globalFilter = ref('')

const form = ref({ freight_name: '', description: '', active: true })

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

const filteredFreight = computed(() => {
  const list = store.getAllFreight
  if (!globalFilter.value.trim()) return list
  const search = globalFilter.value.toLowerCase().trim()
  return list.filter((item) => {
    const fields = [
      item.freight_name || '',
      item.description || '',
      item.active ? 'active' : 'inactive',
    ]
    return fields.some(f => f.toLowerCase().includes(search))
  })
})

const shouldShowPagination = computed(() => filteredFreight.value.length > 10)
const isFormValid = computed(() => form.value.freight_name.trim() !== '')

const columns: TableColumn<Freight>[] = [
  {
    id: 'freight',
    accessorKey: 'freight_name',
    header: 'Freight',
    enableSorting: false,
    meta: { class: { th: 'text-left min-w-[160px]', td: 'text-left' } },
    cell: ({ row }) => h('div', { class: 'font-medium text-default truncate max-w-[200px]' }, row.original.freight_name),
  },
  {
    accessorKey: 'description',
    header: 'Description',
    enableSorting: false,
    meta: { class: { th: 'text-left min-w-[280px]', td: 'text-left' } },
    cell: ({ row }) => {
      const d = row.original.description || ''
      return h('div', { class: 'text-default text-sm truncate max-w-[380px]' }, d || '-')
    },
  },
  {
    accessorKey: 'active',
    header: 'Active',
    enableSorting: false,
    meta: { class: { th: 'text-left min-w-[90px]', td: 'text-left' } },
    cell: ({ row }) => {
      const active = row.original.active
      return h(UBadge, { color: active ? 'success' : 'neutral', variant: 'soft', size: 'sm' }, () =>
        active ? 'Active' : 'Inactive')
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    enableSorting: false,
    meta: { class: { th: 'text-right sticky right-0 z-10 w-32', td: 'text-right sticky right-0 w-32' } },
    cell: ({ row }) => h('div', { class: 'flex justify-end space-x-2' }, [
      h(UTooltip, { text: 'Edit Freight' }, () => [
        h(UButton, {
          icon: 'tdesign:edit-filled',
          size: 'xs',
          variant: 'soft',
          color: 'secondary',
          class: 'hover:scale-105 transition-transform',
          onClick: () => edit(row.original),
        }, () => ''),
      ]),
      h(UTooltip, { text: 'Delete Freight' }, () => [
        h(UButton, {
          icon: 'mingcute:delete-fill',
          size: 'xs',
          variant: 'soft',
          color: 'error',
          class: 'hover:scale-105 transition-transform',
          onClick: () => remove(row.original),
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
  form.value = { freight_name: '', description: '', active: true }
}

function edit(item: Freight) {
  editing.value = item
  form.value = {
    freight_name: item.freight_name,
    description: item.description || '',
    active: item.active,
  }
  showModal.value = true
}

function getErrorMessage(e: unknown): string {
  const fetchError = e as { data?: { statusMessage?: string }, message?: string }
  return fetchError?.data?.statusMessage || fetchError?.message || 'Request failed'
}

async function save() {
  if (!isFormValid.value) {
    toast.add({ title: 'Validation Error', description: 'Please fill in all required fields', color: 'error' })
    return
  }
  saving.value = true
  try {
    const payload = {
      freight_name: form.value.freight_name,
      description: form.value.description || null,
      active: form.value.active,
    }
    if (editing.value) {
      await store.updateFreight(editing.value.uuid, payload)
      toast.add({ title: 'Success', description: 'Freight updated successfully', color: 'success' })
    }
    else {
      await store.createFreight(payload)
      toast.add({ title: 'Success', description: 'Freight added successfully', color: 'success' })
    }
    closeModal()
  }
  catch (e: unknown) {
    toast.add({ title: 'Error', description: getErrorMessage(e), color: 'error' })
  }
  finally {
    saving.value = false
  }
}

async function remove(item: Freight) {
  try {
    await store.deleteFreight(item.uuid)
    toast.add({ title: 'Success', description: 'Freight deleted successfully', color: 'success' })
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
  store.fetchFreight()
})
</script>
