import { defineStore } from 'pinia'

export interface Vendor {
  uuid: string
  vendor_name: string
  corporation_uuid?: string | null
  is_active?: boolean
}

export const useVendorStore = defineStore('vendors', {
  state: () => ({
    vendors: [] as Vendor[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    getActive: (state) => state.vendors.filter(v => v.is_active !== false),
  },

  actions: {
    async fetchVendors(_corporationUuid?: string) {
      this.vendors = []
    },
    clear() {
      this.vendors = []
    },
  },
})
