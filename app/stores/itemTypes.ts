import { defineStore } from 'pinia'

export const useItemTypesStore = defineStore('itemTypes', {
  state: () => ({
    itemTypes: [] as any[],
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async fetchItemTypes(_corporationUuid?: string) {
      this.itemTypes = []
    },
    clear() {
      this.itemTypes = []
    },
  },
})
