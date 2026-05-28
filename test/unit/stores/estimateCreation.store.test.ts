import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useEstimateCreationStore } from '~/stores/estimateCreation'

// ── Mock $fetch ────────────────────────────────────────────────────────────────
const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

// ── Fixtures ───────────────────────────────────────────────────────────────────
const makeProject = (overrides = {}) => ({
  uuid: 'proj-1',
  project_name: 'Test Project',
  project_id: 'P001',
  corporation_uuid: 'corp-1',
  is_active: true,
  ...overrides,
})

const makeDivision = (overrides = {}) => ({
  uuid: 'div-1',
  division_number: '01',
  division_name: 'Concrete',
  is_active: true,
  exclude_in_estimates_and_reports: false,
  ...overrides,
})

const makeConfig = (overrides = {}) => ({
  uuid: 'cc-uuid-1',
  cost_code_number: '01-100',
  cost_code_name: 'Concrete Work',
  division_uuid: 'div-1',
  is_active: true,
  preferred_items: [],
  ...overrides,
})

const makeItemType = (overrides = {}) => ({
  uuid: 'it-1',
  spec_type: 'Structural',
  item_type: 'Steel',
  category: 'materials',
  is_active: true,
  ...overrides,
})

const makeUOM = (overrides = {}) => ({
  ID: 'uom-1',
  Name: 'Each',
  ShortName: 'EA',
  is_active: true,
  ...overrides,
})

