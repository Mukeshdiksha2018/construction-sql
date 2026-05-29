import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface SpecialInstruction {
  id?: number
  uuid?: string
  corporation_uuid: string
  project_uuid: string
  project_name?: string | null
  project_id?: string | null
  name: string
  content: string
  isActive: boolean
  created_at?: string
  updated_at?: string
}

export const useSpecialInstructionsStore = defineStore('specialInstructions', () => {
  const items = ref<SpecialInstruction[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchList = async (params?: { corporation_uuid?: string; project_uuid?: string }) => {
    if (import.meta.server) return

    const c = String(params?.corporation_uuid ?? '').trim()
    const p = String(params?.project_uuid ?? '').trim()

    if (!c) {
      items.value = []
      return
    }

    loading.value = true
    error.value = null
    try {
      const query: Record<string, string> = { corporation_uuid: c }
      if (p) query.project_uuid = p
      const { data } = await $fetch<{ success: boolean; data: SpecialInstruction[] }>(
        '/api/special-instructions',
        { query },
      )
      items.value = Array.isArray(data) ? data : []
    } catch (err: unknown) {
      const e = err as { message?: string }
      error.value = e.message || 'Failed to fetch special instructions'
      items.value = []
    } finally {
      loading.value = false
    }
  }

  const createItem = async (
    payload: Pick<SpecialInstruction, 'corporation_uuid' | 'project_uuid' | 'name' | 'content' | 'isActive'>,
  ) => {
    loading.value = true
    error.value = null
    try {
      const { data } = await $fetch<{ success: boolean; data: SpecialInstruction }>(
        '/api/special-instructions',
        {
          method: 'POST',
          body: {
            corporation_uuid: payload.corporation_uuid,
            project_uuid: payload.project_uuid,
            name: payload.name,
            content: payload.content,
            isActive: payload.isActive,
          },
        },
      )
      if (data) {
        items.value.unshift(data)
      }
      return data
    } catch (err: unknown) {
      const e = err as { data?: { message?: string }; message?: string }
      error.value = e.data?.message || e.message || 'Failed to create'
      throw err
    } finally {
      loading.value = false
    }
  }

  const clearItems = () => {
    items.value = []
  }

  return {
    items,
    loading,
    error,
    fetchList,
    clearItems,
    createItem,
  }
})
