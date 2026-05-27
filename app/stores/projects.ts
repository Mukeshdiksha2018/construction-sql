import { defineStore } from 'pinia'

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
}

export const useProjectsStore = defineStore('projects', {
  state: () => ({
    projects: [] as Project[],
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
      }
      catch (e: unknown) {
        const fetchError = e as { data?: { statusMessage?: string }, message?: string }
        this.error = fetchError?.data?.statusMessage || fetchError?.message || 'Failed to fetch projects'
        throw e
      }
      finally {
        this.loading = false
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
      }
      catch (e: unknown) {
        const fetchError = e as { data?: { statusMessage?: string }, message?: string }
        this.error = fetchError?.data?.statusMessage || fetchError?.message || 'Failed to delete project'
        throw e
      }
      finally {
        this.loading = false
      }
    },
  },
})
