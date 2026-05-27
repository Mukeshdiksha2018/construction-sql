import { defineStore } from 'pinia'

export interface ServiceType {
  id: number
  uuid: string
  name: string
  description: string | null
  color: string
  isActive: boolean
  created_at: string
  updated_at: string
}

export interface CreateServiceTypeData {
  name: string
  description?: string | null
  color?: string
  isActive?: boolean
}

export interface UpdateServiceTypeData {
  name?: string
  description?: string | null
  color?: string
  isActive?: boolean
}

export const useServiceTypesStore = defineStore('serviceTypes', {
  state: () => ({
    serviceTypes: [] as ServiceType[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    getAllServiceTypes: state => state.serviceTypes,
    getActiveServiceTypes: state => state.serviceTypes.filter(st => st.isActive),
    getServiceTypeById: state => (idOrUuid: string) =>
      state.serviceTypes.find(st => st.id.toString() === idOrUuid || st.uuid === idOrUuid),
  },

  actions: {
    async fetchServiceTypes() {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<{ data: ServiceType[] }>('/api/service-types', {
          credentials: 'include',
        })
        this.serviceTypes = response.data ?? []
      }
      catch (e: unknown) {
        const fetchError = e as { data?: { statusMessage?: string }, message?: string }
        this.error = fetchError?.data?.statusMessage || fetchError?.message || 'Failed to fetch service types'
        throw e
      }
      finally {
        this.loading = false
      }
    },

    async createServiceType(payload: CreateServiceTypeData) {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<{ data: ServiceType }>('/api/service-types', {
          method: 'POST',
          body: payload,
          credentials: 'include',
        })
        if (response.data) {
          this.serviceTypes.unshift(response.data)
        }
        return response.data
      }
      catch (e: unknown) {
        const fetchError = e as { data?: { statusMessage?: string }, message?: string }
        this.error = fetchError?.data?.statusMessage || fetchError?.message || 'Failed to create service type'
        throw e
      }
      finally {
        this.loading = false
      }
    },

    async updateServiceType(id: string, payload: UpdateServiceTypeData) {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<{ data: ServiceType }>(`/api/service-types/${id}`, {
          method: 'PUT',
          body: payload,
          credentials: 'include',
        })
        if (response.data) {
          const index = this.serviceTypes.findIndex(st => st.id.toString() === id)
          if (index !== -1) {
            this.serviceTypes[index] = response.data
          }
        }
        return response.data
      }
      catch (e: unknown) {
        const fetchError = e as { data?: { statusMessage?: string }, message?: string }
        this.error = fetchError?.data?.statusMessage || fetchError?.message || 'Failed to update service type'
        throw e
      }
      finally {
        this.loading = false
      }
    },

    async deleteServiceType(id: string) {
      this.loading = true
      this.error = null
      try {
        await $fetch(`/api/service-types/${id}`, {
          method: 'DELETE',
          credentials: 'include',
        })
        this.serviceTypes = this.serviceTypes.filter(st => st.id.toString() !== id)
      }
      catch (e: unknown) {
        const fetchError = e as { data?: { statusMessage?: string }, message?: string }
        this.error = fetchError?.data?.statusMessage || fetchError?.message || 'Failed to delete service type'
        throw e
      }
      finally {
        this.loading = false
      }
    },
  },
})
