export interface NavItem {
  label: string
  to: string
  icon: string
  class?: string
}

export const desktopNavItems: NavItem[] = [
  { label: 'Projects', to: '/projects', icon: 'i-heroicons-folder-solid' },
  { label: 'Vendors', to: '/vendors', icon: 'i-heroicons-user-group-solid' },
  { label: 'Customers', to: '/customers', icon: 'i-heroicons-user-circle-solid' },
  { label: 'Purchase Orders', to: '/purchase-orders', icon: 'i-heroicons-shopping-cart-solid' },
  { label: 'Payables', to: '/payables', icon: 'i-heroicons-credit-card-solid' },
  { label: 'Masters', to: '/masters', icon: 'i-heroicons-circle-stack-solid' },
  { label: 'Configurations', to: '/configurations', icon: 'i-heroicons-cog-6-tooth-solid' },
  { label: 'Reports', to: '/reports', icon: 'i-heroicons-document-text-solid' },
]

export const mobileNavItems: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: 'i-material-symbols-dashboard-rounded' },
  { label: 'Corporation', to: '/corporation', icon: 'i-lucide-building-2' },
  { label: 'Projects', to: '/projects', icon: 'i-heroicons-clipboard-document-list' },
  { label: 'Payables', to: '/payables', icon: 'i-mingcute-card-pay-fill' },
  { label: 'Reports', to: '/reports', icon: 'i-heroicons-chart-bar' },
  { label: 'Settings', to: '/settings', icon: 'i-material-symbols-settings-rounded' },
]

export function useActiveRoute() {
  const route = useRoute()

  return (path: string) => {
    if (path === '/dashboard' && (route.path === '/' || route.path === '/dashboard')) {
      return true
    }
    return route.path === path || route.path.startsWith(`${path}/`)
  }
}
