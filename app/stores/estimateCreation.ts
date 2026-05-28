import { defineStore } from 'pinia'

/**
 * Isolated store for data needed during estimate creation/editing.
 * Kept separate from global corporation context to avoid polluting TopBar state.
 */
export const useEstimateCreationStore = defineStore('estimateCreation', () => {
  const selectedCorporationUuid = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const projects = ref<any[]>([])
  const costCodeDivisions = ref<any[]>([])
  const costCodeConfigurations = ref<any[]>([])
  const itemTypes = ref<any[]>([])
  const uom = ref<any[]>([])

  const hasData = computed(() => selectedCorporationUuid.value !== null)

  const fetchProjects = async (corporationUuid: string) => {
    try {
      projects.value = []
      const response = await $fetch<{ data: any[] }>('/api/projects', {
        query: { corporation_uuid: corporationUuid },
      })
      const data = response?.data || []
      projects.value = (Array.isArray(data) ? data : []).filter((p: any) => p.corporation_uuid === corporationUuid)
    }
    catch (err: any) {
      console.warn('Error fetching projects for estimate creation:', err)
      projects.value = []
    }
  }

  const fetchCostCodeDivisions = async (corporationUuid: string) => {
    try {
      const response = await $fetch<{ data: any[] }>('/api/cost-code-divisions', {
        query: { corporation_uuid: corporationUuid },
      })
      costCodeDivisions.value = response?.data || []
    }
    catch (err: any) {
      console.warn('Error fetching cost code divisions:', err)
      costCodeDivisions.value = []
    }
  }

  const fetchCostCodeConfigurations = async (corporationUuid: string) => {
    try {
      const response = await $fetch<{ data: any[] }>('/api/cost-code-configurations', {
        query: { corporation_uuid: corporationUuid },
      })
      costCodeConfigurations.value = response?.data || []
    }
    catch (err: any) {
      console.warn('Error fetching cost code configurations:', err)
      costCodeConfigurations.value = []
    }
  }

  const fetchItemTypes = async (corporationUuid: string) => {
    try {
      const response = await $fetch<{ data: any[] }>('/api/item-types', {
        query: { corporation_uuid: corporationUuid },
      })
      const data = response?.data || (response as any) || []
      itemTypes.value = Array.isArray(data) ? data : []
    }
    catch (err: any) {
      console.warn('Error fetching item types:', err)
      itemTypes.value = []
    }
  }

  const fetchUOM = async () => {
    try {
      const response = await $fetch<{ data: any[] }>('/api/nimble/uom')
      const data = (response as any)?.data || response || []
      uom.value = Array.isArray(data) ? data : []
    }
    catch (err: any) {
      console.warn('Error fetching UOM:', err)
      uom.value = []
    }
  }

  const setCorporationAndFetchData = async (corporationUuid: string | null) => {
    if (!corporationUuid) { clearStore(); return }

    const isSwitching = Boolean(selectedCorporationUuid.value && selectedCorporationUuid.value !== corporationUuid)
    if (isSwitching) {
      projects.value = []
      costCodeDivisions.value = []
      costCodeConfigurations.value = []
      itemTypes.value = []
    }

    loading.value = true
    error.value = null
    selectedCorporationUuid.value = corporationUuid

    try {
      await Promise.all([
        fetchCostCodeDivisions(corporationUuid).catch(e => console.warn('divisions failed:', e)),
        fetchUOM().catch(e => console.warn('UOM failed:', e)),
      ])
      await fetchProjects(corporationUuid).catch(e => console.warn('projects failed:', e))
      await fetchItemTypes(corporationUuid).catch(e => console.warn('item types failed:', e))
      await fetchCostCodeConfigurations(corporationUuid).catch(e => console.warn('configurations failed:', e))
    }
    catch (err: any) {
      error.value = err.message || 'Failed to fetch estimate creation data'
    }
    finally {
      loading.value = false
    }
  }

  const getActiveDivisions = computed(() => {
    if (!selectedCorporationUuid.value) return []
    return costCodeDivisions.value.filter(d => d.is_active === true)
  })

  const getActiveConfigurations = computed(() => {
    if (!selectedCorporationUuid.value) return []
    return costCodeConfigurations.value.filter(c => c.is_active === true)
  })

  const getActiveUOM = computed(() =>
    uom.value.filter(u => u.status === 'ACTIVE' || u.is_active !== false),
  )

  const clearStore = () => {
    selectedCorporationUuid.value = null
    projects.value = []
    costCodeDivisions.value = []
    costCodeConfigurations.value = []
    itemTypes.value = []
    uom.value = []
    error.value = null
    loading.value = false
  }

  return {
    selectedCorporationUuid: readonly(selectedCorporationUuid),
    selectedCorporation: readonly(selectedCorporationUuid),
    loading: readonly(loading),
    error: readonly(error),
    hasData: readonly(hasData),
    projects: readonly(projects),
    costCodeDivisions: readonly(costCodeDivisions),
    costCodeConfigurations: readonly(costCodeConfigurations),
    itemTypes: readonly(itemTypes),
    uom: readonly(uom),
    getActiveDivisions,
    getActiveConfigurations,
    getActiveUOM,
    setCorporationAndFetchData,
    clearStore,
  }
})
