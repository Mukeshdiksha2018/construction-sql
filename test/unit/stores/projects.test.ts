import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useProjectsStore } from '~/stores/projects'

const makeProject = (overrides = {}) => ({
  id: 1,
  uuid: 'proj-uuid-1',
  corporation_uuid: 'corp-1',
  project_name: 'Test Project',
  project_id: 'PRO-100001',
  project_type_uuid: 'pt-uuid',
  service_type_uuid: 'st-uuid',
  project_description: null,
  estimated_amount: 10000,
  area_sq_ft: null,
  no_of_rooms: null,
  contingency_percentage: null,
  customer_name: null,
  customer_uuid: null,
  project_status: 'Pending',
  project_start_date: null,
  project_estimated_completion_date: null,
  only_total: false,
  enable_labor: true,
  enable_material: true,
  attachments: [],
  enable_location_wise: false,
  location_basis_area: false,
  location_basis_no_of_rooms: false,
  is_active: true,
  ...overrides,
})

describe('useProjectsStore', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    setActivePinia(createPinia())
    mockFetch = vi.fn()
    vi.stubGlobal('$fetch', mockFetch)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ── fetchProjects ────────────────────────────────────────────────────────
  describe('fetchProjects', () => {
    it('loads projects from API', async () => {
      mockFetch.mockResolvedValue({ data: [makeProject()] })

      const store = useProjectsStore()
      await store.fetchProjects('corp-1')

      expect(mockFetch).toHaveBeenCalledWith('/api/projects', expect.objectContaining({ query: { corporation_uuid: 'corp-1' } }))
      expect(store.projects).toHaveLength(1)
      expect(store.projects[0]?.project_name).toBe('Test Project')
    })

    it('sets error on failure', async () => {
      mockFetch.mockRejectedValue({ data: { statusMessage: 'DB error' } })

      const store = useProjectsStore()
      await expect(store.fetchProjects('corp-1')).rejects.toBeDefined()
      expect(store.error).toBe('DB error')
    })
  })

  // ── createProject ────────────────────────────────────────────────────────
  describe('createProject', () => {
    it('creates a project and prepends to list', async () => {
      const newProject = makeProject({ project_name: 'New One' })
      mockFetch.mockResolvedValue({ data: newProject })

      const store = useProjectsStore()
      const result = await store.createProject({
        corporation_uuid: 'corp-1',
        project_name: 'New One',
        project_type_uuid: 'pt-uuid',
        service_type_uuid: 'st-uuid',
      })

      expect(result?.project_name).toBe('New One')
      expect(store.projects[0]).toEqual(newProject)
    })

    it('throws and sets error on failure', async () => {
      mockFetch.mockRejectedValue({ message: 'Network error' })

      const store = useProjectsStore()
      await expect(store.createProject({ corporation_uuid: 'c', project_name: 'p' })).rejects.toBeDefined()
      expect(store.error).toBe('Network error')
    })
  })

  // ── updateProject ────────────────────────────────────────────────────────
  describe('updateProject', () => {
    it('updates a project in the list by uuid string', async () => {
      const original = makeProject()
      const updated = makeProject({ project_name: 'Updated' })
      mockFetch.mockResolvedValue({ data: updated })

      const store = useProjectsStore()
      store.projects = [original]
      await store.updateProject('proj-uuid-1', { project_name: 'Updated' })

      expect(store.projects[0]?.project_name).toBe('Updated')
    })

    it('updates a project using object form', async () => {
      const original = makeProject()
      const updated = makeProject({ project_name: 'Updated 2' })
      mockFetch.mockResolvedValue({ data: updated })

      const store = useProjectsStore()
      store.projects = [original]
      await store.updateProject({ uuid: 'proj-uuid-1', project_name: 'Updated 2' })

      expect(store.projects[0]?.project_name).toBe('Updated 2')
    })

    it('also updates currentProject when it matches', async () => {
      const original = makeProject()
      const updated = makeProject({ project_name: 'Current Updated' })
      mockFetch.mockResolvedValue({ data: updated })

      const store = useProjectsStore()
      store.currentProject = original
      store.projects = [original]
      await store.updateProject('proj-uuid-1', { project_name: 'Current Updated' })

      expect(store.currentProject?.project_name).toBe('Current Updated')
    })
  })

  // ── deleteProject ────────────────────────────────────────────────────────
  describe('deleteProject', () => {
    it('removes project from list after delete', async () => {
      mockFetch.mockResolvedValue({})

      const store = useProjectsStore()
      store.projects = [makeProject()]
      await store.deleteProject('proj-uuid-1')

      expect(store.projects).toHaveLength(0)
    })
  })

  // ── fetchProject (single) ────────────────────────────────────────────────
  describe('fetchProject', () => {
    it('fetches a single project by uuid', async () => {
      const project = makeProject()
      mockFetch.mockResolvedValue({ data: project })

      const store = useProjectsStore()
      const result = await store.fetchProject('proj-uuid-1')

      expect(mockFetch).toHaveBeenCalledWith('/api/projects/proj-uuid-1', expect.anything())
      expect(result.uuid).toBe('proj-uuid-1')
    })
  })

  // ── loadCurrentProject ───────────────────────────────────────────────────
  describe('loadCurrentProject', () => {
    it('sets currentProject on success', async () => {
      mockFetch.mockResolvedValue({ data: makeProject() })

      const store = useProjectsStore()
      const loaded = await store.loadCurrentProject('proj-uuid-1', 'corp-1')

      expect(loaded).toBe(true)
      expect(store.currentProject?.uuid).toBe('proj-uuid-1')
    })

    it('returns false when project not found', async () => {
      mockFetch.mockRejectedValue(new Error('Not found'))

      const store = useProjectsStore()
      const loaded = await store.loadCurrentProject('missing', 'corp-1')

      expect(loaded).toBe(false)
    })

    it('returns false for empty projectId', async () => {
      const store = useProjectsStore()
      const loaded = await store.loadCurrentProject('', 'corp-1')

      expect(loaded).toBe(false)
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  // ── clearCurrentProject ──────────────────────────────────────────────────
  describe('clearCurrentProject', () => {
    it('clears the current project', () => {
      const store = useProjectsStore()
      store.currentProject = makeProject()
      store.clearCurrentProject()

      expect(store.currentProject).toBeNull()
    })
  })

  // ── fetchLocalCustomers ──────────────────────────────────────────────────
  describe('fetchLocalCustomers', () => {
    it('loads customers from API', async () => {
      mockFetch.mockResolvedValue({ data: [{ id: 'c1', name: 'Customer One' }] })

      const store = useProjectsStore()
      await store.fetchLocalCustomers('corp-1')

      expect(mockFetch).toHaveBeenCalledWith('/api/customers/options', expect.objectContaining({ query: { corporation_uuid: 'corp-1' } }))
      expect(store.localCustomers).toHaveLength(1)
    })

    it('sets empty array on failure', async () => {
      mockFetch.mockRejectedValue(new Error('API error'))

      const store = useProjectsStore()
      await store.fetchLocalCustomers('corp-1')

      expect(store.localCustomers).toEqual([])
    })

    it('does nothing for empty corporationUuid', async () => {
      const store = useProjectsStore()
      await store.fetchLocalCustomers('')

      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  // ── clearLocalCustomers ──────────────────────────────────────────────────
  describe('clearLocalCustomers', () => {
    it('clears local customers', () => {
      const store = useProjectsStore()
      store.localCustomers = [{ id: 'c1' }]
      store.clearLocalCustomers()

      expect(store.localCustomers).toEqual([])
    })
  })
})
