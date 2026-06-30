import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useVendorStore } from '~/stores/vendors'

// ── Factories ─────────────────────────────────────────────────────────────────

const CORP_UUID = 'corp-test-123'

function makeSqlVendor(overrides: Record<string, unknown> = {}) {
  return {
    vendor_id: 'vendor-uuid-1',
    name: 'Acme Supplies',
    company_name: null,
    corporation_id: CORP_UUID,
    account_id: null,
    status: 1 as const,
    status_label: 'active' as const,
    tax_id: '12-3456789',
    contact_person_name: null,
    credit_limit: null,
    check_reference: null,
    type: 1,
    bid: '1',
    created_by: null,
    modified_by: null,
    created_at: null,
    modified_at: null,
    ...overrides,
  }
}

function makeApiResponse(vendors = [makeSqlVendor()]) {
  return { vendors }
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('useVendorStore', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    setActivePinia(createPinia())
    mockFetch = vi.fn()
    vi.stubGlobal('$fetch', mockFetch)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ── fetchVendors ──────────────────────────────────────────────────────────

  describe('fetchVendors', () => {
    it('calls the Nimble SQL endpoint with corporation_uuid', async () => {
      mockFetch.mockResolvedValue(makeApiResponse())
      const store = useVendorStore()

      await store.fetchVendors(CORP_UUID)

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/nimble-vendors',
        { query: { corporation_uuid: CORP_UUID }, credentials: 'include' },
      )
    })

    it('does nothing when corporationUuid is undefined', async () => {
      const store = useVendorStore()
      await store.fetchVendors(undefined)
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('does nothing when corporationUuid is empty string', async () => {
      const store = useVendorStore()
      await store.fetchVendors('')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('normalises vendor_id → uuid (lowercased)', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([makeSqlVendor({ vendor_id: 'V-ABC-UPPER' })]))
      const store = useVendorStore()
      await store.fetchVendors(CORP_UUID)
      expect(store.vendors[0]?.uuid).toBe('v-abc-upper')
    })

    it('normalises name → vendor_name', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([makeSqlVendor({ name: 'Northern Build Supply' })]))
      const store = useVendorStore()
      await store.fetchVendors(CORP_UUID)
      expect(store.vendors[0]?.vendor_name).toBe('Northern Build Supply')
    })

    it('normalises corporation_id → corporation_uuid (lowercased)', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([makeSqlVendor({ corporation_id: 'CORP-XYZ-UPPER' })]))
      const store = useVendorStore()
      await store.fetchVendors('corp-xyz-upper')
      expect(store.vendors[0]?.corporation_uuid).toBe('corp-xyz-upper')
    })

    it('normalises tax_id → federal_id', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([makeSqlVendor({ tax_id: '99-1234567' })]))
      const store = useVendorStore()
      await store.fetchVendors(CORP_UUID)
      expect(store.vendors[0]?.federal_id).toBe('99-1234567')
    })

    it('sets federal_id to null when tax_id is absent', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([makeSqlVendor({ tax_id: null })]))
      const store = useVendorStore()
      await store.fetchVendors(CORP_UUID)
      expect(store.vendors[0]?.federal_id).toBeNull()
    })

    it('sets payment_method to null (SQL vendors have no payment method on Business)', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([makeSqlVendor()]))
      const store = useVendorStore()
      await store.fetchVendors(CORP_UUID)
      expect(store.vendors[0]?.payment_method).toBeNull()
    })

    it('marks is_active = true when status === 1', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([makeSqlVendor({ status: 1, status_label: 'active' })]))
      const store = useVendorStore()
      await store.fetchVendors(CORP_UUID)
      expect(store.vendors[0]?.is_active).toBe(true)
    })

    it('marks is_active = false when status === 0', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([makeSqlVendor({ status: 0, status_label: 'inactive' })]))
      const store = useVendorStore()
      await store.fetchVendors(CORP_UUID)
      expect(store.vendors[0]?.is_active).toBe(false)
    })

    it('excludes soft-deleted vendors (status === 3) from dropdown list', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([
        makeSqlVendor({ vendor_id: 'active-v', status: 1, status_label: 'active' }),
        makeSqlVendor({ vendor_id: 'deleted-v', status: 3, status_label: 'deleted' }),
      ]))
      const store = useVendorStore()
      await store.fetchVendors(CORP_UUID)
      expect(store.vendors).toHaveLength(1)
      expect(store.vendors[0]?.uuid).toBe('active-v')
    })

    it('sets loading = false after a successful fetch', async () => {
      mockFetch.mockResolvedValue(makeApiResponse())
      const store = useVendorStore()
      await store.fetchVendors(CORP_UUID)
      expect(store.loading).toBe(false)
    })

    it('handles an empty vendor list gracefully', async () => {
      mockFetch.mockResolvedValue({ vendors: [] })
      const store = useVendorStore()
      await store.fetchVendors(CORP_UUID)
      expect(store.vendors).toHaveLength(0)
    })

    it('handles missing vendors key gracefully', async () => {
      mockFetch.mockResolvedValue({})
      const store = useVendorStore()
      await store.fetchVendors(CORP_UUID)
      expect(store.vendors).toHaveLength(0)
    })

    it('caches: skips second fetch for the same corporation', async () => {
      mockFetch.mockResolvedValue(makeApiResponse())
      const store = useVendorStore()
      await store.fetchVendors(CORP_UUID)
      await store.fetchVendors(CORP_UUID)
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('cache key is case-insensitive', async () => {
      mockFetch.mockResolvedValue(makeApiResponse())
      const store = useVendorStore()
      await store.fetchVendors('CORP-ABC')
      await store.fetchVendors('corp-abc')
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('bypasses cache when forceRefresh = true', async () => {
      mockFetch.mockResolvedValue(makeApiResponse())
      const store = useVendorStore()
      await store.fetchVendors(CORP_UUID)
      await store.fetchVendors(CORP_UUID, true)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('fetches independently for different corporations', async () => {
      mockFetch.mockResolvedValue(makeApiResponse())
      const store = useVendorStore()
      await store.fetchVendors('corp-1')
      await store.fetchVendors('corp-2')
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('replaces existing vendors for a corp on re-fetch', async () => {
      const store = useVendorStore()
      mockFetch.mockResolvedValue(makeApiResponse([makeSqlVendor({ vendor_id: 'old-v' })]))
      await store.fetchVendors(CORP_UUID)

      mockFetch.mockResolvedValue(makeApiResponse([makeSqlVendor({ vendor_id: 'new-v' })]))
      await store.fetchVendors(CORP_UUID, true)

      expect(store.vendors).toHaveLength(1)
      expect(store.vendors[0]?.uuid).toBe('new-v')
    })

    it('keeps vendors for other corps when re-fetching one', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([makeSqlVendor({ vendor_id: 'v-c1', corporation_id: 'corp-1' })]))
      const store = useVendorStore()
      await store.fetchVendors('corp-1')

      mockFetch.mockResolvedValue(makeApiResponse([makeSqlVendor({ vendor_id: 'v-c2', corporation_id: 'corp-2' })]))
      await store.fetchVendors('corp-2')

      expect(store.vendors).toHaveLength(2)
      expect(store.vendors.map(v => v.uuid)).toEqual(expect.arrayContaining(['v-c1', 'v-c2']))
    })

    it('sets error on API failure', async () => {
      mockFetch.mockRejectedValue({ statusMessage: 'Unauthorized' })
      const store = useVendorStore()
      await store.fetchVendors(CORP_UUID)
      expect(store.error).toBeTruthy()
    })

    it('reads error from data.statusMessage when present', async () => {
      mockFetch.mockRejectedValue({ data: { statusMessage: 'Upstream error' } })
      const store = useVendorStore()
      await store.fetchVendors(CORP_UUID)
      expect(store.error).toBe('Upstream error')
    })

    it('reads error from statusMessage when data is absent', async () => {
      mockFetch.mockRejectedValue({ statusMessage: 'Gateway Timeout' })
      const store = useVendorStore()
      await store.fetchVendors(CORP_UUID)
      expect(store.error).toBe('Gateway Timeout')
    })

    it('reads error from message for plain errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network down'))
      const store = useVendorStore()
      await store.fetchVendors(CORP_UUID)
      expect(store.error).toBe('Network down')
    })

    it('sets loading = false even on failure', async () => {
      mockFetch.mockRejectedValue(new Error('Fail'))
      const store = useVendorStore()
      await store.fetchVendors(CORP_UUID)
      expect(store.loading).toBe(false)
    })

    it('does not cache the corporation on failure (allows retry)', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValueOnce(makeApiResponse())
      const store = useVendorStore()
      await store.fetchVendors(CORP_UUID)
      await store.fetchVendors(CORP_UUID)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })

  // ── getActive ─────────────────────────────────────────────────────────────

  describe('getActive', () => {
    it('returns only active vendors across all corporations', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([
        makeSqlVendor({ vendor_id: 'a1', status: 1, status_label: 'active' }),
        makeSqlVendor({ vendor_id: 'a2', status: 0, status_label: 'inactive' }),
        makeSqlVendor({ vendor_id: 'a3', status: 1, status_label: 'active' }),
      ]))
      const store = useVendorStore()
      await store.fetchVendors(CORP_UUID)

      expect(store.getActive).toHaveLength(2)
      expect(store.getActive.every(v => v.is_active)).toBe(true)
    })

    it('returns empty array when no vendors are loaded', () => {
      const store = useVendorStore()
      expect(store.getActive).toHaveLength(0)
    })
  })

  // ── getVendorsForCorporation ──────────────────────────────────────────────

  describe('getVendorsForCorporation', () => {
    it('returns all vendors (active + inactive) for the given corp', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([
        makeSqlVendor({ vendor_id: 'v1', status: 1, status_label: 'active' }),
        makeSqlVendor({ vendor_id: 'v2', status: 0, status_label: 'inactive' }),
      ]))
      const store = useVendorStore()
      await store.fetchVendors(CORP_UUID)

      expect(store.getVendorsForCorporation(CORP_UUID)).toHaveLength(2)
    })

    it('is case-insensitive on the corporation UUID', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([makeSqlVendor()]))
      const store = useVendorStore()
      await store.fetchVendors(CORP_UUID)

      expect(store.getVendorsForCorporation(CORP_UUID.toUpperCase())).toHaveLength(1)
    })

    it('returns empty array for an unknown corporation', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([makeSqlVendor()]))
      const store = useVendorStore()
      await store.fetchVendors(CORP_UUID)

      expect(store.getVendorsForCorporation('other-corp')).toHaveLength(0)
    })

    it('does not return vendors from other corporations', async () => {
      const store = useVendorStore()
      mockFetch.mockResolvedValue(makeApiResponse([makeSqlVendor({ vendor_id: 'v-c1', corporation_id: 'corp-1' })]))
      await store.fetchVendors('corp-1')
      mockFetch.mockResolvedValue(makeApiResponse([makeSqlVendor({ vendor_id: 'v-c2', corporation_id: 'corp-2' })]))
      await store.fetchVendors('corp-2')

      const c1 = store.getVendorsForCorporation('corp-1')
      expect(c1).toHaveLength(1)
      expect(c1[0]?.uuid).toBe('v-c1')
    })
  })

  // ── getActiveForCorporation ───────────────────────────────────────────────

  describe('getActiveForCorporation', () => {
    it('returns only active vendors for the given corp', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([
        makeSqlVendor({ vendor_id: 'v-act', status: 1, status_label: 'active' }),
        makeSqlVendor({ vendor_id: 'v-ina', status: 0, status_label: 'inactive' }),
      ]))
      const store = useVendorStore()
      await store.fetchVendors(CORP_UUID)

      const active = store.getActiveForCorporation(CORP_UUID)
      expect(active).toHaveLength(1)
      expect(active[0]?.uuid).toBe('v-act')
    })

    it('returns empty array when corp has no active vendors', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([makeSqlVendor({ status: 0, status_label: 'inactive' })]))
      const store = useVendorStore()
      await store.fetchVendors(CORP_UUID)

      expect(store.getActiveForCorporation(CORP_UUID)).toHaveLength(0)
    })
  })

  // ── getVendorById ─────────────────────────────────────────────────────────

  describe('getVendorById', () => {
    it('finds a vendor by UUID (exact match)', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([makeSqlVendor({ vendor_id: 'find-me', name: 'Target Vendor' })]))
      const store = useVendorStore()
      await store.fetchVendors(CORP_UUID)

      expect(store.getVendorById('find-me')?.vendor_name).toBe('Target Vendor')
    })

    it('is case-insensitive on UUID lookup', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([makeSqlVendor({ vendor_id: 'ABC123' })]))
      const store = useVendorStore()
      await store.fetchVendors(CORP_UUID)

      expect(store.getVendorById('abc123')).toBeDefined()
    })

    it('returns undefined for an unknown UUID', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([makeSqlVendor()]))
      const store = useVendorStore()
      await store.fetchVendors(CORP_UUID)

      expect(store.getVendorById('nonexistent')).toBeUndefined()
    })

    it('returns undefined when no data is loaded', () => {
      const store = useVendorStore()
      expect(store.getVendorById('any-uuid')).toBeUndefined()
    })
  })

  // ── UUID case-normalisation (pre-selection regression) ────────────────────

  describe('UUID case normalisation', () => {
    it('stores vendor_id as lowercase so DB-stored lowercase UUIDs match', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([
        makeSqlVendor({ vendor_id: '67602259C7C97FBE41F1846ACE6C90320000' }),
      ]))
      const store = useVendorStore()
      await store.fetchVendors(CORP_UUID)

      const uuid = store.vendors[0]?.uuid
      expect(uuid).toBe('67602259c7c97fbe41f1846ace6c90320000')
      // Must be found by the lowercase value that the DB would return
      expect(store.getVendorById('67602259c7c97fbe41f1846ace6c90320000')).toBeDefined()
    })

    it('getVendorById resolves the uppercase Nimble ID when stored lowercase', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([makeSqlVendor({ vendor_id: 'UPPER-ID' })]))
      const store = useVendorStore()
      await store.fetchVendors(CORP_UUID)

      // lookup with uppercase should still work (case-insensitive comparison)
      expect(store.getVendorById('UPPER-ID')).toBeDefined()
      // lookup with lowercase (what the DB returns) should also work
      expect(store.getVendorById('upper-id')).toBeDefined()
    })
  })

  // ── getVendorName ─────────────────────────────────────────────────────────

  describe('getVendorName', () => {
    it('returns the vendor name for a known UUID', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([makeSqlVendor({ vendor_id: 'v1', name: 'UltraTech Cement' })]))
      const store = useVendorStore()
      await store.fetchVendors(CORP_UUID)

      expect(store.getVendorName('v1')).toBe('UltraTech Cement')
    })

    it('falls back to the raw UUID when not found', async () => {
      mockFetch.mockResolvedValue(makeApiResponse())
      const store = useVendorStore()
      await store.fetchVendors(CORP_UUID)

      expect(store.getVendorName('unknown-uuid')).toBe('unknown-uuid')
    })

    it('returns the raw UUID before any data is loaded', () => {
      const store = useVendorStore()
      expect(store.getVendorName('raw-id')).toBe('raw-id')
    })
  })

  // ── refresh ───────────────────────────────────────────────────────────────

  describe('refresh', () => {
    it('forces a re-fetch even when corp is already cached', async () => {
      mockFetch.mockResolvedValue(makeApiResponse())
      const store = useVendorStore()
      await store.fetchVendors(CORP_UUID)
      await store.refresh(CORP_UUID)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('does nothing when corporationUuid is undefined', async () => {
      mockFetch.mockResolvedValue(makeApiResponse())
      const store = useVendorStore()
      await store.fetchVendors(CORP_UUID)
      await store.refresh(undefined)
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('updates vendor list after refresh', async () => {
      const store = useVendorStore()
      mockFetch.mockResolvedValue(makeApiResponse([makeSqlVendor({ vendor_id: 'v1' })]))
      await store.fetchVendors(CORP_UUID)

      mockFetch.mockResolvedValue(makeApiResponse([makeSqlVendor({ vendor_id: 'v2' })]))
      await store.refresh(CORP_UUID)

      expect(store.vendors[0]?.uuid).toBe('v2')
    })
  })

  // ── clear ─────────────────────────────────────────────────────────────────

  describe('clear', () => {
    it('resets all state', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([makeSqlVendor()]))
      const store = useVendorStore()
      await store.fetchVendors(CORP_UUID)
      expect(store.vendors).toHaveLength(1)

      store.clear()

      expect(store.vendors).toHaveLength(0)
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('invalidates cache so fetchVendors runs again after clear', async () => {
      mockFetch.mockResolvedValue(makeApiResponse())
      const store = useVendorStore()
      await store.fetchVendors(CORP_UUID)
      store.clear()
      await store.fetchVendors(CORP_UUID)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('clears vendors for all corporations', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([makeSqlVendor()]))
      const store = useVendorStore()
      await store.fetchVendors('corp-1')
      await store.fetchVendors('corp-2')
      expect(store.vendors).toHaveLength(2)

      store.clear()
      expect(store.vendors).toHaveLength(0)
    })
  })
})
