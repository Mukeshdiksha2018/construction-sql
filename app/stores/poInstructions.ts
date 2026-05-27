import { defineStore } from 'pinia'

export type POInstructionStatus = 'ACTIVE' | 'INACTIVE'

export interface POInstruction {
  id: number
  uuid: string
  corporation_uuid: string
  po_instruction_name: string
  instruction: string
  status: POInstructionStatus
  created_at: string
  updated_at: string
  created_by?: string | null
  updated_by?: string | null
}

export interface CreatePOInstructionData {
  corporation_uuid: string
  po_instruction_name: string
  instruction: string
  status?: POInstructionStatus
}

export interface UpdatePOInstructionData {
  po_instruction_name: string
  instruction: string
  status: POInstructionStatus
}

export const usePOInstructionsStore = defineStore('poInstructions', {
  state: () => ({
    poInstructions: [] as POInstruction[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    getPOInstructionsByCorporation: state => (corporationUuid: string) =>
      state.poInstructions.filter(po => po.corporation_uuid === corporationUuid),
    getActivePOInstructions: state => (corporationUuid: string) =>
      state.poInstructions.filter(
        po => po.corporation_uuid === corporationUuid && po.status === 'ACTIVE',
      ),
    getPOInstructionByUuid: state => (uuid: string) =>
      state.poInstructions.find(po => po.uuid === uuid),
  },

  actions: {
    async fetchPOInstructions(corporationUuid: string) {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<{ data: POInstruction[] }>('/api/po-instructions', {
          query: { corporation_uuid: corporationUuid },
          credentials: 'include',
        })
        const list = response.data ?? []

        this.poInstructions = this.poInstructions.filter(
          po => po.corporation_uuid !== corporationUuid,
        )
        this.poInstructions.push(...list)
      }
      catch (e: unknown) {
        const fetchError = e as { data?: { statusMessage?: string }, message?: string }
        this.error
          = fetchError?.data?.statusMessage
            || fetchError?.message
            || 'Failed to fetch PO instructions'
        throw e
      }
      finally {
        this.loading = false
      }
    },

    async createPOInstruction(
      corporationUuid: string,
      payload: CreatePOInstructionData,
    ) {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<{ data: POInstruction }>('/api/po-instructions', {
          method: 'POST',
          body: {
            corporation_uuid: corporationUuid,
            ...payload,
          },
          credentials: 'include',
        })
        if (response.data) {
          this.poInstructions.unshift(response.data)
        }
        return response.data
      }
      catch (e: unknown) {
        const fetchError = e as { data?: { statusMessage?: string }, message?: string }
        this.error
          = fetchError?.data?.statusMessage
            || fetchError?.message
            || 'Failed to create PO instruction'
        throw e
      }
      finally {
        this.loading = false
      }
    },

    async updatePOInstruction(uuid: string, payload: UpdatePOInstructionData) {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<{ data: POInstruction }>(`/api/po-instructions/${uuid}`, {
          method: 'PUT',
          body: payload,
          credentials: 'include',
        })
        if (response.data) {
          const idx = this.poInstructions.findIndex(po => po.uuid === uuid)
          if (idx !== -1) {
            this.poInstructions[idx] = response.data
          }
        }
        return response.data
      }
      catch (e: unknown) {
        const fetchError = e as { data?: { statusMessage?: string }, message?: string }
        this.error
          = fetchError?.data?.statusMessage
            || fetchError?.message
            || 'Failed to update PO instruction'
        throw e
      }
      finally {
        this.loading = false
      }
    },

    async deletePOInstruction(uuid: string) {
      this.loading = true
      this.error = null
      try {
        await $fetch(`/api/po-instructions/${uuid}`, {
          method: 'DELETE',
          credentials: 'include',
        })
        this.poInstructions = this.poInstructions.filter(po => po.uuid !== uuid)
      }
      catch (e: unknown) {
        const fetchError = e as { data?: { statusMessage?: string }, message?: string }
        this.error
          = fetchError?.data?.statusMessage
            || fetchError?.message
            || 'Failed to delete PO instruction'
        throw e
      }
      finally {
        this.loading = false
      }
    },

    clearPOInstructions() {
      this.poInstructions = []
      this.error = null
    },
  },
})
