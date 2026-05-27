/**
 * Tab-based routing with URL query synchronization (?tab=...).
 */
import { computed, readonly } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export type ProjectsTabName = 'project-details' | 'items' | 'estimates' | 'cost-codes'

export type MastersTabName =
  | 'freight'
  | 'ship-via'
  | 'approval-checks'
  | 'po-instruction'
  | 'location'
  | 'uom'
  | 'uom-types'
  | 'charges'
  | 'sales-tax'
  | 'reason'

export interface TabConfig {
  name: string
  label: string
  icon: string
  value: string
}

export const PROJECTS_TABS: TabConfig[] = [
  {
    name: 'project-details',
    label: 'Project Details',
    icon: 'i-heroicons-clipboard-document-list',
    value: 'project-details',
  },
  {
    name: 'cost-codes',
    label: 'Cost Codes',
    icon: 'i-heroicons-currency-dollar',
    value: 'cost-codes',
  },
  {
    name: 'items',
    label: 'Items',
    icon: 'i-heroicons-cube',
    value: 'items',
  },
  {
    name: 'estimates',
    label: 'Estimates',
    icon: 'i-heroicons-calculator',
    value: 'estimates',
  },
]

export const MASTERS_TABS: TabConfig[] = [
  { name: 'freight', label: 'Freight', icon: 'i-heroicons-truck', value: 'freight' },
  { name: 'ship-via', label: 'Ship VIA', icon: 'i-heroicons-paper-airplane', value: 'ship-via' },
  { name: 'approval-checks', label: 'Approval Checks', icon: 'i-heroicons-check-circle', value: 'approval-checks' },
  { name: 'po-instruction', label: 'PO Instruction', icon: 'i-heroicons-document-text', value: 'po-instruction' },
  { name: 'location', label: 'Location', icon: 'i-heroicons-map-pin', value: 'location' },
  { name: 'uom', label: 'UOM', icon: 'i-heroicons-scale', value: 'uom' },
  { name: 'uom-types', label: 'UOM Types', icon: 'i-heroicons-squares-2x2', value: 'uom-types' },
  { name: 'charges', label: 'Charges', icon: 'i-heroicons-currency-dollar', value: 'charges' },
  { name: 'sales-tax', label: 'Sales Tax', icon: 'i-heroicons-receipt-percent', value: 'sales-tax' },
  { name: 'reason', label: 'Reason', icon: 'i-heroicons-document-text', value: 'reason' },
]

export function useTabRouting(tabs: TabConfig[], defaultTab: string) {
  const route = useRoute()
  const router = useRouter()

  const currentTab = computed(() => {
    const tabParam = route.query.tab
    if (tabParam && typeof tabParam === 'string') {
      const validTab = tabs.find(tab => tab.name === tabParam)
      return validTab ? validTab.name : defaultTab
    }
    return defaultTab
  })

  const refreshTabState = () => {
    const currentTabParam = route.query.tab
    if (currentTabParam && typeof currentTabParam === 'string') {
      const validTab = tabs.find(tab => tab.name === currentTabParam)
      if (!validTab) {
        navigateToTab(defaultTab)
      }
    }
  }

  const navigateToTab = (tab: string) => {
    const currentQuery = { ...route.query }
    currentQuery.tab = tab
    router.push({ query: currentQuery })
  }

  const isTabActive = (tab: string): boolean => currentTab.value === tab

  const initializeUrl = () => {
    if (!route.query.tab) {
      navigateToTab(defaultTab)
    }
  }

  const getTabConfig = (tabName: string): TabConfig | undefined =>
    tabs.find(tab => tab.name === tabName)

  const getAvailableTabs = (): TabConfig[] => tabs

  return {
    currentTab: readonly(currentTab),
    navigateToTab,
    isTabActive,
    initializeUrl,
    getTabConfig,
    getAvailableTabs,
    refreshTabState,
    tabs,
  }
}
