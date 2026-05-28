<template>
  <div>
    <!-- Tabs and Add Button Row -->
    <div class="flex items-center justify-between mb-4">
      <UTabs
        :items="tabs"
        :model-value="activeTab"
        size="sm"
        color="neutral"
        :content="false"
        @update:model-value="handleTabChange"
      />

      <div class="flex items-center gap-3">
        <!-- Project Filter Popover (Items tab only) -->
        <UPopover v-if="showProjectFilter">
          <UButton
            icon="i-heroicons-funnel"
            size="sm"
            color="neutral"
            variant="solid"
            :label="selectedProjectFilter ? getProjectDisplayName(selectedProjectFilter) : 'Filter by Project'"
          />
          <template #content>
            <div class="p-4 w-80">
              <h3 class="text-sm font-medium text-default mb-2">Filter by Project</h3>
              <SharedProjectSelect
                :model-value="selectedProjectFilter"
                placeholder="Select project to filter"
                size="sm"
                :corporation-uuid="corpStore.selectedCorporationId"
                @change="handleProjectFilterChange"
              />
              <div class="flex justify-end mt-3">
                <UButton size="xs" color="neutral" variant="ghost" @click="clearProjectFilter">
                  Clear Filter
                </UButton>
              </div>
            </div>
          </template>
        </UPopover>

        <!-- Search -->
        <div class="w-64">
          <UInput
            v-model="globalFilter"
            placeholder="Search..."
            icon="i-heroicons-magnifying-glass"
            variant="subtle"
            size="xs"
            class="w-full"
          />
        </div>

        <!-- Add Button -->
        <UButton
          icon="i-heroicons-plus"
          size="sm"
          color="primary"
          @click="handleAddNew"
        >
          {{ addButtonLabel }}
        </UButton>
      </div>
    </div>

    <!-- Tab Content -->
    <div class="w-full">
      <ProjectsItemTypes
        v-if="activeTab === 'item-types'"
        ref="itemTypesRef"
        :global-filter="globalFilter"
      />
      <ProjectsItemsList
        v-if="activeTab === 'items'"
        ref="itemsRef"
        :global-filter="globalFilter"
        :project-filter="selectedProjectFilter"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useCorporationStore } from '~/stores/corporations'
import { useProjectsStore } from '~/stores/projects'

const route = useRoute()
const router = useRouter()

const corpStore = useCorporationStore()
const projectsStore = useProjectsStore()

const globalFilter = ref('')
const selectedProjectFilter = ref<string | undefined>(undefined)

const itemTypesRef = ref<{ openAddModal: () => void } | null>(null)
const itemsRef = ref<{ openAddModal: () => void } | null>(null)

const tabs = [
  { key: 'item-types', label: 'Item Types', icon: 'i-heroicons-tag', value: 'item-types', slot: 'item-types' },
  { key: 'items', label: 'Items', icon: 'i-heroicons-cube', value: 'items', slot: 'items' },
]

const activeTab = computed(() => {
  const sub = route.query.subTab
  if (sub && typeof sub === 'string') {
    const valid = tabs.find(t => t.value === sub)
    return valid ? sub : tabs[0].value
  }
  return tabs[0].value
})

const showProjectFilter = computed(() => activeTab.value === 'items')

const addButtonLabel = computed(() => {
  switch (activeTab.value) {
    case 'item-types': return 'Add New Item Type'
    case 'items': return 'Add Item'
    default: return 'Add'
  }
})

watch(() => activeTab.value, (newTab, oldTab) => {
  if (oldTab && newTab !== oldTab) globalFilter.value = ''
})

const handleTabChange = (tab: string | number) => {
  const tabValue = String(tab)
  const valid = tabs.find(t => t.value === tabValue)
  if (valid) {
    const q = { ...route.query, subTab: tabValue }
    router.push({ query: q })
  }
}

const handleAddNew = () => {
  if (activeTab.value === 'item-types') {
    itemTypesRef.value?.openAddModal()
  }
  else if (activeTab.value === 'items') {
    itemsRef.value?.openAddModal()
  }
}

const handleProjectFilterChange = (project: unknown) => {
  if (!project) { selectedProjectFilter.value = undefined; return }
  if (typeof project === 'string') { selectedProjectFilter.value = project; return }
  const p = project as Record<string, unknown>
  selectedProjectFilter.value = (p.value as string) || undefined
}

const clearProjectFilter = () => { selectedProjectFilter.value = undefined }

const getProjectDisplayName = (projectUuid: string): string => {
  const p = projectsStore.projects.find((proj: Record<string, unknown>) => proj.uuid === projectUuid) as Record<string, unknown> | undefined
  return p ? `${p.project_name} (${p.project_id})` : 'Unknown Project'
}

onMounted(() => {
  if (!route.query.subTab) {
    router.push({ query: { ...route.query, subTab: tabs[0].value } })
  }
  if (corpStore.selectedCorporationId) {
    projectsStore.fetchProjects(corpStore.selectedCorporationId)
  }
})

watch(
  () => corpStore.selectedCorporationId,
  (id) => { if (id) projectsStore.fetchProjects(id) },
  { immediate: true },
)
</script>
