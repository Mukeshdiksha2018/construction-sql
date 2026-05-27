import { defineStore } from 'pinia'

export interface Customer {
  id?: number
  uuid: string
  first_name?: string | null
  last_name?: string | null
  middle_name?: string | null
  salutation?: string | null
  company_name?: string | null
  customer_email?: string | null
  profile_image_url?: string | null
  corporation_uuid?: string | null
  project_uuid?: string | null
  is_active?: boolean
}

export const useCustomerStore = defineStore('customers', {
  state: () => ({
    customers: [] as Customer[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    getAll: (state) => state.customers,
    getActive: (state) => state.customers.filter(c => c.is_active !== false),
  },

  actions: {
    async fetchCustomers(corporationUuid?: string | null, _projectUuid?: string | null, _force?: boolean) {
      this.loading = true
      this.error = null
      try {
        const query: Record<string, string> = {}
        if (corporationUuid) query.corporation_id = corporationUuid
        const response = await $fetch<{ data: Customer[] }>('/api/customers/options', {
          query,
          credentials: 'include',
        })
        const fetched = (response.data ?? (response as any) ?? []) as Customer[]
        this.customers = fetched
      } catch (e: unknown) {
        const err = e as { message?: string }
        this.error = err?.message || 'Failed to fetch customers'
      } finally {
        this.loading = false
      }
    },

    clearCustomers() {
      this.customers = []
      this.error = null
    },
  },
})
