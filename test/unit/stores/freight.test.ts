import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useFreightStore } from '~/stores/freight'

describe('useFreightStore', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    setActivePinia(createPinia())
    mockFetch = vi.fn()
    vi.stubGlobal('$fetch', mockFetch)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('loads freight from API', async () => {
    mockFetch.mockResolvedValue({
      data: [{
        id: 1,
        uuid: 'uuid-1',
        freight_name: 'FedEx',
        description: null,
        active: true,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      }],
    })

    const store = useFreightStore()
    await store.fetchFreight()

    expect(mockFetch).toHaveBeenCalledWith('/api/freight', { credentials: 'include' })
    expect(store.freight).toHaveLength(1)
    expect(store.freight[0]?.freight_name).toBe('FedEx')
  })

  it('creates freight and prepends to list', async () => {
    const created = {
      id: 2,
      uuid: 'uuid-2',
      freight_name: 'UPS',
      description: 'Ground',
      active: true,
      created_at: '2026-01-02T00:00:00.000Z',
      updated_at: '2026-01-02T00:00:00.000Z',
    }
    mockFetch.mockResolvedValue({ data: created })

    const store = useFreightStore()
    await store.createFreight({ freight_name: 'UPS', description: 'Ground', active: true })

    expect(store.freight[0]).toEqual(created)
  })
})
