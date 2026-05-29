<template>
  <div class="space-y-6">
    <ClientOnly>
      <section v-if="activeTab === 'freight'">
        <MastersFreight />
      </section>
      <section v-else-if="activeTab === 'approval-checks'">
        <MastersApprovalChecks />
      </section>
      <section v-else-if="activeTab === 'po-instruction'">
        <MastersPOInstruction />
      </section>
      <section v-else-if="activeTab === 'location'">
        <MastersLocation />
      </section>
      <section v-else-if="activeTab === 'reason'">
        <MastersReason />
      </section>
      <p v-else class="text-muted text-sm">
        No master screen available for this menu.
      </p>

      <template #fallback>
        <div class="flex items-center justify-center h-64">
          <div class="text-center">
            <div class="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-4" />
            <p class="text-muted">
              Loading masters...
            </p>
          </div>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import MastersFreight from '~/components/masters/Freight.vue'
import MastersApprovalChecks from '~/components/masters/ApprovalChecks.vue'
import MastersPOInstruction from '~/components/masters/POInstruction.vue'
import MastersLocation from '~/components/masters/Location.vue'
import MastersReason from '~/components/masters/Reason.vue'
import { MASTERS_TABS, useTabRouting } from '~/composables/useTabRouting'
import { getVisibleTabsForNimble, NIMBLE_MENU_IDS_BY_MASTERS_TAB } from '~/utils/nimbleMenuIds'

definePageMeta({
  layout: 'main-layout',
  middleware: 'auth',
})

const route = useRoute()
const runtimeConfig = useRuntimeConfig()
const nimbleOn = runtimeConfig.public.nimbleIntegrations === 'true'

const visibleTabs = computed(() => {
  const filtered = getVisibleTabsForNimble(
    MASTERS_TABS,
    NIMBLE_MENU_IDS_BY_MASTERS_TAB,
    String(route.query.menuId ?? ''),
    nimbleOn,
  )
  return filtered.length ? filtered : MASTERS_TABS
})

const {
  currentTab,
  navigateToTab,
  isTabActive,
  initializeUrl,
  refreshTabState,
  tabs,
} = useTabRouting(visibleTabs.value, visibleTabs.value[0]?.name || 'freight')

const activeTab = computed(() => {
  if (nimbleOn && visibleTabs.value.length > 0) return visibleTabs.value[0]!.name
  const current = currentTab.value
  if (tabs.some(t => t.name === current)) return current
  return tabs[0]?.name || 'freight'
})

watch(() => route.query.tab, (newTab) => {
  if (newTab && typeof newTab === 'string') {
    const validTab = tabs.find(t => t.name === newTab)
    if (!validTab) {
      navigateToTab('freight')
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
