import { defineStore } from 'pinia'

export interface ProjectAddress {
  uuid: string
  project_uuid: string
  address_type: string
  contact_person?: string | null
  email?: string | null
  phone?: string | null
  address_line_1: string
  address_line_2?: string | null
  city?: string | null
  state?: string | null
  zip_code?: string | null
  country?: string | null
  is_primary: boolean
  is_active?: boolean
  copied_from_billing_address_uuid?: string | null
  created_at?: string
  updated_at?: string
  tempId?: string
}

export interface CreateAddressPayload {
  project_uuid: string
  address_type: string
  contact_person?: string | null
  email?: string | null
  phone?: string | null
  address_line_1: string
  address_line_2?: string | null
  city?: string | null
  state?: string | null
  zip_code?: string | null
  country?: string | null
  is_primary?: boolean
  copied_from_billing_address_uuid?: string | null
}

export interface UpdateAddressPayload {
  uuid: string
  address_type?: string
  contact_person?: string | null
  email?: string | null
  phone?: string | null
  address_line_1?: string
  address_line_2?: string | null
  city?: string | null
  state?: string | null
  zip_code?: string | null
  country?: string | null
  is_primary?: boolean
  copied_from_billing_address_uuid?: string | null
  project_uuid?: string
}

export const useProjectAddressesStore = defineStore('projectAddresses', {
  state: () => ({
    addressesByProject: {} as Record<string, ProjectAddress[]>,
    loading: false,
    error: null as string | null,
  }),

  getters: {
    getAddresses: (state) => (projectUuid: string): ProjectAddress[] => {
      return state.addressesByProject[projectUuid] ?? []
    },
  },

  actions: {
    async fetchAddresses(projectUuid: string) {
      if (!projectUuid) return
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<{ data: ProjectAddress[] }>('/api/projects/addresses', {
          query: { project_uuid: projectUuid },
          credentials: 'include',
        })
        this.addressesByProject = {
          ...this.addressesByProject,
          [projectUuid]: response?.data ?? [],
        }
      } catch (e: any) {
        this.error = e?.data?.statusMessage || e?.message || 'Failed to fetch addresses'
        this.addressesByProject = { ...this.addressesByProject, [projectUuid]: [] }
      } finally {
        this.loading = false
      }
    },

    async createAddress(payload: CreateAddressPayload): Promise<ProjectAddress | null> {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<{ data: ProjectAddress }>('/api/projects/addresses', {
          method: 'POST',
          body: payload,
          credentials: 'include',
        })
        const address = response?.data
        if (address && payload.project_uuid) {
          const existing = this.addressesByProject[payload.project_uuid] ?? []
          this.addressesByProject = {
            ...this.addressesByProject,
            [payload.project_uuid]: [...existing, address],
          }
        }
        return address ?? null
      } catch (e: any) {
        this.error = e?.data?.statusMessage || e?.message || 'Failed to create address'
        return null
      } finally {
        this.loading = false
      }
    },

    async updateAddress(payload: UpdateAddressPayload): Promise<ProjectAddress | null> {
      if (!payload.uuid) return null
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<{ data: ProjectAddress }>(`/api/projects/addresses/${payload.uuid}`, {
          method: 'PUT',
          body: payload,
          credentials: 'include',
        })
        const updated = response?.data
        if (updated) {
          const projectUuid = updated.project_uuid || payload.project_uuid
          if (projectUuid) {
            const existing = this.addressesByProject[projectUuid] ?? []
            this.addressesByProject = {
              ...this.addressesByProject,
              [projectUuid]: existing.map(a => a.uuid === updated.uuid ? updated : a),
            }
          }
        }
        return updated ?? null
      } catch (e: any) {
        this.error = e?.data?.statusMessage || e?.message || 'Failed to update address'
        return null
      } finally {
        this.loading = false
      }
    },

    async deleteAddress(uuid: string, projectUuid: string): Promise<boolean> {
      this.loading = true
      this.error = null
      try {
        await $fetch(`/api/projects/addresses/${uuid}`, {
          method: 'DELETE',
          credentials: 'include',
        })
        if (projectUuid) {
          const existing = this.addressesByProject[projectUuid] ?? []
          this.addressesByProject = {
            ...this.addressesByProject,
            [projectUuid]: existing.filter(a => a.uuid !== uuid),
          }
        }
        return true
      } catch (e: any) {
        this.error = e?.data?.statusMessage || e?.message || 'Failed to delete address'
        return false
      } finally {
        this.loading = false
      }
    },

    async checkAddressUsage(uuid: string): Promise<{ inUse: boolean; purchaseOrderCount: number; changeOrderCount: number }> {
      try {
        const response = await $fetch<{ inUse: boolean; purchaseOrderCount: number; changeOrderCount: number }>(
          `/api/projects/addresses/${uuid}/usage`,
          { credentials: 'include' }
        )
        return response ?? { inUse: false, purchaseOrderCount: 0, changeOrderCount: 0 }
      } catch {
        return { inUse: false, purchaseOrderCount: 0, changeOrderCount: 0 }
      }
    },

    clearProjectAddresses(projectUuid: string) {
      const { [projectUuid]: _, ...rest } = this.addressesByProject
      this.addressesByProject = rest
    },
  },
})
