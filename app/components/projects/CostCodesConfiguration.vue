<template>
  <div>
    <!-- Loading skeleton -->
    <div v-if="configurationsStore.loading">
      <div class="relative overflow-auto rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div class="bg-gray-50 dark:bg-gray-700">
          <div class="grid grid-cols-7 gap-4 px-2 py-2 text-sm font-bold border-b border-gray-200 dark:border-gray-600">
            <div v-for="i in 7" :key="i" class="flex items-center gap-2">
              <USkeleton class="h-4 w-20" />
            </div>
          </div>
        </div>
        <div class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          <div v-for="i in 8" :key="i" class="grid grid-cols-7 gap-4 px-2 py-2">
            <USkeleton v-for="j in 7" :key="j" class="h-4 w-full" />
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="configurationsStore.error">
      <UAlert
        icon="i-heroicons-exclamation-triangle"
        color="error"
        variant="soft"
        :title="configurationsStore.error"
        description="Please try refreshing the page."
      />
    </div>

    <div v-else-if="filteredConfigurations.length">
      <UTable
        ref="table"
        sticky
        v-model:pagination="pagination"
        v-model:sorting="sorting"
        :pagination-options="paginationOptions"
        :data="filteredConfigurations"
        :columns="columns"
        class="max-h-[70vh] overflow-auto"
      />
      <div v-if="shouldShowPagination(filteredConfigurations.length).value" class="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-600">Show:</span>
          <USelect v-model="pagination.pageSize" :items="pageSizeOptions" icon="i-heroicons-list-bullet" size="sm" variant="outline" class="w-32" @change="updatePageSize(table)" />
        </div>
        <UPagination v-bind="getPaginationProps(table)" />
        <div class="text-sm text-gray-600">
          {{ getPageInfo(table, 'configurations').value }}
        </div>
      </div>
    </div>

    <div v-else class="text-center py-12">
      <UIcon name="i-heroicons-cog-6-tooth" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <p class="text-gray-500 text-lg font-medium">No cost code configurations found</p>
      <p class="text-gray-400 text-sm">Get started by adding your first configuration</p>
    </div>

    <!-- Manage preferred items (existing cost codes) -->
    <SharedPreferredItemsAddEditModal
      v-if="configForItems"
      v-model="showItemsModal"
      mode="embedded"
      :corporation-uuid="corporationStore.selectedCorporationId || ''"
      :cost-code-configuration-uuid="configForItems.uuid"
      :cost-code-label="formatCostCodeLabel(configForItems)"
      :allow-embedded-project-select="true"
      :lock-embedded-cost-code-selection="true"
      @saved="onPreferredItemsSaved"
    />

    <!-- Delete Confirmation Modal -->
    <UModal v-model:open="showDeleteModal" title="Delete Configuration" description="">
      <template #body>
        <div class="p-6">
          <div class="flex items-center mb-4">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-8 h-8 text-red-500 mr-3" />
            <div>
              <h3 class="text-lg font-medium text-gray-900">Delete Configuration</h3>
              <p class="text-sm text-gray-500">This action cannot be undone.</p>
            </div>
          </div>
          <div v-if="configToDelete" class="bg-gray-50 p-4 rounded-lg mb-4">
            <p class="text-sm text-gray-700">
              <strong>Cost Code:</strong> {{ configToDelete.cost_code_number || 'N/A' }}<br>
              <strong>Name:</strong> {{ configToDelete.cost_code_name || 'N/A' }}<br>
              <strong>Sub Category of:</strong> {{ getParentCostCodeName(configToDelete.parent_cost_code_uuid) || 'N/A' }}<br>
              <strong>Preferred Items:</strong> {{ getPreferredItemCount(configToDelete.uuid) }} item(s)<br>
              <strong>Status:</strong> {{ configToDelete.is_active ? 'Active' : 'Inactive' }}
            </p>
          </div>
          <div
            v-if="configToDelete && getPreferredItemCount(configToDelete.uuid) > 0"
            class="bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800 p-4 rounded-lg mb-4"
          >
            <p class="text-sm text-red-700 dark:text-red-300">
              This cost code has {{ getPreferredItemCount(configToDelete.uuid) }} preferred item(s).
              Remove or reassign those items before deleting the configuration.
            </p>
          </div>
          <p class="text-gray-600">Are you sure you want to delete this cost code configuration?</p>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton color="neutral" variant="soft" @click="cancelDelete">Cancel</UButton>
          <UButton color="error" :loading="deleting" @click="confirmDelete">
            {{ deleting ? 'Deleting...' : 'Delete Configuration' }}
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h, watch, onMounted, useTemplateRef, resolveComponent } from 'vue'
import { useCostCodeConfigurationsStore } from '~/stores/costCodeConfigurations'
import { useCorporationStore } from '~/stores/corporations'
import { useTableStandard } from '~/composables/useTableStandard'
import { useDateFormat } from '~/composables/useDateFormat'
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

