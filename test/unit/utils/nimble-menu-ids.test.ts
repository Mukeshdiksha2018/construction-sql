import { describe, expect, it } from 'vitest'
import {
  getPathForMenuId,
  getVisibleTabsForNimble,
  normalizeMenuId,
  NIMBLE_MENU_IDS_BY_MASTERS_TAB,
  type TabLike,
} from '../../../app/utils/nimbleMenuIds'

const mastersTabs: TabLike[] = [
  { name: 'freight', label: 'Freight', icon: 'truck', value: 'freight' },
  { name: 'approval-checks', label: 'Approval Checks', icon: 'check', value: 'approval-checks' },
  { name: 'location', label: 'Location', icon: 'map', value: 'location' },
]

describe('nimbleMenuIds utils', () => {
  it('normalizes 0x-prefixed menu IDs for matching', () => {
    expect(normalizeMenuId('0x010000AB')).toBe('010000ab')
    expect(normalizeMenuId('010000AB')).toBe('010000ab')
  })

  it('resolves route path from menu ID', () => {
    expect(getPathForMenuId('0x010000000000000000000000000000011146')).toBe('/masters?tab=freight')
    expect(getPathForMenuId('0x010000000000000000000000000000011145')).toBeUndefined()
  })

  it('returns all tabs when Nimble integration is off', () => {
    const visible = getVisibleTabsForNimble(
      mastersTabs,
      NIMBLE_MENU_IDS_BY_MASTERS_TAB,
      undefined,
      false,
    )

    expect(visible.map(t => t.name)).toEqual(['freight', 'approval-checks', 'location'])
  })

  it('filters only menu-mapped tabs when Nimble integration is on', () => {
    const visible = getVisibleTabsForNimble(
      mastersTabs,
      NIMBLE_MENU_IDS_BY_MASTERS_TAB,
      undefined,
      true,
    )

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
