<template>
  <div class="space-y-6">
    <ClientOnly>
      <section v-if="activeTab === 'project-types'">
        <ConfigurationsProjectTypes />
      </section>
      <section v-else-if="activeTab === 'service-types'">
        <ConfigurationsServiceTypes />
      </section>
      <section v-else-if="activeTab === 'terms-and-conditions'">
        <ConfigurationsTermsAndConditions />
      </section>
      <p v-else class="text-muted text-sm">
        No configuration screen available for this menu.
      </p>

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
const activeTab = computed(() => {
  if (nimbleOn && visibleTabs.value.length > 0) return visibleTabs.value[0]!.name
  const current = currentTab.value
  if (tabs.some(t => t.name === current)) return current
  return tabs[0]?.name || 'project-types'
})

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