const router = useRouter()
const route = useRoute()
const configurationsStore = useCostCodeConfigurationsStore()
const corporationStore = useCorporationStore()
const toast = useToast()
const { formatDate } = useDateFormat()
const { pagination, paginationOptions, pageSizeOptions, updatePageSize, shouldShowPagination, getPaginationProps, getPageInfo } = useTableStandard()

const UButton = resolveComponent('UButton')
const UTooltip = resolveComponent('UTooltip')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const table = useTemplateRef<any>('table')
const sorting = ref([])

function getHeader(column: Column<any>, label: string) {
  const isSorted = column.getIsSorted()
  return h(UDropdownMenu, { content: { align: 'start' }, 'aria-label': 'Sort options', items: [
    { label: 'Asc', type: 'checkbox', icon: 'i-lucide-arrow-up-narrow-wide', checked: isSorted === 'asc', onSelect: () => isSorted === 'asc' ? column.clearSorting() : column.toggleSorting(false) },
    { label: 'Desc', icon: 'i-lucide-arrow-down-wide-narrow', type: 'checkbox', checked: isSorted === 'desc', onSelect: () => isSorted === 'desc' ? column.clearSorting() : column.toggleSorting(true) },
  ] }, () => h(UButton, { color: 'neutral', variant: 'ghost', label, icon: isSorted ? (isSorted === 'asc' ? 'i-lucide-arrow-up-narrow-wide' : 'i-lucide-arrow-down-wide-narrow') : 'i-lucide-arrow-up-down', class: '-mx-2.5 data-[state=open]:bg-elevated' }))
}

const showDeleteModal = ref(false)
const configToDelete = ref<any>(null)
const deleting = ref(false)
const showItemsModal = ref(false)
const configForItems = ref<any>(null)
const preferredItemCounts = ref<Record<string, number>>({})

const filteredConfigurations = computed(() => {
  const term = props.globalFilter?.trim().toLowerCase() || ''
  const list = term
    ? configurationsStore.configurations.filter((c: any) =>
      [c.cost_code_number || '', c.cost_code_name || '', c.description || ''].some(f => f.toLowerCase().includes(term)),
    )
    : [...configurationsStore.configurations]
  return list
})

const getParentCostCodeName = (parentUuid: string | null | undefined) => {
  if (!parentUuid) return ''
  const config = configurationsStore.configurations.find((c: any) => c.uuid === parentUuid)
  return config ? config.cost_code_name : ''
}

