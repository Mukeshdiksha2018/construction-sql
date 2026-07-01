<template>
  <div class="space-y-6">
    <ClientOnly v-if="nimbleIntegrations && visibleTabs.length === 1">
      <section>
        <MastersTabContent :tab="activeTab" />
      </section>
      <template #fallback>
        <div class="flex items-center justify-center h-64">
          <div class="text-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p class="text-gray-600">
              Loading masters...
            </p>
          </div>
        </div>
      </template>
    </ClientOnly>
    <ClientOnly v-else>
      <UTabs
        :items="tabItems"
        :model-value="activeTab"
        class="w-full"
        color="primary"
        size="sm"
        :ui="{
          leadingIcon: 'xl',
        }"
        @update:model-value="handleTabChange"
      >
        <template #content="{ item }">
          <section>
            <MastersTabContent :tab="String(item.value)" />
          </section>
        </template>
      </UTabs>
      <template #fallback>
        <div class="flex items-center justify-center h-64">
          <div class="text-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p class="text-gray-600">
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
import MastersTabContent from '~/components/masters/MastersTabContent.vue'
import { MASTERS_TABS, useTabRouting } from '~/composables/useTabRouting'
import {
  getVisibleTabsForNimble,
  NIMBLE_MENU_IDS_BY_MASTERS_TAB,
  normalizeMenuId,
} from '~/utils/nimbleMenuIds'

definePageMeta({
  layout: 'main-layout',
  middleware: 'auth',
})

const {
  currentTab,
  navigateToTab,
  isTabActive,
  initializeUrl,
  refreshTabState,
  tabs,
} = useTabRouting(MASTERS_TABS, 'freight')

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const nimbleIntegrations = computed(
  () => String(config.public.nimbleIntegrations || '').toLowerCase() === 'true',
)

const visibleTabs = computed(() => {
  const menuId = String(route.query.menuId ?? '').trim()
  if (!nimbleIntegrations.value || !menuId) {
    return [...MASTERS_TABS]
  }

  const filtered = getVisibleTabsForNimble(
    tabs,
    NIMBLE_MENU_IDS_BY_MASTERS_TAB,
    menuId,
    true,
  )
  return filtered.length ? filtered : [...MASTERS_TABS]
})

const tabItems = computed<TabsItem[]>(() =>
  visibleTabs.value.map(tab => ({
    label: tab.label,
    icon: tab.icon,
    value: tab.value,
  })),
)

const activeTab = computed(() => {
  const visible = visibleTabs.value
  if (nimbleIntegrations.value && visible.length === 1) return visible[0]!.name
  const cur = currentTab.value
  const firstVisible = visible[0]
  return visible.some(t => t.name === cur) ? cur : (firstVisible?.name ?? currentTab.value)
})

function handleTabChange(tab: string | number) {
  const tabString = String(tab)
  const validTab = visibleTabs.value.find(t => t.value === tabString)
  if (!validTab) return

  if (nimbleIntegrations.value && NIMBLE_MENU_IDS_BY_MASTERS_TAB[validTab.name]) {
    router.push({
      query: {
        ...route.query,
        tab: validTab.name,
        menuId: NIMBLE_MENU_IDS_BY_MASTERS_TAB[validTab.name],
      },
    })
  }
  else {
    navigateToTab(validTab.name)
  }
}

function syncTabFromMenuId() {
  if (!nimbleIntegrations.value) return
  const menuIdFromUrl = String(route.query.menuId ?? '').trim()
  if (!menuIdFromUrl) return
  const normalizedUrl = normalizeMenuId(menuIdFromUrl)
  const tabForMenuId = (
    Object.entries(NIMBLE_MENU_IDS_BY_MASTERS_TAB) as [string, string][]
  ).find(([, id]) => normalizeMenuId(id) === normalizedUrl)?.[0]
  if (tabForMenuId && route.query.tab !== tabForMenuId) {
    router.replace({ query: { ...route.query, tab: tabForMenuId, menuId: route.query.menuId } })
  }
}

function ensureCurrentTabVisible() {
  if (!nimbleIntegrations.value) return
  const visible = visibleTabs.value
  const first = visible[0]
  if (!first) return
  const cur = currentTab.value
  if (visible.some(t => t.name === cur)) return
  const targetTab = first.name
  const menuId = NIMBLE_MENU_IDS_BY_MASTERS_TAB[targetTab]
  router.replace({
    query: {
      ...route.query,
      tab: targetTab,
      ...(menuId ? { menuId } : {}),
    },
  })
}

onMounted(() => {
  if (nimbleIntegrations.value) {
    syncTabFromMenuId()
    if (!route.query.tab && route.query.menuId) {
      syncTabFromMenuId()
    }
    else if (!route.query.tab) {
      initializeUrl()
    }
    ensureCurrentTabVisible()
  }
  else {
    initializeUrl()
    refreshTabState()
  }
})

watch(
  () => [route.query.tab, route.query.menuId],
  () => {
    syncTabFromMenuId()
    ensureCurrentTabVisible()
  },
  { immediate: false },
)

watch(() => route.query.tab, (newTab) => {
  if (newTab && typeof newTab === 'string') {
    const validTab = MASTERS_TABS.find(t => t.name === newTab)
    if (!validTab) navigateToTab('freight')
  }
})

watch(
  () => tabs,
  () => {
    refreshTabState()
  },
  { deep: true },
)

defineExpose({
  navigateToTab,
  getCurrentTab: () => currentTab.value,
  isTabActive,
})
</script>
