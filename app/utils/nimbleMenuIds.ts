/**
 * Nimble menu ID catalog – single source of truth for all Nimble menu IDs.
 * Used when NUXT_PUBLIC_NIMBLE_INTEGRATIONS is true to:
 * - Load privileges per menu
 * - Filter visible tabs by URL menuId (show only the tab that matches the URL menuId)
 *
 * Add new entries here when Nimble adds or changes menus.
 */

/** One Nimble menu entry (label and optional app path). */
export interface NimbleMenuEntry {
  menuId: string
  label: string
  /** App path (e.g. /projects, /masters?tab=freight). Optional for section/parent entries. */
  path?: string
}

/**
 * Full list of Nimble menu IDs in order.
 * Section/parent entries (Construction, Construction Masters) have no path.
 */
export const NIMBLE_MENU_ENTRIES: NimbleMenuEntry[] = [
  { menuId: '0x010000000000000000000000000000011130', label: 'Construction' },
  { menuId: '0x010000000000000000000000000000011131', label: 'Projects', path: '/projects' },
  { menuId: '0x010000000000000000000000000000011132', label: 'Purchase Orders', path: '/purchase-orders' },
  { menuId: '0x010000000000000000000000000000011133', label: 'Vendor Invoices', path: '/payables?tab=vendor-invoices' },
  { menuId: '0x010000000000000000000000000000011134', label: 'Configurations', path: '/configurations' },
  // Configuration child screens
  { menuId: '0x010000000000000000000000000000011149', label: 'Project Type', path: '/configurations?tab=project-types' },
  { menuId: '0x010000000000000000000000000000011150', label: 'Service Type', path: '/configurations?tab=service-types' },
  { menuId: '0x010000000000000000000000000000011153', label: 'Terms and Conditions', path: '/configurations?tab=terms-and-conditions' },
  { menuId: '0x010000000000000000000000000000011161', label: 'Special Instructions', path: '/configurations?tab=special-instructions' },
  // Corporation child screen
  { menuId: '0x010000000000000000000000000000011152', label: 'Storage Locations', path: '/corporation?tab=storage-locations' },
  // Masters section + child screens
  { menuId: '0x010000000000000000000000000000011145', label: 'Construction Masters' },
  { menuId: '0x010000000000000000000000000000011146', label: 'Freight', path: '/masters?tab=freight' },
  { menuId: '0x010000000000000000000000000000011160', label: 'Approval Checks', path: '/masters?tab=approval-checks' },
  { menuId: '0x010000000000000000000000000000011151', label: 'Po Instruction', path: '/masters?tab=po-instruction' },
  { menuId: '0x010000000000000000000000000000011147', label: 'Charges', path: '/masters?tab=charges' },
  { menuId: '0x010000000000000000000000000000011148', label: 'Reason', path: '/masters?tab=reason' },
]

/** Normalize menuId for comparison (strip 0x, lowercase). */
export function normalizeMenuId(id: string | undefined): string {
  const str = String(id ?? '').trim()
  return str.replace(/^0x/i, '').toLowerCase()
}

/** Get menuId by normalized value from NIMBLE_MENU_ENTRIES. */
export function getMenuIdByNormalized(normalized: string): string | undefined {
  return NIMBLE_MENU_ENTRIES.find((e) => normalizeMenuId(e.menuId) === normalized)?.menuId
}

/** Get label for a menuId (from NIMBLE_MENU_ENTRIES). */
export function getMenuLabel(menuId: string): string | undefined {
  const n = normalizeMenuId(menuId)
  return NIMBLE_MENU_ENTRIES.find((e) => normalizeMenuId(e.menuId) === n)?.label
}

/** Get the app path for a menuId (from NIMBLE_MENU_ENTRIES). Used for post-login redirects. */
export function getPathForMenuId(menuId: string | undefined): string | undefined {
  if (!menuId) return undefined
  const n = normalizeMenuId(menuId)
  return NIMBLE_MENU_ENTRIES.find((e) => normalizeMenuId(e.menuId) === n)?.path
}

/** Minimal tab shape for visible-tabs filtering. */
export interface TabLike {
  name: string
  label: string
  icon: string
  value: string
}

