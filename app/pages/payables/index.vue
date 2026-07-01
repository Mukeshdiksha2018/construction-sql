<template>
  <div class="space-y-6">
    <ClientOnly>
      <section v-if="nimbleIntegrations && visibleTabs.length === 1">
        <VendorInvoicesList v-if="activeTab === 'vendor-invoices'" />
        <PayablesBillEntry v-else-if="activeTab === 'bill-entry-payment'" />
        <PayablesPrintChecks v-else-if="activeTab === 'print-checks'" />
      </section>
      <UTabs
        v-else
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
          <section v-if="item.label === 'Vendor Invoices'">
            <VendorInvoicesList />
          </section>
          <section v-else-if="item.label === 'Bill Entry & Payment'">
            <PayablesBillEntry />
          </section>
          <section v-else-if="item.label === 'Print Checks'">
            <PayablesPrintChecks />
          </section>
          <p v-else>This is the {{ item.label }} tab.</p>
        </template>
      </UTabs>
      <template #fallback>
        <div class="flex items-center justify-center h-64">
          <div class="text-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p class="text-gray-600">
              Loading Payables...
            </p>
          </div>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import type { TabsItem } from "@nuxt/ui";
import PayablesBillEntry from '~/components/payables/BillEntry.vue'
import PayablesPrintChecks from '~/components/payables/PrintChecks.vue'
import VendorInvoicesList from '~/components/payables/VendorInvoicesList.vue'
import { useTabRouting, PAYABLES_TABS, type PayablesTabName } from "~/composables/useTabRouting";
import {
  NIMBLE_MENU_IDS_BY_PAYABLES_TAB,
  normalizeMenuId,
  getVisibleTabsForNimble,
} from "~/utils/nimbleMenuIds";

definePageMeta({
  layout: "main-layout",
  middleware: "auth",
});

// Use the tab routing composable
const {
  currentTab,
  navigateToTab,
  isTabActive,
  initializeUrl,
  getAvailableTabs,
  refreshTabState,
  tabs,
} = useTabRouting(PAYABLES_TABS, "vendor-invoices");

const route = useRoute();
const router = useRouter();
const config = useRuntimeConfig();
const nimbleIntegrations = computed(
  () => String(config.public.nimbleIntegrations || '').toLowerCase() === 'true',
);
const { setFromRoute } = useNimbleContext();

/** When Nimble is on: only tabs that have a menuId. When URL has menuId: only the tab that matches that menuId. */
const visibleTabs = computed(() =>
  getVisibleTabsForNimble(
    tabs,
    NIMBLE_MENU_IDS_BY_PAYABLES_TAB,
    (route.query.menuId ?? "") as string,
    nimbleIntegrations.value
  )
);

// Convert visible tab config to NuxtUI TabsItem format
const tabItems = computed<TabsItem[]>(() =>
  visibleTabs.value.map((tab) => ({
    label: tab.label,
    icon: tab.icon,
    value: tab.value,
  }))
);

// When Nimble is on and only one tab is visible (menuId in URL), active tab is that tab; otherwise currentTab
const activeTab = computed(() => {
  const visible = visibleTabs.value;
  if (nimbleIntegrations.value && visible.length === 1) return visible[0]!.name;
  const cur = currentTab.value;
  const firstVisible = visible[0];
  return visible.some((t) => t.name === cur) ? cur : (firstVisible?.name ?? currentTab.value);
});

// Handle tab change (only visible tabs are clickable)
const handleTabChange = (tab: string | number) => {
  const tabString = String(tab);
  const validTab = visibleTabs.value.find((t) => t.value === tabString);
  if (validTab) {
    if (nimbleIntegrations.value && NIMBLE_MENU_IDS_BY_PAYABLES_TAB[validTab.name]) {
      router.push({
        query: { ...route.query, tab: validTab.name, menuId: NIMBLE_MENU_IDS_BY_PAYABLES_TAB[validTab.name] },
      });
    } else {
      navigateToTab(validTab.name);
    }
  }
};