const columns: TableColumn<any>[] = [
  { accessorKey: 'cost_code_number', header: ({ column }) => getHeader(column, 'Cost Code'), enableSorting: true, meta: { class: { th: 'text-left', td: 'text-left' } }, cell: ({ row }) => h('div', { class: 'text-xs font-medium text-default' }, row.original.cost_code_number || '-') },
  { accessorKey: 'cost_code_name', header: 'Cost Code Name', enableSorting: false, meta: { class: { th: 'text-left', td: 'text-left' } }, cell: ({ row }) => h('div', { class: 'text-xs font-medium text-default' }, row.original.cost_code_name || '-') },
  { accessorKey: 'parent_cost_code_uuid', header: 'Sub Category of', enableSorting: false, meta: { class: { th: 'text-left', td: 'text-left' } }, cell: ({ row }) => h('div', { class: 'text-xs text-muted' }, getParentCostCodeName(row.original.parent_cost_code_uuid) || '-') },
  { accessorKey: 'created_at', header: 'Created Date', enableSorting: false, meta: { class: { th: 'text-left', td: 'text-left' } }, cell: ({ row }) => h('div', { class: 'text-xs text-muted' }, formatDate(row.original.created_at) || '-') },
  {
    accessorKey: 'preferred_items',
    header: 'Items',
    enableSorting: false,
    meta: { class: { th: 'text-left', td: 'text-left' } },
    cell: ({ row }) => {
      const count = getPreferredItemCount(row.original.uuid)
      return h('div', { class: 'text-xs text-muted' }, count > 0 ? `${count} item${count > 1 ? 's' : ''}` : 'No items')
    },
  },
  { accessorKey: 'description', header: 'Description', enableSorting: false, meta: { class: { th: 'text-left', td: 'text-left' } }, cell: ({ row }) => h('div', { class: 'text-xs text-muted max-w-xs truncate' }, row.original.description || '-') },
  {
    accessorKey: 'is_active', header: 'Status', enableSorting: false, meta: { class: { th: 'text-left', td: 'text-left' } },
    cell: ({ row }) => {
      const isActive = row.original.is_active
      return h('span', { class: `inline-flex items-center px-2 py-1 gap-1 rounded-md text-xs font-medium ${isActive ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}` }, isActive ? 'Active' : 'Inactive')
    },
  },
  {
    accessorKey: 'actions', header: 'Actions', enableSorting: false,
    meta: { class: { th: 'text-right sticky right-0 z-10 w-32', td: 'text-right sticky right-0 w-32' } },
    cell: ({ row }) => h('div', { class: 'flex justify-end space-x-2' }, [
      h(UTooltip, { text: 'View Configuration' }, () => [h(UButton, { icon: 'i-heroicons-eye-solid', size: 'xs', variant: 'soft', color: 'neutral', class: 'hover:scale-105 transition-transform', onClick: () => viewConfiguration(row.original) }, () => '')]),
      h(UTooltip, { text: 'Add / manage preferred items' }, () => [h(UButton, { icon: 'i-heroicons-cube', size: 'xs', variant: 'soft', color: 'primary', class: 'hover:scale-105 transition-transform', onClick: () => managePreferredItems(row.original) }, () => '')]),
      h(UTooltip, { text: 'Edit Configuration' }, () => [h(UButton, { icon: 'tdesign:edit-filled', size: 'xs', variant: 'soft', color: 'secondary', class: 'hover:scale-105 transition-transform', onClick: () => editConfiguration(row.original) }, () => '')]),
      h(UTooltip, { text: 'Delete Configuration' }, () => [h(UButton, { icon: 'mingcute:delete-fill', size: 'xs', variant: 'soft', color: 'error', class: 'hover:scale-105 transition-transform', onClick: () => deleteConfiguration(row.original) }, () => '')]),
    ]),
  },
]

const viewConfiguration = (config: any) => {
  router.push({ path: `/cost-codes/form/${config.uuid}`, query: { ...route.query, mode: 'view' } })
}

const editConfiguration = (config: any) => {
  router.push({ path: `/cost-codes/form/${config.uuid}`, query: { ...route.query } })
}

const normalizeUuid = (value?: string | null) => String(value ?? '').trim().toLowerCase()

const formatCostCodeLabel = (config: any) => {
  const num = config?.cost_code_number || ''
  const name = config?.cost_code_name || ''
  return [num, name].filter(Boolean).join(' — ') || 'Cost code'
}

