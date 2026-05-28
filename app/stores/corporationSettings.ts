import { defineStore } from 'pinia'

export interface AppSettings {
  uuid: string
  po_print_approved_by_vendor: boolean
  po_use_entity_name: boolean
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export const useAppSettingsStore = defineStore('appSettings', {
  state: () => ({
    settings: null as AppSettings | null,
    loading: false as boolean,
    error: null as string | null,
  }),
  getters: {
    poPrintApprovedByVendor: (state): boolean => state.settings?.po_print_approved_by_vendor ?? false,
    poUseEntityName: (state): boolean => state.settings?.po_use_entity_name ?? false,
  },
  actions: {
    async fetchSettings() {
      this.loading = true
      this.error = null
      try {
        const response: any = await $fetch('/api/corporation-settings', { method: 'GET' })
        this.settings = response?.data || null
      } catch (err: any) {
        this.error = err.message || 'Failed to fetch settings'
      } finally {
        this.loading = false
      }
    },

    async updateSettings(updates: Partial<Pick<AppSettings, 'po_print_approved_by_vendor' | 'po_use_entity_name'>>) {
      this.loading = true
      this.error = null
      try {
        const response: any = await $fetch('/api/corporation-settings', { method: 'POST', body: updates })
        const saved = response?.data
        if (saved) this.settings = saved
        return saved
      } catch (err: any) {
        this.error = err.message || 'Failed to save settings'
        throw err
      } finally {
        this.loading = false
      }
    },
  },
})
