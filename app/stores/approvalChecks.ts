import { defineStore } from 'pinia'

export interface ApprovalCheck {
  id: number
  uuid: string
  approval_check: string
  description: string | null
  active: boolean
  created_at: string
  updated_at: string
  created_by?: string | null
  updated_by?: string | null
}

export interface CreateApprovalCheckData {
  approval_check: string
  description?: string | null
  active?: boolean
}

export interface UpdateApprovalCheckData {
  approval_check: string
  description?: string | null
  active: boolean
}

export const useApprovalChecksStore = defineStore('approvalChecks', {
  state: () => ({
    approvalChecks: [] as ApprovalCheck[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    getAllApprovalChecks: state => state.approvalChecks,
    getActiveApprovalChecks: state => state.approvalChecks.filter(f => f.active),
    getApprovalCheckByUuid: state => (uuid: string) =>
      state.approvalChecks.find(f => f.uuid === uuid),
  },

  actions: {
    async fetchApprovalChecks() {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<{ data: ApprovalCheck[] }>('/api/approval-checks', {
          credentials: 'include',
        })
        this.approvalChecks = response.data ?? []
      }
      catch (e: unknown) {
        const fetchError = e as { data?: { statusMessage?: string }, message?: string }
        this.error
          = fetchError?.data?.statusMessage
            || fetchError?.message
            || 'Failed to fetch approval checks'
        throw e
      }
      finally {
        this.loading = false
      }
    },

    async createApprovalCheck(payload: CreateApprovalCheckData) {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<{ data: ApprovalCheck }>('/api/approval-checks', {
          method: 'POST',
          body: payload,
          credentials: 'include',
        })
        if (response.data) {
          this.approvalChecks.unshift(response.data)
        }
        return response.data
      }
      catch (e: unknown) {
        const fetchError = e as { data?: { statusMessage?: string }, message?: string }
        this.error
          = fetchError?.data?.statusMessage
            || fetchError?.message
            || 'Failed to create approval check'
        throw e
      }
      finally {
        this.loading = false
      }
    },

    async updateApprovalCheck(uuid: string, payload: UpdateApprovalCheckData) {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<{ data: ApprovalCheck }>(`/api/approval-checks/${uuid}`, {
          method: 'PUT',
          body: payload,
          credentials: 'include',
        })
        if (response.data) {
          const idx = this.approvalChecks.findIndex(f => f.uuid === uuid)
          if (idx !== -1) {
            this.approvalChecks[idx] = response.data
          }
        }
        return response.data
      }
      catch (e: unknown) {
        const fetchError = e as { data?: { statusMessage?: string }, message?: string }
        this.error
          = fetchError?.data?.statusMessage
            || fetchError?.message
            || 'Failed to update approval check'
        throw e
      }
      finally {
        this.loading = false
      }
    },

    async deleteApprovalCheck(uuid: string) {
      this.loading = true
      this.error = null
      try {
        await $fetch(`/api/approval-checks/${uuid}`, {
          method: 'DELETE',
          credentials: 'include',
        })
        this.approvalChecks = this.approvalChecks.filter(f => f.uuid !== uuid)
      }
      catch (e: unknown) {
        const fetchError = e as { data?: { statusMessage?: string }, message?: string }
        this.error
          = fetchError?.data?.statusMessage
            || fetchError?.message
            || 'Failed to delete approval check'
        throw e
      }
      finally {
        this.loading = false
      }
    },

    clearApprovalChecks() {
      this.approvalChecks = []
      this.error = null
    },
  },
})
