import { computed, readonly, ref } from 'vue'
import { defineStore } from 'pinia'

export interface CostCodeDivision {
  id?: number
  uuid?: string
  division_number: string
  division_name: string
  division_order: number
  description?: string | null
  is_active: boolean
  exclude_in_estimates_and_reports?: boolean
  corporation_uuid: string
  created_at?: string
  updated_at?: string
}

export const useCostCodeDivisionsStore = defineStore('costCodeDivisions', () => {
  const divisions = ref<CostCodeDivision[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const lastFetchedCorporation = ref<string | null>(null)
  const hasDataForCorporation = ref<Set<string>>(new Set())

  const getDivisionsByCorporation = computed(() => {
    return (corporationUuid: string) =>
      divisions.value.filter(d => d.corporation_uuid === corporationUuid)
  })

  const getActiveDivisions = computed(() => {
    return (corporationUuid: string) =>
      divisions.value.filter(d => d.corporation_uuid === corporationUuid && d.is_active)
  })

  const getDivisionById = computed(() => {
    return (uuid: string) => divisions.value.find(d => d.uuid === uuid)
  })

  const getDivisionCountByCorporation = computed(() => {
    return (corporationUuid: string) =>
      divisions.value.filter(d => d.corporation_uuid === corporationUuid).length
  })

  const getActiveDivisionCountByCorporation = computed(() => {
    return (corporationUuid: string) =>
      divisions.value.filter(d => d.corporation_uuid === corporationUuid && d.is_active).length
  })

  const divisionExists = computed(() => {
    return (uuid: string) => divisions.value.some(d => d.uuid === uuid)
  })

  const shouldFetchData = (corporationUuid: string) => {
    if (lastFetchedCorporation.value !== corporationUuid) return true
    return !hasDataForCorporation.value.has(corporationUuid)
  }

  const fetchDivisions = async (corporationUuid: string, forceRefresh = false) => {
    if (!forceRefresh && !shouldFetchData(corporationUuid)) return
    if (process.server) return

    loading.value = true
    error.value = null

    try {
      const { data } = await $fetch<{ data: CostCodeDivision[] }>('/api/cost-code-divisions', {
        query: { corporation_uuid: corporationUuid },
      })
      divisions.value = data || []
      lastFetchedCorporation.value = corporationUuid
      hasDataForCorporation.value.add(corporationUuid)
    }
    catch (err: any) {
      error.value = err.message || 'Failed to fetch cost code divisions'
      divisions.value = []
      hasDataForCorporation.value.delete(corporationUuid)
    }
    finally {
      loading.value = false
    }
  }

  const createDivision = async (divisionData: Omit<CostCodeDivision, 'id' | 'created_at' | 'updated_at'>) => {
    loading.value = true
    error.value = null

    try {
      const { data } = await $fetch<{ data: CostCodeDivision }>('/api/cost-code-divisions', {
        method: 'POST',
        body: divisionData,
      })
      if (data) {
        divisions.value.unshift(data)
        hasDataForCorporation.value.delete(divisionData.corporation_uuid)
      }
      return data
    }
    catch (err: any) {
      error.value = err.message || 'Failed to create cost code division'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const updateDivision = async (uuid: string, divisionData: Partial<CostCodeDivision>) => {
    loading.value = true
    error.value = null

    try {
      const { data } = await $fetch<{ data: CostCodeDivision }>(`/api/cost-code-divisions/${uuid}`, {
        method: 'PUT',
        body: divisionData,
      })
      if (data) {
        const index = divisions.value.findIndex(d => d.uuid === uuid)
        if (index !== -1) {
          divisions.value[index] = data
          hasDataForCorporation.value.delete(data.corporation_uuid)
        }
      }
      return data
    }
    catch (err: any) {
      error.value = err.message || 'Failed to update cost code division'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const deleteDivision = async (uuid: string) => {
    loading.value = true
    error.value = null

    try {
      const divisionToDelete = divisions.value.find(d => d.uuid === uuid)

      await $fetch(`/api/cost-code-divisions/${uuid}`, { method: 'DELETE' })

      const index = divisions.value.findIndex(d => d.uuid === uuid)
      if (index !== -1) {
        divisions.value.splice(index, 1)
        if (divisionToDelete?.corporation_uuid) {
          hasDataForCorporation.value.delete(divisionToDelete.corporation_uuid)
        }
      }
    }
    catch (err: any) {
      error.value = err.message || 'Failed to delete cost code division'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const bulkImportDivisions = async (
    corporationUuid: string,
    divisionsData: Omit<CostCodeDivision, 'id' | 'created_at' | 'updated_at'>[],
  ) => {
    loading.value = true
    error.value = null

    try {
      const result = await $fetch<{ data: any; message: string }>('/api/cost-code-divisions/bulk', {
        method: 'POST',
        body: { corporation_uuid: corporationUuid, divisions: divisionsData },
      })
      hasDataForCorporation.value.delete(corporationUuid)
      await fetchDivisions(corporationUuid, true)
      return result
    }
    catch (err: any) {
      error.value = err.message || 'Failed to bulk import cost code divisions'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const deleteAllDivisions = async (corporationUuid: string) => {
    loading.value = true
    error.value = null

    try {
      await $fetch('/api/cost-code-divisions/delete-all', {
        method: 'DELETE',
        query: { corporation_uuid: corporationUuid },
      })
      divisions.value = divisions.value.filter(d => d.corporation_uuid !== corporationUuid)
      hasDataForCorporation.value.delete(corporationUuid)
    }
    catch (err: any) {
      error.value = err.message || 'Failed to delete all cost code divisions'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const clearError = () => { error.value = null }

  const clearDivisions = () => {
    divisions.value = []
    lastFetchedCorporation.value = null
    hasDataForCorporation.value.clear()
  }

  return {
    divisions: readonly(divisions),
    loading: readonly(loading),
    error: readonly(error),
    getDivisionsByCorporation,
    getActiveDivisions,
    getDivisionById,
    getDivisionCountByCorporation,
    getActiveDivisionCountByCorporation,
    divisionExists,
    fetchDivisions,
    createDivision,
    updateDivision,
    deleteDivision,
    bulkImportDivisions,
    deleteAllDivisions,
    clearError,
    clearDivisions,
  }
})
