import { defineStore } from 'pinia'

export const useChangeOrdersStore = defineStore('changeOrders', {
  state: () => ({
    changeOrders: [] as any[],
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async fetchChangeOrders(_corporationUuid?: string) {
      this.changeOrders = []
    },
    clear() {
      this.changeOrders = []
    },
  },
})
