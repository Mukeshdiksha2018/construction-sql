import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useApiClient } from '~/composables/useApiClient'

export type Customer = {
  id: number
  uuid: string
  created_at: string
  corporation_uuid: string
  project_uuid?: string | null
  customer_address: string
  customer_city?: string
  customer_state?: string
  customer_country?: string
  customer_zip?: string
  customer_phone: string
  customer_email: string
  company_name?: string
  salutation?: string
  first_name?: string
  middle_name?: string
  last_name?: string
  profile_image_url?: string
  is_active: boolean
  updated_at: string
  nimble_customer_id?: string | null
}

type CreateCustomerPayload = {
  corporation_uuid: string
  project_uuid?: string | null
  customer_address?: string
  customer_city?: string
  customer_state?: string
  customer_country?: string
  customer_zip?: string
  customer_phone?: string
  customer_email?: string
  company_name?: string
  salutation?: string
  first_name?: string
  middle_name?: string
  last_name?: string
  profile_image_url?: string
  is_active?: boolean
}

export const useCustomerStore = defineStore('customers', () => {
  const customers = ref<Customer[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastFetchedCorporation = ref<string | null>(null)
  const hasDataForCorporation = ref<Set<string>>(new Set())

  const shouldFetchData = (corporationUUID: string) => {
    if (lastFetchedCorporation.value !== corporationUUID) return true
    if (hasDataForCorporation.value.has(corporationUUID)) return false
    return true
  }

  const fetchCustomers = async (
    corporationUUID: string,
    projectUUID?: string | null,
    forceRefresh = false,
  ) => {
    if (!forceRefresh && !shouldFetchData(corporationUUID)) return
    if (import.meta.server) return

    loading.value = true
    error.value = null
    try {
      const { apiFetch } = useApiClient()
      let url = `/api/customers?corporation_uuid=${encodeURIComponent(corporationUUID)}`
      if (projectUUID) {
        url += `&project_uuid=${encodeURIComponent(projectUUID)}`
      }
      const response = await apiFetch<{ data?: Customer[], error?: string }>(url)
      if (response?.error) throw new Error(response.error)

      customers.value = response?.data || []
      lastFetchedCorporation.value = corporationUUID
      hasDataForCorporation.value.add(corporationUUID)
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch customers'
      error.value = message
      customers.value = []
      hasDataForCorporation.value.delete(corporationUUID)
    }
    finally {
      loading.value = false
    }
  }

  const addCustomer = async (
    corporationUUID: string,
    customerData: CreateCustomerPayload,
  ) => {
    loading.value = true
    error.value = null
    try {
      const { apiFetch } = useApiClient()
      const response = await apiFetch<{ data?: Customer, error?: string }>('/api/customers', {
        method: 'POST',
        body: { ...customerData, corporation_uuid: corporationUUID },
      })
      if (response?.error) throw new Error(response.error)

      const newCustomer = response?.data
      if (newCustomer) {
        customers.value.unshift(newCustomer)
        hasDataForCorporation.value.delete(corporationUUID)
      }
      return response
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to add customer'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const updateCustomer = async (
    corporationUUID: string,
    customer: Customer,
    updatedData: Partial<CreateCustomerPayload>,
  ) => {
    loading.value = true
    error.value = null
    try {
      const { apiFetch } = useApiClient()
      const response = await apiFetch<{ data?: Customer, error?: string }>('/api/customers', {
        method: 'PUT',
        body: {
          ...updatedData,
          uuid: customer.uuid,
          corporation_uuid: corporationUUID,
        },
      })
      if (response?.error) throw new Error(response.error)

      const updatedCustomer = response?.data
      const index = customers.value.findIndex(c => c.uuid === customer.uuid)
      if (index > -1 && updatedCustomer) {
        customers.value[index] = updatedCustomer
        hasDataForCorporation.value.delete(corporationUUID)
      }
      return response
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to update customer'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const deleteCustomer = async (corporationUUID: string, customer: Customer) => {
    loading.value = true
    error.value = null
    try {
      const { apiFetch } = useApiClient()
      const response = await apiFetch<{ error?: string }>(
        `/api/customers?uuid=${encodeURIComponent(customer.uuid)}`,
        { method: 'DELETE' },
      )
      if (response?.error) throw new Error(response.error)

      const index = customers.value.findIndex(c => c.uuid === customer.uuid)
      if (index > -1) {
        customers.value.splice(index, 1)
        hasDataForCorporation.value.delete(corporationUUID)
      }
      return response
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to delete customer'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const clearCache = (corporationUUID?: string) => {
    if (!corporationUUID || lastFetchedCorporation.value === corporationUUID) {
      customers.value = []
      lastFetchedCorporation.value = null
      hasDataForCorporation.value.clear()
    }
  }

  const refreshCustomersFromAPI = async (
    corporationUUID: string,
    projectUUID?: string | null,
  ) => fetchCustomers(corporationUUID, projectUUID, true)

  return {
    customers,
    loading,
    error,
    fetchCustomers,
    refreshCustomersFromAPI,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    clearCache,
    getAll: customers,
    getActive: () => customers.value.filter(c => c.is_active !== false),
  }
})
