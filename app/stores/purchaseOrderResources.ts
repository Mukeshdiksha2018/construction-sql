import { defineStore } from 'pinia'
import { reactive, computed } from 'vue'

type Nullable<T> = T | null | undefined

interface EstimateItemsState {
  key: string
  estimateUuid: string
  poItems: any[]
  rawItems: any[]
  loading: boolean
  error: string | null
  fetchedAt: number | null
}

interface ProjectResourceState {
  corporationUuid: string
  projectUuid: string
  itemTypes: any[]
  itemTypesLoading: boolean
  itemTypesLoaded: boolean
  preferredItems: any[]
  preferredItemsLoading: boolean
  preferredItemsLoaded: boolean
  preferredItemsPromise: Promise<any[]> | null
  estimates: any[]
  estimatesLoading: boolean
  estimatesLoaded: boolean
  costCodeConfigurations: any[]
  costCodeConfigurationsLoading: boolean
  costCodeConfigurationsLoaded: boolean
  costCodeConfigurationsPromise: Promise<any[]> | null
  estimateItemsMap: Record<string, EstimateItemsState>
}

interface EnsureArgs {
  corporationUuid: string
  projectUuid?: string | null
  estimateUuid?: string | null
  force?: boolean
}

const projectKey = (corporationUuid?: Nullable<string>, projectUuid?: Nullable<string>) => {
  const corp = corporationUuid ? String(corporationUuid) : ''
  const project = projectUuid ? String(projectUuid) : ''
  return `${corp}::${project}`
}

const estimateKey = (corporationUuid?: Nullable<string>, projectUuid?: Nullable<string>, estimateUuid?: Nullable<string>) => {
  const base = projectKey(corporationUuid, projectUuid)
  const estimate = estimateUuid ? String(estimateUuid) : ''
  return `${base}::${estimate}`
}

