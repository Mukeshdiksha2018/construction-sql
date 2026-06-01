import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeCustomerApi } from '../../helpers/customers'

const mockApiFetch = vi.fn()

vi.mock('~/composables/useApiClient', () => ({
  useApiClient: () => ({ apiFetch: mockApiFetch }),
}))

import { useCustomerStore } from '~/stores/customers'

describe('useCustomerStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('starts with empty customers', () => {
    const store = useCustomerStore()
    expect(store.customers).toEqual([])
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  describe('fetchCustomers', () => {
    it('loads customers for corporation', async () => {
      const rows = [makeCustomerApi()]
      mockApiFetch.mockResolvedValue({ data: rows })

      const store = useCustomerStore()
      await store.fetchCustomers('corp-1')

      expect(mockApiFetch).toHaveBeenCalledWith('/api/customers?corporation_uuid=corp-1')
      expect(store.customers).toEqual(rows)
      expect(store.error).toBeNull()
    })

    it('includes project_uuid in query when provided', async () => {
      mockApiFetch.mockResolvedValue({ data: [] })
      const store = useCustomerStore()
      await store.fetchCustomers('corp-1', 'proj-1', true)

      expect(mockApiFetch).toHaveBeenCalledWith(
        '/api/customers?corporation_uuid=corp-1&project_uuid=proj-1',
      )
    })

    it('handles API error response', async () => {
      mockApiFetch.mockResolvedValue({ error: 'Denied' })
      const store = useCustomerStore()
      await store.fetchCustomers('corp-1', null, true)

      expect(store.error).toBe('Denied')
      expect(store.customers).toEqual([])
    })

    it('skips fetch when cache is warm', async () => {
      mockApiFetch.mockResolvedValue({ data: [makeCustomerApi()] })
      const store = useCustomerStore()
      await store.fetchCustomers('corp-1')
      await store.fetchCustomers('corp-1')

      expect(mockApiFetch).toHaveBeenCalledTimes(1)
    })

    it('force refresh bypasses cache', async () => {
      mockApiFetch.mockResolvedValue({ data: [makeCustomerApi()] })
      const store = useCustomerStore()
      await store.fetchCustomers('corp-1')
      await store.fetchCustomers('corp-1', null, true)

      expect(mockApiFetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('addCustomer', () => {
    it('POSTs and prepends new customer', async () => {
      const created = makeCustomerApi({ uuid: 'new-1' })
      mockApiFetch.mockResolvedValue({ data: created })

      const store = useCustomerStore()
      const result = await store.addCustomer('corp-1', {
        first_name: 'New',
        last_name: 'User',
      })

      expect(mockApiFetch).toHaveBeenCalledWith('/api/customers', {
        method: 'POST',
        body: expect.objectContaining({
          corporation_uuid: 'corp-1',
          first_name: 'New',
        }),
      })
      expect(store.customers[0]).toEqual(created)
      expect(result?.data).toEqual(created)
    })

    it('throws on error response', async () => {
      mockApiFetch.mockResolvedValue({ error: 'Create failed' })
      const store = useCustomerStore()

      await expect(store.addCustomer('corp-1', {
        first_name: 'A',
        last_name: 'B',
      })).rejects.toThrow()
      expect(store.error).toBe('Create failed')
    })
  })

  describe('updateCustomer', () => {
    it('PUTs and replaces customer in list', async () => {
      const existing = makeCustomerApi()
      const updated = makeCustomerApi({ first_name: 'Updated' })
      mockApiFetch.mockResolvedValue({ data: updated })

      const store = useCustomerStore()
      store.customers = [existing as never]

      await store.updateCustomer('corp-1', existing as never, { first_name: 'Updated' })

      expect(mockApiFetch).toHaveBeenCalledWith('/api/customers', {
        method: 'PUT',
        body: expect.objectContaining({
          uuid: existing.uuid,
          first_name: 'Updated',
        }),
      })
      expect(store.customers[0].first_name).toBe('Updated')
    })
  })

  describe('deleteCustomer', () => {
    it('DELETEs and removes from list', async () => {
      const existing = makeCustomerApi()
      mockApiFetch.mockResolvedValue({ success: true })

      const store = useCustomerStore()
      store.customers = [existing as never]

      await store.deleteCustomer('corp-1', existing as never)

      expect(mockApiFetch).toHaveBeenCalledWith(
        `/api/customers?uuid=${existing.uuid}`,
        { method: 'DELETE' },
      )
      expect(store.customers).toHaveLength(0)
    })
  })

  describe('clearCache', () => {
    it('resets customers and cache', async () => {
      mockApiFetch.mockResolvedValue({ data: [makeCustomerApi()] })
      const store = useCustomerStore()
      await store.fetchCustomers('corp-1')
      store.clearCache()

      expect(store.customers).toEqual([])
    })
  })
})
