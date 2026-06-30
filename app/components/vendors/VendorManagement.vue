<template>
  <div>
    <div v-if="corpStore.selectedCorporation" class="flex justify-end items-center mb-4 gap-2">
      <div class="flex-1 max-w-sm">
        <UInput
          v-model="globalFilter"
          placeholder="Search vendors..."
          icon="i-heroicons-magnifying-glass"
          variant="subtle"
          size="xs"
          class="w-full"
        />
      </div>
      <UButton
        icon="i-material-symbols-add-rounded"
        size="xs"
        color="primary"
        variant="solid"
        @click="openCreate"
      >
        Add Vendor
      </UButton>
    </div>

    <p v-else class="text-muted mb-4">
      Select a corporation to manage vendors.
    </p>

    <div v-if="vendorStore.nimbleLoading">
      <p class="text-muted text-sm py-8 text-center">
        Loading vendors...
      </p>
    </div>

    <div v-else-if="vendorStore.nimbleError">
      <p class="text-red-500">
        Error: {{ vendorStore.nimbleError }}
      </p>
    </div>

    <div v-else-if="filteredVendors.length">
      <UTable
        ref="table"
        v-model:pagination="pagination"
        v-model:column-pinning="columnPinning"
        v-model:global-filter="globalFilter"
        sticky
        :pagination-options="paginationOptions"
        :data="filteredVendors"
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
          vendors
        </div>
      </div>
    </div>

    <p v-else class="text-muted text-center py-12">
      No vendors found.
    </p>

    <VendorsVendorForm
      v-model="showModal"
      :vendor="editingVendor"
      @saved="handleSaved"
    />

    <UModal
      v-model:open="showDeleteModal"
      title="Delete Vendor"
      description="The vendor will be marked deleted in Nimble (Status = 3)."
    >
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="outline" @click="showDeleteModal = false">
            Cancel
          </UButton>
          <UButton color="error" :loading="deleting" @click="confirmDelete">
            Delete Vendor
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
import { useVendorStore, type NimbleDbVendor } from '~/stores/vendors'
import { useCorporationStore } from '~/stores/corporations'
import { useChartOfAccountsStore } from '~/stores/chartOfAccounts'

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')

const vendorStore = useVendorStore()
const corpStore = useCorporationStore()
const coaStore = useChartOfAccountsStore()
const toast = useToast()

const showModal = ref(false)
const showDeleteModal = ref(false)
const editingVendor = ref<NimbleDbVendor | null>(null)
const vendorToDelete = ref<NimbleDbVendor | null>(null)
const deleting = ref(false)
const globalFilter = ref('')

const pagination = ref({ pageIndex: 0, pageSize: 10 })
const columnPinning = ref({ left: ['name'], right: ['actions'] })
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

const corporationNameById = computed(() => {
  const map: Record<string, string> = {}
  for (const corp of corpStore.corporations) {
    if (corp.id) map[corp.id.toLowerCase()] = corp.name
  }
  return map
})

const accountLabelById = computed(() => {
  const map: Record<string, string> = {}
  for (const account of coaStore.accounts) {
    const id = (account.uuid ?? '').toLowerCase()
    if (id) map[id] = coaStore.getAccountLabel(account.uuid)
  }
  return map
})

const filteredVendors = computed(() => {
  const corpId = corpStore.selectedCorporation?.id
  if (!corpId) return []
  const list = vendorStore.getNimbleVendorsForCorporation(corpId)
  if (!globalFilter.value.trim()) return list

  const search = globalFilter.value.toLowerCase().trim()
  return list.filter((v) => {
    const fields = [
      v.name,
      v.company_name ?? '',
      v.tax_id ?? '',
      v.contact_person_name ?? '',
      corporationNameById.value[v.corporation_id] ?? '',
      accountLabelById.value[v.account_id ?? ''] ?? '',
    ]
    return fields.some(f => f.toLowerCase().includes(search))
  })
})

const shouldShowPagination = computed(() => filteredVendors.value.length > 10)

