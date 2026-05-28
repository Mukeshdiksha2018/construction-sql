import { defineStore } from 'pinia'

/** Shape returned by GET /api/nimble/uom (raw Nimble DTO) */
interface NimbleUOMDTO {
  ID: string
  ClientID: string
  UOMType: string
  UOMName: string
  ShortName: string
  Status: number
}

/** Normalised shape stored in the Pinia state */
export interface UOMItem {
  uuid: string
  name: string
  short_name: string
  uom_type_uuid: string
  /** 'ACTIVE' when Nimble Status === 1, otherwise 'INACTIVE' */
  status: 'ACTIVE' | 'INACTIVE'
}

function normalise(dto: NimbleUOMDTO): UOMItem {
  return {
    uuid: dto.ID,
    name: dto.UOMName,
    short_name: dto.ShortName,
    uom_type_uuid: dto.UOMType,
    status: dto.Status === 1 ? 'ACTIVE' : 'INACTIVE',
  }
}

export const useUOMStore = defineStore('uom', {
  state: () => ({
    uom: [] as UOMItem[],
    loading: false,
    loaded: false,
    error: null as string | null,
  }),

  getters: {
    /**
     * Returns all active UOMs (optionally filtered by corporation, though the
     * Nimble UOM list is global so corporationUuid is accepted but not used).
     */
    getActiveUOM: (state) => (_corporationUuid?: string): UOMItem[] =>
      state.uom.filter(u => u.status === 'ACTIVE'),

    /** Look up a UOM by its Nimble ID (UUID) */
    getUOMById: (state) => (id: string): UOMItem | undefined =>
      state.uom.find(u => u.uuid === id),

    /** Returns the short name for a given UUID – useful for display in read-only tables */
    getShortName: (state) => (id: string): string => {
      const found = state.uom.find(u => u.uuid === id)
      return found ? found.short_name || found.name : id
    },
  },

  actions: {
    /**
     * Fetch UOM list from the Nimble proxy endpoint.
     * Results are cached in state; pass forceRefresh = true to bypass the cache.
     * The corporationUuid argument is accepted for API compatibility but is not
     * forwarded – the Nimble UOM list is corporation-agnostic.
     */
    async fetchUOM(_corporationUuid?: string, forceRefresh = false) {
      // Skip on SSR
      if (import.meta.server) return
      // Use cache if available and not forced
      if (!forceRefresh && this.loaded && this.uom.length > 0) return

      this.loading = true
      this.error = null

      try {
        const data = await $fetch<{ uom: NimbleUOMDTO[] }>('/api/nimble/uom', {
          credentials: 'include',
        })

        this.uom = (data.uom ?? []).map(normalise)
        this.loaded = true
      }
      catch (err: unknown) {
        const e = err as Record<string, unknown>
        this.error = (e?.data as Record<string, unknown>)?.statusMessage as string
          || (e?.statusMessage as string)
          || (err as Error)?.message
          || 'Failed to fetch UOM list'
      }
      finally {
        this.loading = false
      }
    },

    /** Invalidate the cache and re-fetch */
    async refresh() {
      await this.fetchUOM(undefined, true)
    },

    clear() {
      this.uom = []
      this.loaded = false
      this.error = null
      this.loading = false
    },

    // Legacy stubs (kept for API compatibility with any other callers)
    async createUOM(_corporationUuid: string | null, _payload: unknown) {
      return null
    },
    async createUOMViaNimble(_payload: unknown) {
      return null
    },
  },
})
