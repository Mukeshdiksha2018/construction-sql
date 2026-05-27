/**
 * Nimble menu ID catalog and helpers.
 */
export interface NimbleMenuEntry {
  menuId: string
  label: string
  path?: string
}

export const NIMBLE_MENU_ENTRIES: NimbleMenuEntry[] = [
  { menuId: '0x010000000000000000000000000000011130', label: 'Construction' },
  { menuId: '0x010000000000000000000000000000011131', label: 'Projects', path: '/projects' },
  { menuId: '0x010000000000000000000000000000011132', label: 'Purchase Orders', path: '/purchase-orders' },
  { menuId: '0x010000000000000000000000000000011133', label: 'Vendor Invoices', path: '/payables?tab=vendor-invoices' },
  { menuId: '0x010000000000000000000000000000011134', label: 'Configurations', path: '/configurations' },
  { menuId: '0x010000000000000000000000000000011149', label: 'Project Type', path: '/configurations?tab=project-types' },
  { menuId: '0x010000000000000000000000000000011150', label: 'Service Type', path: '/configurations?tab=service-types' },
  { menuId: '0x010000000000000000000000000000011153', label: 'Terms and Conditions', path: '/configurations?tab=terms-and-conditions' },
  { menuId: '0x010000000000000000000000000000011161', label: 'Special Instructions', path: '/configurations?tab=special-instructions' },
  { menuId: '0x010000000000000000000000000000011152', label: 'Storage Locations', path: '/corporation?tab=storage-locations' },
  { menuId: '0x010000000000000000000000000000011145', label: 'Construction Masters' },
  { menuId: '0x010000000000000000000000000000011146', label: 'Freight', path: '/masters?tab=freight' },
  { menuId: '0x010000000000000000000000000000011160', label: 'Approval Checks', path: '/masters?tab=approval-checks' },
  { menuId: '0x010000000000000000000000000000011151', label: 'Po Instruction', path: '/masters?tab=po-instruction' },
  { menuId: '0x010000000000000000000000000000011147', label: 'Charges', path: '/masters?tab=charges' },
  { menuId: '0x010000000000000000000000000000011148', label: 'Reason', path: '/masters?tab=reason' },
]

export function normalizeMenuId(id: string | undefined): string {
  const str = String(id ?? '').trim()
  return str.replace(/^0x/i, '').toLowerCase()
}

export function getMenuEntry(menuId: string | undefined): NimbleMenuEntry | undefined {
  const normalized = normalizeMenuId(menuId)
  return NIMBLE_MENU_ENTRIES.find(e => normalizeMenuId(e.menuId) === normalized)
}

export function getPathForMenuId(menuId: string | undefined): string | undefined {
  return getMenuEntry(menuId)?.path
}

export interface TabLike {
  name: string
  label: string
  icon: string
  value: string
}

export function getVisibleTabsForNimble<T extends TabLike>(
  tabs: T[],
  menuIdsByTab: Partial<Record<string, string>>,
  menuIdFromUrl: string | undefined,
  nimbleOn: boolean,
): T[] {
  if (!nimbleOn) return [...tabs]

  const withMenuId = tabs.filter(tab => menuIdsByTab[tab.name])
  const normalizedUrl = normalizeMenuId(menuIdFromUrl)

  if (!normalizedUrl) {
    return withMenuId
  }

  return withMenuId.filter(
    tab => normalizeMenuId(menuIdsByTab[tab.name]) === normalizedUrl,
  )
}

export const NIMBLE_MENU_IDS_BY_MASTERS_TAB: Partial<Record<string, string>> = {
  freight: '0x010000000000000000000000000000011146',
  'approval-checks': '0x010000000000000000000000000000011160',
  'po-instruction': '0x010000000000000000000000000000011151',
  charges: '0x010000000000000000000000000000011147',
  reason: '0x010000000000000000000000000000011148',
}

export const NIMBLE_MENU_IDS_BY_PAYABLES_TAB: Partial<Record<string, string>> = {
  'vendor-invoices': '0x010000000000000000000000000000011133',
}

export const NIMBLE_MENU_IDS_BY_CORPORATION_TAB: Partial<Record<string, string>> = {
  'storage-locations': '0x010000000000000000000000000000011152',
}

export const NIMBLE_MENU_IDS_BY_CONFIGURATIONS_TAB: Partial<Record<string, string>> = {
  'project-types': '0x010000000000000000000000000000011149',
  'service-types': '0x010000000000000000000000000000011150',
  'terms-and-conditions': '0x010000000000000000000000000000011153',
  'special-instructions': '0x010000000000000000000000000000011161',
}

export const NIMBLE_MENU_IDS_BY_PURCHASE_ORDERS_TAB: Partial<Record<string, string>> = {
  'purchase-orders': '0x010000000000000000000000000000011131',
  'change-orders': '0x010000000000000000000000000000011132',
  'stock-receipt-note': '0x010000000000000000000000000000011134',
  'stock-returns': '0x010000000000000000000000000000011135',
}

export const NIMBLE_MENU_IDS_BY_PROJECTS_TAB: Partial<Record<string, string>> = {
  'project-details': '0x010000000000000000000000000000011137',
  items: '0x010000000000000000000000000000011138',
  'cost-codes': '0x010000000000000000000000000000011139',
  estimates: '0x010000000000000000000000000000011140',
}
