import { defineStore } from 'pinia'

export const useCostCodeDivisionsStore = defineStore('costCodeDivisions', {
  state: () => ({
    divisions: [] as any[],
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async fetchDivisions(_corporationUuid?: string) {
      this.divisions = []
    },
    clear() {
      this.divisions = []
    },
  },
})
