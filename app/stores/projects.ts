import { defineStore } from 'pinia'
import { useApiClient } from '~/composables/useApiClient'

export interface Project {
  id: number
  uuid: string
  corporation_uuid: string
  project_name: string
  project_id: string
  project_type_uuid: string | null
  service_type_uuid: string | null
  customer_uuid: string | null
  project_status: string
  project_start_date: string | null
  project_estimated_completion_date: string | null
  estimated_amount: number
  area_sq_ft: number | null
  no_of_rooms: number | null
  is_active: boolean
  project_description?: string | null
  contingency_percentage?: number | null
  only_total?: boolean
  enable_labor?: boolean
  enable_material?: boolean
  enable_location_wise?: boolean
  location_basis_area?: boolean
  location_basis_no_of_rooms?: boolean
  project_address_uuid?: string | null
  [key: string]: any
}

export interface UpsertProjectPayload {
  corporation_uuid?: string
  project_name?: string
  project_id?: string
  project_type_uuid?: string | null
  service_type_uuid?: string | null
  customer_uuid?: string | null
  project_status?: string
  project_start_date?: string | null
  project_estimated_completion_date?: string | null
  estimated_amount?: number
  area_sq_ft?: number | null
  no_of_rooms?: number | null
  project_description?: string | null
  contingency_percentage?: number | null
  only_total?: boolean
  enable_labor?: boolean
  enable_material?: boolean
  enable_location_wise?: boolean
  location_basis_area?: boolean
  location_basis_no_of_rooms?: boolean
  project_address_uuid?: string | null
  [key: string]: any
}

export const useProjectsStore = defineStore('projects', {
  state: () => ({
    projects: [] as Project[],
    currentProject: null as Project | null,
    localCustomers: [] as any[],
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async fetchProjects(corporationUUID: string) {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<{ data: Project[] }>('/api/projects', {
          query: { corporation_uuid: corporationUUID },
          credentials: 'include',
        })
        this.projects = response.data ?? []
      } catch (e: unknown) {
        const fetchError = e as { data?: { statusMessage?: string }, message?: string }
        this.error = fetchError?.data?.statusMessage || fetchError?.message || 'Failed to fetch projects'
        throw e
      } finally {
        this.loading = false
      }
    },

    async fetchProjectsMetadata(corporationUUID: string) {
      if (!corporationUUID) return
      try {
        const response = await $fetch<{ data: Project[] }>('/api/projects', {
          query: { corporation_uuid: corporationUUID },
          credentials: 'include',
        })
        this.projects = response.data ?? []
      } catch {
        // silently fail metadata fetch
      }
    },

    async deleteProject(uuid: string) {
      this.loading = true
      this.error = null
      try {
        await $fetch('/api/projects', {
          method: 'DELETE',
          query: { uuid },
          credentials: 'include',
        })
        this.projects = this.projects.filter(p => p.uuid !== uuid)
        return true
      } catch (e: unknown) {
        const fetchError = e as { data?: { statusMessage?: string }, message?: string }
        this.error = fetchError?.data?.statusMessage || fetchError?.message || 'Failed to delete project'
        throw e
      } finally {
        this.loading = false
      }
    },

    async fetchProject(uuid: string): Promise<Project> {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<{ data: Project }>(`/api/projects/${uuid}`, {
          credentials: 'include',
        })
        return response.data
      } catch (e: unknown) {
        const fetchError = e as { data?: { statusMessage?: string }, message?: string }
        this.error = fetchError?.data?.statusMessage || fetchError?.message || 'Failed to fetch project'
        throw e
      } finally {
        this.loading = false
      }
    },

    async loadCurrentProject(projectId: string, _corporationUuid: string): Promise<boolean> {
      if (!projectId) return false
      try {
        const project = await this.fetchProject(projectId)
        if (project) {
          this.currentProject = project
          return true
        }
        return false
      } catch {
        return false
      }
    },

    clearCurrentProject() {
      this.currentProject = null
    },

    async createProject(payload: UpsertProjectPayload): Promise<Project | null> {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<{ data: Project }>('/api/projects', {
          method: 'POST',
          body: payload,
          credentials: 'include',
        })
        if (response.data) {
          this.projects.unshift(response.data)
        }
        return response.data ?? null
      } catch (e: unknown) {
        const fetchError = e as { data?: { statusMessage?: string }, message?: string }
        this.error = fetchError?.data?.statusMessage || fetchError?.message || 'Failed to create project'
        throw e
      } finally {
        this.loading = false
      }
    },

    async updateProject(uuidOrPayload: string | ({ uuid: string } & Partial<UpsertProjectPayload>), payload?: Partial<UpsertProjectPayload>): Promise<Project | null> {
      this.loading = true
      this.error = null
      try {
        let uuid: string
        let body: any
        if (typeof uuidOrPayload === 'string') {
          uuid = uuidOrPayload
          body = { uuid, ...payload }
        } else {
          uuid = uuidOrPayload.uuid
          body = { ...uuidOrPayload }
        }
        const response = await $fetch<{ data: Project }>('/api/projects', {
          method: 'PUT',
          body,
          credentials: 'include',
        })
        if (response.data) {
          const index = this.projects.findIndex(p => p.uuid === uuid)
          if (index !== -1) this.projects[index] = response.data
          if (this.currentProject?.uuid === uuid) this.currentProject = response.data
        }
        return response.data ?? null
      } catch (e: unknown) {
        const fetchError = e as { data?: { statusMessage?: string }, message?: string }
        this.error = fetchError?.data?.statusMessage || fetchError?.message || 'Failed to update project'
        throw e
      } finally {
        this.loading = false
      }
    },

    async fetchLocalCustomers(corporationUuid: string, projectUuid?: string | null, _force?: boolean) {
      if (!corporationUuid) return
      if (import.meta.server) return
      try {
        const { apiFetch } = useApiClient()
        let url = `/api/customers?corporation_uuid=${encodeURIComponent(corporationUuid)}`
        if (projectUuid) {
          url += `&project_uuid=${encodeURIComponent(projectUuid)}`
        }
        const response = await apiFetch<{ data?: any[], error?: string }>(url)
        if (response?.error) throw new Error(response.error)
        this.localCustomers = response?.data ?? []
      } catch {
        this.localCustomers = []
      }
    },

    clearLocalCustomers() {
      this.localCustomers = []
    },
  },
})
