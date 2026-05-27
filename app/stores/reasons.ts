import { defineStore } from 'pinia'

export interface Reason {
  id: number
  uuid: string
  reason: string
  active: boolean
  created_at: string
  updated_at: string
  created_by?: string | null
  updated_by?: string | null
}

export interface CreateReasonData {
  reason: string
  active?: boolean
}

export interface UpdateReasonData {
  reason: string
  active: boolean
}

export const useReasonsStore = defineStore('reasons', {
  state: () => ({
    reasons: [] as Reason[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    getAll: state => state.reasons,
    getActive: state => state.reasons.filter(r => r.active),
    getByUuid: state => (uuid: string) =>
      state.reasons.find(r => r.uuid === uuid),
  },

  actions: {
    async fetchReasons() {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<{ data: Reason[] }>('/api/reasons', {
          credentials: 'include',
        })
        this.reasons = response.data ?? []
      }
      catch (e: unknown) {
        const fetchError = e as { data?: { statusMessage?: string }, message?: string }
        this.error
          = fetchError?.data?.statusMessage
            || fetchError?.message
            || 'Failed to fetch reasons'
        throw e
      }
      finally {
        this.loading = false
      }
    },

    async createReason(payload: CreateReasonData) {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<{ data: Reason }>('/api/reasons', {
          method: 'POST',
          body: payload,
          credentials: 'include',
        })
        if (response.data) {
          this.reasons.unshift(response.data)
        }
        return response.data
      }
      catch (e: unknown) {
        const fetchError = e as { data?: { statusMessage?: string }, message?: string }
        this.error
          = fetchError?.data?.statusMessage
            || fetchError?.message
            || 'Failed to create reason'
        throw e
      }
      finally {
        this.loading = false
      }
    },

    async updateReason(uuid: string, payload: UpdateReasonData) {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<{ data: Reason }>(`/api/reasons/${uuid}`, {
          method: 'PUT',
          body: payload,
          credentials: 'include',
        })
        if (response.data) {
          const idx = this.reasons.findIndex(r => r.uuid === uuid)
          if (idx !== -1) {
            this.reasons[idx] = response.data
          }
        }
        return response.data
      }
      catch (e: unknown) {
        const fetchError = e as { data?: { statusMessage?: string }, message?: string }
        this.error
          = fetchError?.data?.statusMessage
            || fetchError?.message
            || 'Failed to update reason'
        throw e
      }
      finally {
        this.loading = false
      }
    },

    async deleteReason(uuid: string) {
      this.loading = true
      this.error = null
      try {
        await $fetch(`/api/reasons/${uuid}`, {
          method: 'DELETE',
          credentials: 'include',
        })
        this.reasons = this.reasons.filter(r => r.uuid !== uuid)
      }
      catch (e: unknown) {
        const fetchError = e as { data?: { statusMessage?: string }, message?: string }
        this.error
          = fetchError?.data?.statusMessage
            || fetchError?.message
            || 'Failed to delete reason'
        throw e
      }
      finally {
        this.loading = false
      }
    },

    clearReasons() {
      this.reasons = []
      this.error = null
    },
  },
})
