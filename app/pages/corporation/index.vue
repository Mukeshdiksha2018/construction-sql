<template>
  <div class="space-y-6">
    <ClientOnly v-if="nimbleIntegrations && visibleTabs.length === 1">
      <section>
        <CorporationTabContent :tab="activeTab" />
      </section>
      <template #fallback>
        <div class="flex items-center justify-center h-64">
          <div class="text-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p class="text-gray-600">
              Loading corporation...
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
            <CorporationTabContent :tab="String(item.value)" />
          </section>
        </template>
      </UTabs>
      <template #fallback>
        <div class="flex items-center justify-center h-64">
          <div class="text-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p class="text-gray-600">
              Loading corporation...
            </p>
          </div>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'
import CorporationTabContent from '~/components/corporation/CorporationTabContent.vue'
import { CORPORATION_TABS, useTabRouting } from '~/composables/useTabRouting'
import {
  getVisibleTabsForNimble,
  NIMBLE_MENU_IDS_BY_CORPORATION_TAB,
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
} = useTabRouting(CORPORATION_TABS, 'manage-corporation')

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const nimbleIntegrations = computed(
  () => String(config.public.nimbleIntegrations || '').toLowerCase() === 'true',
)
const { setFromRoute } = useNimbleContext()

const visibleTabs = computed(() => {
  const filtered = getVisibleTabsForNimble(
    tabs,
    NIMBLE_MENU_IDS_BY_CORPORATION_TAB,
    (route.query.menuId ?? '') as string,
    nimbleIntegrations.value,
  )
  return filtered.length ? filtered : CORPORATION_TABS
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

  if (nimbleIntegrations.value && NIMBLE_MENU_IDS_BY_CORPORATION_TAB[validTab.name]) {
    router.push({
      query: {
        ...route.query,
        tab: validTab.name,
        menuId: NIMBLE_MENU_IDS_BY_CORPORATION_TAB[validTab.name],
      },
    })
  }
  else {
    navigateToTab(validTab.name)
  }
}

function syncTabFromMenuId() {
  if (!nimbleIntegrations.value) return
  const menuIdFromUrl = (route.query.menuId ?? '') as string
  if (!menuIdFromUrl.trim()) return
  const normalizedUrl = normalizeMenuId(menuIdFromUrl)
  const tabForMenuId = (
    Object.entries(NIMBLE_MENU_IDS_BY_CORPORATION_TAB) as [string, string][]
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
  const menuId = NIMBLE_MENU_IDS_BY_CORPORATION_TAB[targetTab]
  router.replace({
    query: {
      ...route.query,
      tab: targetTab,
      ...(menuId ? { menuId } : {}),
    },
  })
}

onMounted(() => {
  setFromRoute({
    params: (route.params || {}) as Record<string, string>,
    query: (route.query || {}) as Record<string, string>,
  })

  if (nimbleIntegrations.value) {
    syncTabFromMenuId()
    if (!route.query.tab) {
      const menuIdFromUrl = (route.query.menuId ?? '') as string
      if (menuIdFromUrl.trim()) {
        const normalizedUrl = normalizeMenuId(menuIdFromUrl)
        const tabForMenuId = (
          Object.entries(NIMBLE_MENU_IDS_BY_CORPORATION_TAB) as [string, string][]
        ).find(([, id]) => normalizeMenuId(id) === normalizedUrl)?.[0]
        const tab = tabForMenuId ?? 'manage-corporation'
        router.replace({
          query: {
            ...route.query,
            tab,
            menuId: NIMBLE_MENU_IDS_BY_CORPORATION_TAB[tab] ?? route.query.menuId,
          },
        })
      }
      else {
        router.replace({
          query: {
            ...route.query,
            tab: 'manage-corporation',
            ...(NIMBLE_MENU_IDS_BY_CORPORATION_TAB['manage-corporation']
              ? { menuId: NIMBLE_MENU_IDS_BY_CORPORATION_TAB['manage-corporation'] }
              : {}),
          },
        })
      }
    }
    else if (
      NIMBLE_MENU_IDS_BY_CORPORATION_TAB[route.query.tab as string]
      && !route.query.menuId
    ) {
      router.replace({
        query: {
          ...route.query,
          menuId: NIMBLE_MENU_IDS_BY_CORPORATION_TAB[route.query.tab as string],
        },
      })
    }
    ensureCurrentTabVisible()
  }
  else {
    initializeUrl()
    refreshTabState()
  }
})

watch(
  () => [route.params, route.query],
  () => {
    setFromRoute({
      params: (route.params || {}) as Record<string, string>,
      query: (route.query || {}) as Record<string, string>,
    })
  },
  { deep: true },
)

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
    const validTab = CORPORATION_TABS.find(t => t.name === newTab)
    if (!validTab) navigateToTab('manage-corporation')
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
  navigateToTab: (tab: string) => navigateToTab(tab),
  getCurrentTab: () => currentTab.value,
  isTabActive: (tab: string) => isTabActive(tab),
})

useHead({ title: 'Corporation - Nimble Property Management' })
</script>
