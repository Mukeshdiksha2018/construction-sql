import { defineStore } from 'pinia'

export const usePurchaseOrdersStore = defineStore('purchaseOrders', {
  state: () => ({
    purchaseOrders: [] as any[],
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async fetchPurchaseOrders(_corporationUuid?: string) {
      this.purchaseOrders = []
    },
    clear() {
      this.purchaseOrders = []
    },
  },
})
