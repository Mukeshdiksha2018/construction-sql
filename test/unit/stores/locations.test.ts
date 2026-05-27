import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useLocationsStore } from '~/stores/locations'

describe('useLocationsStore', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    setActivePinia(createPinia())
    mockFetch = vi.fn()
    vi.stubGlobal('$fetch', mockFetch)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('loads locations from API', async () => {
    mockFetch.mockResolvedValue({
      data: [{
        id: 1,
        uuid: 'uuid-1',
        location_name: 'Main Warehouse',
        location_code: 'WH-01',
        description: null,
        active: true,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      }],
    })

    const store = useLocationsStore()
    await store.fetchLocations()

    expect(mockFetch).toHaveBeenCalledWith('/api/location', { credentials: 'include' })
    expect(store.locations).toHaveLength(1)
    expect(store.locations[0]?.location_name).toBe('Main Warehouse')
  })

  it('creates location and prepends to list', async () => {
    const created = {
      id: 2,
      uuid: 'uuid-2',
      location_name: 'Yard',
      location_code: 'YD-1',
      description: 'Open',
      active: true,
      created_at: '2026-01-02T00:00:00.000Z',
      updated_at: '2026-01-02T00:00:00.000Z',
    }
    mockFetch.mockResolvedValue({ data: created })

    const store = useLocationsStore()
    await store.createLocation({
      location_name: 'Yard',
      location_code: 'YD-1',
      description: 'Open',
      active: true,
    })

    expect(store.locations[0]).toEqual(created)
  })
})
