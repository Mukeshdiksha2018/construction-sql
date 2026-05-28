import { describe, expect, it } from 'vitest'
import {
  getPathForMenuId,
  getMenuLabel,
  getMenuIdByNormalized,
  getVisibleTabsForNimble,
  normalizeMenuId,
  NIMBLE_MENU_IDS_BY_MASTERS_TAB,
  NIMBLE_MENU_IDS_BY_PURCHASE_ORDERS_TAB,
  NIMBLE_MENU_IDS_BY_PROJECTS_TAB,
  NIMBLE_MENU_IDS_BY_CONFIGURATIONS_TAB,
  NIMBLE_MENU_ID_PROJECTS,
  NIMBLE_MENU_ID_PURCHASE_ORDERS,
  NIMBLE_MENU_ID_CONFIGURATIONS,
  type TabLike,
} from '../../../app/utils/nimbleMenuIds'

const mastersTabs: TabLike[] = [
  { name: 'freight', label: 'Freight', icon: 'truck', value: 'freight' },
  { name: 'approval-checks', label: 'Approval Checks', icon: 'check', value: 'approval-checks' },
  { name: 'location', label: 'Location', icon: 'map', value: 'location' },
]

const purchaseOrdersTabs: TabLike[] = [
  { name: 'purchase-orders', label: 'Purchase Orders', icon: 'cart', value: 'purchase-orders' },
  { name: 'change-orders', label: 'Change Orders', icon: 'edit', value: 'change-orders' },
  { name: 'stock-receipt-note', label: 'Receipt Notes', icon: 'inbox', value: 'stock-receipt-note' },
  { name: 'stock-returns', label: 'Stock Returns', icon: 'return', value: 'stock-returns' },
  { name: 'vendor-management', label: 'Vendors', icon: 'users', value: 'vendor-management' },
]

const projectsTabs: TabLike[] = [
  { name: 'project-details', label: 'Details', icon: 'info', value: 'project-details' },
  { name: 'items', label: 'Items', icon: 'list', value: 'items' },
  { name: 'cost-codes', label: 'Cost Codes', icon: 'code', value: 'cost-codes' },
  { name: 'estimates', label: 'Estimates', icon: 'calc', value: 'estimates' },
  { name: 'other', label: 'Other', icon: 'more', value: 'other' },
]

