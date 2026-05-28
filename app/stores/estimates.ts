import { defineStore } from 'pinia'
import { useCorporationStore } from '~/stores/corporations'

export interface EstimateLineItem {
  cost_code_uuid: string
  cost_code_number: string
  cost_code_name: string
  division_name: string
  description: string
  labor_amount: number
  material_amount: number
  total_amount: number
  estimation_type: string
  labor_amount_per_room?: number
  labor_rooms_count?: number
  labor_amount_per_sqft?: number
  labor_sq_ft_count?: number
  labor_number_of_hours?: number
  labor_hourly_wage?: number
  is_sub_cost_code?: boolean
  is_sub_sub_cost_code?: boolean
  parent_cost_code_uuid?: string
}

export interface EstimateAttachment {
  file_name: string
  file_size: number
  file_url: string
}

export interface Estimate {
  id?: string
  uuid?: string
  estimate_number: string
  project_uuid: string
  corporation_uuid: string
  estimate_date: string | null
  valid_until?: string | null
  status: 'Draft' | 'Ready' | 'Approved' | 'Rejected' | 'Expired'
  total_amount: number
  tax_amount?: number
  discount_amount?: number
  final_amount: number
  notes?: string | null
  line_items: EstimateLineItem[]
  attachments: EstimateAttachment[]
  removed_cost_code_uuids?: string[]
  audit_log?: any[]
  created_by?: string | null
  approved_by?: string | null
  approved_at?: string | null
  created_at?: string | null
  updated_at?: string | null
  is_active?: boolean
  project?: {
    uuid: string
    project_name: string
    project_id: string
  } | null
}

export interface CreateEstimatePayload {
  estimate_number?: string
  project_uuid: string
  corporation_uuid: string
  estimate_date: string
  valid_until?: string
  status?: string
  total_amount: number
  tax_amount?: number
  discount_amount?: number
  final_amount: number
  notes?: string
  line_items: EstimateLineItem[]
  attachments?: EstimateAttachment[]
  removed_cost_code_uuids?: string[]
}

export interface UpdateEstimatePayload {
  uuid: string
  estimate_number?: string
  estimate_date?: string
  valid_until?: string
  status?: string
  total_amount?: number
  tax_amount?: number
  discount_amount?: number
  final_amount?: number
  notes?: string
  line_items?: EstimateLineItem[]
  attachments?: EstimateAttachment[]
  removed_cost_code_uuids?: string[]
}

export interface PaginationInfo {
  page: number
  pageSize: number
  totalRecords: number
  totalPages: number
  hasMore: boolean
}

export const useEstimatesStore = defineStore('estimates', () => {
  const estimates = ref<Estimate[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const paginationInfo = ref<Record<string, PaginationInfo>>({})

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function getUserInfo() {
    try {
      const { useAuthStore } = require('~/stores/auth')
      const authStore = useAuthStore()
      const user = authStore.user
      if (!user) return null
      return {
        user_id: user.id || '',
        user_name: user.user_metadata?.full_name
          || `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim()
          || user.email?.split('@')[0]
          || 'Unknown User',
        user_email: user.email || '',
        user_image_url: user.user_metadata?.avatar_url || user.user_metadata?.image_url || null,
      }
    }
    catch { return null }
  }

  // ── Actions ──────────────────────────────────────────────────────────────────
  const fetchEstimates = async (corporationUuid: string) => {
    if (!corporationUuid) return
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<{ data: Estimate[], pagination: PaginationInfo }>(
        '/api/estimates',
        { query: { corporation_uuid: corporationUuid } },
      )
      estimates.value = response?.data || []
      if (response?.pagination) paginationInfo.value[corporationUuid] = response.pagination
    }
    catch (err: any) {
      error.value = err.message || 'Failed to fetch estimates'
    }
    finally {
      loading.value = false
    }
  }

  const refreshEstimatesFromAPI = fetchEstimates

  const createEstimate = async (payload: CreateEstimatePayload): Promise<boolean> => {
    loading.value = true
    error.value = null
    try {
      const userInfo = getUserInfo()
      const response = await $fetch<{ data: Estimate }>('/api/estimates', {
        method: 'POST',
        body: { ...payload, ...(userInfo || {}) },
      })
      if (response?.data) {
        const corpStore = useCorporationStore()
        if (response.data.corporation_uuid === corpStore.selectedCorporationId) {
          estimates.value.unshift(response.data)
        }
        return true
      }
      throw new Error('Failed to create estimate — no data returned')
    }
    catch (err: any) {
      error.value = err.message || 'Failed to create estimate'
      return false
    }
    finally {
      loading.value = false
    }
  }

  const updateEstimate = async (payload: UpdateEstimatePayload): Promise<boolean> => {
    loading.value = true
    error.value = null
    try {
      const userInfo = getUserInfo()
      const response = await $fetch<{ data: Estimate }>(`/api/estimates/${payload.uuid}`, {
        method: 'PUT',
        body: { ...payload, ...(userInfo || {}) },
      })
      if (response?.data) {
        const corpStore = useCorporationStore()
        if (response.data.corporation_uuid === corpStore.selectedCorporationId) {
          const idx = estimates.value.findIndex(e => e.uuid === payload.uuid)
          if (idx !== -1) estimates.value[idx] = response.data
        }
        return true
      }
      throw new Error('Failed to update estimate — no data returned')
    }
    catch (err: any) {
      error.value = err.message || 'Failed to update estimate'
      return false
    }
    finally {
      loading.value = false
    }
  }

  const deleteEstimate = async (estimateUuid: string): Promise<boolean> => {
    loading.value = true
    error.value = null
    try {
      await $fetch(`/api/estimates/${estimateUuid}`, { method: 'DELETE' })
      estimates.value = estimates.value.filter(e => e.uuid !== estimateUuid)
      return true
    }
    catch (err: any) {
      error.value = err.message || err.statusMessage || 'Failed to delete estimate'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const getEstimateByUuid = (uuid: string): Estimate | undefined =>
    estimates.value.find(e => e.uuid === uuid)

  const getEstimateByUuidFromAPI = async (_corporationUuid: string, uuid: string): Promise<Estimate | null> => {
    try {
      const response = await $fetch<{ data: Estimate }>(`/api/estimates/${uuid}`)
      return response?.data || null
    }
    catch { return null }
  }

  const getEstimatesByProject = (projectUuid: string): Estimate[] =>
    estimates.value.filter(e => e.project_uuid === projectUuid)

  const getEstimatesByStatus = (status: string): Estimate[] =>
    estimates.value.filter(e => e.status === status)

  const getPaginationInfo = (corporationUuid: string): PaginationInfo | null =>
    paginationInfo.value[corporationUuid] || null

  const clearEstimates = () => {
    estimates.value = []
    error.value = null
  }

  return {
    estimates: readonly(estimates),
    loading: readonly(loading),
    error: readonly(error),
    paginationInfo: readonly(paginationInfo),
    fetchEstimates,
    refreshEstimatesFromAPI,
    createEstimate,
    updateEstimate,
    deleteEstimate,
    getEstimateByUuid,
    getEstimateByUuidFromDB: getEstimateByUuidFromAPI,
    getEstimatesByProject,
    getEstimatesByStatus,
    getPaginationInfo,
    clearEstimates,
  }
})
