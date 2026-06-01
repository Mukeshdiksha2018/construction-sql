import { defineStore } from 'pinia'

/** Ship-via master (freight charges live in `freightGlobal.ts`). */
export interface ShipVia {
  id: number
  uuid: string
  ship_via: string
  description: string | null
  active: boolean
  created_at: string
  updated_at: string
  created_by?: string | null
  updated_by?: string | null
}

export interface CreateShipViaData {
  ship_via: string
  description?: string | null
  active?: boolean
}

export interface UpdateShipViaData {
  ship_via: string
  description?: string | null
  active: boolean
}

export const useShipViaStore = defineStore('shipVia', {
  state: () => ({
    shipVia: [] as ShipVia[],
    loading: false,
    error: null as string | null,
  }),
  getters: {
    getAllShipVia: (state) => state.shipVia,
    getActiveShipVia: (state) => state.shipVia.filter((f) => f.active === true),
    getShipViaByUuid: (state) => (uuid: string) => state.shipVia.find((f) => f.uuid === uuid),
  },
  actions: {
    async fetchShipVia(_force = false) {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<{ data: ShipVia[] }>('/api/ship-via', { credentials: 'include' })
        this.shipVia = Array.isArray(response) ? response : (response?.data ?? [])
      }
      catch (e: unknown) {
        const err = e as { data?: { statusMessage?: string }; message?: string }
        this.error = err?.data?.statusMessage || err?.message || 'Failed to fetch ship via'
        throw e
      }
      finally {
        this.loading = false
      }
    },
    async createShipVia(payload: CreateShipViaData) {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<{ data: ShipVia }>('/api/ship-via', { method: 'POST', body: payload, credentials: 'include' })
        const data = (response as any)?.data || response as any
        if (data) this.shipVia.push(data)
        return data
      }
      catch (e: unknown) {
        const err = e as { data?: { statusMessage?: string }; message?: string }
        this.error = err?.data?.statusMessage || err?.message || 'Failed to create ship via'
        throw e
      }
      finally {
        this.loading = false
      }
    },
    async updateShipVia(uuid: string, payload: UpdateShipViaData) {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<{ data: ShipVia }>(`/api/ship-via/${uuid}`, { method: 'PUT', body: payload, credentials: 'include' })
        const data = (response as any)?.data || response as any
        if (data) {
          const idx = this.shipVia.findIndex((f) => f.uuid === uuid)
          if (idx !== -1) this.shipVia[idx] = data
        }
        return data
      }
      catch (e: unknown) {
        const err = e as { data?: { statusMessage?: string }; message?: string }
        this.error = err?.data?.statusMessage || err?.message || 'Failed to update ship via'
        throw e
      }
      finally {
        this.loading = false
      }
    },
    async deleteShipVia(uuid: string) {
      this.loading = true
      this.error = null
      try {
        await $fetch(`/api/ship-via/${uuid}`, { method: 'DELETE', credentials: 'include' })
        this.shipVia = this.shipVia.filter((f) => f.uuid !== uuid)
      }
      catch (e: unknown) {
        const err = e as { data?: { statusMessage?: string }; message?: string }
        this.error = err?.data?.statusMessage || err?.message || 'Failed to delete ship via'
        throw e
      }
      finally {
        this.loading = false
      }
    },
    clearShipVia() {
      this.shipVia = []
    },
  },
})
