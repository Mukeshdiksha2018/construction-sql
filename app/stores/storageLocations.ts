import { defineStore } from 'pinia'

export const useStorageLocationsStore = defineStore('storageLocations', {
  state: () => ({
    storageLocations: [] as any[],
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async fetchStorageLocations(_corporationUuid?: string, _force?: boolean, _useApi?: boolean) {
      this.storageLocations = []
    },
    clear() {
      this.storageLocations = []
    },
  },
})
