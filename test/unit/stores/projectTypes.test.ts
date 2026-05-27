import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useProjectTypesStore } from '~/stores/projectTypes'

describe('useProjectTypesStore', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    setActivePinia(createPinia())
    mockFetch = vi.fn()
    vi.stubGlobal('$fetch', mockFetch)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('loads project types from API', async () => {
    mockFetch.mockResolvedValue({
      data: [{
        id: 1,
        uuid: 'uuid-1',
        name: 'Residential',
        description: null,
        color: '#3B82F6',
        isActive: true,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      }],
    })

    const store = useProjectTypesStore()
    await store.fetchProjectTypes()

    expect(mockFetch).toHaveBeenCalledWith('/api/project-types', { credentials: 'include' })
    expect(store.projectTypes).toHaveLength(1)
    expect(store.projectTypes[0]?.name).toBe('Residential')
  })

  it('creates project type and prepends to list', async () => {
    const created = {
      id: 2,
      uuid: 'uuid-2',
      name: 'Commercial',
      description: 'Office projects',
      color: '#10B981',
      isActive: true,
      created_at: '2026-01-02T00:00:00.000Z',
      updated_at: '2026-01-02T00:00:00.000Z',
    }

    mockFetch.mockResolvedValue({ data: created })

    const store = useProjectTypesStore()
    await store.createProjectType({
      name: 'Commercial',
      description: 'Office projects',
      color: '#10B981',
      isActive: true,
    })

    expect(store.projectTypes[0]).toEqual(created)
  })

  it('updates project type in list', async () => {
    const store = useProjectTypesStore()
    store.projectTypes = [{
      id: 1,
      uuid: 'uuid-1',
      name: 'Residential',
      description: null,
      color: '#3B82F6',
      isActive: true,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    }]

    mockFetch.mockResolvedValue({
      data: {
        ...store.projectTypes[0],
        name: 'Residential Updated',
      },
    })

    await store.updateProjectType('1', { name: 'Residential Updated' })
    expect(store.projectTypes[0]?.name).toBe('Residential Updated')
  })

  it('deletes project type from list', async () => {
    const store = useProjectTypesStore()
    store.projectTypes = [{
      id: 1,
      uuid: 'uuid-1',
      name: 'Residential',
      description: null,
      color: '#3B82F6',
      isActive: true,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    }]

    mockFetch.mockResolvedValue({})

    await store.deleteProjectType('1')
    expect(store.projectTypes).toHaveLength(0)
  })
})
