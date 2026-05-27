import { defineStore } from 'pinia'

export interface Corporation {
  id: string
  profitCenterId: string | null
  name: string
  legalName: string
  sortOrder: number
  propertyType: number
  strId: number
}

export const useCorporationStore = defineStore('corporation', {
  state: () => ({
    corporations: [] as Corporation[],
    selectedCorporationId: null as string | null,
    loading: false,
    errorMessage: '',
    loaded: false,
  }),

  getters: {
    selectedCorporation(state): Corporation | undefined {
      return state.corporations.find(c => c.id === state.selectedCorporationId)
    },
    hasCorporations: state => state.corporations.length > 0,
  },

  actions: {
    setSelectedCorporation(id: string | null) {
      this.selectedCorporationId = id
    },

    clear() {
      this.corporations = []
      this.selectedCorporationId = null
      this.loading = false
      this.errorMessage = ''
      this.loaded = false
    },

    async fetchCorporations(options: { isShowAll?: boolean, force?: boolean } = {}) {
      const { isShowAll = false, force = false } = options

      if (this.loading) return
      if (!force && this.loaded && this.corporations.length > 0) return

      this.loading = true
      this.errorMessage = ''

      try {
        const data = await $fetch<{ corporations: Corporation[] }>('/api/nimble/corporations', {
          query: { IsShowAll: isShowAll },
          credentials: 'include',
        })

        this.corporations = data.corporations ?? []
        this.loaded = true

        if (
          this.selectedCorporationId
          && !this.corporations.some(c => c.id === this.selectedCorporationId)
        ) {
          this.selectedCorporationId = null
        }
      }
      catch (err: unknown) {
        const fetchError = err as { data?: { statusMessage?: string }, message?: string }
        this.errorMessage
          = fetchError?.data?.statusMessage
            || fetchError?.message
            || 'Failed to fetch corporations'
        throw err
      }
      finally {
        this.loading = false
      }
    },
  },

  persist: {
    pick: ['corporations', 'selectedCorporationId', 'loaded'],
  },
})
