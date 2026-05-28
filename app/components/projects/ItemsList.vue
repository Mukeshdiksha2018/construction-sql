<template>
  <div>
    <!-- Loading -->
    <div v-if="itemsStore.loading">
      <div class="relative overflow-auto rounded-2xl shadow border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div class="bg-gray-50 dark:bg-gray-700">
          <div class="grid grid-cols-7 gap-4 px-4 py-2 text-sm font-bold border-b border-gray-200 dark:border-gray-600">
            <div v-for="i in 6" :key="i" class="flex items-center gap-2"><USkeleton class="h-4 w-20" /></div>
            <div class="flex justify-end"><USkeleton class="h-4 w-16" /></div>
          </div>
        </div>
        <div class="divide-y divide-gray-200 dark:divide-gray-700">
          <div v-for="i in 5" :key="i" class="grid grid-cols-7 gap-4 px-4 py-2">
            <div v-for="j in 6" :key="j" class="flex items-center"><USkeleton class="h-4 w-24" /></div>
            <div class="flex justify-end gap-1"><USkeleton class="h-6 w-6 rounded" /><USkeleton class="h-6 w-6 rounded" /></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="itemsStore.error">
      <UAlert
        icon="i-heroicons-exclamation-triangle"
        color="error"
        variant="soft"
        :title="itemsStore.error"
        description="Please try refreshing the page or contact support if the issue persists."
      />
    </div>

    <!-- Table -->
    <div v-else-if="filteredItems.length">
      <div class="overflow-auto rounded-2xl shadow border border-gray-200 dark:border-gray-700">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-800 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
            <tr>
              <th class="px-4 py-2 text-left">Project</th>
              <th class="px-4 py-2 text-left">Category</th>
              <th class="px-4 py-2 text-left">Item Type</th>
              <th class="px-4 py-2 text-left">Spec</th>
              <th class="px-4 py-2 text-left">Item Name</th>
              <th class="px-4 py-2 text-right">Unit Cost</th>
              <th class="px-4 py-2 text-left">UOM</th>
              <th class="px-4 py-2 text-left">Status</th>
              <th class="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700 text-sm bg-white dark:bg-gray-900">
            <tr
              v-for="item in paginatedItems"
              :key="item.uuid"
              class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <td class="px-4 py-2">
                <div class="text-xs text-gray-700 dark:text-gray-300">
                  <template v-if="getProject(item.project_uuid)">
                    {{ getProject(item.project_uuid)?.project_name }}
                    <br>
                    <span class="text-gray-400 text-[10px] uppercase">{{ getProject(item.project_uuid)?.project_id }}</span>
                  </template>
                  <template v-else>—</template>
                </div>
              </td>
              <td class="px-4 py-2">
                <span class="text-xs text-gray-600 dark:text-gray-400">{{ getCategoryLabel(item.category ?? '') }}</span>
              </td>
              <td class="px-4 py-2">
                <span class="text-xs text-gray-600 dark:text-gray-400">{{ getItemTypeName(item.item_type_uuid) }}</span>
              </td>
              <td class="px-4 py-2">
                <span class="text-xs text-gray-600 dark:text-gray-400">{{ item.item_sequence || '—' }}</span>
              </td>
              <td class="px-4 py-2">
                <span class="text-sm font-medium">{{ item.item_name }}</span>
              </td>
              <td class="px-4 py-2 text-right">
                <span class="text-xs text-gray-600 dark:text-gray-400">{{ formatCurrency(item.unit_price) }}</span>
              </td>
              <td class="px-4 py-2">
                <span class="text-xs text-gray-600 dark:text-gray-400">{{ getUOMName(item.unit) }}</span>
              </td>
              <td class="px-4 py-2">
                <UBadge
                  :color="item.status === 'Active' ? 'success' : 'neutral'"
                  variant="soft"
                  size="xs"
                >
                  {{ item.status || 'Inactive' }}
                </UBadge>
              </td>
              <td class="px-4 py-2">
                <div class="flex justify-end gap-1">
                  <UTooltip text="Edit Item">
                    <UButton
                      icon="tdesign:edit-filled"
                      size="xs"
                      variant="soft"
                      color="secondary"
                      @click="openEditModal(item)"
                    />
                  </UTooltip>
                  <UTooltip text="Delete Item">
                    <UButton
                      icon="mingcute:delete-fill"
                      size="xs"
                      variant="soft"
                      color="error"
                      @click="openDeleteModal(item)"
                    />
                  </UTooltip>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="mt-4 flex justify-between items-center">
        <span class="text-sm text-gray-600">
          Showing {{ (currentPage - 1) * pageSize + 1 }}–{{ Math.min(currentPage * pageSize, filteredItems.length) }} of {{ filteredItems.length }} items
        </span>
        <UPagination v-model:page="currentPage" :total="filteredItems.length" :page-size="pageSize" />
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="text-center py-12">
      <div class="text-gray-400 mb-4">
        <UIcon name="i-heroicons-cube" class="w-12 h-12 mx-auto" />
      </div>
      <p class="text-gray-500 text-lg">No items found</p>
      <p class="text-gray-400 text-sm mb-6">
        {{ props.globalFilter ? 'No items match your search criteria' : 'Add your first item to get started' }}
      </p>
      <UButton v-if="!props.globalFilter" icon="i-heroicons-plus" @click="openAddModal">
        Add Item
      </UButton>
    </div>

    <!-- Fullscreen Add/Edit Modal -->
    <SharedPreferredItemsAddEditModal
      v-model="showFormModal"
      :initial-editing-item="editingItem"
      @saved="onSaved"
    />

    <!-- Delete Confirmation Modal -->
    <UModal v-model:open="showDeleteModal">
      <template #header>
        <div class="flex items-center justify-between w-full">
          <h3 class="text-base font-semibold text-red-600">Delete Item</h3>
          <UButton icon="i-heroicons-x-mark" size="xs" variant="solid" color="neutral" @click="closeDeleteModal" />
        </div>
      </template>
      <template #body>
        <div class="space-y-4">
          <div class="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-6 h-6 text-red-600 flex-shrink-0" />
            <div>
              <p class="font-medium text-red-800 dark:text-red-200">Are you sure you want to delete this item?</p>
              <p class="text-sm text-red-600 dark:text-red-300 mt-1">This action cannot be undone.</p>
            </div>
          </div>
          <div v-if="itemToDelete" class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div class="text-sm"><span class="text-gray-500">Name:</span> <span class="font-medium">{{ itemToDelete.item_name }}</span></div>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex items-center justify-end gap-2">
          <UButton variant="solid" color="neutral" @click="closeDeleteModal">Cancel</UButton>
          <UButton variant="solid" color="error" :loading="isDeleting" @click="confirmDelete">Delete Item</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useCorporationStore } from '~/stores/corporations'
