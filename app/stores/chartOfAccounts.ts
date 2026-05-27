import { defineStore } from 'pinia'

export const useChartOfAccountsStore = defineStore('chartOfAccounts', {
  state: () => ({
    accounts: [] as any[],
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async fetchAccounts(_corporationUuid?: string) {
      this.accounts = []
    },
    clear() {
      this.accounts = []
    },
  },
})
