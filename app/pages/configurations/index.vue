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
          <section v-if="item.value === 'project-types'">
            <ConfigurationsProjectTypes />
          </section>
          <section v-else-if="item.value === 'service-types'">
            <ConfigurationsServiceTypes />
          </section>
          <section v-else-if="item.value === 'terms-and-conditions'">
            <ConfigurationsTermsAndConditions />
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
              Loading configurations...
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
import ConfigurationsProjectTypes from '~/components/configurations/ProjectTypes.vue'
import ConfigurationsServiceTypes from '~/components/configurations/ServiceTypes.vue'
import ConfigurationsTermsAndConditions from '~/components/configurations/TermsAndConditions.vue'
import { CONFIGURATIONS_TABS, useTabRouting } from '~/composables/useTabRouting'
import { getVisibleTabsForNimble, NIMBLE_MENU_IDS_BY_CONFIGURATIONS_TAB } from '~/utils/nimbleMenuIds'

definePageMeta({
  middleware: 'auth',
  layout: 'main-layout',
})

const route = useRoute()
const runtimeConfig = useRuntimeConfig()
const nimbleOn = runtimeConfig.public.nimbleIntegrations === 'true'

const visibleTabs = computed(() => {
  const filtered = getVisibleTabsForNimble(
    CONFIGURATIONS_TABS,
    NIMBLE_MENU_IDS_BY_CONFIGURATIONS_TAB,
    String(route.query.menuId ?? ''),
    nimbleOn,
  )
  return filtered.length ? filtered : CONFIGURATIONS_TABS
})

const {
  currentTab,
  navigateToTab,
  initializeUrl,
  refreshTabState,
  tabs,
} = useTabRouting(visibleTabs.value, visibleTabs.value[0]?.name || 'project-types')

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
  if (validTab) {
    navigateToTab(validTab.name)
  }
}

watch(() => route.query.tab, (newTab) => {
  if (newTab && typeof newTab === 'string') {
    const validTab = tabs.find(t => t.name === newTab)
    if (!validTab) {
      navigateToTab('project-types')
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
</script>
