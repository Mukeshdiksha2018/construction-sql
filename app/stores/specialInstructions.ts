import { defineStore } from 'pinia'

export interface SpecialInstruction {
  uuid: string
  name: string
  content?: string | null
  isActive?: boolean
  project_uuid?: string | null
  project_name?: string | null
  project_id?: string | null
  corporation_uuid?: string | null
}

export const useSpecialInstructionsStore = defineStore('specialInstructions', {
  state: () => ({
    items: [] as SpecialInstruction[],
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async fetchList(_params?: { corporation_uuid?: string; project_uuid?: string }) {
      this.items = []
    },
    clearItems() {
      this.items = []
    },
  },
})