const getPreferredItemCount = (configUuid?: string | null) => {
  const key = normalizeUuid(configUuid)
  if (!key) return 0
  return preferredItemCounts.value[key] ?? 0
}

const loadPreferredItemCounts = async (corporationUuid: string) => {
  if (!corporationUuid || import.meta.server) {
    preferredItemCounts.value = {}
    return
  }
  try {
    const { data } = await $fetch<{ data: Array<{ cost_code_configuration_uuid?: string | null }> }>(
      '/api/preferred-items',
      { query: { corporation_uuid: corporationUuid }, credentials: 'include' },
    )
    const counts: Record<string, number> = {}
    for (const item of data ?? []) {
      const key = normalizeUuid(item.cost_code_configuration_uuid)
      if (key) counts[key] = (counts[key] || 0) + 1
    }
    preferredItemCounts.value = counts
  }
  catch {
    preferredItemCounts.value = {}
  }
}

const managePreferredItems = (config: any) => {
  if (!config?.uuid) {
    toast.add({
      title: 'Cannot add items',
      description: 'Save the cost code configuration before adding preferred items.',
      color: 'warning',
      icon: 'i-heroicons-exclamation-triangle',
    })
    return
  }
  configForItems.value = config
  showItemsModal.value = true
}

const onPreferredItemsSaved = async () => {
  const corpUuid = corporationStore.selectedCorporationId
  if (corpUuid) {
    await loadPreferredItemCounts(corpUuid)
    await configurationsStore.fetchConfigurations(corpUuid, true)
  }
  showItemsModal.value = false
}

const deleteConfiguration = (config: any) => {
  const count = getPreferredItemCount(config?.uuid)
  if (count > 0) {
    toast.add({
      title: 'Cannot delete cost code',
      description: `This cost code has ${count} preferred item(s). Remove or reassign them first.`,
      color: 'error',
      icon: 'i-heroicons-exclamation-triangle',
    })
    return
  }
  configToDelete.value = config
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (!configToDelete.value) return
  if (getPreferredItemCount(configToDelete.value.uuid) > 0) {
    toast.add({
      title: 'Cannot delete cost code',
      description: 'Remove all preferred items from this cost code before deleting.',
      color: 'error',
      icon: 'i-heroicons-exclamation-triangle',
    })
    return
  }
  deleting.value = true
  try {
    await configurationsStore.deleteConfiguration(configToDelete.value.uuid)
    toast.add({ title: 'Configuration deleted successfully', color: 'success', icon: 'i-heroicons-check-circle' })
    showDeleteModal.value = false
    configToDelete.value = null
  }
  catch (error) {
    toast.add({ title: 'Error', description: 'Failed to delete configuration', color: 'error', icon: 'i-heroicons-x-circle' })
  }
  finally {
    deleting.value = false
  }
}

const cancelDelete = () => {
  showDeleteModal.value = false
  configToDelete.value = null
}

watch(() => pagination.value.pageSize, (size) => table.value?.tableApi?.setPageSize(size))
watch(() => props.globalFilter, () => table.value?.tableApi?.setPageIndex(0))
watch(sorting, () => table.value?.tableApi?.setPageIndex(0))

watch(
  () => corporationStore.selectedCorporationId,
  async (uuid) => {
    if (uuid) {
      await Promise.all([
        configurationsStore.fetchConfigurations(uuid),
        loadPreferredItemCounts(uuid),
      ])
    }
    else {
      preferredItemCounts.value = {}
    }
  },
  { immediate: true },
)

onMounted(() => {
  const corpUuid = corporationStore.selectedCorporationId
  if (corpUuid) {
    configurationsStore.fetchConfigurations(corpUuid)
    loadPreferredItemCounts(corpUuid)
  }
})

defineExpose({ openAddModal: () => router.push({ path: '/cost-codes/form/new', query: { ...route.query } }) })
</script>