// Sync tab from URL menuId when Nimble is on: if menuId in URL, ensure tab matches that menuId
function syncTabFromMenuId() {
  if (!nimbleIntegrations.value) return;
  const menuIdFromUrl = (route.query.menuId ?? "") as string;
  if (!menuIdFromUrl.trim()) return;
  const normalizedUrl = normalizeMenuId(menuIdFromUrl);
  const tabForMenuId = (
    Object.entries(NIMBLE_MENU_IDS_BY_PAYABLES_TAB) as [string, string][]
  ).find(([, id]) => normalizeMenuId(id) === normalizedUrl)?.[0];
  if (tabForMenuId && route.query.tab !== tabForMenuId) {
    router.replace({ query: { ...route.query, tab: tabForMenuId, menuId: route.query.menuId } });
  }
}

// When Nimble is on and current tab is not in visible list, redirect to first visible tab
function ensureCurrentTabVisible() {
  if (!nimbleIntegrations.value) return;
  const visible = visibleTabs.value;
  const first = visible[0];
  if (!first) return;
  const cur = currentTab.value;
  if (visible.some((t) => t.name === cur)) return;
  const targetTab = first.name;
  router.replace({
    query: { ...route.query, tab: targetTab, menuId: NIMBLE_MENU_IDS_BY_PAYABLES_TAB[targetTab] },
  });
}

// Initialize URL on component mount
onMounted(() => {
  setFromRoute({
    params: (route.params || {}) as Record<string, string>,
    query: (route.query || {}) as Record<string, string>,
  });
  if (nimbleIntegrations.value) {
    syncTabFromMenuId();
    if (!route.query.tab) {
      const menuIdFromUrl = (route.query.menuId ?? "") as string;
      if (menuIdFromUrl.trim()) {
        const normalizedUrl = normalizeMenuId(menuIdFromUrl);
        const tabForMenuId = (
          Object.entries(NIMBLE_MENU_IDS_BY_PAYABLES_TAB) as [string, string][]
        ).find(([, id]) => normalizeMenuId(id) === normalizedUrl)?.[0];
        const tab = tabForMenuId ?? "vendor-invoices";
        router.replace({
          query: { ...route.query, tab, menuId: NIMBLE_MENU_IDS_BY_PAYABLES_TAB[tab] ?? route.query.menuId },
        });
      } else {
        router.replace({
          query: { ...route.query, tab: "vendor-invoices", menuId: NIMBLE_MENU_IDS_BY_PAYABLES_TAB["vendor-invoices"] },
        });
      }
    } else if (NIMBLE_MENU_IDS_BY_PAYABLES_TAB[route.query.tab as string] && !route.query.menuId) {
      router.replace({
        query: { ...route.query, menuId: NIMBLE_MENU_IDS_BY_PAYABLES_TAB[route.query.tab as string] },
      });
    }
    ensureCurrentTabVisible();
  } else if (!route.query.tab) {
    initializeUrl();
  }
  refreshTabState();
});

watch(
  () => [route.params, route.query],
  () => {
    setFromRoute({
      params: (route.params || {}) as Record<string, string>,
      query: (route.query || {}) as Record<string, string>,
    });
  },
  { deep: true },
);

// Watch for route changes: sync tab from menuId and ensure current tab is visible
watch(
  () => [route.query.tab, route.query.menuId],
  () => {
    syncTabFromMenuId();
    ensureCurrentTabVisible();
  },
  { immediate: false }
);

// Watch for route tab to handle direct URL navigation
watch(() => route.query.tab, (newTab) => {
  if (newTab && typeof newTab === "string") {
    const validTab = tabs.find((t) => t.name === newTab);
    if (!validTab) {
      navigateToTab("vendor-invoices");
    }
  }
});

// Expose utility functions for external use
defineExpose({
  navigateToTab: (tab: string) => {
    navigateToTab(tab);
  },
  getCurrentTab: () => {
    return currentTab.value;
  },
  isTabActive: (tab: string) => {
    return isTabActive(tab);
  }
});
</script>
