import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCostCodeConfigurationsStore } from '~/stores/costCodeConfigurations'

const makeConfig = (overrides = {}) => ({
  id: 1,
  uuid: 'cfg-uuid-1',
  corporation_uuid: 'corp-1',
  division_uuid: null,
  cost_code_number: '01-100',
  cost_code_name: 'General Conditions',
  parent_cost_code_uuid: null,
  order_number: 1,
  gl_account_uuid: null,
  effective_from: null,
  description: null,
  update_previous_transactions: false,
  is_active: true,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  ...overrides,
})

describe('useCostCodeConfigurationsStore', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    setActivePinia(createPinia())
    mockFetch = vi.fn()
    vi.stubGlobal('$fetch', mockFetch)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ── fetchConfigurations ─────────────────────────────────────────────────────
  describe('fetchConfigurations', () => {
    it('fetches from API and populates configurations', async () => {
      const config = makeConfig()
      mockFetch.mockResolvedValue({ data: [config] })

      const store = useCostCodeConfigurationsStore()
      await store.fetchConfigurations('corp-1')

      expect(mockFetch).toHaveBeenCalledWith('/api/cost-code-configurations', {
        query: { corporation_uuid: 'corp-1' },
      })
      expect(store.configurations).toHaveLength(1)
      expect(store.configurations[0]?.cost_code_name).toBe('General Conditions')
    })

    it('skips fetch when data already cached', async () => {
      mockFetch.mockResolvedValue({ data: [makeConfig()] })

      const store = useCostCodeConfigurationsStore()
      await store.fetchConfigurations('corp-1')
      await store.fetchConfigurations('corp-1')

      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('re-fetches when forceRefresh is true', async () => {
      mockFetch.mockResolvedValue({ data: [makeConfig()] })

      const store = useCostCodeConfigurationsStore()
      await store.fetchConfigurations('corp-1')
      await store.fetchConfigurations('corp-1', true)

      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('sets error and clears configurations on failure', async () => {
      mockFetch.mockRejectedValue(new Error('Server error'))

      const store = useCostCodeConfigurationsStore()
      await store.fetchConfigurations('corp-1')

      expect(store.error).toBe('Server error')
      expect(store.configurations).toHaveLength(0)
    })

    it('sets loading to false after fetch', async () => {
      mockFetch.mockResolvedValue({ data: [] })

      const store = useCostCodeConfigurationsStore()
      await store.fetchConfigurations('corp-1')

      expect(store.loading).toBe(false)
    })
  })

  // ── createConfiguration ─────────────────────────────────────────────────────
  describe('createConfiguration', () => {
    it('creates a configuration and prepends to list', async () => {
      // Populate first
      mockFetch.mockResolvedValueOnce({ data: [makeConfig()] })
      const store = useCostCodeConfigurationsStore()
      await store.fetchConfigurations('corp-1')

      const created = makeConfig({ uuid: 'new-uuid', cost_code_name: 'Excavation' })
      mockFetch.mockResolvedValueOnce({ data: created })

      const result = await store.createConfiguration({
        corporation_uuid: 'corp-1',
        cost_code_number: '02-200',
        cost_code_name: 'Excavation',
        is_active: true,
      })

      expect(mockFetch).toHaveBeenLastCalledWith('/api/cost-code-configurations', {
        method: 'POST',
        body: expect.objectContaining({ cost_code_name: 'Excavation' }),
      })
      expect(result?.cost_code_name).toBe('Excavation')
      expect(store.configurations[0]?.cost_code_name).toBe('Excavation')
    })

    it('throws and sets error on create failure', async () => {
      mockFetch.mockRejectedValue(new Error('Duplicate cost code'))

      const store = useCostCodeConfigurationsStore()
      await expect(
        store.createConfiguration({ corporation_uuid: 'corp-1', cost_code_number: '01-100', cost_code_name: 'Test', is_active: true }),
      ).rejects.toThrow('Duplicate cost code')
      expect(store.error).toBe('Duplicate cost code')
    })
  })

  // ── updateConfiguration ─────────────────────────────────────────────────────
  describe('updateConfiguration', () => {
    it('updates configuration in place', async () => {
      const existing = makeConfig()
      mockFetch.mockResolvedValueOnce({ data: [existing] })
      const store = useCostCodeConfigurationsStore()
      await store.fetchConfigurations('corp-1')

      const updated = { ...existing, cost_code_name: 'Updated Name' }
      mockFetch.mockResolvedValueOnce({ data: updated })

      await store.updateConfiguration('cfg-uuid-1', { cost_code_name: 'Updated Name' })

      expect(store.configurations[0]?.cost_code_name).toBe('Updated Name')
    })
  })

  // ── deleteConfiguration ─────────────────────────────────────────────────────
  describe('deleteConfiguration', () => {
    it('deletes configuration and removes from list', async () => {
      mockFetch.mockResolvedValueOnce({ data: [makeConfig()] })
      const store = useCostCodeConfigurationsStore()
      await store.fetchConfigurations('corp-1')

      mockFetch.mockResolvedValueOnce({})
      await store.deleteConfiguration('cfg-uuid-1')

      expect(mockFetch).toHaveBeenLastCalledWith('/api/cost-code-configurations/cfg-uuid-1', { method: 'DELETE' })
      expect(store.configurations).toHaveLength(0)
    })

    it('only removes the targeted configuration', async () => {
      const cfg1 = makeConfig({ uuid: 'cfg-uuid-1' })
      const cfg2 = makeConfig({ uuid: 'cfg-uuid-2', cost_code_number: '02-200', cost_code_name: 'Excavation' })
      mockFetch.mockResolvedValueOnce({ data: [cfg1, cfg2] })
      const store = useCostCodeConfigurationsStore()
      await store.fetchConfigurations('corp-1')

      mockFetch.mockResolvedValueOnce({})
      await store.deleteConfiguration('cfg-uuid-1')

      expect(store.configurations).toHaveLength(1)
      expect(store.configurations[0]?.cost_code_name).toBe('Excavation')
    })

    it('throws and sets error on delete failure', async () => {
      mockFetch
        .mockResolvedValueOnce({ data: [makeConfig()] })
        .mockRejectedValueOnce(new Error('Not found'))
      const store = useCostCodeConfigurationsStore()
      await store.fetchConfigurations('corp-1')

      await expect(store.deleteConfiguration('cfg-uuid-1')).rejects.toThrow('Not found')
      expect(store.error).toBe('Not found')
    })
  })

  // ── Computed getters ────────────────────────────────────────────────────────
  describe('computed getters', () => {
    it('getConfigurationsByCorporation filters correctly', async () => {
      mockFetch.mockResolvedValue({ data: [makeConfig({ corporation_uuid: 'corp-1' })] })
      const store = useCostCodeConfigurationsStore()
      await store.fetchConfigurations('corp-1')

      expect(store.getConfigurationsByCorporation('corp-1')).toHaveLength(1)
      expect(store.getConfigurationsByCorporation('corp-other')).toHaveLength(0)
    })

    it('getActiveConfigurations returns only active ones', async () => {
      mockFetch.mockResolvedValue({
        data: [
          makeConfig({ uuid: 'cfg-1', is_active: true }),
          makeConfig({ uuid: 'cfg-2', cost_code_number: '02-200', is_active: false }),
        ],
      })
      const store = useCostCodeConfigurationsStore()
      await store.fetchConfigurations('corp-1')

      expect(store.getActiveConfigurations('corp-1')).toHaveLength(1)
    })

    it('getConfigurationById returns matching config', async () => {
      mockFetch.mockResolvedValue({ data: [makeConfig()] })
      const store = useCostCodeConfigurationsStore()
      await store.fetchConfigurations('corp-1')

      expect(store.getConfigurationById('cfg-uuid-1')?.cost_code_name).toBe('General Conditions')
      expect(store.getConfigurationById('missing')).toBeUndefined()
    })

    it('getConfigurationCountByCorporation returns correct count', async () => {
      mockFetch.mockResolvedValue({
        data: [
          makeConfig({ uuid: 'cfg-1' }),
          makeConfig({ uuid: 'cfg-2', cost_code_number: '02-200' }),
        ],
      })
      const store = useCostCodeConfigurationsStore()
      await store.fetchConfigurations('corp-1')

      expect(store.getConfigurationCountByCorporation('corp-1')).toBe(2)
      expect(store.getConfigurationCountByCorporation('corp-other')).toBe(0)
    })

    it('configurationExists returns true when present', async () => {
      mockFetch.mockResolvedValue({ data: [makeConfig()] })
      const store = useCostCodeConfigurationsStore()
      await store.fetchConfigurations('corp-1')

      expect(store.configurationExists('cfg-uuid-1')).toBe(true)
      expect(store.configurationExists('missing')).toBe(false)
    })
  })

  // ── clearConfigurations ─────────────────────────────────────────────────────
  describe('clearConfigurations', () => {
    it('resets all state', async () => {
      mockFetch.mockResolvedValue({ data: [makeConfig()] })
      const store = useCostCodeConfigurationsStore()
      await store.fetchConfigurations('corp-1')
      expect(store.configurations).toHaveLength(1)

      store.clearConfigurations()

      expect(store.configurations).toHaveLength(0)
    })
  })
})
