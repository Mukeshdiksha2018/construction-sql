<template>
  <div>
    <div v-if="corpStore.selectedCorporation && !vendorStore.nimbleLoading" class="flex justify-end items-center mb-4">
      <div class="flex-1 max-w-sm mr-2">
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
        icon="i-heroicons-plus"
        color="primary"
        size="xs"
        @click="openCreate"
      >
        Add Vendor
      </UButton>
    </div>

    <p v-else-if="!corpStore.selectedCorporation" class="text-muted mb-4">
      Select a corporation in the top bar to manage vendors.
    </p>

    <div v-if="vendorStore.nimbleLoading">
      <div class="text-center py-12">
        <div class="text-gray-400 mb-4">
          <UIcon name="i-heroicons-arrow-path" class="w-12 h-12 mx-auto animate-spin" />
        </div>
        <p class="text-gray-500 text-lg">
          Loading vendors...
        </p>
      </div>
    </div>

    <div v-else-if="vendorStore.nimbleError && !filteredVendors.length">
      <UAlert
        icon="i-heroicons-exclamation-triangle"
        color="error"
        variant="soft"
        :title="vendorStore.nimbleError"
        description="Please try refreshing the page or contact support if the issue persists."
      />
    </div>

    <div v-else-if="filteredVendors.length && corpStore.selectedCorporation">
      <UTable
        ref="table"
        sticky
        v-model:pagination="pagination"
        v-model:column-pinning="columnPinning"
        v-model:global-filter="globalFilter"
        :pagination-options="paginationOptions"
        :data="filteredVendors"
        :columns="columns"
        class="max-h-[70vh] overflow-auto"
      />

      <div
        v-if="shouldShowPagination(filteredVendors.length).value"
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
          {{ getPageInfo(table, 'vendors').value }}
        </div>
      </div>
    </div>

    <div v-else-if="corpStore.selectedCorporation" class="text-center py-12">
      <div class="text-gray-400 mb-4">
        <UIcon name="i-heroicons-building-storefront" class="w-12 h-12 mx-auto" />
      </div>
      <p class="text-gray-500 text-lg">
        No vendors found
      </p>
      <p class="text-gray-400 text-sm mb-6">
        Create your first vendor to get started
      </p>
      <UButton
        icon="i-heroicons-plus"
        @click="openCreate"
      >
        Add Vendor
      </UButton>
    </div>

    <VendorsVendorForm
      v-model="showModal"
      :vendor="editingVendor"
      @saved="handleSaved"
    />

    <UModal v-model:open="showDeleteModal" :ui="{ footer: 'hidden' }">
      <template #header>
        <div class="flex items-center justify-between w-full gap-4">
          <h3 class="text-lg font-semibold text-default">
            Delete Vendor
          </h3>
          <div class="flex items-center gap-2">
            <UButton color="neutral" variant="soft" @click="showDeleteModal = false">
              Cancel
            </UButton>
            <UButton color="error" :loading="deleting" @click="confirmDelete">
              Delete Vendor
            </UButton>
          </div>
        </div>
      </template>
      <template #body>
        <p class="text-sm text-muted">
          The vendor will be marked deleted in Nimble (Status = 3). Historical purchase orders keep the vendor reference.
        </p>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, ref, resolveComponent, useTemplateRef, watch } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { useTableStandard } from '~/composables/useTableStandard'
import { useVendorStore, type NimbleDbVendor } from '~/stores/vendors'
import { useCorporationStore } from '~/stores/corporations'
import { useChartOfAccountsStore } from '~/stores/chartOfAccounts'

const UButton = resolveComponent('UButton')
const UTooltip = resolveComponent('UTooltip')
const UBadge = resolveComponent('UBadge')

const vendorStore = useVendorStore()
const corpStore = useCorporationStore()
const coaStore = useChartOfAccountsStore()
const toast = useToast()

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
const editingVendor = ref<NimbleDbVendor | null>(null)
const vendorToDelete = ref<NimbleDbVendor | null>(null)
const deleting = ref(false)
const globalFilter = ref('')

