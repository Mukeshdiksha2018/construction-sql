<template>
  <div class="space-y-6">
    <!-- When Nimble is on and only one tab: hide tab bar, show content only -->
    <ClientOnly v-if="nimbleIntegrations && visibleTabs.length === 1">
      <section>
        <PurchaseOrdersList v-if="activeTab === 'purchase-orders'" />
        <ReceiptNoteList v-else-if="activeTab === 'stock-receipt-note'" />
        <StockReturnsList v-else-if="activeTab === 'stock-returns'" />
      </section>
      <template #fallback>
        <div class="flex items-center justify-center h-64">
          <div class="text-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p class="text-gray-600">Loading purchase orders...</p>
          </div>
        </div>
      </template>
    </ClientOnly>
    <ClientOnly v-else>
      <UTabs
        :items="tabItems"
        :model-value="activeTab"
        @update:model-value="handleTabChange"
        class="w-full"
        color="primary"
        size="sm"
      >
        <template #content="{ item }">
          <section v-if="item.value === 'purchase-orders'">
            <PurchaseOrdersList />
          </section>
          <section v-else-if="item.value === 'stock-receipt-note'">
            <ReceiptNoteList />
          </section>
          <section v-else-if="item.value === 'stock-returns'">
            <StockReturnsList />
          </section>
          <p v-else>This is the {{ item.label }} tab.</p>
        </template>
      </UTabs>
      <template #fallback>
        <div class="flex items-center justify-center h-64">
          <div class="text-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p class="text-gray-600">Loading purchase orders...</p>
          </div>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'
import PurchaseOrdersList from '~/components/purchaseOrders/PurchaseOrdersList.vue'
import ReceiptNoteList from '~/components/purchaseOrders/ReceiptNoteList.vue'
import StockReturnsList from '~/components/purchaseOrders/StockReturnsList.vue'
import { useTabRouting, PURCHASE_ORDERS_TABS, type PurchaseOrdersTabName } from '~/composables/useTabRouting'
import {
  NIMBLE_MENU_IDS_BY_PURCHASE_ORDERS_TAB,
  normalizeMenuId,
  getVisibleTabsForNimble,
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
  getAvailableTabs,
  refreshTabState,
  tabs,
} = useTabRouting(PURCHASE_ORDERS_TABS, 'purchase-orders')

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const nimbleIntegrations = computed(() => !!config.public.nimbleIntegrations)
const { setFromRoute } = useNimbleContext()

onMounted(() => {
  setFromRoute({
    params: (route.params || {}) as Record<string, string>,
    query: (route.query || {}) as Record<string, string>,
  })
})
watch(
  () => [route.params, route.query],
  () => {
    setFromRoute({
      params: (route.params || {}) as Record<string, string>,
      query: (route.query || {}) as Record<string, string>,
    })
  },
  { deep: true }
)

// Extended tabs including stock returns
const extendedTabs = computed(() => {
  const base = [...tabs]
  const stockReturnsTab = {
    name: 'stock-returns',
    label: 'Stock Returns',
    icon: 'i-heroicons-arrow-uturn-left',
    value: 'stock-returns',
  }
  if (!base.some(t => t.value === 'stock-returns')) {
    const srIdx = base.findIndex(t => t.value === 'stock-receipt-note')
    if (srIdx !== -1) {
      return [...base.slice(0, srIdx + 1), stockReturnsTab, ...base.slice(srIdx + 1)]
    }
    return [...base, stockReturnsTab]
  }
  return base
})

const visibleTabs = computed(() =>
  getVisibleTabsForNimble(
    extendedTabs.value,
    NIMBLE_MENU_IDS_BY_PURCHASE_ORDERS_TAB,
    (route.query.menuId ?? '') as string,
    nimbleIntegrations.value
  )
)

const tabItems = computed<TabsItem[]>(() =>
  visibleTabs.value.map(tab => ({
    label: tab.label,
    icon: tab.icon,
    value: tab.value,
  }))
)

const activeTab = computed(() => {
  const visible = visibleTabs.value
  if (nimbleIntegrations.value && visible.length === 1) return visible[0]!.name
  const tabFromUrl = route.query.tab as string | undefined
  if (tabFromUrl === 'stock-returns') return tabFromUrl
  const cur = currentTab.value
  const firstVisible = visible[0]
  return visible.some(t => t.name === cur) ? cur : (firstVisible?.name ?? currentTab.value)
})

const handleTabChange = (tab: string | number) => {
  const tabString = String(tab)
  const validTab = visibleTabs.value.find(t => t.value === tabString)
  if (validTab) {
    if (validTab.name === 'stock-returns') {
      router.push({ query: { ...route.query, tab: validTab.name } })
    } else if (nimbleIntegrations.value && NIMBLE_MENU_IDS_BY_PURCHASE_ORDERS_TAB[validTab.name]) {
      router.push({
        query: { ...route.query, tab: validTab.name, menuId: NIMBLE_MENU_IDS_BY_PURCHASE_ORDERS_TAB[validTab.name] },
      })
    } else {
      navigateToTab(validTab.name)
    }
  }
}

function syncTabFromMenuId() {
  if (!nimbleIntegrations.value) return
  const menuIdFromUrl = (route.query.menuId ?? '') as string
  if (!menuIdFromUrl.trim()) return
  const normalizedUrl = normalizeMenuId(menuIdFromUrl)
  const tabForMenuId = (
    Object.entries(NIMBLE_MENU_IDS_BY_PURCHASE_ORDERS_TAB) as [string, string][]
  ).find(([, id]) => normalizeMenuId(id) === normalizedUrl)?.[0]
  if (tabForMenuId && route.query.tab !== tabForMenuId) {
    router.replace({ query: { ...route.query, tab: tabForMenuId, menuId: route.query.menuId } })
  }
}

onMounted(() => {
  if (nimbleIntegrations.value) {
    syncTabFromMenuId()
    if (!route.query.tab) {
      router.replace({
        query: { ...route.query, tab: 'purchase-orders', menuId: NIMBLE_MENU_IDS_BY_PURCHASE_ORDERS_TAB['purchase-orders'] },
      })
    }
  } else {
    initializeUrl()
    refreshTabState()
  }
})

watch(
  () => [route.query.tab, route.query.menuId],
  () => { syncTabFromMenuId() },
  { immediate: false }
)

watch(() => route.query.tab, (newTab) => {
  if (newTab && typeof newTab === 'string') {
    const validTab = extendedTabs.value.find(t => t.name === newTab)
    if (!validTab) navigateToTab('purchase-orders')
  }
})

defineExpose({
  navigateToTab: (tab: string) => navigateToTab(tab),
  getCurrentTab: () => currentTab.value,
  isTabActive: (tab: string) => isTabActive(tab),
})

useHead({ title: 'Purchase Orders - Nimble Property Management' })
</script>