describe('useEstimateCreationStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  // ── Initial state ────────────────────────────────────────────────────────────
  describe('initial state', () => {
    it('starts with no corporation selected', () => {
      const store = useEstimateCreationStore()
      expect(store.selectedCorporationUuid).toBeNull()
    })

    it('starts with all arrays empty', () => {
      const store = useEstimateCreationStore()
      expect(store.projects).toEqual([])
      expect(store.costCodeDivisions).toEqual([])
      expect(store.costCodeConfigurations).toEqual([])
      expect(store.itemTypes).toEqual([])
      expect(store.uom).toEqual([])
    })

    it('hasData is false initially', () => {
      const store = useEstimateCreationStore()
      expect(store.hasData).toBe(false)
    })
  })

  // ── getActiveDivisions ───────────────────────────────────────────────────────
  describe('getActiveDivisions', () => {
    it('returns empty array when no corporation selected', () => {
      const store = useEstimateCreationStore()
      expect(store.getActiveDivisions).toEqual([])
    })

    it('returns only active divisions after data is loaded', async () => {
      mockFetch
        .mockResolvedValueOnce({ data: [makeDivision(), makeDivision({ uuid: 'div-2', is_active: false })] }) // divisions
        .mockResolvedValueOnce({ data: [] }) // uom
        .mockResolvedValueOnce({ data: [] }) // projects
        .mockResolvedValueOnce({ data: [] }) // item types
        .mockResolvedValueOnce({ data: [] }) // configurations

      const store = useEstimateCreationStore()
      await store.setCorporationAndFetchData('corp-1')

      expect(store.getActiveDivisions).toHaveLength(1)
      expect(store.getActiveDivisions[0].uuid).toBe('div-1')
    })
  })

  // ── getActiveConfigurations ──────────────────────────────────────────────────
  describe('getActiveConfigurations', () => {
    it('returns empty array when no corporation selected', () => {
      const store = useEstimateCreationStore()
      expect(store.getActiveConfigurations).toEqual([])
    })

    it('returns only active configurations after data is loaded', async () => {
      mockFetch
        .mockResolvedValueOnce({ data: [] }) // divisions
        .mockResolvedValueOnce({ data: [] }) // uom
        .mockResolvedValueOnce({ data: [] }) // projects
        .mockResolvedValueOnce({ data: [] }) // item types
        .mockResolvedValueOnce({ data: [makeConfig(), makeConfig({ uuid: 'cc-2', is_active: false })] })

      const store = useEstimateCreationStore()
      await store.setCorporationAndFetchData('corp-1')

      expect(store.getActiveConfigurations).toHaveLength(1)
    })
  })

  // ── getActiveUOM ─────────────────────────────────────────────────────────────
  describe('getActiveUOM', () => {
    it('filters UOM by active status', async () => {
      const uomData = [
        makeUOM({ ID: 'u-1', is_active: true }),
        makeUOM({ ID: 'u-2', is_active: false }),
        makeUOM({ ID: 'u-3', status: 'ACTIVE' }),
      ]
      mockFetch
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: uomData })
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [] })

      const store = useEstimateCreationStore()
      await store.setCorporationAndFetchData('corp-1')

      const activeUOM = store.getActiveUOM
      expect(activeUOM.every((u: any) => u.is_active !== false)).toBe(true)
    })
  })

  // ── setCorporationAndFetchData ───────────────────────────────────────────────
  describe('setCorporationAndFetchData', () => {
    it('sets corporation uuid and fetches all data', async () => {
      mockFetch
        .mockResolvedValueOnce({ data: [makeDivision()] })
        .mockResolvedValueOnce({ data: [makeUOM()] })
        .mockResolvedValueOnce({ data: [makeProject()] })
        .mockResolvedValueOnce({ data: [makeItemType()] })
        .mockResolvedValueOnce({ data: [makeConfig()] })

      const store = useEstimateCreationStore()
      await store.setCorporationAndFetchData('corp-1')

      expect(store.selectedCorporationUuid).toBe('corp-1')
      expect(store.costCodeDivisions).toHaveLength(1)
      expect(store.projects).toHaveLength(1)
      expect(store.itemTypes).toHaveLength(1)
      expect(store.costCodeConfigurations).toHaveLength(1)
      expect(store.loading).toBe(false)
    })

    it('filters projects to only those matching corporation', async () => {
      mockFetch
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({
          data: [
            makeProject({ corporation_uuid: 'corp-1' }),
            makeProject({ uuid: 'proj-2', corporation_uuid: 'corp-2' }),
          ],
        })
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [] })

      const store = useEstimateCreationStore()
      await store.setCorporationAndFetchData('corp-1')

      expect(store.projects).toHaveLength(1)
      expect(store.projects[0].corporation_uuid).toBe('corp-1')
    })

    it('clears all data when called with null', async () => {
      const store = useEstimateCreationStore()
      // pre-populate
      mockFetch
        .mockResolvedValueOnce({ data: [makeDivision()] })
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [] })
      await store.setCorporationAndFetchData('corp-1')

      await store.setCorporationAndFetchData(null)
      expect(store.selectedCorporationUuid).toBeNull()
      expect(store.costCodeDivisions).toHaveLength(0)
    })

    it('clears previous corp data when switching corporations', async () => {
      mockFetch.mockResolvedValue({ data: [] })
      const store = useEstimateCreationStore()

      await store.setCorporationAndFetchData('corp-1')
      await store.setCorporationAndFetchData('corp-2')

      expect(store.selectedCorporationUuid).toBe('corp-2')
    })

    it('continues loading even when individual fetch fails', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('divisions failed'))
        .mockResolvedValueOnce({ data: [] }) // uom
        .mockResolvedValueOnce({ data: [makeProject()] }) // projects
        .mockResolvedValueOnce({ data: [] }) // item types
        .mockResolvedValueOnce({ data: [] }) // configurations

      const store = useEstimateCreationStore()
      await store.setCorporationAndFetchData('corp-1')

      expect(store.loading).toBe(false)
      expect(store.projects).toHaveLength(1)
    })

    it('sets loading false even on total failure', async () => {
      mockFetch.mockRejectedValue(new Error('Complete failure'))
      const store = useEstimateCreationStore()

      await store.setCorporationAndFetchData('corp-1')
      expect(store.loading).toBe(false)
    })
  })

  // ── clearStore ───────────────────────────────────────────────────────────────
  describe('clearStore', () => {
    it('resets all state to initial values', async () => {
      mockFetch
        .mockResolvedValueOnce({ data: [makeDivision()] })
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [] })

      const store = useEstimateCreationStore()
      await store.setCorporationAndFetchData('corp-1')

      store.clearStore()
      expect(store.selectedCorporationUuid).toBeNull()
      expect(store.costCodeDivisions).toHaveLength(0)
      expect(store.projects).toHaveLength(0)
      expect(store.error).toBeNull()
      expect(store.loading).toBe(false)
    })
  })
})