describe('nimbleMenuIds utils', () => {
  describe('normalizeMenuId', () => {
    it('strips 0x prefix and lowercases', () => {
      expect(normalizeMenuId('0x010000AB')).toBe('010000ab')
      expect(normalizeMenuId('010000AB')).toBe('010000ab')
    })

    it('handles undefined and empty string', () => {
      expect(normalizeMenuId(undefined)).toBe('')
      expect(normalizeMenuId('')).toBe('')
    })
  })

  describe('getPathForMenuId', () => {
    it('resolves path for known menu IDs', () => {
      expect(getPathForMenuId('0x010000000000000000000000000000011146')).toBe('/masters?tab=freight')
      expect(getPathForMenuId('0x010000000000000000000000000000011131')).toBe('/projects')
      expect(getPathForMenuId('0x010000000000000000000000000000011132')).toBe('/purchase-orders')
      expect(getPathForMenuId('0x010000000000000000000000000000011134')).toBe('/configurations')
      expect(getPathForMenuId('0x010000000000000000000000000000011133')).toBe('/payables?tab=vendor-invoices')
    })

    it('returns undefined for parent/section entries with no path', () => {
      expect(getPathForMenuId('0x010000000000000000000000000000011145')).toBeUndefined()
      expect(getPathForMenuId('0x010000000000000000000000000000011130')).toBeUndefined()
    })

    it('returns undefined for unknown menu IDs', () => {
      expect(getPathForMenuId('0xDEADBEEF')).toBeUndefined()
      expect(getPathForMenuId(undefined)).toBeUndefined()
    })
  })

  describe('getMenuLabel', () => {
    it('returns label for known menu IDs', () => {
      expect(getMenuLabel('0x010000000000000000000000000000011131')).toBe('Projects')
      expect(getMenuLabel('0x010000000000000000000000000000011132')).toBe('Purchase Orders')
      expect(getMenuLabel('0x010000000000000000000000000000011134')).toBe('Configurations')
      expect(getMenuLabel('0x010000000000000000000000000000011146')).toBe('Freight')
    })

    it('returns undefined for unknown menu IDs', () => {
      expect(getMenuLabel('0xDEADBEEF')).toBeUndefined()
    })
  })

  describe('getMenuIdByNormalized', () => {
    it('returns full menuId from a normalized ID string', () => {
      const normalized = '010000000000000000000000000000011131'
      expect(getMenuIdByNormalized(normalized)).toBe('0x010000000000000000000000000000011131')
    })

    it('returns undefined for unknown normalized ID', () => {
      expect(getMenuIdByNormalized('deadbeef')).toBeUndefined()
    })
  })

  describe('top-level route constants', () => {
    it('NIMBLE_MENU_ID_PROJECTS is 11131', () => {
      expect(normalizeMenuId(NIMBLE_MENU_ID_PROJECTS)).toBe('010000000000000000000000000000011131')
    })

    it('NIMBLE_MENU_ID_PURCHASE_ORDERS is 11132', () => {
      expect(normalizeMenuId(NIMBLE_MENU_ID_PURCHASE_ORDERS)).toBe('010000000000000000000000000000011132')
    })

    it('NIMBLE_MENU_ID_CONFIGURATIONS is 11134', () => {
      expect(normalizeMenuId(NIMBLE_MENU_ID_CONFIGURATIONS)).toBe('010000000000000000000000000000011134')
    })
  })

  describe('NIMBLE_MENU_IDS_BY_PURCHASE_ORDERS_TAB', () => {
    it('maps all four purchase-orders tabs', () => {
      expect(NIMBLE_MENU_IDS_BY_PURCHASE_ORDERS_TAB['purchase-orders']).toBe('0x010000000000000000000000000000011131')
      expect(NIMBLE_MENU_IDS_BY_PURCHASE_ORDERS_TAB['change-orders']).toBe('0x010000000000000000000000000000011132')
      expect(NIMBLE_MENU_IDS_BY_PURCHASE_ORDERS_TAB['stock-receipt-note']).toBe('0x010000000000000000000000000000011134')
      expect(NIMBLE_MENU_IDS_BY_PURCHASE_ORDERS_TAB['stock-returns']).toBe('0x010000000000000000000000000000011135')
    })

    it('shows only mapped tabs when Nimble is on with no specific menuId', () => {
      const visible = getVisibleTabsForNimble(purchaseOrdersTabs, NIMBLE_MENU_IDS_BY_PURCHASE_ORDERS_TAB, undefined, true)
      expect(visible.map(t => t.name)).toEqual(['purchase-orders', 'change-orders', 'stock-receipt-note', 'stock-returns'])
      // vendor-management has no menuId so it is hidden
      expect(visible.find(t => t.name === 'vendor-management')).toBeUndefined()
    })

    it('shows only the purchase-orders tab when menuId 11131 is in the URL', () => {
      const visible = getVisibleTabsForNimble(
        purchaseOrdersTabs,
        NIMBLE_MENU_IDS_BY_PURCHASE_ORDERS_TAB,
        '010000000000000000000000000000011131',
        true,
      )
      expect(visible).toHaveLength(1)
      expect(visible[0]?.name).toBe('purchase-orders')
    })

    it('shows only the stock-receipt-note tab when menuId 11134 is in the URL', () => {
      const visible = getVisibleTabsForNimble(
        purchaseOrdersTabs,
        NIMBLE_MENU_IDS_BY_PURCHASE_ORDERS_TAB,
        '0x010000000000000000000000000000011134',
        true,
      )
      expect(visible).toHaveLength(1)
      expect(visible[0]?.name).toBe('stock-receipt-note')
    })

    it('shows only the stock-returns tab when menuId 11135 is in the URL', () => {
      const visible = getVisibleTabsForNimble(
        purchaseOrdersTabs,
        NIMBLE_MENU_IDS_BY_PURCHASE_ORDERS_TAB,
        '0x010000000000000000000000000000011135',
        true,
      )
      expect(visible).toHaveLength(1)
      expect(visible[0]?.name).toBe('stock-returns')
    })

    it('shows all tabs when Nimble is off regardless of menuId', () => {
      const visible = getVisibleTabsForNimble(
        purchaseOrdersTabs,
        NIMBLE_MENU_IDS_BY_PURCHASE_ORDERS_TAB,
        '010000000000000000000000000000011131',
        false,
      )
      expect(visible.map(t => t.name)).toEqual(['purchase-orders', 'change-orders', 'stock-receipt-note', 'stock-returns', 'vendor-management'])
    })
  })

  describe('NIMBLE_MENU_IDS_BY_PROJECTS_TAB', () => {
    it('maps all four project tabs', () => {
      expect(NIMBLE_MENU_IDS_BY_PROJECTS_TAB['project-details']).toBe('0x010000000000000000000000000000011137')
      expect(NIMBLE_MENU_IDS_BY_PROJECTS_TAB['items']).toBe('0x010000000000000000000000000000011138')
      expect(NIMBLE_MENU_IDS_BY_PROJECTS_TAB['cost-codes']).toBe('0x010000000000000000000000000000011139')
      expect(NIMBLE_MENU_IDS_BY_PROJECTS_TAB['estimates']).toBe('0x010000000000000000000000000000011140')
    })

    it('shows only the estimates tab when menuId 11140 is in the URL', () => {
      const visible = getVisibleTabsForNimble(
        projectsTabs,
        NIMBLE_MENU_IDS_BY_PROJECTS_TAB,
        '010000000000000000000000000000011140',
        true,
      )
      expect(visible).toHaveLength(1)
      expect(visible[0]?.name).toBe('estimates')
    })

    it('shows only the cost-codes tab when menuId 11139 is in the URL', () => {
      const visible = getVisibleTabsForNimble(
        projectsTabs,
        NIMBLE_MENU_IDS_BY_PROJECTS_TAB,
        '010000000000000000000000000000011139',
        true,
      )
      expect(visible).toHaveLength(1)
      expect(visible[0]?.name).toBe('cost-codes')
    })

    it('hides unmapped tabs (other) when Nimble is on', () => {
      const visible = getVisibleTabsForNimble(projectsTabs, NIMBLE_MENU_IDS_BY_PROJECTS_TAB, undefined, true)
      expect(visible.find(t => t.name === 'other')).toBeUndefined()
      expect(visible.map(t => t.name)).toEqual(['project-details', 'items', 'cost-codes', 'estimates'])
    })
  })

  describe('NIMBLE_MENU_IDS_BY_CONFIGURATIONS_TAB', () => {
    it('maps all configuration tabs', () => {
      expect(NIMBLE_MENU_IDS_BY_CONFIGURATIONS_TAB['project-types']).toBe('0x010000000000000000000000000000011149')
      expect(NIMBLE_MENU_IDS_BY_CONFIGURATIONS_TAB['service-types']).toBe('0x010000000000000000000000000000011150')
      expect(NIMBLE_MENU_IDS_BY_CONFIGURATIONS_TAB['terms-and-conditions']).toBe('0x010000000000000000000000000000011153')
      expect(NIMBLE_MENU_IDS_BY_CONFIGURATIONS_TAB['special-instructions']).toBe('0x010000000000000000000000000000011161')
    })
  })

  describe('getVisibleTabsForNimble – masters (existing coverage)', () => {
    it('returns all tabs when Nimble integration is off', () => {
      const visible = getVisibleTabsForNimble(mastersTabs, NIMBLE_MENU_IDS_BY_MASTERS_TAB, undefined, false)
      expect(visible.map(t => t.name)).toEqual(['freight', 'approval-checks', 'location'])
    })

    it('filters only menu-mapped tabs when Nimble integration is on', () => {
      const visible = getVisibleTabsForNimble(mastersTabs, NIMBLE_MENU_IDS_BY_MASTERS_TAB, undefined, true)
      expect(visible.map(t => t.name)).toEqual(['freight', 'approval-checks'])
    })

    it('filters to single tab when menuId is passed in URL', () => {
      const visible = getVisibleTabsForNimble(
        mastersTabs,
        NIMBLE_MENU_IDS_BY_MASTERS_TAB,
        '010000000000000000000000000000011160',
        true,
      )
      expect(visible).toHaveLength(1)
      expect(visible[0]?.name).toBe('approval-checks')
    })
  })
})
