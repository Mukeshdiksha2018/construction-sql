<template>
  <div>
    <!-- Stats + Search -->
    <div v-if="isReady && !loading" class="flex items-center gap-4 mb-4">
      <div class="flex flex-row flex-1 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
        <div
          :class="['flex-1 px-4 py-2 cursor-pointer transition-colors flex items-center justify-center', selectedStatusFilter === null ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700']"
          @click="clearStatusFilter"
        >
          <div class="flex flex-col items-center text-center">
            <div class="text-sm text-gray-700 dark:text-gray-300">Summary ({{ allEstimatesStats.count }})</div>
            <div class="text-base font-bold text-gray-900 dark:text-white mt-1">{{ formatCurrency(allEstimatesStats.totalValue) }}</div>
          </div>
        </div>
        <div class="w-px bg-gray-200 dark:bg-gray-700" />
        <div
          v-for="stat in statusStats"
          :key="stat.status"
          :class="['flex-1 px-4 py-2 cursor-pointer transition-colors flex items-center justify-center', selectedStatusFilter === stat.status ? 'bg-gray-100 dark:bg-gray-700' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700']"
          @click="toggleStatusFilter(stat.status)"
        >
          <div class="flex flex-col items-center text-center">
            <div class="text-sm text-gray-700 dark:text-gray-300">{{ stat.label }} ({{ stat.count }})</div>
            <div class="text-base font-bold text-gray-900 dark:text-white mt-1">{{ formatCurrency(stat.totalValue) }}</div>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <UButton v-if="hasPermission('project_estimates_create')" icon="i-heroicons-plus" color="primary" size="xs" @click="addNewEstimate">
          Add New Estimate
        </UButton>
        <UInput v-model="globalFilter" placeholder="Search estimates..." icon="i-heroicons-magnifying-glass" variant="subtle" size="xs" class="w-full max-w-sm" />
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow overflow-hidden">
      <div v-for="i in 6" :key="i" class="grid grid-cols-7 gap-4 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <USkeleton v-for="j in 7" :key="j" class="h-4 w-full" />
      </div>
    </div>

    <div v-else-if="error">
      <UAlert icon="i-heroicons-exclamation-triangle" color="error" variant="soft" :title="error" description="Please try refreshing the page." />
    </div>

    <div v-else-if="filteredEstimates.length && isReady">
      <UTable
        ref="table"
        sticky
        v-model:pagination="pagination"
        v-model:column-pinning="columnPinning"
        :pagination-options="paginationOptions"
        :data="filteredEstimates"
        :columns="columns"
        v-model:selected="selectedEstimates"
        v-model:global-filter="globalFilter"
        :selectable="true"
        class="max-h-[70vh] overflow-auto"
      />
    </div>

    <div v-else-if="isReady" class="text-center py-12">
      <UIcon name="i-heroicons-calculator" class="w-12 h-12 mx-auto text-gray-400 mb-4" />
      <p class="text-gray-500 text-lg">No estimates found</p>
      <p class="text-gray-400 text-sm mb-6">Create your first estimate to get started</p>
      <UButton v-if="hasPermission('project_estimates_create')" icon="i-heroicons-plus" @click="addNewEstimate">
        Add Estimate
      </UButton>
    </div>

    <!-- Delete Modal -->
    <UModal v-model:open="showDeleteModal" title="Delete Estimate">
      <template #body>
        <div class="p-6">
          <div class="flex items-center mb-4">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-8 h-8 text-red-500 mr-3" />
            <div>
              <h3 class="text-lg font-medium text-gray-900">Delete Estimate</h3>
              <p class="text-sm text-gray-500">This action cannot be undone.</p>
            </div>
          </div>
          <div v-if="estimateToDelete" class="bg-gray-50 p-4 rounded-lg mb-4">
            <p class="text-sm text-gray-700">
              <strong>Estimate Number:</strong> {{ estimateToDelete.estimate_number || 'N/A' }}<br>
              <strong>Project:</strong> {{ estimateToDelete.project?.project_name || 'N/A' }}<br>
              <strong>Date:</strong> {{ formatDate(estimateToDelete.estimate_date) }}<br>
              <strong>Amount:</strong> {{ formatCurrency(estimateToDelete.final_amount) }}<br>
              <strong>Status:</strong> {{ estimateToDelete.status || 'N/A' }}
            </p>
          </div>
          <p class="text-gray-600">Are you sure you want to delete this estimate?</p>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton color="neutral" variant="soft" @click="cancelDelete">Cancel</UButton>
          <UButton color="error" @click="confirmDelete">Delete Estimate</UButton>
        </div>
      </template>
    </UModal>

    <!-- Audit Log Modal -->
    <UModal
      v-model:open="showAuditLogModal"
      title="Estimate Audit Log"
      size="2xl"
      :ui="{ body: 'p-6' }"
    >
      <template #body>
        <ProjectsEstimateAuditTimeline
          v-if="selectedEstimateForAudit"
          :audit-log="selectedEstimateForAudit.audit_log || []"
          :estimate-uuid="selectedEstimateForAudit.uuid || ''"
        />
      </template>
      <template #footer>
        <div class="flex justify-end">
          <UButton color="neutral" variant="solid" @click="showAuditLogModal = false">Close</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h, watch, useTemplateRef, resolveComponent } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCorporationStore } from '~/stores/corporations'
