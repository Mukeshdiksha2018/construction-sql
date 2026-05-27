import { defineStore } from 'pinia'

export interface TermsAndCondition {
  id: number
  uuid: string
  name: string
  content: string
  isActive: boolean
  created_at: string
  updated_at: string
}

export interface CreateTermsAndConditionData {
  name: string
  content: string
  isActive?: boolean
}

export interface UpdateTermsAndConditionData {
  name?: string
  content?: string
  isActive?: boolean
}

export const useTermsAndConditionsStore = defineStore('termsAndConditions', {
  state: () => ({
    termsAndConditions: [] as TermsAndCondition[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    getAllTermsAndConditions: state => state.termsAndConditions,
    getActiveTermsAndConditions: state => state.termsAndConditions.filter(tc => tc.isActive),
    getTermsAndConditionById: state => (idOrUuid: string) =>
      state.termsAndConditions.find(tc => tc.id.toString() === idOrUuid || tc.uuid === idOrUuid),
  },

  actions: {
    async fetchTermsAndConditions() {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<{ data: TermsAndCondition[] }>('/api/terms-and-conditions', {
          credentials: 'include',
        })
        this.termsAndConditions = response.data ?? []
      }
      catch (e: unknown) {
        const fetchError = e as { data?: { statusMessage?: string }, message?: string }
        this.error = fetchError?.data?.statusMessage || fetchError?.message || 'Failed to fetch terms and conditions'
        throw e
      }
      finally {
        this.loading = false
      }
    },

    async createTermsAndCondition(payload: CreateTermsAndConditionData) {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<{ data: TermsAndCondition }>('/api/terms-and-conditions', {
          method: 'POST',
          body: payload,
          credentials: 'include',
        })
        if (response.data) {
          this.termsAndConditions.unshift(response.data)
        }
        return response.data
      }
      catch (e: unknown) {
        const fetchError = e as { data?: { statusMessage?: string }, message?: string }
        this.error = fetchError?.data?.statusMessage || fetchError?.message || 'Failed to create terms and condition'
        throw e
      }
      finally {
        this.loading = false
      }
    },

    async updateTermsAndCondition(id: string, payload: UpdateTermsAndConditionData) {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<{ data: TermsAndCondition }>(`/api/terms-and-conditions/${id}`, {
          method: 'PUT',
          body: payload,
          credentials: 'include',
        })
        if (response.data) {
          const index = this.termsAndConditions.findIndex(tc => tc.id.toString() === id)
          if (index !== -1) {
            this.termsAndConditions[index] = response.data
          }
        }
        return response.data
      }
      catch (e: unknown) {
        const fetchError = e as { data?: { statusMessage?: string }, message?: string }
        this.error = fetchError?.data?.statusMessage || fetchError?.message || 'Failed to update terms and condition'
        throw e
      }
      finally {
        this.loading = false
      }
    },

    async deleteTermsAndCondition(id: string) {
      this.loading = true
      this.error = null
      try {
        await $fetch(`/api/terms-and-conditions/${id}`, {
          method: 'DELETE',
          credentials: 'include',
        })
        this.termsAndConditions = this.termsAndConditions.filter(tc => tc.id.toString() !== id)
      }
      catch (e: unknown) {
        const fetchError = e as { data?: { statusMessage?: string }, message?: string }
        this.error = fetchError?.data?.statusMessage || fetchError?.message || 'Failed to delete terms and condition'
        throw e
      }
      finally {
        this.loading = false
      }
    },
  },
})