const normalizeNumber = (value: any, fallback = 0) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const parsed = parseFloat(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const transformEstimateMaterialItemsToPoItems = (flattened: any[], preferredItems: any[] = []) => {
  // Key by lowercase uuid — CostCodePreferredItem.uuid is always lowercase,
  // but item_uuid on material items may be mixed case from the frontend.
  const preferredItemsByUuid = new Map()
  preferredItems.forEach(item => {
    if (item.item_uuid) preferredItemsByUuid.set(String(item.item_uuid).toLowerCase(), item)
  })

  return flattened.map((entry: any, index: number) => {
    const unitPrice = normalizeNumber(entry.unit_price, 0)
    const quantity = normalizeNumber(entry.quantity, 0)

    const pref = entry.item_uuid ? preferredItemsByUuid.get(String(entry.item_uuid).toLowerCase()) : null
    const unitUuid = entry.uom_uuid || entry.unit_uuid || pref?.uom_uuid || null
    const unitLabel = entry.uom_label || entry.unit_label || entry.unit || pref?.uom_label || null

    return {
      order_index: index,
      source: 'estimate',
      cost_code_uuid: entry.cost_code_uuid ?? null,
      cost_code_label: entry.cost_code_label ?? '',
      cost_code_number: entry.cost_code_number ?? '',
      cost_code_name: entry.cost_code_name ?? '',
      division_name: entry.division_name ?? '',
      category: entry.category ?? null,
      item_division_uuid: entry.item_division_uuid ?? null,
      item_type_uuid: entry.item_type_uuid ?? null,
      item_type_label: entry.item_type_label ?? '',
      item_uuid: entry.item_uuid ?? null,
      name: entry.item_name || entry.name || '',
      item_name: entry.item_name || entry.name || '',
      description: entry.description ?? '',
      model_number: pref?.model_number || entry.model_number || '',
      location_uuid: entry.location_uuid ?? null,
      location_label: entry.location_label || entry.location || null,
      location: entry.location_label || entry.location || null,
      unit_uuid: unitUuid,
      unit_label: unitLabel,
      unit: unitLabel,
      quantity,
      unit_price: unitPrice,
      total: normalizeNumber(entry.total, quantity * unitPrice),
      po_quantity: quantity,
      po_unit_price: unitPrice,
      po_total: normalizeNumber(entry.total, quantity * unitPrice),
      approval_checks: [],
      approval_checks_uuids: [],
      configuration_name: entry.configuration_name ?? null,
      metadata: {},
    }
  })
}

export const usePurchaseOrderResourcesStore = defineStore('purchaseOrderResources', () => {
  const projectResources = reactive<Record<string, ProjectResourceState>>({})

  const getOrCreateProjectState = (corporationUuid: string, projectUuid: string): ProjectResourceState => {
    const key = projectKey(corporationUuid, projectUuid)
    if (!projectResources[key]) {
      projectResources[key] = {
        corporationUuid,
        projectUuid,
        itemTypes: [],
        itemTypesLoading: false,
        itemTypesLoaded: false,
        preferredItems: [],
        preferredItemsLoading: false,
        preferredItemsLoaded: false,
        preferredItemsPromise: null,
        estimates: [],
        estimatesLoading: false,
        estimatesLoaded: false,
        costCodeConfigurations: [],
        costCodeConfigurationsLoading: false,
        costCodeConfigurationsLoaded: false,
        costCodeConfigurationsPromise: null,
        estimateItemsMap: {},
      }
    }
    return projectResources[key]
  }

  const ensureItemTypes = async ({ corporationUuid, projectUuid, force = false }: EnsureArgs) => {
    if (!corporationUuid) return []
    const state = getOrCreateProjectState(corporationUuid, projectUuid ?? '')
    if (state.itemTypesLoaded && !force) return state.itemTypes
    if (state.itemTypesLoading && !force) return state.itemTypes

    state.itemTypesLoading = true
    try {
      const response = await $fetch<any>('/api/item-types', {
        query: { corporation_uuid: corporationUuid },
      })
      state.itemTypes = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : [])
      state.itemTypesLoaded = true
    } catch (err) {
      console.error('[PO Resources] ensureItemTypes error:', err)
    } finally {
      state.itemTypesLoading = false
    }
    return state.itemTypes
  }

  const ensurePreferredItems = async ({ corporationUuid, projectUuid, force = false }: EnsureArgs): Promise<any[]> => {
    if (!corporationUuid) return []
    const state = getOrCreateProjectState(corporationUuid, projectUuid ?? '')
    if (state.preferredItemsLoaded && !force) return state.preferredItems
    if (state.preferredItemsPromise && !force) return state.preferredItemsPromise

    const run = async (): Promise<any[]> => {
      state.preferredItemsLoading = true
      try {
        const query: Record<string, string> = { corporation_uuid: corporationUuid }
        if (projectUuid) query.project_uuid = projectUuid
        const response = await $fetch<any>('/api/cost-code-configurations/project-filtered', { query })
        const configs = Array.isArray(response?.data) ? response.data : []

        const items: any[] = []
        for (const config of configs) {
          const configItems = Array.isArray(config.preferred_items) ? config.preferred_items : []
          for (const item of configItems) {
            items.push({
              ...item,
              cost_code_uuid: config.cost_code_uuid,
              cost_code_label: config.cost_code_label,
              cost_code_number: config.cost_code_number,
              cost_code_name: config.cost_code_name,
              division_name: config.division_name,
            })
          }
        }

        state.preferredItems = items
        state.preferredItemsLoaded = true
      } catch (err) {
        console.error('[PO Resources] ensurePreferredItems error:', err)
      } finally {
        state.preferredItemsLoading = false
        state.preferredItemsPromise = null
      }
      return state.preferredItems
    }

    state.preferredItemsPromise = run()
    return state.preferredItemsPromise
  }

  const ensureEstimates = async ({ corporationUuid, projectUuid, force = false }: EnsureArgs) => {
    if (!corporationUuid) return []
    const state = getOrCreateProjectState(corporationUuid, projectUuid ?? '')
    if (state.estimatesLoaded && !force) return state.estimates
    if (state.estimatesLoading && !force) return state.estimates

    state.estimatesLoading = true
    try {
      const query: Record<string, string> = { corporation_uuid: corporationUuid }
      if (projectUuid) query.project_uuid = projectUuid
      const response = await $fetch<any>('/api/estimates', { query })
      state.estimates = Array.isArray(response?.data) ? response.data : []
      state.estimatesLoaded = true
    } catch (err) {
      console.error('[PO Resources] ensureEstimates error:', err)
    } finally {
      state.estimatesLoading = false
    }
    return state.estimates
  }

  const fetchEstimateItems = async ({ corporationUuid, projectUuid, estimateUuid, force = false }: EnsureArgs): Promise<any[]> => {
    if (!corporationUuid || !estimateUuid || !projectUuid) return []

    const state = getOrCreateProjectState(corporationUuid, projectUuid)
    const key = estimateKey(corporationUuid, projectUuid, estimateUuid)
    const existingState = state.estimateItemsMap[key]

    if (existingState && existingState.fetchedAt && !force) {
      return existingState.poItems
    }

    // Create or reuse the state entry, then set loading=true via replacement to trigger reactivity
    const workingState: EstimateItemsState = existingState
      ? { ...existingState, loading: true, error: null }
      : { key, estimateUuid, poItems: [], rawItems: [], loading: true, error: null, fetchedAt: null }
    state.estimateItemsMap[key] = workingState

    try {
      const [lineItemsResp, preferredItems] = await Promise.all([
        $fetch<any>('/api/estimate-line-items', {
          query: {
            estimate_uuid: estimateUuid,
            project_uuid: projectUuid,
            corporation_uuid: corporationUuid,
          },
        }),
        ensurePreferredItems({ corporationUuid, projectUuid }),
      ])

      // The API returns { data: [...lineItems with embedded material_items...] }
      // When there are no line items, returns [] directly (no .data wrapper)
      const lineItems = Array.isArray(lineItemsResp?.data)
        ? lineItemsResp.data
        : Array.isArray(lineItemsResp) ? lineItemsResp : []

      // Flatten material_items already embedded in each line item response
      const allMaterialItems: any[] = []
      for (const lineItem of lineItems) {
        const matItems = Array.isArray(lineItem.material_items) ? lineItem.material_items : []
        for (const item of matItems) {
          allMaterialItems.push({
            ...item,
            cost_code_uuid: lineItem.cost_code_uuid,
            cost_code_label: lineItem.cost_code_label ?? '',
            cost_code_number: lineItem.cost_code_number ?? '',
            cost_code_name: lineItem.cost_code_name ?? '',
            division_name: lineItem.division_name ?? '',
          })
        }
      }

      // Replace entire map entry with spread to guarantee Vue reactivity triggers
      state.estimateItemsMap[key] = {
        ...workingState,
        rawItems: allMaterialItems,
        poItems: transformEstimateMaterialItemsToPoItems(allMaterialItems, preferredItems),
        fetchedAt: Date.now(),
        loading: false,
      }
    } catch (err: any) {
      console.error('[PO Resources] fetchEstimateItems error:', err)
      state.estimateItemsMap[key] = {
        ...workingState,
        error: err?.data?.statusMessage || err?.message || 'Failed to load estimate items',
        loading: false,
      }
    }

    return state.estimateItemsMap[key].poItems
  }

  const ensureCostCodeConfigurations = async ({ corporationUuid, projectUuid, force = false }: EnsureArgs): Promise<any[]> => {
    if (!corporationUuid) return []
    const state = getOrCreateProjectState(corporationUuid, projectUuid ?? '')
    if (state.costCodeConfigurationsLoaded && !force) return state.costCodeConfigurations
    if (state.costCodeConfigurationsPromise && !force) return state.costCodeConfigurationsPromise

    const run = async (): Promise<any[]> => {
      state.costCodeConfigurationsLoading = true
      try {
        const query: Record<string, string> = { corporation_uuid: corporationUuid }
        if (projectUuid) query.project_uuid = projectUuid
        const response = await $fetch<any>('/api/cost-code-configurations/project-filtered', { query })
        state.costCodeConfigurations = Array.isArray(response?.data) ? response.data : []
        state.costCodeConfigurationsLoaded = true
      } catch (err) {
        console.error('[PO Resources] ensureCostCodeConfigurations error:', err)
      } finally {
        state.costCodeConfigurationsLoading = false
        state.costCodeConfigurationsPromise = null
      }
      return state.costCodeConfigurations
    }

    state.costCodeConfigurationsPromise = run()
    return state.costCodeConfigurationsPromise
  }

  const getProjectState = computed(() => {
    return (corporationUuid?: Nullable<string>, projectUuid?: Nullable<string>) => {
      if (!corporationUuid) return null
      const key = projectKey(corporationUuid, projectUuid)
      return projectResources[key] || null
    }
  })

  const getItemTypes = computed(() => {
    return (corporationUuid?: Nullable<string>, projectUuid?: Nullable<string>) => {
      return getProjectState.value(corporationUuid, projectUuid)?.itemTypes ?? []
    }
  })

  const getPreferredItems = computed(() => {
    return (corporationUuid?: Nullable<string>, projectUuid?: Nullable<string>) => {
      return getProjectState.value(corporationUuid, projectUuid)?.preferredItems ?? []
    }
  })

  const getEstimates = computed(() => {
    return (corporationUuid?: Nullable<string>, projectUuid?: Nullable<string>) => {
      return getProjectState.value(corporationUuid, projectUuid)?.estimates ?? []
    }
  })

  const getCostCodeConfigurations = computed(() => {
    return (corporationUuid?: Nullable<string>, projectUuid?: Nullable<string>) => {
      return getProjectState.value(corporationUuid, projectUuid)?.costCodeConfigurations ?? []
    }
  })

  const clearProject = (corporationUuid?: Nullable<string>, projectUuid?: Nullable<string>) => {
    const key = projectKey(corporationUuid, projectUuid)
    if (projectResources[key]) delete projectResources[key]
  }

  const clear = () => {
    Object.keys(projectResources).forEach(key => delete projectResources[key])
  }

  // ── Reactive helpers for estimate items state (used by PurchaseOrderForm computed props) ──

  const getEstimateItemsLoading = (
    corporationUuid?: Nullable<string>,
    projectUuid?: Nullable<string>,
    estimateUuid?: Nullable<string>,
  ): boolean => {
    if (!corporationUuid || !estimateUuid) return false
    const state = getOrCreateProjectState(corporationUuid, projectUuid ?? '')
    const key = estimateKey(corporationUuid, projectUuid, estimateUuid)
    return state.estimateItemsMap[key]?.loading ?? false
  }

  const getEstimateItemsError = (
    corporationUuid?: Nullable<string>,
    projectUuid?: Nullable<string>,
    estimateUuid?: Nullable<string>,
  ): string | null => {
    if (!corporationUuid || !estimateUuid) return null
    const state = getOrCreateProjectState(corporationUuid, projectUuid ?? '')
    const key = estimateKey(corporationUuid, projectUuid, estimateUuid)
    return state.estimateItemsMap[key]?.error ?? null
  }

  /**
   * Synchronous read of cached estimate items (poItems array).
   * Used by PurchaseOrderForm computed `estimatePoItems`.
   */
  const getEstimateItems = (
    corporationUuid?: Nullable<string>,
    projectUuid?: Nullable<string>,
    estimateUuid?: Nullable<string>,
  ): any[] => {
    if (!corporationUuid || !estimateUuid) return []
    const state = getOrCreateProjectState(corporationUuid, projectUuid ?? '')
    const key = estimateKey(corporationUuid, projectUuid, estimateUuid)
    return state.estimateItemsMap[key]?.poItems ?? []
  }

  /**
   * Async: fetch + cache estimate items. Returns the poItems array.
   * Called as `ensureEstimateItems` from PurchaseOrderForm event handlers.
   */
  const ensureEstimateItems = fetchEstimateItems

  /**
   * Convenience: ensure item-types, cost-code-configurations, preferred-items,
   * and (optionally) estimate items for a given project scope.
   */
  const ensureProjectResources = async ({
    corporationUuid,
    projectUuid,
    estimateUuid,
    force = false,
  }: EnsureArgs) => {
    if (!corporationUuid) return
    await Promise.allSettled([
      ensureItemTypes({ corporationUuid, projectUuid, force }),
      ensureCostCodeConfigurations({ corporationUuid, projectUuid, force }),
      ensurePreferredItems({ corporationUuid, projectUuid, force }),
      // Always fetch estimates for the project so latestProjectEstimate resolves
      projectUuid
        ? ensureEstimates({ corporationUuid, projectUuid, force })
        : Promise.resolve(),
      estimateUuid
        ? fetchEstimateItems({ corporationUuid, projectUuid, estimateUuid, force })
        : Promise.resolve(),
    ])
  }

  /** Sync read of estimates for a project (same data as getEstimates getter). */
  const getEstimatesByProject = (
    corporationUuid?: Nullable<string>,
    projectUuid?: Nullable<string>,
  ): any[] => {
    return getProjectState.value(corporationUuid, projectUuid)?.estimates ?? []
  }

  return {
    ensureItemTypes,
    ensurePreferredItems,
    ensureEstimates,
    ensureEstimateItems,
    ensureProjectResources,
    ensureCostCodeConfigurations,
    getEstimateItems,
    getEstimatesByProject,
    getEstimateItemsLoading,
    getEstimateItemsError,
    getProjectState,
    getItemTypes,
    getPreferredItems,
    getEstimates,
    getCostCodeConfigurations,
    clearProject,
    clear,
    estimateKey,
    projectKey,
  }
})