import { useEstimatesStore } from '~/stores/estimates'
import { useProjectsStore } from '~/stores/projects'
import { useTableStandard } from '~/composables/useTableStandard'
import { useDateFormat } from '~/composables/useDateFormat'
import { useCurrencyFormat } from '~/composables/useCurrencyFormat'
import { useAuditLog } from '~/composables/useAuditLog'
import { usePermissions } from '~/composables/usePermissions'
import { useEstimatePrint } from '~/composables/useEstimatePrint'
import { useApiClient } from '~/composables/useApiClient'
import type { TableColumn } from '@nuxt/ui'

declare function useToast(): { add: (opts: any) => void }
declare function useRuntimeConfig(): { public: Record<string, any> }

const UButton = resolveComponent('UButton')
const UTooltip = resolveComponent('UTooltip')
const UBadge = resolveComponent('UBadge')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const router = useRouter()
const route = useRoute()
const corporationStore = useCorporationStore()
const estimatesStore = useEstimatesStore()
const projectsStore = useProjectsStore()
const runtimeConfig = useRuntimeConfig()
const nimbleIntegrationsEnabled = computed(() => !!runtimeConfig.public.nimbleIntegrations)
const { formatDate } = useDateFormat()
const { formatCurrency } = useCurrencyFormat()
const { hasPermission, isReady } = usePermissions()
const { openEstimatePrint } = useEstimatePrint()
const { apiFetch } = useApiClient()
const { onAuditLogsLoaded, onAuditLogError } = useAuditLog({
  entityType: 'estimate',
  corporationUuid: computed(() => corporationStore.selectedCorporation?.uuid || ''),
  formatCurrency,
})
const { pagination, paginationOptions, pageSizeOptions, updatePageSize } = useTableStandard()

const selectedEstimates = ref<any[]>([])
const globalFilter = ref('')
const selectedStatusFilter = ref<string | null>(null)
const showDeleteModal = ref(false)
const estimateToDelete = ref<any>(null)
const showAuditLogModal = ref(false)
const selectedEstimateForAudit = ref<any>(null)
const columnPinning = ref({ left: [], right: ['actions'] })
const table = useTemplateRef<any>('table')

const estimates = computed(() => estimatesStore.estimates)
const loading = computed(() => estimatesStore.loading)
const error = computed(() => {
  const e = estimatesStore.error
  if (e && (e.includes('delete') || e.includes('Cannot delete'))) return null
  return e
})

const statusStats = computed(() => {
  const statuses = [
    { status: 'Draft', label: 'Drafting…' },
    { status: 'Ready', label: 'For Approval' },
    { status: 'Approved', label: 'Approved' },
  ]
  return statuses.map(({ status, label }) => {
    const filtered = estimates.value.filter(e => e.status === status)
    return { status, label, count: filtered.length, totalValue: filtered.reduce((s, e) => s + (Number(e.final_amount) || 0), 0) }
  })
})

