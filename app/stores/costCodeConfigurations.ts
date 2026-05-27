import { defineStore } from 'pinia'

export interface CostCodeConfiguration {
  id?: number
  uuid?: string
  corporation_uuid: string
  division_uuid?: string | null
  cost_code_number: string
  cost_code_name: string
  parent_cost_code_uuid?: string | null
  order_number?: number | null
  gl_account_uuid?: string | null
  effective_from?: string | null
  description?: string | null
  update_previous_transactions?: boolean
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export const useCostCodeConfigurationsStore = defineStore('costCodeConfigurations', () => {
  const configurations = ref<CostCodeConfiguration[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const lastFetchedCorporation = ref<string | null>(null)
  const hasDataForCorporation = ref<Set<string>>(new Set())

  const getConfigurationsByCorporation = computed(() => {
    return (corporationUuid: string) =>
      configurations.value.filter(c => c.corporation_uuid === corporationUuid)
  })

  const getActiveConfigurations = computed(() => {
    return (corporationUuid: string) =>
      configurations.value.filter(c => c.corporation_uuid === corporationUuid && c.is_active)
  })

  const getConfigurationById = computed(() => {
    return (uuid: string) => configurations.value.find(c => c.uuid === uuid)
  })

  const getConfigurationCountByCorporation = computed(() => {
    return (corporationUuid: string) =>
      configurations.value.filter(c => c.corporation_uuid === corporationUuid).length
  })

  const getActiveConfigurationCountByCorporation = computed(() => {
    return (corporationUuid: string) =>
      configurations.value.filter(c => c.corporation_uuid === corporationUuid && c.is_active).length
  })

  const configurationExists = computed(() => {
    return (uuid: string) => configurations.value.some(c => c.uuid === uuid)
  })

  const shouldFetchData = (corporationUuid: string) => {
    if (lastFetchedCorporation.value !== corporationUuid) return true
    return !hasDataForCorporation.value.has(corporationUuid)
  }

  const fetchConfigurations = async (corporationUuid: string, forceRefresh = false) => {
    if (!forceRefresh && !shouldFetchData(corporationUuid)) return
    if (process.server) return

    loading.value = true
    error.value = null

    try {
      const { data } = await $fetch<{ data: CostCodeConfiguration[] }>('/api/cost-code-configurations', {
        query: { corporation_uuid: corporationUuid },
      })
      configurations.value = data || []
      lastFetchedCorporation.value = corporationUuid
      hasDataForCorporation.value.add(corporationUuid)
    }
    catch (err: any) {
      error.value = err.message || 'Failed to fetch cost code configurations'
      configurations.value = []
      hasDataForCorporation.value.delete(corporationUuid)
    }
    finally {
      loading.value = false
    }
  }

  const createConfiguration = async (configData: Omit<CostCodeConfiguration, 'id' | 'created_at' | 'updated_at'>) => {
    loading.value = true
    error.value = null

    try {
      const { data } = await $fetch<{ data: CostCodeConfiguration }>('/api/cost-code-configurations', {
        method: 'POST',
        body: configData,
      })
      if (data) {
        configurations.value.unshift(data)
        hasDataForCorporation.value.delete(configData.corporation_uuid)
      }
      return data
    }
    catch (err: any) {
      error.value = err.message || 'Failed to create cost code configuration'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const updateConfiguration = async (uuid: string, configData: Partial<CostCodeConfiguration>) => {
    loading.value = true
    error.value = null

    try {
      const { data } = await $fetch<{ data: CostCodeConfiguration }>(`/api/cost-code-configurations/${uuid}`, {
        method: 'PUT',
        body: configData,
      })
      if (data) {
        const index = configurations.value.findIndex(c => c.uuid === uuid)
        if (index !== -1) {
          configurations.value[index] = data
          hasDataForCorporation.value.delete(data.corporation_uuid)
        }
      }
      return data
    }
    catch (err: any) {
      error.value = err.message || 'Failed to update cost code configuration'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const deleteConfiguration = async (uuid: string) => {
    loading.value = true
    error.value = null

    try {
      const configToDelete = configurations.value.find(c => c.uuid === uuid)

      await $fetch(`/api/cost-code-configurations/${uuid}`, { method: 'DELETE' })

      const index = configurations.value.findIndex(c => c.uuid === uuid)
      if (index !== -1) {
        configurations.value.splice(index, 1)
        if (configToDelete?.corporation_uuid) {
          hasDataForCorporation.value.delete(configToDelete.corporation_uuid)
        }
      }
    }
    catch (err: any) {
      error.value = err.message || 'Failed to delete cost code configuration'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const deleteAllConfigurations = async (corporationUuid: string) => {
    loading.value = true
    error.value = null

    try {
      await $fetch('/api/cost-code-configurations/delete-all', {
        method: 'DELETE',
        query: { corporation_uuid: corporationUuid },
      })
      configurations.value = configurations.value.filter(c => c.corporation_uuid !== corporationUuid)
      hasDataForCorporation.value.delete(corporationUuid)
    }
    catch (err: any) {
      error.value = err.message || 'Failed to delete all cost code configurations'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const clearError = () => { error.value = null }

  const clearConfigurations = () => {
    configurations.value = []
    lastFetchedCorporation.value = null
    hasDataForCorporation.value.clear()
  }

  return {
    configurations: readonly(configurations),
    loading: readonly(loading),
    error: readonly(error),
    getConfigurationsByCorporation,
    getActiveConfigurations,
    getConfigurationById,
    getConfigurationCountByCorporation,
    getActiveConfigurationCountByCorporation,
    configurationExists,
    fetchConfigurations,
    createConfiguration,
    updateConfiguration,
    deleteConfiguration,
    deleteAllConfigurations,
    clearError,
    clearConfigurations,
  }
})
