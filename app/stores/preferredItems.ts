import { defineStore } from 'pinia'
import { ref, readonly } from 'vue'

export interface PreferredItem {
  id: number
  uuid: string
  corporation_uuid: string
  project_uuid: string | null
  cost_code_configuration_uuid: string | null
  item_type_uuid: string | null
  category: string | null
  item_name: string
  unit_price: number | null
  uom_uuid: string | null
  description: string | null
  status: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreatePreferredItemPayload {
  corporation_uuid: string
  project_uuid?: string | null
  cost_code_configuration_uuid?: string | null
  item_type_uuid?: string | null
  category?: string | null
  item_name: string
  unit_price?: number | null
  uom_uuid?: string | null
  description?: string | null
  status?: string
  is_active?: boolean
}

interface ItemResponse {
  data: PreferredItem
}

interface ItemsResponse {
  data: PreferredItem[]
}

export const usePreferredItemsStore = defineStore('preferredItems', () => {
  const items = ref<PreferredItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchItems = async (corporationUuid: string, projectUuid?: string): Promise<void> => {
    if (!corporationUuid || import.meta.server) return
    loading.value = true
    error.value = null
    try {
      const url = projectUuid
        ? `/api/preferred-items?corporation_uuid=${corporationUuid}&project_uuid=${projectUuid}`
        : `/api/preferred-items?corporation_uuid=${corporationUuid}`
      const response = await $fetch<ItemsResponse>(url)
      items.value = response?.data || []
    }
    catch (err: unknown) {
      error.value = (err as Error).message || 'Failed to fetch items'
    }
    finally {
      loading.value = false
    }
  }

  const createItem = async (payload: CreatePreferredItemPayload): Promise<PreferredItem | null> => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<ItemResponse>('/api/preferred-items', { method: 'POST', body: payload })
      const created = response?.data
      if (created) items.value.unshift(created)
      return created || null
    }
    catch (err: unknown) {
      const e = err as Record<string, unknown>
      error.value = (e?.data as Record<string, unknown>)?.statusMessage as string
        || (e?.statusMessage as string)
        || (err as Error).message
        || 'Failed to create item'
      return null
    }
    finally {
      loading.value = false
    }
  }

  const updateItem = async (uuid: string, payload: Partial<CreatePreferredItemPayload>): Promise<PreferredItem | null> => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<ItemResponse>(`/api/preferred-items/${uuid}`, { method: 'PUT', body: payload })
      const updated = response?.data
      if (updated) {
        const idx = items.value.findIndex(i => i.uuid === uuid)
        if (idx !== -1) items.value[idx] = updated
      }
      return updated || null
    }
    catch (err: unknown) {
      error.value = (err as Error).message || 'Failed to update item'
      return null
    }
    finally {
      loading.value = false
    }
  }

  const deleteItem = async (uuid: string): Promise<boolean> => {
    loading.value = true
    error.value = null
    try {
      await $fetch(`/api/preferred-items/${uuid}`, { method: 'DELETE' })
      const idx = items.value.findIndex(i => i.uuid === uuid)
      if (idx !== -1) items.value.splice(idx, 1)
      return true
    }
    catch (err: unknown) {
      error.value = (err as Error).message || 'Failed to delete item'
      return false
    }
    finally {
      loading.value = false
    }
  }

  const clearData = () => {
    items.value = []
    error.value = null
  }

  return {
    items: readonly(items),
    loading: readonly(loading),
    error: readonly(error),
    fetchItems,
    createItem,
    updateItem,
    deleteItem,
    clearData,
  }
})
