import { defineStore } from 'pinia'

export interface Estimate {
  id?: string | number
  uuid: string
  project_uuid: string
  corporation_uuid: string
  estimate_date?: string | null
  status?: string | null
  final_amount?: number | null
  notes?: string | null
  created_at?: string
  updated_at?: string
}

export const useEstimatesStore = defineStore('estimates', {
  state: () => ({
    estimates: [] as Estimate[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    getEstimatesByProject: (state) => (projectId: string): Estimate[] => {
      if (!projectId) return []
      return state.estimates.filter(e => e.project_uuid === projectId || e.uuid === projectId)
    },
  },

  actions: {
    async fetchEstimates(corporationUuid: string) {
      if (!corporationUuid) return
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<{ data: Estimate[] }>('/api/estimates', {
          query: { corporation_uuid: corporationUuid },
          credentials: 'include',
        })
        this.estimates = response?.data ?? []
      } catch (e: any) {
        this.error = e?.data?.statusMessage || e?.message || 'Failed to fetch estimates'
        this.estimates = []
      } finally {
        this.loading = false
      }
    },

    clear() {
      this.estimates = []
    },
  },
})
