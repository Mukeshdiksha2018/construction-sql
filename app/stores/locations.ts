import { defineStore } from 'pinia'

export interface Location {
  id: number
  uuid: string
  location_name: string
  location_code: string | null
  description: string | null
  active: boolean
  created_at: string
  updated_at: string
  created_by?: string | null
  updated_by?: string | null
}

export interface CreateLocationData {
  location_name: string
  location_code?: string | null
  description?: string | null
  active?: boolean
}

export interface UpdateLocationData {
  location_name: string
  location_code?: string | null
  description?: string | null
  active: boolean
}

export const useLocationsStore = defineStore('locations', {
  state: () => ({
    locations: [] as Location[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    getAll: state => state.locations,
    getActive: state => state.locations.filter(l => l.active),
    getByUuid: state => (uuid: string) =>
      state.locations.find(l => l.uuid === uuid),
  },

  actions: {
    async fetchLocations(_force?: boolean) {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<{ data: Location[] }>('/api/location', {
          credentials: 'include',
        })
        this.locations = response.data ?? []
      }
      catch (e: unknown) {
        const fetchError = e as { data?: { statusMessage?: string }, message?: string }
        this.error
          = fetchError?.data?.statusMessage
            || fetchError?.message
            || 'Failed to fetch locations'
        throw e
      }
      finally {
        this.loading = false
      }
    },

    async createLocation(payload: CreateLocationData) {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<{ data: Location }>('/api/location', {
          method: 'POST',
          body: payload,
          credentials: 'include',
        })
        if (response.data) {
          this.locations.unshift(response.data)
        }
        return response.data
      }
      catch (e: unknown) {
        const fetchError = e as { data?: { statusMessage?: string }, message?: string }
        this.error
          = fetchError?.data?.statusMessage
            || fetchError?.message
            || 'Failed to create location'
        throw e
      }
      finally {
        this.loading = false
      }
    },

    async updateLocation(uuid: string, payload: UpdateLocationData) {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<{ data: Location }>(`/api/location/${uuid}`, {
          method: 'PUT',
          body: payload,
          credentials: 'include',
        })
        if (response.data) {
          const idx = this.locations.findIndex(l => l.uuid === uuid)
          if (idx !== -1) {
            this.locations[idx] = response.data
          }
        }
        return response.data
      }
      catch (e: unknown) {
        const fetchError = e as { data?: { statusMessage?: string }, message?: string }
        this.error
          = fetchError?.data?.statusMessage
            || fetchError?.message
            || 'Failed to update location'
        throw e
      }
      finally {
        this.loading = false
      }
    },

    async deleteLocation(uuid: string) {
      this.loading = true
      this.error = null
      try {
        await $fetch(`/api/location/${uuid}`, {
          method: 'DELETE',
          credentials: 'include',
        })
        this.locations = this.locations.filter(l => l.uuid !== uuid)
      }
      catch (e: unknown) {
        const fetchError = e as { data?: { statusMessage?: string }, message?: string }
        this.error
          = fetchError?.data?.statusMessage
            || fetchError?.message
            || 'Failed to delete location'
        throw e
      }
      finally {
        this.loading = false
      }
    },

    clearLocations() {
      this.locations = []
      this.error = null
    },
  },
})
