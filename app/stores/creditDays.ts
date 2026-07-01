import { defineStore } from 'pinia'

export interface NimbleCreditDays {
  credit_days_id: string
  name: string
  interval_days: number
  status: 0 | 1 | 3
  status_label: 'inactive' | 'active' | 'deleted'
  client_id: string | null
  is_default: boolean | null
}

export interface CreditDaysFormInput {
  name: string
  interval_days: number
  active: boolean
}

function toPayload(input: CreditDaysFormInput) {
  return {
    name: input.name.trim(),
    interval_days: input.interval_days,
    active: input.active,
  }
}

export const useCreditDaysStore = defineStore('creditDays', {
  state: () => ({
    items: [] as NimbleCreditDays[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    getAll: state => state.items,
    getActive: state => state.items.filter(item => item.status === 1),
    getById: state => (id: string) =>
      state.items.find(item => item.credit_days_id.toLowerCase() === id.toLowerCase()),
  },

  actions: {
    async fetchCreditDays(includeDeleted = false) {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<{ credit_days: NimbleCreditDays[] }>('/api/nimble-credit-days', {
          credentials: 'include',
          query: includeDeleted ? { include_deleted: 'true' } : undefined,
        })
        this.items = response.credit_days ?? []
      }
      catch (e: unknown) {
        const fetchError = e as { data?: { statusMessage?: string }, message?: string }
        this.error
          = fetchError?.data?.statusMessage
            || fetchError?.message
            || 'Failed to fetch credit days'
        throw e
      }
      finally {
        this.loading = false
      }
    },

    async createCreditDays(input: CreditDaysFormInput) {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<{ credit_days: NimbleCreditDays }>('/api/nimble-credit-days', {
          method: 'POST',
          body: toPayload(input),
          credentials: 'include',
        })
        if (response.credit_days) {
          this.items.unshift(response.credit_days)
        }
        return response.credit_days
      }
      catch (e: unknown) {
        const fetchError = e as { data?: { statusMessage?: string }, message?: string }
        this.error
          = fetchError?.data?.statusMessage
            || fetchError?.message
            || 'Failed to create credit days'
        throw e
      }
      finally {
        this.loading = false
      }
    },

    async updateCreditDays(id: string, input: CreditDaysFormInput) {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<{ credit_days: NimbleCreditDays }>(`/api/nimble-credit-days/${id}`, {
          method: 'PUT',
          body: toPayload(input),
          credentials: 'include',
        })
        if (response.credit_days) {
          const idx = this.items.findIndex(
            item => item.credit_days_id.toLowerCase() === id.toLowerCase(),
          )
          if (idx !== -1) {
            this.items[idx] = response.credit_days
          }
        }
        return response.credit_days
      }
      catch (e: unknown) {
        const fetchError = e as { data?: { statusMessage?: string }, message?: string }
        this.error
          = fetchError?.data?.statusMessage
            || fetchError?.message
            || 'Failed to update credit days'
        throw e
      }
      finally {
        this.loading = false
      }
    },

    async deleteCreditDays(id: string) {
      this.loading = true
      this.error = null
      try {
        await $fetch(`/api/nimble-credit-days/${id}`, {
          method: 'DELETE',
          credentials: 'include',
        })
        this.items = this.items.filter(
          item => item.credit_days_id.toLowerCase() !== id.toLowerCase(),
        )
      }
      catch (e: unknown) {
        const fetchError = e as { data?: { statusMessage?: string }, message?: string }
        this.error
          = fetchError?.data?.statusMessage
            || fetchError?.message
            || 'Failed to delete credit days'
        throw e
      }
      finally {
        this.loading = false
      }
    },
  },
})
