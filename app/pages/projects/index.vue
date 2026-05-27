<template>
  <div class="space-y-6">
    <ClientOnly>
      <UTabs
        :items="tabItems"
        :model-value="activeTab"
        class="w-full"
        color="primary"
        size="sm"
        :ui="{ leadingIcon: 'xl' }"
        @update:model-value="handleTabChange"
      >
        <template #content="{ item }">
          <section v-if="item.value === 'project-details'">
            <ProjectsProjectDetails />
          </section>
          <section v-else-if="item.value === 'items'">
            <ProjectsItems />
          </section>
          <section v-else-if="item.value === 'estimates'">
            <ProjectsEstimates />
          </section>
          <section v-else-if="item.value === 'cost-codes'">
            <ProjectsCostCodes />
          </section>
          <p v-else class="text-muted text-sm">
            This is the {{ item.label }} tab.
          </p>
        </template>
      </UTabs>

      <template #fallback>
        <div class="flex items-center justify-center h-64">
          <div class="text-center">
            <div class="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-4" />
            <p class="text-muted">
              Loading projects...
            </p>
          </div>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'
import { computed, onMounted, watch } from 'vue'
import ProjectsProjectDetails from '~/components/projects/ProjectDetails.vue'
import ProjectsItems from '~/components/projects/Items.vue'
import ProjectsEstimates from '~/components/projects/Estimates.vue'
import ProjectsCostCodes from '~/components/projects/CostCodes.vue'
import { PROJECTS_TABS, useTabRouting } from '~/composables/useTabRouting'
import { getVisibleTabsForNimble, NIMBLE_MENU_IDS_BY_PROJECTS_TAB } from '~/utils/nimbleMenuIds'

definePageMeta({
  layout: 'main-layout',
  middleware: 'auth',
})

const route = useRoute()
const router = useRouter()
const runtimeConfig = useRuntimeConfig()
const nimbleOn = runtimeConfig.public.nimbleIntegrations === 'true'

const visibleTabs = computed(() => {
  const filtered = getVisibleTabsForNimble(
    PROJECTS_TABS,
    NIMBLE_MENU_IDS_BY_PROJECTS_TAB,
    String(route.query.menuId ?? ''),
    nimbleOn,
  )
  return filtered.length ? filtered : PROJECTS_TABS
})

const {
  currentTab,
  navigateToTab,
  isTabActive,
  initializeUrl,
  refreshTabState,
  tabs,
} = useTabRouting(visibleTabs.value, visibleTabs.value[0]?.name || 'project-details')

const tabItems = computed<TabsItem[]>(() =>
  tabs.map(tab => ({
    label: tab.label,
    icon: tab.icon,
    value: tab.value,
  })),
)

const activeTab = computed(() => currentTab.value)

function handleTabChange(tab: string | number) {
  const tabString = String(tab)
  const validTab = tabs.find(t => t.value === tabString)
  if (!validTab) return

  const query: Record<string, string> = { ...route.query, tab: validTab.name } as Record<string, string>
  if (validTab.name === 'items') {
    query.subTab = 'item-types'
  }
  if (validTab.name === 'cost-codes') {
    query.subTab = 'cost-codes-division'
  }
  router.push({ query })
}

watch(() => route.query.tab, (newTab) => {
  if (newTab && typeof newTab === 'string') {
    const validTab = tabs.find(t => t.name === newTab)
    if (!validTab) {
      navigateToTab('project-details')
    }
  }
})

watch(() => tabs, () => {
  refreshTabState()
}, { deep: true })

onMounted(() => {
  initializeUrl()
  refreshTabState()
})

defineExpose({
  navigateToTab,
  getCurrentTab: () => currentTab.value,
  isTabActive,
})
</script>
