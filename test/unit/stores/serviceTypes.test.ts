import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useServiceTypesStore } from '~/stores/serviceTypes'

describe('useServiceTypesStore', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    setActivePinia(createPinia())
    mockFetch = vi.fn()
    vi.stubGlobal('$fetch', mockFetch)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('loads service types from API', async () => {
    mockFetch.mockResolvedValue({
      data: [{
        id: 1,
        uuid: 'uuid-1',
        name: 'Electrical',
        description: null,
        color: '#3D5C7C',
        isActive: true,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      }],
    })

    const store = useServiceTypesStore()
    await store.fetchServiceTypes()

    expect(mockFetch).toHaveBeenCalledWith('/api/service-types', { credentials: 'include' })
    expect(store.serviceTypes).toHaveLength(1)
    expect(store.serviceTypes[0]?.name).toBe('Electrical')
  })

  it('creates service type and prepends to list', async () => {
    const created = {
      id: 2,
      uuid: 'uuid-2',
      name: 'Plumbing',
      description: 'Plumbing services',
      color: '#10B981',
      isActive: true,
      created_at: '2026-01-02T00:00:00.000Z',
      updated_at: '2026-01-02T00:00:00.000Z',
    }

    mockFetch.mockResolvedValue({ data: created })

    const store = useServiceTypesStore()
    await store.createServiceType({
      name: 'Plumbing',
      description: 'Plumbing services',
      color: '#10B981',
      isActive: true,
    })

    expect(store.serviceTypes[0]).toEqual(created)
  })

  it('updates service type in list', async () => {
    const store = useServiceTypesStore()
    store.serviceTypes = [{
      id: 1,
      uuid: 'uuid-1',
      name: 'Electrical',
      description: null,
      color: '#3D5C7C',
      isActive: true,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    }]

    mockFetch.mockResolvedValue({
      data: {
        ...store.serviceTypes[0],
        name: 'Electrical Updated',
      },
    })

    await store.updateServiceType('1', { name: 'Electrical Updated' })
    expect(store.serviceTypes[0]?.name).toBe('Electrical Updated')
  })

  it('deletes service type from list', async () => {
    const store = useServiceTypesStore()
    store.serviceTypes = [{
      id: 1,
      uuid: 'uuid-1',
      name: 'Electrical',
      description: null,
      color: '#3D5C7C',
      isActive: true,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    }]

    mockFetch.mockResolvedValue({})

    await store.deleteServiceType('1')
    expect(store.serviceTypes).toHaveLength(0)
  })
})
