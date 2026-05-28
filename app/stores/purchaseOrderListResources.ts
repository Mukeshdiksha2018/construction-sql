import { defineStore } from 'pinia'
import { reactive, computed } from 'vue'

type Nullable<T> = T | null | undefined

interface CorporationProjectsState {
  corporationUuid: string
  projects: any[]
  vendors: any[]
  loading: boolean
  vendorsLoading: boolean
  loaded: boolean
  vendorsLoaded: boolean
  fetchedAt: number | null
  vendorsFetchedAt: number | null
}

export const usePurchaseOrderListResourcesStore = defineStore(
  'purchaseOrderListResources',
  () => {
    const corporationProjects = reactive<Record<string, CorporationProjectsState>>({})
    const inFlightEnsures = new Map<string, Promise<any[]>>()
    const inFlightVendorEnsures = new Map<string, Promise<any[]>>()

    const getOrCreateCorporationState = (corporationUuid: string) => {
      if (!corporationProjects[corporationUuid]) {
        corporationProjects[corporationUuid] = {
          corporationUuid,
          projects: [],
          vendors: [],
          loading: false,
          vendorsLoading: false,
          loaded: false,
          vendorsLoaded: false,
          fetchedAt: null,
          vendorsFetchedAt: null,
        }
      }
      return corporationProjects[corporationUuid]
    }

    const ensureProjects = async ({ corporationUuid, force = false }: { corporationUuid: string; force?: boolean }) => {
      if (!corporationUuid) return []
      const state = getOrCreateCorporationState(corporationUuid)
      if (state.loaded && !force) return state.projects
      if (!force) {
        const existing = inFlightEnsures.get(corporationUuid)
        if (existing) return existing
      } else {
        inFlightEnsures.delete(corporationUuid)
      }

      const run = async (): Promise<any[]> => {
        state.loading = true
        try {
          const response: any = await $fetch('/api/projects/options', {
            query: { corporation_uuid: corporationUuid },
          })
          state.projects = Array.isArray(response?.data) ? response.data.map((p: any) => ({ ...p, is_active: true })) : []
          state.loaded = true
          state.fetchedAt = Date.now()
        } catch (err) {
          console.error('[PO List Resources] Failed to load projects', err)
          if (force) { state.projects = []; state.loaded = false }
        } finally {
          state.loading = false
          inFlightEnsures.delete(corporationUuid)
        }
        return state.projects
      }

      const promise = run()
      if (!force) inFlightEnsures.set(corporationUuid, promise)
      return promise
    }

    const ensureVendors = async ({ corporationUuid, force = false }: { corporationUuid: string; force?: boolean }) => {
      if (!corporationUuid) return []
      const state = getOrCreateCorporationState(corporationUuid)
      if (state.vendorsLoaded && !force) return state.vendors
      if (!force) {
        const existing = inFlightVendorEnsures.get(corporationUuid)
        if (existing) return existing
      } else {
        inFlightVendorEnsures.delete(corporationUuid)
      }

      const run = async (): Promise<any[]> => {
        state.vendorsLoading = true
        try {
          const response: any = await $fetch('/api/purchase-orders/vendors', {
            query: { corporation_uuid: corporationUuid },
          })
          state.vendors = Array.isArray(response?.data) ? response.data.map((v: any) => ({ ...v })) : []
          state.vendorsLoaded = true
          state.vendorsFetchedAt = Date.now()
        } catch (err) {
          console.error('[PO List Resources] Failed to load vendors', err)
          if (force) { state.vendors = []; state.vendorsLoaded = false }
        } finally {
          state.vendorsLoading = false
          inFlightVendorEnsures.delete(corporationUuid)
        }
        return state.vendors
      }

      const promise = run()
      if (!force) inFlightVendorEnsures.set(corporationUuid, promise)
      return promise
    }

    const getCorporationState = computed(() => {
      return (corporationUuid?: Nullable<string>) => {
        if (!corporationUuid) return null
        return corporationProjects[corporationUuid] || null
      }
    })

    const getProjects = computed(() => {
      return (corporationUuid?: Nullable<string>) => {
        const state = getCorporationState.value(corporationUuid)
        return state?.projects ?? []
      }
    })

    const getProjectsLoading = computed(() => {
      return (corporationUuid?: Nullable<string>) => {
        const state = getCorporationState.value(corporationUuid)
        return state?.loading ?? false
      }
    })

    const getVendors = computed(() => {
      return (corporationUuid?: Nullable<string>) => {
        const state = getCorporationState.value(corporationUuid)
        return state?.vendors ?? []
      }
    })

    const getVendorsLoading = computed(() => {
      return (corporationUuid?: Nullable<string>) => {
        const state = getCorporationState.value(corporationUuid)
        return state?.vendorsLoading ?? false
      }
    })

    const clearCorporation = (corporationUuid?: Nullable<string>) => {
      if (corporationUuid && corporationProjects[corporationUuid]) {
        inFlightEnsures.delete(corporationUuid)
        inFlightVendorEnsures.delete(corporationUuid)
        delete corporationProjects[corporationUuid]
      }
    }

    const clear = () => {
      inFlightEnsures.clear()
      inFlightVendorEnsures.clear()
      Object.keys(corporationProjects).forEach(key => delete corporationProjects[key])
    }

    return {
      ensureProjects,
      ensureVendors,
      getCorporationState,
      getProjects,
      getProjectsLoading,
      getVendors,
      getVendorsLoading,
      clearCorporation,
      clear,
    }
  }
)
