import { defineStore } from 'pinia'

export interface Freight {
  id: number
  uuid: string
  freight_name: string
  description: string | null
  active: boolean
  created_at: string
  updated_at: string
  created_by?: string | null
  updated_by?: string | null
}

export interface CreateFreightData {
  freight_name: string
  description?: string | null
  active?: boolean
}

export interface UpdateFreightData {
  freight_name: string
  description?: string | null
  active: boolean
}

export const useFreightStore = defineStore('freight', {
  state: () => ({
    freight: [] as Freight[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    getAllFreight: state => state.freight,
    getActiveFreight: state => state.freight.filter(f => f.active),
    getFreightByUuid: state => (uuid: string) =>
      state.freight.find(f => f.uuid === uuid),
  },

  actions: {
    async fetchFreight() {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<{ data: Freight[] }>('/api/freight', {
          credentials: 'include',
        })
        this.freight = response.data ?? []
      }
      catch (e: unknown) {
        const fetchError = e as { data?: { statusMessage?: string }, message?: string }
        this.error
          = fetchError?.data?.statusMessage
            || fetchError?.message
            || 'Failed to fetch freight'
        throw e
      }
      finally {
        this.loading = false
      }
    },

    async createFreight(payload: CreateFreightData) {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<{ data: Freight }>('/api/freight', {
          method: 'POST',
          body: payload,
          credentials: 'include',
        })
        if (response.data) {
          this.freight.unshift(response.data)
        }
        return response.data
      }
      catch (e: unknown) {
        const fetchError = e as { data?: { statusMessage?: string }, message?: string }
        this.error
          = fetchError?.data?.statusMessage
            || fetchError?.message
            || 'Failed to create freight'
        throw e
      }
      finally {
        this.loading = false
      }
    },

    async updateFreight(uuid: string, payload: UpdateFreightData) {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<{ data: Freight }>(`/api/freight/${uuid}`, {
          method: 'PUT',
          body: payload,
          credentials: 'include',
        })
        if (response.data) {
          const idx = this.freight.findIndex(f => f.uuid === uuid)
          if (idx !== -1) {
            this.freight[idx] = response.data
          }
        }
        return response.data
      }
      catch (e: unknown) {
        const fetchError = e as { data?: { statusMessage?: string }, message?: string }
        this.error
          = fetchError?.data?.statusMessage
            || fetchError?.message
            || 'Failed to update freight'
        throw e
      }
      finally {
        this.loading = false
      }
    },

    async deleteFreight(uuid: string) {
      this.loading = true
      this.error = null
      try {
        await $fetch(`/api/freight/${uuid}`, {
          method: 'DELETE',
          credentials: 'include',
        })
        this.freight = this.freight.filter(f => f.uuid !== uuid)
      }
      catch (e: unknown) {
        const fetchError = e as { data?: { statusMessage?: string }, message?: string }
        this.error
          = fetchError?.data?.statusMessage
            || fetchError?.message
            || 'Failed to delete freight'
        throw e
      }
      finally {
        this.loading = false
      }
    },

    clearFreight() {
      this.freight = []
      this.error = null
    },
  },
})
