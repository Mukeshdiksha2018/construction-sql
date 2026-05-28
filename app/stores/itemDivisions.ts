import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface ItemDivision {
  id: number
  uuid: string
  created_at: string
  updated_at: string
  corporation_uuid: string
  category: string
  division_name: string
  is_active: boolean
}

export interface CreateItemDivisionPayload {
  corporation_uuid: string
  category: string
  division_name: string
  is_active?: boolean
}

export const useItemDivisionsStore = defineStore('itemDivisions', () => {
  const itemDivisions = ref<ItemDivision[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastFetchedCorporation = ref<string | null>(null)
  const hasDataForCorporation = ref<Set<string>>(new Set())

  const fetchItemDivisions = async (corporationUUID: string, forceRefresh = false) => {
    if (!forceRefresh && lastFetchedCorporation.value === corporationUUID && hasDataForCorporation.value.has(corporationUUID)) return

    loading.value = true
    error.value = null
    try {
      const response = await $fetch<any>(`/api/item-divisions?corporation_uuid=${corporationUUID}`)
      const newList = response?.data ?? []
      itemDivisions.value = [
        ...itemDivisions.value.filter(d => d.corporation_uuid !== corporationUUID),
        ...newList,
      ]
      lastFetchedCorporation.value = corporationUUID
      hasDataForCorporation.value.add(corporationUUID)
    } catch (err: any) {
      error.value = err?.message || 'Failed to fetch item divisions'
    } finally {
      loading.value = false
    }
  }

  const createItemDivision = async (payload: CreateItemDivisionPayload): Promise<ItemDivision | null> => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<any>('/api/item-divisions', { method: 'POST', body: payload })
      const newItem: ItemDivision = response?.data
      if (newItem) {
        itemDivisions.value = [...itemDivisions.value, newItem]
        return newItem
      }
      return null
    } catch (err: any) {
      error.value = err?.message || 'Failed to create item division'
      return null
    } finally {
      loading.value = false
    }
  }

  const getActiveItemDivisions = computed(() => {
    return (corporationUuid: string, category?: string) => {
      return itemDivisions.value.filter(d =>
        d.corporation_uuid === corporationUuid &&
        d.is_active &&
        (!category || d.category === category)
      )
    }
  })

  return {
    itemDivisions,
    loading,
    error,
    fetchItemDivisions,
    createItemDivision,
    getActiveItemDivisions,
  }
})