function statusBadgeColor(status: number) {
  if (status === 1) return 'success'
  if (status === 3) return 'error'
  return 'neutral'
}

const columns: TableColumn<NimbleDbVendor>[] = [
  {
    accessorKey: 'corporation_id',
    header: 'Corporation',
    enableSorting: false,
    cell: ({ row }) => h('div', corporationNameById.value[row.original.corporation_id] || row.original.corporation_id),
  },
  {
    accessorKey: 'name',
    header: 'Vendor Name',
    enableSorting: false,
    cell: ({ row }) => h('div', { class: 'font-medium text-default' }, row.original.name),
  },
  {
    accessorKey: 'company_name',
    header: 'Company',
    enableSorting: false,
    cell: ({ row }) => h('div', row.original.company_name || '—'),
  },
  {
    accessorKey: 'account_id',
    header: 'Chart of Account',
    enableSorting: false,
    cell: ({ row }) => {
      const id = row.original.account_id
      return h('div', id ? (accountLabelById.value[id] || id) : '—')
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    enableSorting: false,
    cell: ({ row }) => h(UBadge, {
      color: statusBadgeColor(row.original.status),
      variant: 'soft',
      size: 'sm',
    }, () => row.original.status_label),
  },
  {
    accessorKey: 'created_by',
    header: 'Created By',
    enableSorting: false,
    cell: ({ row }) => h('div', { class: 'text-xs text-muted truncate max-w-[120px]' }, row.original.created_by || '—'),
  },
  {
    accessorKey: 'modified_by',
    header: 'Modified By',
    enableSorting: false,
    cell: ({ row }) => h('div', { class: 'text-xs text-muted truncate max-w-[120px]' }, row.original.modified_by || '—'),
  },
  {
    id: 'actions',
    header: 'Actions',
    enableSorting: false,
    cell: ({ row }) => {
      if (row.original.status === 3) {
        return h('span', { class: 'text-xs text-muted' }, 'Deleted')
      }
      return h('div', { class: 'flex justify-end gap-1' }, [
        h(UButton, {
          icon: 'i-heroicons-pencil-square',
          size: 'xs',
          color: 'neutral',
          variant: 'ghost',
          onClick: () => openEdit(row.original),
        }),
        h(UButton, {
          icon: 'i-heroicons-trash',
          size: 'xs',
          color: 'error',
          variant: 'ghost',
          onClick: () => openDelete(row.original),
        }),
      ])
    },
  },
]

async function loadVendors() {
  const corpId = corpStore.selectedCorporation?.id
  if (!corpId) return
  await vendorStore.fetchNimbleDbVendors(corpId, true)
}

function openCreate() {
  editingVendor.value = null
  showModal.value = true
}

function openEdit(vendor: NimbleDbVendor) {
  editingVendor.value = vendor
  showModal.value = true
}

function openDelete(vendor: NimbleDbVendor) {
  vendorToDelete.value = vendor
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!vendorToDelete.value) return
  deleting.value = true
  try {
    await vendorStore.deleteNimbleVendor(vendorToDelete.value.vendor_id)
    toast.add({ title: 'Vendor deleted', color: 'success' })
    showDeleteModal.value = false
    vendorToDelete.value = null
  }
  catch (err: unknown) {
    const e = err as Record<string, unknown>
    toast.add({
      title: 'Delete failed',
      description: (e?.statusMessage as string) || (err as Error).message,
      color: 'error',
    })
  }
  finally {
    deleting.value = false
  }
}

async function handleSaved() {
  const corpId = corpStore.selectedCorporation?.id
  if (corpId) {
    await vendorStore.fetchNimbleDbVendors(corpId, true)
    await vendorStore.refresh(corpId)
  }
}

function updatePageSize() {
  table.value?.tableApi?.setPageIndex(0)
}

watch(() => corpStore.selectedCorporation?.id, () => {
  loadVendors()
})

onMounted(() => {
  const corpId = corpStore.selectedCorporation?.id
  if (corpId) {
    coaStore.fetchAccounts(corpId)
  }
  loadVendors()
})
</script>
