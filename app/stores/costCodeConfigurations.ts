import { defineStore } from 'pinia'

export const useCostCodeConfigurationsStore = defineStore('costCodeConfigurations', {
  state: () => ({
    configurations: [] as any[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    getActiveConfigurations: (state) => (_corporationUuid?: string) =>
      state.configurations.filter((c: any) => c.is_active !== false),
    getConfigurationsByCorporation: (state) => (_corporationUuid?: string) =>
      state.configurations,
    getConfigurationById: (state) => (uuid: string) =>
      state.configurations.find((c: any) => c.uuid === uuid),
    getConfigurationCountByCorporation: (_state) => (_corporationUuid?: string) => 0,
  },

  actions: {
    async fetchConfigurations(_corporationUuid?: string) {
      this.configurations = []
    },
    clear() {
      this.configurations = []
    },
  },
})