const allEstimatesStats = computed(() => ({
  count: estimates.value.length,
  totalValue: estimates.value.reduce((s, e) => s + (Number(e.final_amount) || Number(e.total_amount) || 0), 0),
}))

const filteredEstimates = computed(() => {
  let list = [...estimates.value]
  if (selectedStatusFilter.value) list = list.filter(e => e.status === selectedStatusFilter.value)
  if (globalFilter.value.trim()) {
    const q = globalFilter.value.toLowerCase()
    list = list.filter(e => [e.estimate_number || '', e.project?.project_name || '', e.status || ''].some(f => f.toLowerCase().includes(q)))
  }
  return list
})

function getHeader(column: any, label: string) {
  const isSorted = column.getIsSorted()
  return h(UDropdownMenu, {
    content: { align: 'start' },
    'aria-label': 'Sort options',
    items: [
      { label: 'Asc', type: 'checkbox', icon: 'i-lucide-arrow-up-narrow-wide', checked: isSorted === 'asc', onSelect: () => isSorted === 'asc' ? column.clearSorting() : column.toggleSorting(false) },
      { label: 'Desc', icon: 'i-lucide-arrow-down-wide-narrow', type: 'checkbox', checked: isSorted === 'desc', onSelect: () => isSorted === 'desc' ? column.clearSorting() : column.toggleSorting(true) },
    ],
  }, () => h(UButton, { color: 'neutral', variant: 'ghost', label, icon: isSorted ? (isSorted === 'asc' ? 'i-lucide-arrow-up-narrow-wide' : 'i-lucide-arrow-down-wide-narrow') : 'i-lucide-arrow-up-down', class: '-mx-2.5 data-[state=open]:bg-elevated', 'aria-label': `Sort by ${label}` }))
}

const statusMap: Record<string, { label: string; color: string }> = {
  Draft: { label: 'Drafting…', color: 'warning' },
  Ready: { label: 'For Approval', color: 'primary' },
  Approved: { label: 'Approved', color: 'success' },
}

const columns: TableColumn<any>[] = [
  { accessorKey: 'estimate_date', header: ({ column }) => getHeader(column, 'Date'), enableSorting: true, meta: { class: { th: 'text-left', td: 'text-left' } }, cell: ({ row }) => h('div', formatDate(row.original.estimate_date)) },
  { accessorKey: 'estimate_number', header: ({ column }) => getHeader(column, 'Estimate #'), enableSorting: true, meta: { class: { th: 'text-left', td: 'text-left' } }, cell: ({ row }) => h('div', { class: 'font-medium text-default' }, row.original.estimate_number || 'N/A') },
  { accessorKey: 'project_name', header: 'Project', enableSorting: false, meta: { class: { th: 'text-left', td: 'text-left' } }, cell: ({ row }) => h('div', row.original.project?.project_name || 'N/A') },
  {
    accessorKey: 'status', header: 'Status', enableSorting: false, meta: { class: { th: 'text-left', td: 'text-left' } },
    cell: ({ row }) => {
      const cfg = statusMap[row.original.status] ?? { label: row.original.status || 'Draft', color: 'neutral' }
      return h(UBadge, { color: cfg.color, variant: 'soft', size: 'sm' }, () => cfg.label)
    },
  },
  { accessorKey: 'total_amount', header: 'Total Amount', enableSorting: false, meta: { class: { th: 'text-left', td: 'text-left' } }, cell: ({ row }) => h('div', { class: 'font-mono text-sm' }, formatCurrency(row.original.total_amount || 0)) },
  { accessorKey: 'final_amount', header: 'Final Amount', enableSorting: false, meta: { class: { th: 'text-right', td: 'text-right' } }, cell: ({ row }) => h('div', { class: 'text-right font-mono text-sm font-semibold' }, formatCurrency(row.original.final_amount || 0)) },
  {
    accessorKey: 'actions', header: 'Actions', enableSorting: false,
    meta: { class: { th: 'text-right sticky right-0 z-10 w-32', td: 'text-right sticky right-0 w-32' } },
    cell: ({ row }) => {
      const btns = []
      if (hasPermission('project_estimates_view')) {
        btns.push(h(UTooltip, { text: 'View' }, () => [h(UButton, { icon: 'i-heroicons-eye-solid', size: 'xs', variant: 'soft', color: 'neutral', class: 'hover:scale-105 transition-transform', onClick: () => viewEstimate(row.original) })]))
      }
      if (hasPermission('project_estimates_edit')) {
        btns.push(h(UTooltip, { text: 'Edit' }, () => [h(UButton, { icon: 'tdesign:edit-filled', size: 'xs', variant: 'soft', color: 'secondary', class: 'hover:scale-105 transition-transform', onClick: () => editEstimate(row.original) })]))
      }
      if (hasPermission('project_estimates_delete')) {
        btns.push(h(UTooltip, { text: 'Delete' }, () => [h(UButton, { icon: 'mingcute:delete-fill', size: 'xs', variant: 'soft', color: 'error', class: 'hover:scale-105 transition-transform', onClick: () => promptDelete(row.original) })]))
      }
      return h('div', { class: 'flex justify-end space-x-2' }, btns)
    },
  },
]

