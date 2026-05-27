import { defineStore } from 'pinia'

export interface ProjectType {
  id: number
  uuid: string
  name: string
  description: string | null
  color: string
  isActive: boolean
  created_at: string
  updated_at: string
}

export interface CreateProjectTypeData {
  name: string
  description?: string | null
  color?: string
  isActive?: boolean
}

export interface UpdateProjectTypeData {
  name?: string
  description?: string | null
  color?: string
  isActive?: boolean
}

export const useProjectTypesStore = defineStore('projectTypes', {
  state: () => ({
    projectTypes: [] as ProjectType[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    getAllProjectTypes: state => state.projectTypes,
    getActiveProjectTypes: state => state.projectTypes.filter(pt => pt.isActive),
    getProjectTypeById: state => (idOrUuid: string) =>
      state.projectTypes.find(pt => pt.id.toString() === idOrUuid || pt.uuid === idOrUuid),
  },

  actions: {
    async fetchProjectTypes() {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<{ data: ProjectType[] }>('/api/project-types', {
          credentials: 'include',
        })
        this.projectTypes = response.data ?? []
      }
      catch (e: unknown) {
        const fetchError = e as { data?: { statusMessage?: string }, message?: string }
        this.error = fetchError?.data?.statusMessage || fetchError?.message || 'Failed to fetch project types'
        throw e
      }
      finally {
        this.loading = false
      }
    },

    async createProjectType(payload: CreateProjectTypeData) {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<{ data: ProjectType }>('/api/project-types', {
          method: 'POST',
          body: payload,
          credentials: 'include',
        })
        if (response.data) {
          this.projectTypes.unshift(response.data)
        }
        return response.data
      }
      catch (e: unknown) {
        const fetchError = e as { data?: { statusMessage?: string }, message?: string }
        this.error = fetchError?.data?.statusMessage || fetchError?.message || 'Failed to create project type'
        throw e
      }
      finally {
        this.loading = false
      }
    },

    async updateProjectType(id: string, payload: UpdateProjectTypeData) {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<{ data: ProjectType }>(`/api/project-types/${id}`, {
          method: 'PUT',
          body: payload,
          credentials: 'include',
        })
        if (response.data) {
          const index = this.projectTypes.findIndex(pt => pt.id.toString() === id)
          if (index !== -1) {
            this.projectTypes[index] = response.data
          }
        }
        return response.data
      }
      catch (e: unknown) {
        const fetchError = e as { data?: { statusMessage?: string }, message?: string }
        this.error = fetchError?.data?.statusMessage || fetchError?.message || 'Failed to update project type'
        throw e
      }
      finally {
        this.loading = false
      }
    },

    async deleteProjectType(id: string) {
      this.loading = true
      this.error = null
      try {
        await $fetch(`/api/project-types/${id}`, {
          method: 'DELETE',
          credentials: 'include',
        })
        this.projectTypes = this.projectTypes.filter(pt => pt.id.toString() !== id)
      }
      catch (e: unknown) {
        const fetchError = e as { data?: { statusMessage?: string }, message?: string }
        this.error = fetchError?.data?.statusMessage || fetchError?.message || 'Failed to delete project type'
        throw e
      }
      finally {
        this.loading = false
      }
    },
  },
})
