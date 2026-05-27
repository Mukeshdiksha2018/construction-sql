<template>
  <div>
    <div v-if="isReady && !loading" class="flex items-center gap-4 mb-4">
      <div class="flex flex-row flex-1 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
        <div
          class="flex-1 px-4 py-2 cursor-pointer transition-colors flex items-center justify-center"
          :class="selectedStatusFilter === null ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'"
          @click="clearStatusFilter"
        >
          <div class="flex flex-col items-center text-center">
            <div class="text-sm text-gray-700 dark:text-gray-300">
              Summary ({{ allProjectsStats.count }})
            </div>
            <div class="text-base font-bold text-gray-900 dark:text-white mt-1">
              {{ formatCurrency(allProjectsStats.totalValue) }}
            </div>
          </div>
        </div>

        <div class="w-px bg-gray-200 dark:bg-gray-700" />

        <div
          v-for="status in statuses"
          :key="status"
          class="flex-1 px-4 py-2 cursor-pointer transition-colors flex items-center justify-center"
          :class="selectedStatusFilter === status ? 'bg-gray-100 dark:bg-gray-700' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'"
          @click="toggleStatusFilter(status)"
        >
          <div class="flex flex-col items-center text-center">
            <div class="text-sm text-gray-700 dark:text-gray-300">
              {{ status }} ({{ statusStats[status].count }})
            </div>
            <div class="text-base font-bold text-gray-900 dark:text-white mt-1">
              {{ formatCurrency(statusStats[status].totalValue) }}
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <UButton
          v-if="hasPermission('project_create')"
          icon="i-heroicons-plus"
          color="primary"
          size="xs"
          @click="addNewProject"
        >
          Add New Project
        </UButton>
        <div class="max-w-sm">
          <UInput
            v-model="globalFilter"
            placeholder="Search projects..."
            icon="i-heroicons-magnifying-glass"
            variant="subtle"
            size="xs"
            class="w-full"
          />
        </div>
      </div>
    </div>

    <div v-if="loading">
      <div class="relative overflow-auto rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div class="bg-gray-50 dark:bg-gray-700">
          <div class="grid gap-4 px-2 py-2 text-sm font-bold text-gray-800 dark:text-gray-200 tracking-wider border-b border-gray-200 dark:border-gray-600" style="grid-template-columns: repeat(9, minmax(0, 1fr));">
            <div v-for="idx in 9" :key="idx" class="flex items-center gap-2">
              <USkeleton class="h-4 w-4 rounded" />
              <USkeleton class="h-4 w-16" />
            </div>
          </div>
        </div>
        <div class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          <div v-for="i in 8" :key="i" class="grid gap-4 px-2 py-1" style="grid-template-columns: repeat(9, minmax(0, 1fr));">
            <USkeleton v-for="j in 9" :key="j" class="h-4 w-20" />
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="error">
      <UAlert
        icon="i-heroicons-exclamation-triangle"
        color="error"
        variant="soft"
        :title="error"
        description="Please try refreshing the page or contact support if the issue persists."
      />
    </div>

    <div v-else-if="projects.length && hasPermission('project_view') && isReady">
      <UTable
        ref="table"
        sticky
        v-model:pagination="pagination"
        v-model:column-pinning="columnPinning"
        :pagination-options="paginationOptions"
        :data="filteredProjects"
        :columns="columns"
        v-model:global-filter="globalFilter"
        class="max-h-[70vh] overflow-auto"
      />

      <div v-if="shouldShowPagination(filteredProjects.length).value" class="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
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
          {{ getPageInfo(table, 'projects').value }}
        </div>
      </div>
    </div>

    <div v-else-if="!hasPermission('project_view') && isReady" class="text-center py-12">
      <UIcon name="i-heroicons-lock-closed" class="w-12 h-12 mx-auto text-gray-400 mb-4" />
      <p class="text-gray-500 text-lg">
        Access Denied
      </p>
      <p class="text-gray-400 text-sm">
        You don't have permission to view projects
      </p>
    </div>

    <div v-else-if="isReady" class="text-center py-12">
      <UIcon name="i-heroicons-clipboard-document-list" class="w-12 h-12 mx-auto text-gray-400 mb-4" />
      <p class="text-gray-500 text-lg">
        No projects found
      </p>
      <p class="text-gray-400 text-sm mb-6">
        Create your first project to get started
      </p>
      <UButton
        v-if="hasPermission('project_create')"
        icon="i-heroicons-plus"
        @click="addNewProject"
      >
        Add Project
      </UButton>
    </div>

    <UModal v-model:open="showDeleteModal" title="Delete Project" :description="''">
      <template #body>
        <div class="p-6">
          <div class="flex items-center mb-4">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-8 h-8 text-red-500 mr-3" />
            <div>
              <h3 class="text-lg font-medium text-gray-900">
                Delete Project
              </h3>
              <p class="text-sm text-gray-500">
                This action cannot be undone.
              </p>
            </div>
          </div>

          <div v-if="projectToDelete" class="bg-gray-50 p-4 rounded-lg mb-4">
            <p class="text-sm text-gray-700">
              <strong>Project Name:</strong> {{ projectToDelete.project_name || 'N/A' }}<br>
              <strong>Project ID:</strong> {{ projectToDelete.project_id || 'N/A' }}<br>
              <strong>Type:</strong> {{ projectTypeNameByUuid[projectToDelete.project_type_uuid] || projectToDelete.project_type_uuid || 'N/A' }}<br>
              <strong>Estimated Amount:</strong> {{ formatCurrency(projectToDelete.estimated_amount) }}<br>
              <strong>Status:</strong> {{ projectToDelete.project_status || 'N/A' }}
            </p>
          </div>
          <p class="text-gray-600">
            Are you sure you want to delete this project?
          </p>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton color="neutral" variant="soft" @click="cancelDelete">
            Cancel
          </UButton>
          <UButton color="error" @click="confirmDelete">
            Delete Project
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { computed, h, nextTick, onMounted, ref, resolveComponent, useTemplateRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { TableColumn } from '@nuxt/ui'
import { useCorporationStore } from '~/stores/corporations'
import { useProjectsStore } from '~/stores/projects'
import { useServiceTypesStore } from '~/stores/serviceTypes'
import { useDateFormat } from '~/composables/useDateFormat'
import { useCurrencyFormat } from '~/composables/useCurrencyFormat'
import { usePermissions } from '~/composables/usePermissions'
import { useTableStandard } from '~/composables/useTableStandard'

const UButton = resolveComponent('UButton')
const UTooltip = resolveComponent('UTooltip')

const route = useRoute()
const router = useRouter()
const toast = useToast()

const corporationStore = useCorporationStore()
const projectsStore = useProjectsStore()
const serviceTypesStore = useServiceTypesStore()

const { formatDate } = useDateFormat()
const { formatCurrency } = useCurrencyFormat()
const { hasPermission, isReady } = usePermissions()
const {
  pagination,
  paginationOptions,
  pageSizeOptions,
  updatePageSize,
  getPaginationProps,
  getPageInfo,
  shouldShowPagination,
} = useTableStandard()

const statuses = ['Pending', 'Bidding', 'Started', 'In Progress', 'Completed', 'On Hold'] as const
type StatusName = (typeof statuses)[number]

const selectedStatusFilter = ref<StatusName | null>(null)
const globalFilter = ref('')
const customerOptions = ref<Array<{
  uuid: string
  first_name?: string | null
  last_name?: string | null
  company_name?: string | null
  customer_email?: string | null
}>>([])

const showDeleteModal = ref(false)
const projectToDelete = ref<any>(null)
const columnPinning = ref({ left: [] as string[], right: ['actions'] })
const table = useTemplateRef<any>('table')

const projects = computed(() => projectsStore.projects)
const loading = computed(() => projectsStore.loading)
const error = computed(() => projectsStore.error)
const selectedCorporationId = computed(() => corporationStore.selectedCorporationId || '')

const serviceTypeNameByUuid = computed<Record<string, string>>(() => {
  const map: Record<string, string> = {}
  for (const serviceType of serviceTypesStore.getActiveServiceTypes || []) {
    map[serviceType.uuid] = serviceType.name
  }
  return map
})

const projectTypeNameByUuid = ref<Record<string, string>>({})

const customerByUuid = computed(() => {
  const map = new Map<string, any>()
  for (const customer of customerOptions.value) {
    map.set(customer.uuid, customer)
  }
  return map
})

function getCustomerDisplayName(customer: any): string {
  const fullName = [customer.first_name, customer.last_name].filter(Boolean).join(' ')
  return fullName || customer.company_name || customer.customer_email || 'Unnamed Customer'
}

const statusStats = computed<Record<StatusName, { count: number, totalValue: number }>>(() => {
  const result = {} as Record<StatusName, { count: number, totalValue: number }>
  for (const status of statuses) {
    const list = projects.value.filter(p => (p.project_status || 'Pending') === status)
    result[status] = {
      count: list.length,
      totalValue: list.reduce((sum, project) => sum + (Number(project.estimated_amount) || 0), 0),
    }
  }
  return result
})

const allProjectsStats = computed(() => ({
  count: projects.value.length,
  totalValue: projects.value.reduce((sum, project) => sum + (Number(project.estimated_amount) || 0), 0),
}))

const filteredProjects = computed(() => {
  if (!selectedStatusFilter.value) return projects.value
  return projects.value.filter(project => project.project_status === selectedStatusFilter.value)
})

function toggleStatusFilter(status: StatusName) {
  selectedStatusFilter.value = selectedStatusFilter.value === status ? null : status
  table.value?.tableApi?.setPageIndex(0)
}

function clearStatusFilter() {
  selectedStatusFilter.value = null
  table.value?.tableApi?.setPageIndex(0)
}

const columns: TableColumn<any>[] = [
  { accessorKey: 'project_id', header: 'Project ID', enableSorting: false, cell: ({ row }) => h('div', row.original.project_id || 'N/A') },
  { accessorKey: 'project_name', header: 'Project Name', enableSorting: false, cell: ({ row }) => h('div', { class: 'font-medium text-default' }, row.original.project_name || 'N/A') },
  {
    accessorKey: 'project_type_uuid',
    header: 'Type',
    enableSorting: false,
    cell: ({ row }) => h('div', projectTypeNameByUuid.value[row.original.project_type_uuid] || row.original.project_type_uuid || 'N/A'),
  },
  {
    accessorKey: 'project_status',
    header: 'Status',
    enableSorting: false,
    cell: ({ row }) => {
      const status = row.original.project_status || 'Pending'
      return h('span', { class: 'inline-flex items-center px-2 py-1 gap-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700' }, status)
    },
  },
  {
    accessorKey: 'service_type_uuid',
    header: 'Service Type',
    enableSorting: false,
    cell: ({ row }) => h('div', serviceTypeNameByUuid.value[row.original.service_type_uuid] || row.original.service_type_uuid || 'N/A'),
  },
  {
    accessorKey: 'customer_uuid',
    header: 'Customer',
    enableSorting: false,
    cell: ({ row }) => {
      const customer = customerByUuid.value.get(row.original.customer_uuid)
      return h('div', customer ? getCustomerDisplayName(customer) : 'N/A')
    },
  },
  { accessorKey: 'project_start_date', header: 'Start Date', enableSorting: false, cell: ({ row }) => h('div', formatDate(row.original.project_start_date) || 'N/A') },
  { accessorKey: 'project_estimated_completion_date', header: 'Est End Date', enableSorting: false, cell: ({ row }) => h('div', formatDate(row.original.project_estimated_completion_date) || 'N/A') },
  { accessorKey: 'estimated_amount', header: 'Estimated Amount', enableSorting: false, meta: { class: { th: 'text-right', td: 'text-right' } }, cell: ({ row }) => h('div', { class: 'text-right font-mono text-sm' }, formatCurrency(row.original.estimated_amount || 0)) },
  {
    id: 'actions',
    header: 'Actions',
    enableSorting: false,
    meta: { class: { th: 'text-right sticky right-0 z-10 w-28', td: 'text-right sticky right-0 w-28' } },
    cell: ({ row }) => h('div', { class: 'flex justify-end space-x-2' }, [
      h(UTooltip, { text: 'View Project Details' }, () => [
        h(UButton, { icon: 'i-heroicons-eye-solid', size: 'xs', variant: 'soft', color: 'neutral', onClick: () => viewProject(row.original) }),
      ]),
      h(UTooltip, { text: 'Edit Project' }, () => [
        h(UButton, { icon: 'tdesign:edit-filled', size: 'xs', variant: 'soft', color: 'secondary', onClick: () => editProject(row.original) }),
      ]),
      h(UTooltip, { text: 'Delete Project' }, () => [
        h(UButton, { icon: 'mingcute:delete-fill', size: 'xs', variant: 'soft', color: 'error', onClick: () => deleteProject(row.original) }),
      ]),
    ]),
  },
]

async function fetchProjectTypeOptions() {
  try {
    const response = await $fetch<{ data?: Array<{ uuid: string, name: string }> }>('/api/project-types/options')
    const map: Record<string, string> = {}
    for (const option of response.data ?? []) {
      map[option.uuid] = option.name
    }
    projectTypeNameByUuid.value = map
  }
  catch {
    projectTypeNameByUuid.value = {}
  }
}

async function fetchCustomerOptions(corporationUuid: string) {
  try {
    const response = await $fetch<{ data?: typeof customerOptions.value }>('/api/customers/options', {
      query: { corporation_uuid: corporationUuid },
    })
    customerOptions.value = response.data ?? []
  }
  catch {
    customerOptions.value = []
  }
}

async function fetchProjects() {
  if (!selectedCorporationId.value) return
  await Promise.all([
    projectsStore.fetchProjects(selectedCorporationId.value),
    fetchProjectTypeOptions(),
    serviceTypesStore.fetchServiceTypes(),
    fetchCustomerOptions(selectedCorporationId.value),
  ])
}

function addNewProject() {
  router.push({ path: '/projects/form/new', query: { ...route.query } })
}

function viewProject(project: any) {
  router.push({ path: `/projects/form/${project.uuid}`, query: { ...route.query, mode: 'view' } })
}

function editProject(project: any) {
  router.push({ path: `/projects/form/${project.uuid}`, query: { ...route.query } })
}

function deleteProject(project: any) {
  projectToDelete.value = project
  showDeleteModal.value = true
}

function cancelDelete() {
  showDeleteModal.value = false
  projectToDelete.value = null
}

async function confirmDelete() {
  if (!projectToDelete.value?.uuid) return
  try {
    await projectsStore.deleteProject(projectToDelete.value.uuid)
    toast.add({
      title: 'Success',
      description: 'Project deleted successfully',
      color: 'success',
      icon: 'i-heroicons-check-circle',
    })
  }
  catch (error: unknown) {
    const err = error as { data?: { statusMessage?: string }, message?: string }
    toast.add({
      title: 'Error',
      description: err?.data?.statusMessage || err?.message || 'Failed to delete project',
      color: 'error',
      icon: 'i-heroicons-x-circle',
    })
  }
  finally {
    cancelDelete()
  }
}

watch(() => selectedCorporationId.value, (newValue) => {
  if (newValue) fetchProjects()
}, { immediate: true })

watch(globalFilter, () => {
  table.value?.tableApi?.setPageIndex(0)
})

onMounted(() => {
  nextTick(() => {
    fetchProjects()
  })
})
</script>