const columnPinning = ref({ left: [], right: ['actions'] })
const table = useTemplateRef('table')

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

  const list = vendorStore
    .getNimbleVendorsForCorporation(corpId)
    .filter(v => v.status !== 3)

  if (!globalFilter.value.trim()) return list

  const search = globalFilter.value.toLowerCase().trim()
  return list.filter((v) => {
    const fields = [
      v.name,
      v.company_name ?? '',
      v.tax_id ?? '',
      v.federal_id ?? '',
      v.contact_person_name ?? '',
      corporationNameById.value[v.corporation_id] ?? '',
      accountLabelById.value[v.account_id ?? ''] ?? '',
    ]
    return fields.some(f => f.toLowerCase().includes(search))
  })
})

function vendorStatusConfig(status: number, statusLabel: string) {
  if (status === 1) return { label: 'Active', color: 'success' as const }
  if (status === 0) return { label: 'Inactive', color: 'neutral' as const }
  return { label: statusLabel, color: 'neutral' as const }
}

const columns = computed<TableColumn<NimbleDbVendor>[]>(() => [
  {
    accessorKey: 'corporation_id',
    header: 'Corporation',
    enableSorting: false,
    meta: { class: { th: 'text-left', td: 'text-left' } },
    cell: ({ row }) => h('div', corporationNameById.value[row.original.corporation_id] || row.original.corporation_id),
  },
  {
    accessorKey: 'name',
    header: 'Vendor Name',
    enableSorting: false,
    meta: { class: { th: 'text-left', td: 'text-left' } },
    cell: ({ row }) => h('div', { class: 'font-medium text-default' }, row.original.name),
  },
  {
    accessorKey: 'company_name',
    header: 'Company',
    enableSorting: false,
    meta: { class: { th: 'text-left', td: 'text-left' } },
    cell: ({ row }) => h('div', row.original.company_name || 'N/A'),
  },
  {
    accessorKey: 'account_id',
    header: 'Chart of Account',
    enableSorting: false,
    meta: { class: { th: 'text-left', td: 'text-left' } },
    cell: ({ row }) => {
      const id = row.original.account_id
      return h('div', id ? (accountLabelById.value[id] || id) : 'N/A')
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    enableSorting: false,
    meta: { class: { th: 'text-left', td: 'text-left' } },
    cell: ({ row }) => {
      const config = vendorStatusConfig(row.original.status, row.original.status_label)
      return h(UBadge, {
        color: config.color,
        variant: 'soft',
        size: 'sm',
      }, () => config.label)
    },
  },
  {
    accessorKey: 'created_by',
    header: 'Created By',
    enableSorting: false,
    meta: { class: { th: 'text-left', td: 'text-left' } },
    cell: ({ row }) => h('div', { class: 'text-xs text-muted truncate max-w-[120px]' }, row.original.created_by || 'N/A'),
  },
  {
    accessorKey: 'modified_by',
    header: 'Modified By',
    enableSorting: false,
    meta: { class: { th: 'text-left', td: 'text-left' } },
    cell: ({ row }) => h('div', { class: 'text-xs text-muted truncate max-w-[120px]' }, row.original.modified_by || 'N/A'),
  },
  {
    id: 'actions',
    header: 'Actions',
    enableSorting: false,
    meta: { class: { th: 'text-right sticky right-0 z-10 w-32', td: 'text-right sticky right-0 w-32' } },
    cell: ({ row }) => h('div', { class: 'flex justify-end space-x-2' }, [
      h(UTooltip, { text: 'Edit Vendor' }, () => [
        h(UButton, {
          icon: 'tdesign:edit-filled',
          size: 'xs',
          variant: 'soft',
          color: 'secondary',
          class: 'hover:scale-105 transition-transform',
          onClick: () => openEdit(row.original),
        }, () => ''),
      ]),
      h(UTooltip, { text: 'Delete Vendor' }, () => [
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
])

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

async function handleSaved(vendor?: NimbleDbVendor) {
  const corpId = corpStore.selectedCorporation?.id
  if (corpId) {
    await vendorStore.fetchNimbleDbVendors(corpId, true)
    await vendorStore.refresh(corpId)
  }
  if (vendor) {
    editingVendor.value = vendor
  }
}

watch(() => corpStore.selectedCorporation?.id, (corpId) => {
  if (corpId) {
    coaStore.fetchAccounts(corpId)
  }
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
