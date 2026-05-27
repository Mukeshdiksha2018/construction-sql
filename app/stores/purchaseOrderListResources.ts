import { defineStore } from 'pinia'

export const usePurchaseOrderListResourcesStore = defineStore('purchaseOrderListResources', {
  state: () => ({
    currentProjectUuid: null as string | null,
    currentCorporationUuid: null as string | null,
  }),
})