function toggleStatusFilter(status: string) {
  selectedStatusFilter.value = selectedStatusFilter.value === status ? null : status
  table.value?.tableApi?.setPageIndex(0)
}
function clearStatusFilter() {
  selectedStatusFilter.value = null
  table.value?.tableApi?.setPageIndex(0)
}

async function addNewEstimate() {
  if (!hasPermission('project_estimates_create')) return
  const projectUuid = route.query?.projectUuid
  if (projectUuid && typeof projectUuid === 'string') {
    const corpUuid = corporationStore.selectedCorporationId
    if (corpUuid) {
      try {
        const resp: any = await apiFetch('/api/estimates', { query: { corporation_uuid: corpUuid, project_uuid: projectUuid, page: 1, page_size: 1 } })
        const existing = resp?.data || []
        if (existing.length > 0) {
          const toast = useToast()
          toast.add({ title: 'Estimate Already Exists', description: `Estimate (${existing[0]?.estimate_number}) already exists for this project.`, color: 'warning', icon: 'i-heroicons-exclamation-triangle' })
          return
        }
      }
      catch { /* continue */ }
    }
  }
  router.push({ path: '/estimates/form/new', query: { ...route.query } })
}

function viewEstimate(estimate: any) {
  router.push({ path: `/estimates/form/${estimate.uuid}`, query: { ...route.query, mode: 'view' } })
}

function editEstimate(estimate: any) {
  router.push({ path: `/estimates/form/${estimate.uuid}`, query: { ...route.query } })
}

function promptDelete(estimate: any) {
  estimateToDelete.value = estimate
  showDeleteModal.value = true
}

function cancelDelete() {
  showDeleteModal.value = false
  estimateToDelete.value = null
}

async function confirmDelete() {
  if (!estimateToDelete.value) return
  try {
    await estimatesStore.deleteEstimate(estimateToDelete.value.uuid)
    const toast = useToast()
    toast.add({ title: 'Success', description: 'Estimate deleted successfully', color: 'success', icon: 'i-heroicons-check-circle' })
    showDeleteModal.value = false
    estimateToDelete.value = null
  }
  catch (err: any) {
    const toast = useToast()
    toast.add({ title: 'Error', description: err?.statusMessage || err?.message || 'Failed to delete estimate', color: 'error', icon: 'i-heroicons-x-circle' })
  }
}

watch(
  () => corporationStore.selectedCorporationId,
  (corpId) => { if (corpId) estimatesStore.fetchEstimates(corpId) },
  { immediate: true },
)

watch(
  () => route.query.projectUuid,
  (q) => { if (nimbleIntegrationsEnabled.value && typeof q === 'string' && q.trim()) selectedEstimates.value = [] },
  { immediate: true },
)
</script>