/**
 * Get visible tabs when Nimble integration is on.
 * When nimbleOn is false, returns all tabs.
 * When nimbleOn is true, returns only tabs that have a menuId in menuIdsByTab.
 * When menuIdFromUrl is provided, returns only the tab whose menuId matches (single tab).
 * Used by Masters, Payables, and Corporation pages to show only the tab(s) for the current menuId.
 */
export function getVisibleTabsForNimble<T extends TabLike>(
  tabs: T[],
  menuIdsByTab: Partial<Record<string, string>>,
  menuIdFromUrl: string | undefined,
  nimbleOn: boolean,
): T[] {
  if (!nimbleOn) return [...tabs]
  const withMenuId = tabs.filter((tab) => menuIdsByTab[tab.name])
  const menuId = String(menuIdFromUrl ?? '').trim()
  if (!menuId) return withMenuId
  const normalizedUrl = normalizeMenuId(menuId)
  return withMenuId.filter(
    (tab) => normalizeMenuId(menuIdsByTab[tab.name]) === normalizedUrl,
  )
}

// --- Per-screen tab → menuId (for pages with tabs; only tabs that have a Nimble menuId are listed) ---

/** Masters page: tab name → Nimble menuId. Tabs not listed have no menuId and are hidden when Nimble is on. */
export const NIMBLE_MENU_IDS_BY_MASTERS_TAB: Partial<Record<string, string>> = {
  freight: '0x010000000000000000000000000000011146',
  'approval-checks': '0x010000000000000000000000000000011160',
  'po-instruction': '0x010000000000000000000000000000011151',
  charges: '0x010000000000000000000000000000011147',
  reason: '0x010000000000000000000000000000011148',
}

/** Payables page: tab name → Nimble menuId. */
export const NIMBLE_MENU_IDS_BY_PAYABLES_TAB: Partial<Record<string, string>> = {
  'vendor-invoices': '0x010000000000000000000000000000011133',
}

/** Corporation page: tab name → Nimble menuId. */
export const NIMBLE_MENU_IDS_BY_CORPORATION_TAB: Partial<Record<string, string>> = {
  'storage-locations': '0x010000000000000000000000000000011152',
}

/** Configurations page: tab name → Nimble menuId. */
export const NIMBLE_MENU_IDS_BY_CONFIGURATIONS_TAB: Partial<Record<string, string>> = {
  'project-types': '0x010000000000000000000000000000011149',
  'service-types': '0x010000000000000000000000000000011150',
  'terms-and-conditions': '0x010000000000000000000000000000011153',
  'special-instructions': '0x010000000000000000000000000000011161',
}

/** Purchase Orders page: tab name → Nimble menuId. */
export const NIMBLE_MENU_IDS_BY_PURCHASE_ORDERS_TAB: Partial<Record<string, string>> = {
  'purchase-orders': '0x010000000000000000000000000000011131',
  'change-orders': '0x010000000000000000000000000000011132',
  'stock-receipt-note': '0x010000000000000000000000000000011134',
  'stock-returns': '0x010000000000000000000000000000011135',
}

/** Projects page: tab name → Nimble menuId. When Nimble is on, only the tab matching the URL menuId is shown. */
export const NIMBLE_MENU_IDS_BY_PROJECTS_TAB: Partial<Record<string, string>> = {
  'project-details': '0x010000000000000000000000000000011137',
  'items': '0x010000000000000000000000000000011138',
  'cost-codes': '0x010000000000000000000000000000011139',
  'estimates': '0x010000000000000000000000000000011140',
}

// --- Top-level routes (single route, no tabs) ---

/** Projects page (single route). */
export const NIMBLE_MENU_ID_PROJECTS = '0x010000000000000000000000000000011131'

/** Purchase Orders page. */
export const NIMBLE_MENU_ID_PURCHASE_ORDERS = '0x010000000000000000000000000000011132'

/** Configurations page. */
export const NIMBLE_MENU_ID_CONFIGURATIONS = '0x010000000000000000000000000000011134'

/** Customers page. */
export const NIMBLE_MENU_ID_CUSTOMERS = '0x010000000000000000000000000000011162'
