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
          <section v-if="item.value === 'freight'">
            <MastersFreight />
          </section>
          <section v-else-if="item.value === 'approval-checks'">
            <MastersApprovalChecks />
          </section>
          <section v-else-if="item.value === 'po-instruction'">
            <MastersPOInstruction />
          </section>
          <section v-else-if="item.value === 'location'">
            <MastersLocation />
          </section>
          <section v-else-if="item.value === 'reason'">
            <MastersReason />
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
              Loading masters...
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
import MastersFreight from '~/components/masters/Freight.vue'
import MastersApprovalChecks from '~/components/masters/ApprovalChecks.vue'
import MastersPOInstruction from '~/components/masters/POInstruction.vue'
import MastersLocation from '~/components/masters/Location.vue'
import MastersReason from '~/components/masters/Reason.vue'
import { MASTERS_TABS, useTabRouting } from '~/composables/useTabRouting'

definePageMeta({
  layout: 'main-layout',
  middleware: 'auth',
})

const route = useRoute()

const {
  currentTab,
  navigateToTab,
  isTabActive,
  initializeUrl,
  refreshTabState,
  tabs,
} = useTabRouting(MASTERS_TABS, 'freight')

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
