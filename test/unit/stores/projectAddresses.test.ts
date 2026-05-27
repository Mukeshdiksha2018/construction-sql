import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useProjectAddressesStore } from '~/stores/projectAddresses'

const makeAddress = (overrides = {}) => ({
  id: 1,
  uuid: 'addr-uuid-1',
  project_uuid: 'proj-uuid-1',
  address_type: 'shipment',
  contact_person: 'John',
  email: 'john@test.com',
  phone: '123',
  address_line_1: '742 Mission St',
  address_line_2: null,
  city: 'San Francisco',
  state: 'CA',
  zip_code: '94103',
  country: 'US',
  is_primary: true,
  is_active: true,
  copied_from_billing_address_uuid: null,
  created_at: '2026-05-08T09:16:34.000Z',
  updated_at: '2026-05-08T09:16:34.000Z',
  ...overrides,
})

describe('useProjectAddressesStore', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    setActivePinia(createPinia())
    mockFetch = vi.fn()
    vi.stubGlobal('$fetch', mockFetch)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ── fetchAddresses ───────────────────────────────────────────────────────
  describe('fetchAddresses', () => {
    it('loads addresses for a project', async () => {
      mockFetch.mockResolvedValue({ data: [makeAddress()] })

      const store = useProjectAddressesStore()
      await store.fetchAddresses('proj-uuid-1')

      expect(mockFetch).toHaveBeenCalledWith('/api/projects/addresses', expect.objectContaining({
        query: { project_uuid: 'proj-uuid-1' },
      }))
      expect(store.addressesByProject['proj-uuid-1']).toHaveLength(1)
      expect(store.addressesByProject['proj-uuid-1']?.[0]?.address_type).toBe('shipment')
    })

    it('does nothing for empty projectUuid', async () => {
      const store = useProjectAddressesStore()
      await store.fetchAddresses('')

      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('sets empty array on failure', async () => {
      mockFetch.mockRejectedValue(new Error('API error'))

      const store = useProjectAddressesStore()
      await store.fetchAddresses('proj-uuid-1')

      expect(store.addressesByProject['proj-uuid-1']).toEqual([])
    })
  })

  // ── getAddresses getter ──────────────────────────────────────────────────
  describe('getAddresses getter', () => {
    it('returns empty array when no addresses loaded', () => {
      const store = useProjectAddressesStore()
      expect(store.getAddresses('unknown-proj')).toEqual([])
    })

    it('returns addresses after fetch', async () => {
      mockFetch.mockResolvedValue({ data: [makeAddress()] })

      const store = useProjectAddressesStore()
      await store.fetchAddresses('proj-uuid-1')

      expect(store.getAddresses('proj-uuid-1')).toHaveLength(1)
    })
  })

  // ── createAddress ────────────────────────────────────────────────────────
  describe('createAddress', () => {
    it('creates an address and appends to project list', async () => {
      const newAddress = makeAddress({ uuid: 'addr-uuid-new', address_type: 'bill' })
      mockFetch.mockResolvedValue({ data: newAddress })

      const store = useProjectAddressesStore()
      store.addressesByProject['proj-uuid-1'] = [makeAddress()]

      const result = await store.createAddress({
        project_uuid: 'proj-uuid-1',
        address_type: 'bill',
        address_line_1: '100 Main St',
      })

      expect(result?.uuid).toBe('addr-uuid-new')
      expect(store.addressesByProject['proj-uuid-1']).toHaveLength(2)
    })

    it('returns null on failure', async () => {
      mockFetch.mockRejectedValue(new Error('API error'))

      const store = useProjectAddressesStore()
      const result = await store.createAddress({
        project_uuid: 'proj-uuid-1',
        address_type: 'shipment',
        address_line_1: '100 Main St',
      })

      expect(result).toBeNull()
      expect(store.error).toBeTruthy()
    })
  })

  // ── updateAddress ────────────────────────────────────────────────────────
  describe('updateAddress', () => {
    it('updates an address in project list', async () => {
      const original = makeAddress()
      const updated = makeAddress({ city: 'Oakland' })
      mockFetch.mockResolvedValue({ data: updated })

      const store = useProjectAddressesStore()
      store.addressesByProject['proj-uuid-1'] = [original]

      await store.updateAddress({ uuid: 'addr-uuid-1', project_uuid: 'proj-uuid-1', city: 'Oakland' })

      expect(store.addressesByProject['proj-uuid-1']?.[0]?.city).toBe('Oakland')
    })

    it('returns null for empty uuid', async () => {
      const store = useProjectAddressesStore()
      const result = await store.updateAddress({ uuid: '' })

      expect(result).toBeNull()
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  // ── deleteAddress ────────────────────────────────────────────────────────
  describe('deleteAddress', () => {
    it('removes address from project list', async () => {
      mockFetch.mockResolvedValue({})

      const store = useProjectAddressesStore()
      store.addressesByProject['proj-uuid-1'] = [makeAddress()]

      const result = await store.deleteAddress('addr-uuid-1', 'proj-uuid-1')

      expect(result).toBe(true)
      expect(store.addressesByProject['proj-uuid-1']).toHaveLength(0)
    })

    it('returns false on failure', async () => {
      mockFetch.mockRejectedValue(new Error('API error'))

      const store = useProjectAddressesStore()
      const result = await store.deleteAddress('addr-uuid-1', 'proj-uuid-1')

      expect(result).toBe(false)
    })
  })

  // ── checkAddressUsage ────────────────────────────────────────────────────
  describe('checkAddressUsage', () => {
    it('returns usage data from API', async () => {
      mockFetch.mockResolvedValue({ inUse: false, purchaseOrderCount: 0, changeOrderCount: 0 })

      const store = useProjectAddressesStore()
      const result = await store.checkAddressUsage('addr-uuid-1')

      expect(result.inUse).toBe(false)
    })

    it('returns safe defaults on failure', async () => {
      mockFetch.mockRejectedValue(new Error('API error'))

      const store = useProjectAddressesStore()
      const result = await store.checkAddressUsage('addr-uuid-1')

      expect(result).toEqual({ inUse: false, purchaseOrderCount: 0, changeOrderCount: 0 })
    })
  })

  // ── clearProjectAddresses ────────────────────────────────────────────────
  describe('clearProjectAddresses', () => {
    it('removes project key from the map', () => {
      const store = useProjectAddressesStore()
      store.addressesByProject['proj-uuid-1'] = [makeAddress()]
      store.clearProjectAddresses('proj-uuid-1')

      expect(store.addressesByProject['proj-uuid-1']).toBeUndefined()
    })
  })
})
