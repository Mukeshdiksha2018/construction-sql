/**
 * Tab-based routing with URL query synchronization (?tab=...).
 */
import { computed, readonly } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export type ProjectsTabName = 'project-details' | 'items' | 'estimates' | 'cost-codes'
export type ConfigurationsTabName =
  | 'project-types'
  | 'service-types'
  | 'terms-and-conditions'
  | 'special-instructions'
export type PurchaseOrdersTabName = 'purchase-orders' | 'stock-receipt-note'
export type PayablesTabName = 'vendor-invoices' | 'bill-entry-payment' | 'print-checks'
export type CorporationTabName =
  | 'manage-corporation'
  | 'profit-center'
  | 'chart-of-accounts'
  | 'locking-unlocking'
  | 'bank-details'
  | 'digital-signature'

export type MastersTabName =
  | 'freight'
  | 'approval-checks'
  | 'po-instruction'
  | 'location'
  | 'reason'
  | 'credit-days'

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
  { name: 'approval-checks', label: 'Approval Checks', icon: 'i-heroicons-check-circle', value: 'approval-checks' },
  { name: 'po-instruction', label: 'PO Instruction', icon: 'i-heroicons-document-text', value: 'po-instruction' },
  { name: 'location', label: 'Location', icon: 'i-heroicons-map-pin', value: 'location' },
  { name: 'reason', label: 'Reason', icon: 'i-heroicons-document-text', value: 'reason' },
  { name: 'credit-days', label: 'Credit Days', icon: 'i-heroicons-calendar-days', value: 'credit-days' },
]

export const PURCHASE_ORDERS_TABS: TabConfig[] = [
  {
    name: 'purchase-orders',
    label: 'Purchase Orders',
    icon: 'i-heroicons-shopping-cart',
    value: 'purchase-orders',
  },
  {
    name: 'stock-receipt-note',
    label: 'Stock Receipt Note',
    icon: 'i-heroicons-clipboard-document-check',
    value: 'stock-receipt-note',
  },
]

export const PAYABLES_TABS: TabConfig[] = [
  {
    name: 'vendor-invoices',
    label: 'Vendor Invoices',
    icon: 'i-heroicons-document-text',
    value: 'vendor-invoices',
  },
  {
    name: 'bill-entry-payment',
    label: 'Bill Entry & Payment',
    icon: 'i-heroicons-document-plus',
    value: 'bill-entry-payment',
  },
  {
    name: 'print-checks',
    label: 'Print Checks',
    icon: 'i-heroicons-printer',
    value: 'print-checks',
  },
]

export const CORPORATION_TABS: TabConfig[] = [
  {
    name: 'manage-corporation',
    label: 'Manage Corporation',
    icon: 'i-heroicons-building-office-2',
    value: 'manage-corporation',
  },
  {
    name: 'profit-center',
    label: 'Profit Center',
    icon: 'i-heroicons-chart-pie',
    value: 'profit-center',
  },
  {
    name: 'chart-of-accounts',
    label: 'Chart of Accounts',
    icon: 'i-heroicons-table-cells',
    value: 'chart-of-accounts',
  },
  {
    name: 'locking-unlocking',
    label: 'Locking/Unlocking',
    icon: 'i-heroicons-lock-closed',
    value: 'locking-unlocking',
  },
  {
    name: 'bank-details',
    label: 'Bank Details',
    icon: 'i-heroicons-building-library',
    value: 'bank-details',
  },
  {
    name: 'digital-signature',
    label: 'Digital Signature',
    icon: 'i-heroicons-pencil-square',
    value: 'digital-signature',
  },
]

export const CONFIGURATIONS_TABS: TabConfig[] = [
  {
    name: 'project-types',
    label: 'Project Types',
    icon: 'i-heroicons-chart-bar-square',
    value: 'project-types',
  },
  {
    name: 'service-types',
    label: 'Service Types',
    icon: 'i-heroicons-scale',
    value: 'service-types',
  },
  {
    name: 'terms-and-conditions',
    label: 'Terms and Conditions Master',
    icon: 'i-heroicons-document-text',
    value: 'terms-and-conditions',
  },
  {
    name: 'special-instructions',
    label: 'Special Instructions',
    icon: 'i-heroicons-clipboard-document-list',
    value: 'special-instructions',
  },
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
