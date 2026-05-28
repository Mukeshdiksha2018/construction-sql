import { defineStore } from 'pinia'

export interface AppSettings {
  uuid: string
  po_print_approved_by_vendor: boolean
  po_use_entity_name: boolean
  is_active: boolean
  created_at?: string
  updated_at?: string
}

/**
 * Corporation settings store — stubbed with safe defaults.
 * The /api/corporation-settings endpoint is not implemented; all settings
 * fall back to their default values (false / disabled).
 */
export const useAppSettingsStore = defineStore('appSettings', {
  state: () => ({
    settings: null as AppSettings | null,
    loading: false as boolean,
    error: null as string | null,
  }),
  getters: {
    poPrintApprovedByVendor: (_state): boolean => false,
    poUseEntityName: (_state): boolean => false,
  },
  actions: {
    async fetchSettings() {
      // No-op: corporation-settings not implemented; defaults used.
    },
    async updateSettings(_updates: Partial<Pick<AppSettings, 'po_print_approved_by_vendor' | 'po_use_entity_name'>>) {
      // No-op: corporation-settings not implemented.
    },
  },
})
