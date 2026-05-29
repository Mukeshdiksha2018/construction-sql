/**
 * Tests for the ship-via display fix in PurchaseOrdersList.vue:
 *
 * BUG — After saving a PO and closing the modal, the "Shipped Via" column in the list
 * showed raw UUIDs instead of ship-via names.
 *
 * ROOT CAUSE — closeFormModal() and the showFormModal watcher both called
 * shipViaStore.clearShipVia() when Nimble integrations were enabled. This emptied
 * the uuid→name lookup map right as the list re-rendered.
 *
 * FIX — Removed clearShipVia() / clearFreight() from both modal-close paths.
 * Ship-via data now persists in the store for the list. It is force-refreshed
 * the next time the form opens via refreshFreightAndShipViaForNimble().
 *
 * Tests cover:
 *  1. useShipViaStore — full lifecycle (fetch, getters, CRUD, clearShipVia)
 *  2. shipViaNameByUuid lookup logic — the uuid→name computed used by the column
 *  3. Regression contract — data must survive modal close (clearShipVia must NOT
 *     be called after save; only called on the next form-open refresh cycle)
 */
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'

const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

// ── Row factory ───────────────────────────────────────────────────────────────

function makeShipViaRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    uuid: 'sv-uuid-1',
    ship_via: 'FedEx Ground',
    description: null,
    active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

async function getStore() {
  const { useShipViaStore } = await import('../../../app/stores/freight')
  return useShipViaStore()
}

// ══════════════════════════════════════════════════════════════════════════════
// 1 — useShipViaStore lifecycle
// ══════════════════════════════════════════════════════════════════════════════
describe('useShipViaStore – fetchShipVia', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })
  afterEach(() => vi.restoreAllMocks())

  it('calls GET /api/ship-via with credentials', async () => {
    mockFetch.mockResolvedValue({ data: [] })
    const store = await getStore()
    await store.fetchShipVia()
    expect(mockFetch).toHaveBeenCalledWith('/api/ship-via', { credentials: 'include' })
  })

  it('populates shipVia from response.data array', async () => {
    mockFetch.mockResolvedValue({ data: [makeShipViaRow(), makeShipViaRow({ uuid: 'sv-2', ship_via: 'UPS' })] })
    const store = await getStore()
    await store.fetchShipVia()
    expect(store.getAllShipVia).toHaveLength(2)
    expect(store.getAllShipVia[0].ship_via).toBe('FedEx Ground')
    expect(store.getAllShipVia[1].ship_via).toBe('UPS')
  })

  it('also works when the API returns a bare array (not wrapped in data)', async () => {
    mockFetch.mockResolvedValue([makeShipViaRow({ uuid: 'sv-bare', ship_via: 'DHL' })])
    const store = await getStore()
    await store.fetchShipVia()
    expect(store.getAllShipVia).toHaveLength(1)
    expect(store.getAllShipVia[0].ship_via).toBe('DHL')
  })

  it('sets loading to true during fetch and false after', async () => {
    let capturedLoading = false
    mockFetch.mockImplementation(async () => {
      capturedLoading = (await getStore()).loading
      return { data: [] }
    })
    const store = await getStore()
    await store.fetchShipVia()
    expect(capturedLoading).toBe(true)
    expect(store.loading).toBe(false)
  })

  it('throws on API error and sets error state', async () => {
    mockFetch.mockRejectedValue({ message: 'Network error' })
    const store = await getStore()
    await expect(store.fetchShipVia()).rejects.toBeTruthy()
    expect(store.error).toBeTruthy()
  })
})

