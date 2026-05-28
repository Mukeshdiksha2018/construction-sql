import { defineStore } from 'pinia'
import { ref, readonly } from 'vue'

export interface ItemType {
  id: number
  uuid: string
  created_at: string
  updated_at: string
  corporation_uuid?: string | null
  category: string
  spec_type?: string
  item_division_uuid: string | null
  item_type: string
  description?: string | null
  is_active: boolean
}

export interface CreateItemTypePayload {
  corporation_uuid?: string | null
  category: string
  spec_type: string
  item_division_uuid?: string | null
  item_type: string
  description?: string | null
  is_active?: boolean
}

export interface UpdateItemTypePayload extends Partial<CreateItemTypePayload> {
  uuid: string
}

interface ItemTypeResponse {
  data: ItemType
  error?: string
}

interface ItemTypesResponse {
  data: ItemType[]
  error?: string
}

export const useItemTypesStore = defineStore(
  'itemTypes',
  () => {
    const itemTypes = ref<ItemType[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)

    const lastFetchedCorporation = ref<string | null>(null)
    const hasDataForCorporation = ref<Set<string>>(new Set())

    const extractApiErrorMessage = (err: unknown, fallback: string): string => {
      const e = err as Record<string, unknown>
      const statusMessage =
        (e?.data as Record<string, unknown>)?.statusMessage as string
        || (e?.statusMessage as string)
        || ((e?.response as Record<string, unknown>)?._data as Record<string, unknown>)?.statusMessage as string
      if (typeof statusMessage === 'string' && statusMessage.trim()) return statusMessage.trim()

      const code = Number((e?.statusCode) || (e?.status) || ((e?.response as Record<string, unknown>)?.status) || 0)
      if (code === 409) return 'Duplicate item type already exists for this category and spec type'

      const msg = e?.message as string
      if (typeof msg === 'string' && msg.trim()) return msg.trim()
      return fallback
    }

    const shouldFetchData = (corporationUUID?: string): boolean => {
      const cacheKey = corporationUUID ? corporationUUID.toLowerCase() : '__global__'
      if (lastFetchedCorporation.value !== cacheKey) return true
      return !hasDataForCorporation.value.has(cacheKey)
    }

    const fetchItemTypes = async (corporationUUID?: string, forceRefresh = false): Promise<void> => {
      const id = corporationUUID ? corporationUUID.toLowerCase() : undefined
      const cacheKey = id || '__global__'
      if (!forceRefresh && !shouldFetchData(id)) return
      if (import.meta.server) return

      loading.value = true
      error.value = null
      try {
        const url = id
          ? `/api/item-types?corporation_uuid=${id}`
          : '/api/item-types'
        const response = await $fetch<ItemTypesResponse>(url)
        if (response?.error) throw new Error(response.error)

        const newItemTypes = response?.data || []

        if (id && lastFetchedCorporation.value && lastFetchedCorporation.value !== cacheKey) {
          itemTypes.value = itemTypes.value.filter(
            it => !it.corporation_uuid || it.corporation_uuid.toLowerCase() !== lastFetchedCorporation.value,
          )
        }

        if (id) {
          itemTypes.value = [
            ...itemTypes.value.filter(it => !it.corporation_uuid || it.corporation_uuid.toLowerCase() !== id),
            ...newItemTypes,
          ]
        }
        else {
          itemTypes.value = [...newItemTypes]
        }

        lastFetchedCorporation.value = cacheKey
        hasDataForCorporation.value.add(cacheKey)
      }
      catch (err: unknown) {
        const e = err as Error
        error.value = e.message || 'Failed to fetch item types'
        if (id && lastFetchedCorporation.value === cacheKey) {
          itemTypes.value = itemTypes.value.filter(
            it => !it.corporation_uuid || it.corporation_uuid.toLowerCase() !== id,
          )
        }
        hasDataForCorporation.value.delete(cacheKey)
      }
      finally {
        loading.value = false
      }
    }

    const hasCachedData = (corporationUUID?: string): boolean => {
      return hasDataForCorporation.value.has(corporationUUID || '__global__')
    }

    const fetchItemType = async (uuid: string): Promise<ItemType | null> => {
      loading.value = true
      error.value = null
      try {
        const response = await $fetch<ItemTypeResponse>(`/api/item-types/${uuid}`)
        if (response?.error) throw new Error(response.error)
        return response?.data || null
      }
      catch (err: unknown) {
        error.value = (err as Error).message || 'Failed to fetch item type'
        return null
      }
      finally {
        loading.value = false
      }
    }

    const createItemType = async (itemTypeData: CreateItemTypePayload): Promise<ItemType | null> => {
      loading.value = true
      error.value = null
      try {
        const response = await $fetch<ItemTypeResponse>('/api/item-types', {
          method: 'POST',
          body: itemTypeData,
        })
        if (response?.error) throw new Error(response.error)

        const newItemType = response?.data
        if (newItemType) {
          itemTypes.value.unshift(newItemType)
        }
        return newItemType || null
      }
      catch (err: unknown) {
        error.value = extractApiErrorMessage(err, 'Failed to create item type')
        return null
      }
      finally {
        loading.value = false
      }
    }

    const updateItemType = async (itemTypeData: UpdateItemTypePayload): Promise<ItemType | null> => {
      loading.value = true
      error.value = null
      try {
        const response = await $fetch<ItemTypeResponse>(`/api/item-types/${itemTypeData.uuid}`, {
          method: 'PUT',
          body: itemTypeData,
        })
        if (response?.error) throw new Error(response.error)

        const updated = response?.data
        if (updated) {
          const idx = itemTypes.value.findIndex(it => it.uuid === updated.uuid)
          if (idx !== -1) itemTypes.value[idx] = updated
        }
        return updated || null
      }
      catch (err: unknown) {
        error.value = extractApiErrorMessage(err, 'Failed to update item type')
        return null
      }
      finally {
        loading.value = false
      }
    }

    const deleteItemType = async (uuid: string): Promise<boolean> => {
      loading.value = true
      error.value = null
      try {
        await $fetch(`/api/item-types/${uuid}`, { method: 'DELETE' })
        const idx = itemTypes.value.findIndex(it => it.uuid === uuid)
        if (idx !== -1) itemTypes.value.splice(idx, 1)
        return true
      }
      catch (err: unknown) {
        error.value = (err as Error).message || 'Failed to delete item type'
        return false
      }
      finally {
        loading.value = false
      }
    }

    const getActiveItemTypes = (corporationUuid?: string): ItemType[] => {
      return itemTypes.value.filter((it) => {
        if (!it.is_active) return false
        if (!corporationUuid) return true
        const corp = it.corporation_uuid
        return !corp || corp === corporationUuid
      })
    }

    const searchItemTypes = (query: string, corporationUuid?: string): ItemType[] => {
      if (!query.trim()) return getActiveItemTypes(corporationUuid)
      const lq = query.toLowerCase()
      return getActiveItemTypes(corporationUuid).filter(
        it => it.item_type.toLowerCase().includes(lq)
          || (it.description || '').toLowerCase().includes(lq),
      )
    }

    const getItemTypeById = (uuid: string): ItemType | undefined => {
      const id = uuid?.toLowerCase()
      return itemTypes.value.find(it => it.uuid?.toLowerCase() === id)
    }

    const clearData = () => {
      itemTypes.value = []
      error.value = null
      lastFetchedCorporation.value = null
      hasDataForCorporation.value.clear()
    }

    const clearCache = (corporationUUID: string) => {
      hasDataForCorporation.value.delete(corporationUUID)
      if (lastFetchedCorporation.value === corporationUUID) lastFetchedCorporation.value = null
    }

    const clearError = () => { error.value = null }
    const clearItemTypes = () => { itemTypes.value = [] }
    const setItemTypes = (newItemTypes: ItemType[]) => { itemTypes.value = newItemTypes }

    return {
      itemTypes: readonly(itemTypes),
      loading: readonly(loading),
      error: readonly(error),

      fetchItemTypes,
      fetchItemType,
      createItemType,
      updateItemType,
      deleteItemType,
      hasCachedData,
      clearData,
      clearCache,
      clearError,
      clearItemTypes,
      setItemTypes,

      getActiveItemTypes,
      searchItemTypes,
      getItemTypeById,
    }
  },
  {
    persist: {
      storage: typeof window !== 'undefined' ? localStorage : undefined,
      paths: ['lastFetchedCorporation', 'hasDataForCorporation'],
    },
  },
)
