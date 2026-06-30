import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useVendorStore } from '~/stores/vendors'

// ── Factories ─────────────────────────────────────────────────────────────────

const CORP_UUID = 'corp-test-123'

function makeDTO(overrides: Record<string, unknown> = {}) {
  return {
    vendorID: 'vendor-uuid-1',
    vendorName: 'Acme Supplies',
    corporationID: CORP_UUID,
    corporationName: 'Test Corp',
    clientName: 'qa22',
    federalID: '12-3456789',
    creditDays: 30,
    creditDaysID: 'cd-uuid-1',
    paymentMethodID: 'pm-uuid-1',
    paymentMethodName: 'CHECK',
    status: 1,
    addressDetails: [],
    contractDetails: [],
    ...overrides,
  }
}

function makeApiResponse(vendors = [makeDTO()]) {
  return { vendors, total: vendors.length }
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('useVendorStore', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    setActivePinia(createPinia())
    mockFetch = vi.fn()
    vi.stubGlobal('$fetch', mockFetch)
    vi.stubGlobal('useRuntimeConfig', () => ({
      public: { useNimbleDbVendors: 'false' },
    }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ── fetchVendors ──────────────────────────────────────────────────────────

  describe('fetchVendors', () => {
    it('calls the proxy endpoint with corporation_uuid', async () => {
      mockFetch.mockResolvedValue(makeApiResponse())
      const store = useVendorStore()

      await store.fetchVendors(CORP_UUID)

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/nimble/vendors',
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

    it('normalises the DTO: vendorID → uuid (lowercased)', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([makeDTO({ vendorID: 'V-ABC-UPPER' })]))
      const store = useVendorStore()
      await store.fetchVendors(CORP_UUID)
      expect(store.vendors[0]?.uuid).toBe('v-abc-upper')
    })

    it('normalises vendorName → vendor_name', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([makeDTO({ vendorName: 'Northern Build Supply' })]))
      const store = useVendorStore()
      await store.fetchVendors(CORP_UUID)
      expect(store.vendors[0]?.vendor_name).toBe('Northern Build Supply')
    })

    it('normalises corporationID → corporation_uuid (lowercased)', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([makeDTO({ corporationID: 'CORP-XYZ-UPPER' })]))
      const store = useVendorStore()
      await store.fetchVendors('corp-xyz-upper')
      expect(store.vendors[0]?.corporation_uuid).toBe('corp-xyz-upper')
    })

    it('falls back to the queried corporationUuid when corporationID is missing, lowercased', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([makeDTO({ corporationID: undefined })]))
      const store = useVendorStore()
      await store.fetchVendors('INJECTED-CORP')
      expect(store.vendors[0]?.corporation_uuid).toBe('injected-corp')
    })

    it('normalises federalID → federal_id', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([makeDTO({ federalID: '99-1234567' })]))
      const store = useVendorStore()
      await store.fetchVendors(CORP_UUID)
      expect(store.vendors[0]?.federal_id).toBe('99-1234567')
    })

    it('sets federal_id to null when federalID is absent', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([makeDTO({ federalID: undefined })]))
      const store = useVendorStore()
      await store.fetchVendors(CORP_UUID)
      expect(store.vendors[0]?.federal_id).toBeNull()
    })

    it('normalises paymentMethodName → payment_method', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([makeDTO({ paymentMethodName: 'ACH' })]))
      const store = useVendorStore()
      await store.fetchVendors(CORP_UUID)
      expect(store.vendors[0]?.payment_method).toBe('ACH')
    })

    it('marks is_active = true when status === 1', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([makeDTO({ status: 1 })]))
      const store = useVendorStore()
      await store.fetchVendors(CORP_UUID)
      expect(store.vendors[0]?.is_active).toBe(true)
    })

    it('marks is_active = false when status === 0', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([makeDTO({ status: 0 })]))
      const store = useVendorStore()
      await store.fetchVendors(CORP_UUID)
      expect(store.vendors[0]?.is_active).toBe(false)
    })

    it('marks is_active = false when status is absent', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([makeDTO({ status: undefined })]))
      const store = useVendorStore()
      await store.fetchVendors(CORP_UUID)
      expect(store.vendors[0]?.is_active).toBe(false)
    })

    it('sets loading = false after a successful fetch', async () => {
      mockFetch.mockResolvedValue(makeApiResponse())
      const store = useVendorStore()
      await store.fetchVendors(CORP_UUID)
      expect(store.loading).toBe(false)
    })

    it('handles an empty vendor list gracefully', async () => {
      mockFetch.mockResolvedValue({ vendors: [], total: 0 })
      const store = useVendorStore()
      await store.fetchVendors(CORP_UUID)
      expect(store.vendors).toHaveLength(0)
    })

    it('handles missing vendorContractMasterList key gracefully', async () => {
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
      mockFetch.mockResolvedValue(makeApiResponse([makeDTO({ vendorID: 'old-v' })]))
      await store.fetchVendors(CORP_UUID)

      mockFetch.mockResolvedValue(makeApiResponse([makeDTO({ vendorID: 'new-v' })]))
      await store.fetchVendors(CORP_UUID, true)

      expect(store.vendors).toHaveLength(1)
      expect(store.vendors[0]?.uuid).toBe('new-v')
    })

    it('keeps vendors for other corps when re-fetching one', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([makeDTO({ vendorID: 'v-c1', corporationID: 'corp-1' })]))
      const store = useVendorStore()
      await store.fetchVendors('corp-1')

      mockFetch.mockResolvedValue(makeApiResponse([makeDTO({ vendorID: 'v-c2', corporationID: 'corp-2' })]))
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
        makeDTO({ vendorID: 'a1', status: 1 }),
        makeDTO({ vendorID: 'a2', status: 0 }),
        makeDTO({ vendorID: 'a3', status: 1 }),
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
        makeDTO({ vendorID: 'v1', status: 1 }),
        makeDTO({ vendorID: 'v2', status: 0 }),
      ]))
      const store = useVendorStore()
      await store.fetchVendors(CORP_UUID)

      expect(store.getVendorsForCorporation(CORP_UUID)).toHaveLength(2)
    })

    it('is case-insensitive on the corporation UUID', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([makeDTO()]))
      const store = useVendorStore()
      await store.fetchVendors(CORP_UUID)

      expect(store.getVendorsForCorporation(CORP_UUID.toUpperCase())).toHaveLength(1)
    })

    it('returns empty array for an unknown corporation', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([makeDTO()]))
      const store = useVendorStore()
      await store.fetchVendors(CORP_UUID)

      expect(store.getVendorsForCorporation('other-corp')).toHaveLength(0)
    })

    it('does not return vendors from other corporations', async () => {
      const store = useVendorStore()
      mockFetch.mockResolvedValue(makeApiResponse([makeDTO({ vendorID: 'v-c1', corporationID: 'corp-1' })]))
      await store.fetchVendors('corp-1')
      mockFetch.mockResolvedValue(makeApiResponse([makeDTO({ vendorID: 'v-c2', corporationID: 'corp-2' })]))
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
        makeDTO({ vendorID: 'v-act', status: 1 }),
        makeDTO({ vendorID: 'v-ina', status: 0 }),
      ]))
      const store = useVendorStore()
      await store.fetchVendors(CORP_UUID)

      const active = store.getActiveForCorporation(CORP_UUID)
      expect(active).toHaveLength(1)
      expect(active[0]?.uuid).toBe('v-act')
    })

    it('returns empty array when corp has no active vendors', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([makeDTO({ status: 0 })]))
      const store = useVendorStore()
      await store.fetchVendors(CORP_UUID)

      expect(store.getActiveForCorporation(CORP_UUID)).toHaveLength(0)
    })
  })

  // ── getVendorById ─────────────────────────────────────────────────────────

  describe('getVendorById', () => {
    it('finds a vendor by UUID (exact match)', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([makeDTO({ vendorID: 'find-me', vendorName: 'Target Vendor' })]))
      const store = useVendorStore()
      await store.fetchVendors(CORP_UUID)

      expect(store.getVendorById('find-me')?.vendor_name).toBe('Target Vendor')
    })

    it('is case-insensitive on UUID lookup', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([makeDTO({ vendorID: 'ABC123' })]))
      const store = useVendorStore()
      await store.fetchVendors(CORP_UUID)

      expect(store.getVendorById('abc123')).toBeDefined()
    })

    it('returns undefined for an unknown UUID', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([makeDTO()]))
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
    it('stores vendorID as lowercase so DB-stored lowercase UUIDs match', async () => {
      // Nimble returns uppercase vendorIDs; the DB stores them lowercased (via mapRow).
      // VendorSelect looks up the UUID straight from the DB value, so both sides must
      // use the same case.
      mockFetch.mockResolvedValue(makeApiResponse([
        makeDTO({ vendorID: '67602259C7C97FBE41F1846ACE6C90320000' }),
      ]))
      const store = useVendorStore()
      await store.fetchVendors(CORP_UUID)

      const uuid = store.vendors[0]?.uuid
      expect(uuid).toBe('67602259c7c97fbe41f1846ace6c90320000')
      // Must be found by the lowercase value that the DB would return
      expect(store.getVendorById('67602259c7c97fbe41f1846ace6c90320000')).toBeDefined()
    })

    it('getVendorById resolves the uppercase Nimble ID when stored lowercase', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([makeDTO({ vendorID: 'UPPER-ID' })]))
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
      mockFetch.mockResolvedValue(makeApiResponse([makeDTO({ vendorID: 'v1', vendorName: 'UltraTech Cement' })]))
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
      mockFetch.mockResolvedValue(makeApiResponse([makeDTO({ vendorID: 'v1' })]))
      await store.fetchVendors(CORP_UUID)

      mockFetch.mockResolvedValue(makeApiResponse([makeDTO({ vendorID: 'v2' })]))
      await store.refresh(CORP_UUID)

      expect(store.vendors[0]?.uuid).toBe('v2')
    })
  })

  // ── clear ─────────────────────────────────────────────────────────────────

  describe('clear', () => {
    it('resets all state', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([makeDTO()]))
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
      mockFetch.mockResolvedValue(makeApiResponse([makeDTO()]))
      const store = useVendorStore()
      await store.fetchVendors('corp-1')
      await store.fetchVendors('corp-2')
      expect(store.vendors).toHaveLength(2)

      store.clear()
      expect(store.vendors).toHaveLength(0)
    })
  })
})
