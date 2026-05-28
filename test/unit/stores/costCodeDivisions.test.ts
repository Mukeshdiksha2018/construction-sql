import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCostCodeDivisionsStore } from '~/stores/costCodeDivisions'

const makeDivision = (overrides = {}) => ({
  id: 1,
  uuid: 'div-uuid-1',
  corporation_uuid: 'corp-1',
  division_number: '01',
  division_name: 'Site Work',
  division_order: 1,
  description: null,
  is_active: true,
  exclude_in_estimates_and_reports: false,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  ...overrides,
})

describe('useCostCodeDivisionsStore', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    setActivePinia(createPinia())
    mockFetch = vi.fn()
    vi.stubGlobal('$fetch', mockFetch)
    // NOTE: do NOT stub `process` – that removes process.env.NODE_ENV which Pinia needs.
    // process.server is undefined (falsy) in Vitest, so fetch guards pass naturally.
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ── fetchDivisions ──────────────────────────────────────────────────────────
  describe('fetchDivisions', () => {
    it('fetches from API and populates divisions', async () => {
      const division = makeDivision()
      mockFetch.mockResolvedValue({ data: [division] })

      const store = useCostCodeDivisionsStore()
      await store.fetchDivisions('corp-1')

      expect(mockFetch).toHaveBeenCalledWith('/api/cost-code-divisions', {
        query: { corporation_uuid: 'corp-1' },
      })
      expect(store.divisions).toHaveLength(1)
      expect(store.divisions[0]?.division_name).toBe('Site Work')
    })

    it('skips fetch when data already cached for same corporation', async () => {
      const division = makeDivision()
      mockFetch.mockResolvedValue({ data: [division] })

      const store = useCostCodeDivisionsStore()
      await store.fetchDivisions('corp-1')
      await store.fetchDivisions('corp-1')

      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('re-fetches when forceRefresh is true', async () => {
      const division = makeDivision()
      mockFetch.mockResolvedValue({ data: [division] })

      const store = useCostCodeDivisionsStore()
      await store.fetchDivisions('corp-1')
      await store.fetchDivisions('corp-1', true)

      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('sets error and clears divisions on fetch failure', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const store = useCostCodeDivisionsStore()
      await store.fetchDivisions('corp-1')

      expect(store.error).toBe('Network error')
      expect(store.divisions).toHaveLength(0)
    })

    it('fetches for different corporations independently', async () => {
      const div1 = makeDivision({ corporation_uuid: 'corp-1', uuid: 'div-1' })
      const div2 = makeDivision({ corporation_uuid: 'corp-2', uuid: 'div-2', division_name: 'Foundation' })
      mockFetch
        .mockResolvedValueOnce({ data: [div1] })
        .mockResolvedValueOnce({ data: [div2] })

      const store = useCostCodeDivisionsStore()
      await store.fetchDivisions('corp-1')
      await store.fetchDivisions('corp-2')

      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('sets loading to false after successful fetch', async () => {
      mockFetch.mockResolvedValue({ data: [] })

      const store = useCostCodeDivisionsStore()
      await store.fetchDivisions('corp-1')

      expect(store.loading).toBe(false)
    })

    it('sets loading to false after failed fetch', async () => {
      mockFetch.mockRejectedValue(new Error('Error'))

      const store = useCostCodeDivisionsStore()
      await store.fetchDivisions('corp-1')

      expect(store.loading).toBe(false)
    })
  })

  // ── createDivision ──────────────────────────────────────────────────────────
  describe('createDivision', () => {
    it('creates a division and prepends it to the list', async () => {
      // Populate store first via fetch
      mockFetch.mockResolvedValueOnce({ data: [makeDivision()] })
      const store = useCostCodeDivisionsStore()
      await store.fetchDivisions('corp-1')

      const created = makeDivision({ uuid: 'new-uuid', division_name: 'Concrete' })
      mockFetch.mockResolvedValueOnce({ data: created })

      const result = await store.createDivision({
        corporation_uuid: 'corp-1',
        division_number: '03',
        division_name: 'Concrete',
        division_order: 3,
        is_active: true,
      })

      expect(mockFetch).toHaveBeenLastCalledWith('/api/cost-code-divisions', {
        method: 'POST',
        body: expect.objectContaining({ division_name: 'Concrete' }),
      })
      expect(result?.division_name).toBe('Concrete')
      expect(store.divisions[0]?.division_name).toBe('Concrete')
    })

    it('throws and sets error on create failure', async () => {
      mockFetch.mockRejectedValue(new Error('Duplicate division number'))

      const store = useCostCodeDivisionsStore()
      await expect(
        store.createDivision({ corporation_uuid: 'corp-1', division_number: '01', division_name: 'Site Work', division_order: 1, is_active: true }),
      ).rejects.toThrow('Duplicate division number')
      expect(store.error).toBe('Duplicate division number')
    })
  })

  // ── updateDivision ──────────────────────────────────────────────────────────
  describe('updateDivision', () => {
    it('updates an existing division in the list', async () => {
      const existing = makeDivision()
      // Populate via fetch
      mockFetch.mockResolvedValueOnce({ data: [existing] })
      const store = useCostCodeDivisionsStore()
      await store.fetchDivisions('corp-1')

      const updated = { ...existing, division_name: 'Updated Name' }
      mockFetch.mockResolvedValueOnce({ data: updated })

      await store.updateDivision('div-uuid-1', { division_name: 'Updated Name' })

      expect(mockFetch).toHaveBeenLastCalledWith('/api/cost-code-divisions/div-uuid-1', {
        method: 'PUT',
        body: { division_name: 'Updated Name' },
      })
      expect(store.divisions[0]?.division_name).toBe('Updated Name')
    })
  })

  // ── deleteDivision ──────────────────────────────────────────────────────────
  describe('deleteDivision', () => {
    it('deletes a division and removes it from the list', async () => {
      // Populate via fetch
      mockFetch.mockResolvedValueOnce({ data: [makeDivision()] })
      const store = useCostCodeDivisionsStore()
      await store.fetchDivisions('corp-1')

      mockFetch.mockResolvedValueOnce({})
      await store.deleteDivision('div-uuid-1')

      expect(mockFetch).toHaveBeenLastCalledWith('/api/cost-code-divisions/div-uuid-1', { method: 'DELETE' })
      expect(store.divisions).toHaveLength(0)
    })

    it('only deletes the targeted division', async () => {
      const div1 = makeDivision({ uuid: 'div-uuid-1' })
      const div2 = makeDivision({ uuid: 'div-uuid-2', division_name: 'Concrete' })
      mockFetch.mockResolvedValueOnce({ data: [div1, div2] })
      const store = useCostCodeDivisionsStore()
      await store.fetchDivisions('corp-1')

      mockFetch.mockResolvedValueOnce({})
      await store.deleteDivision('div-uuid-1')

      expect(store.divisions).toHaveLength(1)
      expect(store.divisions[0]?.division_name).toBe('Concrete')
    })

    it('throws and sets error on delete failure', async () => {
      mockFetch
        .mockResolvedValueOnce({ data: [makeDivision()] })
        .mockRejectedValueOnce(new Error('Not found'))
      const store = useCostCodeDivisionsStore()
      await store.fetchDivisions('corp-1')

      await expect(store.deleteDivision('div-uuid-1')).rejects.toThrow('Not found')
      expect(store.error).toBe('Not found')
    })
  })

  // ── Computed getters ────────────────────────────────────────────────────────
  describe('computed getters', () => {
    it('getDivisionsByCorporation returns filtered list', async () => {
      mockFetch.mockResolvedValue({ data: [makeDivision({ corporation_uuid: 'corp-1' })] })
      const store = useCostCodeDivisionsStore()
      await store.fetchDivisions('corp-1')

      expect(store.getDivisionsByCorporation('corp-1')).toHaveLength(1)
      expect(store.getDivisionsByCorporation('corp-other')).toHaveLength(0)
    })

    it('getActiveDivisions returns only active divisions', async () => {
      mockFetch.mockResolvedValue({
        data: [
          makeDivision({ uuid: 'div-1', is_active: true }),
          makeDivision({ uuid: 'div-2', is_active: false }),
        ],
      })
      const store = useCostCodeDivisionsStore()
      await store.fetchDivisions('corp-1')

      expect(store.getActiveDivisions('corp-1')).toHaveLength(1)
    })

    it('getDivisionById returns the matching division', async () => {
      mockFetch.mockResolvedValue({ data: [makeDivision()] })
      const store = useCostCodeDivisionsStore()
      await store.fetchDivisions('corp-1')

      expect(store.getDivisionById('div-uuid-1')?.division_name).toBe('Site Work')
      expect(store.getDivisionById('nonexistent')).toBeUndefined()
    })

    it('getDivisionCountByCorporation returns correct count', async () => {
      mockFetch.mockResolvedValue({
        data: [
          makeDivision({ uuid: 'div-1' }),
          makeDivision({ uuid: 'div-2', division_number: '02' }),
        ],
      })
      const store = useCostCodeDivisionsStore()
      await store.fetchDivisions('corp-1')

      expect(store.getDivisionCountByCorporation('corp-1')).toBe(2)
      expect(store.getDivisionCountByCorporation('corp-other')).toBe(0)
    })

    it('divisionExists returns true when division is present', async () => {
      mockFetch.mockResolvedValue({ data: [makeDivision()] })
      const store = useCostCodeDivisionsStore()
      await store.fetchDivisions('corp-1')

      expect(store.divisionExists('div-uuid-1')).toBe(true)
      expect(store.divisionExists('missing-uuid')).toBe(false)
    })
  })

  // ── Case-insensitive corporation UUID matching ─────────────────────────────
  describe('case-insensitive corporation UUID matching', () => {
    it('getDivisionsByCorporation matches uppercase against lowercase-stored data', async () => {
      mockFetch.mockResolvedValue({ data: [makeDivision({ corporation_uuid: 'corp-1' })] })
      const store = useCostCodeDivisionsStore()
      await store.fetchDivisions('corp-1')

      expect(store.getDivisionsByCorporation('CORP-1')).toHaveLength(1)
    })

    it('getActiveDivisions matches uppercase corporation UUID', async () => {
      mockFetch.mockResolvedValue({ data: [makeDivision({ corporation_uuid: 'corp-abc' })] })
      const store = useCostCodeDivisionsStore()
      await store.fetchDivisions('corp-abc')

      expect(store.getActiveDivisions('CORP-ABC')).toHaveLength(1)
    })

    it('getDivisionCountByCorporation is case-insensitive', async () => {
      mockFetch.mockResolvedValue({ data: [makeDivision({ corporation_uuid: 'corp-x' })] })
      const store = useCostCodeDivisionsStore()
      await store.fetchDivisions('corp-x')

      expect(store.getDivisionCountByCorporation('CORP-X')).toBe(1)
    })

    it('deduplicates cache between uppercase and lowercase calls', async () => {
      mockFetch.mockResolvedValue({ data: [makeDivision()] })
      const store = useCostCodeDivisionsStore()
      await store.fetchDivisions('CORP-1')
      await store.fetchDivisions('corp-1')

      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  // ── clearDivisions ──────────────────────────────────────────────────────────
  describe('clearDivisions', () => {
    it('resets all state', async () => {
      mockFetch.mockResolvedValue({ data: [makeDivision()] })
      const store = useCostCodeDivisionsStore()
      await store.fetchDivisions('corp-1')
      expect(store.divisions).toHaveLength(1)

      store.clearDivisions()

      expect(store.divisions).toHaveLength(0)
    })
  })
})