import { useProjectsStore } from '~/stores/projects'
import { usePreferredItemsStore, type PreferredItem } from '~/stores/preferredItems'
import { useItemTypesStore } from '~/stores/itemTypes'
import { useUOMStore } from '~/stores/uom'
import { getCategoryLabel } from '~/constants/itemCategories'

interface Props {
  globalFilter?: string
  projectFilter?: string
}

const props = withDefaults(defineProps<Props>(), {
  globalFilter: '',
  projectFilter: undefined,
})

const corpStore = useCorporationStore()
const projectsStore = useProjectsStore()
const itemsStore = usePreferredItemsStore()
const itemTypesStore = useItemTypesStore()
const uomStore = useUOMStore()
const toast = useToast()

// Ensure UOM list is loaded for name resolution
onMounted(() => { uomStore.fetchUOM() })

const currentPage = ref(1)
const pageSize = 20
const totalPages = computed(() => Math.ceil(filteredItems.value.length / pageSize))

const filteredItems = computed(() => {
  let list = [...itemsStore.items]
  if (props.projectFilter) {
    list = list.filter(i => i.project_uuid === props.projectFilter)
  }
  if (props.globalFilter?.trim()) {
    const q = props.globalFilter.toLowerCase()
    list = list.filter(
      i => i.item_name.toLowerCase().includes(q)
        || (i.item_sequence || '').toLowerCase().includes(q)
        || getUOMName(i.unit).toLowerCase().includes(q)
        || getItemTypeName(i.item_type_uuid).toLowerCase().includes(q)
        || getCategoryLabel(i.category ?? '').toLowerCase().includes(q),
    )
  }
  return list
})

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredItems.value.slice(start, start + pageSize)
})

function getProject(uuid: string | null) {
  if (!uuid) return null
  return projectsStore.projects.find((p: Record<string, unknown>) => p.uuid === uuid) ?? null
}

function getItemTypeName(uuid: string | null | undefined): string {
  if (!uuid) return '—'
  return itemTypesStore.getItemTypeById(uuid)?.item_type || '—'
}

function formatCurrency(val: number | null | undefined): string {
  if (val == null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)
}

/**
 * Resolve a UOM UUID to its short name (e.g. "KG", "C").
 * Falls back to the raw value if the UOM list hasn't loaded yet, or '—' if empty.
 */
function getUOMName(unit: string | null | undefined): string {
  if (!unit) return '—'
  // If UOMs are loaded, resolve UUID → name; otherwise show the raw value
  if (uomStore.loaded) return uomStore.getShortName(unit) || unit
  return unit
}

// Form / modal state
const showFormModal = ref(false)
const editingItem = ref<Record<string, unknown> | null>(null)

function openAddModal() {
  editingItem.value = null
  showFormModal.value = true
}

function openEditModal(item: PreferredItem) {
  editingItem.value = item as unknown as Record<string, unknown>
  showFormModal.value = true
}

function onSaved() {
  const corpUuid = corpStore.selectedCorporationId
  if (corpUuid) itemsStore.fetchItems(corpUuid)
}

// Delete
const showDeleteModal = ref(false)
const itemToDelete = ref<PreferredItem | null>(null)
const isDeleting = ref(false)

function openDeleteModal(item: PreferredItem) {
  itemToDelete.value = item
  showDeleteModal.value = true
}

function closeDeleteModal() {
  showDeleteModal.value = false
  itemToDelete.value = null
}

async function confirmDelete() {
  if (!itemToDelete.value) return
  isDeleting.value = true
  const success = await itemsStore.deleteItem(itemToDelete.value.uuid)
  isDeleting.value = false
  if (success) {
    toast.add({ title: 'Success', description: 'Item deleted successfully', color: 'success', icon: 'i-heroicons-check-circle' })
    closeDeleteModal()
  }
  else {
    toast.add({ title: 'Error', description: itemsStore.error || 'Failed to delete item', color: 'error', icon: 'i-heroicons-x-circle' })
  }
}

watch(
  () => corpStore.selectedCorporationId,
  (id) => {
    if (id) {
      itemsStore.fetchItems(id)
      itemTypesStore.fetchItemTypes(id)
    }
  },
  { immediate: true },
)

watch(() => props.globalFilter, () => { currentPage.value = 1 })

defineExpose({ openAddModal })
</script>
