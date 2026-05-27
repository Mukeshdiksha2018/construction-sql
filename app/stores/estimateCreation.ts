import { defineStore } from 'pinia'

export const useEstimateCreationStore = defineStore('estimateCreation', {
  state: () => ({
    currentEstimate: null as any,
  }),

  getters: {
    currentProjectUuid: (_state) => null as string | null,
    currentCorporationUuid: (_state) => null as string | null,
    currentSubcontractorUuid: (_state) => null as string | null,
  },
})