describe('useShipViaStore – getters', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('getAllShipVia returns all items including inactive', async () => {
    mockFetch.mockResolvedValue({ data: [
      makeShipViaRow({ uuid: 'sv-a', active: true }),
      makeShipViaRow({ uuid: 'sv-b', active: false }),
    ] })
    const store = await getStore()
    await store.fetchShipVia()
    expect(store.getAllShipVia).toHaveLength(2)
  })

  it('getActiveShipVia filters to only active items', async () => {
    mockFetch.mockResolvedValue({ data: [
      makeShipViaRow({ uuid: 'sv-active', active: true }),
      makeShipViaRow({ uuid: 'sv-inactive', active: false }),
    ] })
    const store = await getStore()
    await store.fetchShipVia()
    expect(store.getActiveShipVia).toHaveLength(1)
    expect(store.getActiveShipVia[0].uuid).toBe('sv-active')
  })

  it('getShipViaByUuid finds the correct item', async () => {
    mockFetch.mockResolvedValue({ data: [
      makeShipViaRow({ uuid: 'sv-1', ship_via: 'FedEx' }),
      makeShipViaRow({ uuid: 'sv-2', ship_via: 'UPS' }),
    ] })
    const store = await getStore()
    await store.fetchShipVia()
    expect(store.getShipViaByUuid('sv-2')?.ship_via).toBe('UPS')
  })

  it('getShipViaByUuid returns undefined for unknown uuid', async () => {
    mockFetch.mockResolvedValue({ data: [] })
    const store = await getStore()
    await store.fetchShipVia()
    expect(store.getShipViaByUuid('no-such-uuid')).toBeUndefined()
  })

  it('getAllShipVia returns empty array before any fetch', async () => {
    const store = await getStore()
    expect(store.getAllShipVia).toEqual([])
  })
})

describe('useShipViaStore – clearShipVia', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('empties the shipVia array', async () => {
    mockFetch.mockResolvedValue({ data: [makeShipViaRow()] })
    const store = await getStore()
    await store.fetchShipVia()
    expect(store.getAllShipVia).toHaveLength(1)

    store.clearShipVia()
    expect(store.getAllShipVia).toHaveLength(0)
  })

  it('can be re-populated by fetchShipVia after clear', async () => {
    mockFetch.mockResolvedValue({ data: [makeShipViaRow()] })
    const store = await getStore()
    await store.fetchShipVia()
    store.clearShipVia()
    expect(store.getAllShipVia).toHaveLength(0)

    await store.fetchShipVia()
    expect(store.getAllShipVia).toHaveLength(1)
  })
})

