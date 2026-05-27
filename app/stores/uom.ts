import { defineStore } from 'pinia'

export const useUOMStore = defineStore('uom', {
  state: () => ({
    uom: [] as any[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    getActiveUOM: (state) => (_corp?: string) => state.uom.filter((u: any) => u.status === 'ACTIVE'),
  },

  actions: {
    async fetchUOM(_corporationUuid?: string, _forceApi?: boolean) {
      this.uom = []
    },
    async createUOM(_corporationUuid: string | null, _payload: any) {
      return null
    },
    async createUOMViaNimble(_payload: any) {
      return null
    },
    clear() {
      this.uom = []
    },
  },
})