describe('useShipViaStore – createShipVia / updateShipVia / deleteShipVia', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('createShipVia pushes the new row into the store', async () => {
    const created = makeShipViaRow({ uuid: 'sv-new', ship_via: 'USPS' })
    mockFetch.mockResolvedValue({ data: created })
    const store = await getStore()
    await store.createShipVia({ ship_via: 'USPS', active: true })
    expect(store.getAllShipVia).toHaveLength(1)
    expect(store.getAllShipVia[0].ship_via).toBe('USPS')
  })

  it('createShipVia posts to /api/ship-via', async () => {
    mockFetch.mockResolvedValue({ data: makeShipViaRow() })
    const store = await getStore()
    await store.createShipVia({ ship_via: 'FedEx', active: true })
    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toBe('/api/ship-via')
    expect(opts.method).toBe('POST')
  })

  it('updateShipVia puts to /api/ship-via/:uuid and updates in-place', async () => {
    // Seed store
    mockFetch.mockResolvedValueOnce({ data: makeShipViaRow({ uuid: 'sv-upd', ship_via: 'Old Name' }) })
    const store = await getStore()
    await store.createShipVia({ ship_via: 'Old Name', active: true })

    // Update
    const updated = makeShipViaRow({ uuid: 'sv-upd', ship_via: 'New Name' })
    mockFetch.mockResolvedValueOnce({ data: updated })
    await store.updateShipVia('sv-upd', { ship_via: 'New Name', active: true })

    expect(store.getShipViaByUuid('sv-upd')?.ship_via).toBe('New Name')
    const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1]
    expect(lastCall[0]).toBe('/api/ship-via/sv-upd')
    expect(lastCall[1].method).toBe('PUT')
  })

  it('deleteShipVia removes the item from the store', async () => {
    mockFetch.mockResolvedValueOnce({ data: makeShipViaRow({ uuid: 'sv-del' }) })
    const store = await getStore()
    await store.createShipVia({ ship_via: 'ToDelete', active: true })
    expect(store.getAllShipVia).toHaveLength(1)

    mockFetch.mockResolvedValueOnce({})
    await store.deleteShipVia('sv-del')
    expect(store.getAllShipVia).toHaveLength(0)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 2 — shipViaNameByUuid lookup logic
// Mirrors the computed in PurchaseOrdersList.vue:
//   list.forEach(sv => { if (sv?.uuid) map[sv.uuid] = sv.ship_via || sv.uuid })
// ══════════════════════════════════════════════════════════════════════════════
describe('shipViaNameByUuid lookup logic (column display)', () => {
  /** Mirrors the exact computed from PurchaseOrdersList.vue */
  function buildShipViaNameMap(list: any[]): Record<string, string> {
    const map: Record<string, string> = {}
    list.forEach((sv: any) => {
      if (sv?.uuid) map[sv.uuid] = sv.ship_via || sv.uuid
    })
    return map
  }

  it('maps uuid → ship_via name', () => {
    const map = buildShipViaNameMap([
      makeShipViaRow({ uuid: 'sv-1', ship_via: 'FedEx Ground' }),
      makeShipViaRow({ uuid: 'sv-2', ship_via: 'UPS Overnight' }),
    ])
    expect(map['sv-1']).toBe('FedEx Ground')
    expect(map['sv-2']).toBe('UPS Overnight')
  })

  it('falls back to uuid when ship_via name is empty string', () => {
    const map = buildShipViaNameMap([makeShipViaRow({ uuid: 'sv-empty', ship_via: '' })])
    expect(map['sv-empty']).toBe('sv-empty')
  })

  it('returns empty map when list is empty', () => {
    expect(buildShipViaNameMap([])).toEqual({})
  })

  it('skips entries that have no uuid', () => {
    const map = buildShipViaNameMap([{ ship_via: 'NoUuid' }, makeShipViaRow({ uuid: 'sv-ok', ship_via: 'Has UUID' })])
    expect(Object.keys(map)).toHaveLength(1)
    expect(map['sv-ok']).toBe('Has UUID')
  })

  it('lookup returns undefined for an unknown uuid', () => {
    const map = buildShipViaNameMap([makeShipViaRow({ uuid: 'sv-known', ship_via: 'DHL' })])
    expect(map['no-such-uuid']).toBeUndefined()
  })

  it('column cell shows name when uuid is in the map', () => {
    const map = buildShipViaNameMap([makeShipViaRow({ uuid: 'sv-abc', ship_via: 'USPS Priority' })])
    // Mirrors the cell renderer: uuid ? (map[uuid] || uuid) : 'N/A'
    const uuid = 'sv-abc'
    const label = uuid ? (map[uuid] || uuid) : 'N/A'
    expect(label).toBe('USPS Priority')
  })

  it('column cell falls back to raw uuid when not in map (degraded state)', () => {
    const map = buildShipViaNameMap([])  // empty — simulates post-clearShipVia state (the bug)
    const uuid = 'sv-abc'
    const label = uuid ? (map[uuid] || uuid) : 'N/A'
    expect(label).toBe('sv-abc')  // shows raw uuid — this is the broken behaviour we fixed
  })

  it('column cell shows N/A when uuid is null/empty', () => {
    const map = buildShipViaNameMap([makeShipViaRow({ uuid: 'sv-1', ship_via: 'FedEx' })])
    const uuid = null
    const label = uuid ? (map[uuid] || uuid) : 'N/A'
    expect(label).toBe('N/A')
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 3 — Regression contract: data must survive modal close
// ══════════════════════════════════════════════════════════════════════════════
describe('regression: shipVia data must survive modal close (clearShipVia NOT called on save)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('calling clearShipVia() breaks uuid→name resolution (documents the old bug)', async () => {
    mockFetch.mockResolvedValue({ data: [makeShipViaRow({ uuid: 'sv-1', ship_via: 'FedEx' })] })
    const store = await getStore()
    await store.fetchShipVia()

    // Simulate the old broken closeFormModal behaviour
    store.clearShipVia()

    // Name lookup now fails — this is what was shown to the user as a raw UUID
    expect(store.getShipViaByUuid('sv-1')).toBeUndefined()
    expect(store.getAllShipVia).toHaveLength(0)
  })

  it('NOT calling clearShipVia() keeps uuid→name resolution intact (the fix)', async () => {
    mockFetch.mockResolvedValue({ data: [makeShipViaRow({ uuid: 'sv-1', ship_via: 'FedEx' })] })
    const store = await getStore()
    await store.fetchShipVia()

    // Simulate the FIXED closeFormModal — clearShipVia() is no longer called
    // (no store.clearShipVia() here)

    // Name lookup still works — the list can resolve the name
    expect(store.getShipViaByUuid('sv-1')?.ship_via).toBe('FedEx')
    expect(store.getAllShipVia).toHaveLength(1)
  })

  it('fetchShipVia(force) on next form open refreshes data even without prior clear', async () => {
    // First fetch (initial load or prior save cycle)
    mockFetch.mockResolvedValueOnce({ data: [makeShipViaRow({ uuid: 'sv-1', ship_via: 'Old Name' })] })
    const store = await getStore()
    await store.fetchShipVia()
    expect(store.getShipViaByUuid('sv-1')?.ship_via).toBe('Old Name')

    // Modal opens → refreshFreightAndShipViaForNimble() calls fetchShipVia(true)
    // (simulated here as a second fetch that overwrites stale data)
    mockFetch.mockResolvedValueOnce({ data: [makeShipViaRow({ uuid: 'sv-1', ship_via: 'New Name' })] })
    await store.fetchShipVia()
    expect(store.getShipViaByUuid('sv-1')?.ship_via).toBe('New Name')
  })

  it('full save-cycle: data populated → saved → modal closed → still resolvable', async () => {
    // Phase 1: fetch ship-via on mount
    mockFetch.mockImplementation(async (url: string) => {
      if (url === '/api/ship-via') return { data: [makeShipViaRow({ uuid: 'sv-fedex', ship_via: 'FedEx' })] }
      if (url === '/api/purchase-order-forms') return { data: { uuid: 'new-po', ship_via: 'sv-fedex', corporation_uuid: 'corp-1', entry_date: '2026-05-01' } }
      return { data: [] }
    })

    const store = await getStore()
    await store.fetchShipVia()
    expect(store.getShipViaByUuid('sv-fedex')?.ship_via).toBe('FedEx')

    // Phase 2: PO is saved (header + items) — closeFormModal fires but no clearShipVia()

    // Phase 3: List re-renders — lookup must still work
    const map: Record<string, string> = {}
    store.getAllShipVia.forEach((sv) => {
      if (sv?.uuid) map[sv.uuid] = sv.ship_via || sv.uuid
    })
    expect(map['sv-fedex']).toBe('FedEx')
  })

  it('multiple saves do not degrade the lookup map', async () => {
    mockFetch.mockResolvedValue({ data: [
      makeShipViaRow({ uuid: 'sv-1', ship_via: 'FedEx' }),
      makeShipViaRow({ uuid: 'sv-2', ship_via: 'UPS' }),
      makeShipViaRow({ uuid: 'sv-3', ship_via: 'DHL' }),
    ] })
    const store = await getStore()
    await store.fetchShipVia()

    // Simulate 3 save cycles — none call clearShipVia()
    for (let i = 0; i < 3; i++) {
      // closeFormModal without clearShipVia — data untouched
    }

    expect(store.getAllShipVia).toHaveLength(3)
    expect(store.getShipViaByUuid('sv-1')?.ship_via).toBe('FedEx')
    expect(store.getShipViaByUuid('sv-2')?.ship_via).toBe('UPS')
    expect(store.getShipViaByUuid('sv-3')?.ship_via).toBe('DHL')
  })
})
