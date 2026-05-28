import { defineStore } from 'pinia'
import { computed, readonly, ref } from 'vue'

export interface StockReturnNote {
  id?: number | string
  uuid: string
  corporation_uuid: string
  project_uuid?: string | null
  purchase_order_uuid?: string | null
  change_order_uuid?: string | null
  return_type?: 'purchase_order' | 'change_order' | string
  entry_date: string | null
  return_note_number: string
  reference_number?: string | null
  location_uuid?: string | null
  notes?: string | null
  status: 'Waiting' | 'Returned' | string
  total_return_amount?: number | null
  attachments?: any[]
  metadata?: Record<string, any> | null
  audit_log?: any[]
  is_active?: boolean
  created_at: string
  updated_at: string
}

export interface CreateStockReturnNotePayload extends Partial<StockReturnNote> {
  corporation_uuid: string
  entry_date?: string | null
}

export interface UpdateStockReturnNotePayload extends Partial<CreateStockReturnNotePayload> {
  uuid: string
}

const compareNotes = (a: StockReturnNote, b: StockReturnNote) => {
  const getTime = (note: StockReturnNote) => {
    const d = note.entry_date || note.created_at || null
    if (!d) return 0
    return new Date(d).getTime()
  }
  return getTime(b) - getTime(a)
}

const sortNotes = (notes: StockReturnNote[]) => [...notes].sort(compareNotes)

const normalizeReturnNumber = (n: string | null | undefined): string => {
  if (!n) return ''
  const numericPart = String(n).replace(/^RTN-/i, '')
  const num = parseInt(numericPart, 10)
  if (Number.isNaN(num)) return n
  return `RTN-${num}`
}

export const useStockReturnNotesStore = defineStore('stockReturnNotes', () => {
  const stockReturnNotes = ref<StockReturnNote[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastFetchedCorporation = ref<string | null>(null)
  const hasDataForCorporation = ref<Set<string>>(new Set())

  const replaceCorporationNotes = (corporationUuid: string, notes: StockReturnNote[]) => {
    const others = stockReturnNotes.value.filter(n => n.corporation_uuid !== corporationUuid)
    stockReturnNotes.value = sortNotes([...others, ...notes])
  }

  const getNotesForCorporation = (corporationUuid: string) =>
    stockReturnNotes.value.filter(n => n.corporation_uuid === corporationUuid)

  const fetchStockReturnNotes = async (
    corporationUuid: string,
    options: { force?: boolean; filters?: { project_uuid?: string; vendor_uuid?: string } } = {}
  ) => {
    if (!corporationUuid) return
    const { force = false, filters } = options
    const hasListFilters = Boolean(filters && Object.keys(filters).length > 0)

    let shouldFetch = force || hasListFilters
    if (!shouldFetch) {
      shouldFetch = !hasDataForCorporation.value.has(corporationUuid) || lastFetchedCorporation.value !== corporationUuid
    }
    if (!shouldFetch) return

    loading.value = true
    error.value = null
    try {
      const query: Record<string, string> = { corporation_uuid: corporationUuid }
      if (filters?.project_uuid) query.project_uuid = filters.project_uuid
      if (filters?.vendor_uuid) query.vendor_uuid = filters.vendor_uuid

      const response = await $fetch<any>('/api/stock-return-notes', { query })
      const notes: StockReturnNote[] = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : [])
      const normalized = notes.map(n => ({ ...n, return_note_number: normalizeReturnNumber(n.return_note_number) }))
      replaceCorporationNotes(corporationUuid, sortNotes(normalized))
      lastFetchedCorporation.value = corporationUuid
      hasDataForCorporation.value.add(corporationUuid)
    } catch (err: any) {
      console.error('[StockReturnNotes] fetch error:', err)
      error.value = err?.statusMessage || err?.message || 'Failed to fetch stock return notes'
    } finally {
      loading.value = false
    }
  }

  const getNoteByUuid = (uuid: string) =>
    stockReturnNotes.value.find(n => n.uuid === uuid) ?? null

  const generateNextReturnNumber = (corporationUuid: string): string => {
    const corpNotes = getNotesForCorporation(corporationUuid)
    let maxNum = 0
    for (const note of corpNotes) {
      const num = parseInt(String(note.return_note_number || '').replace(/^RTN-/i, ''), 10)
      if (!Number.isNaN(num)) maxNum = Math.max(maxNum, num)
    }
    return `RTN-${maxNum + 1}`
  }

  const createStockReturnNote = async (payload: CreateStockReturnNotePayload): Promise<StockReturnNote | null> => {
    if (!payload?.corporation_uuid) throw new Error('corporation_uuid is required')
    try {
      const response = await $fetch<any>('/api/stock-return-notes', { method: 'POST', body: payload })
      const newNote: StockReturnNote | null = response?.data ?? response ?? null
      if (newNote) {
        const normalized = { ...newNote, return_note_number: normalizeReturnNumber(newNote.return_note_number) }
        const corpUuid = normalized.corporation_uuid
        const existing = getNotesForCorporation(corpUuid).filter(n => n.uuid !== normalized.uuid)
        replaceCorporationNotes(corpUuid, sortNotes([normalized, ...existing]))
        lastFetchedCorporation.value = corpUuid
        hasDataForCorporation.value.add(corpUuid)
        return normalized
      }
      return null
    } catch (err: any) {
      const message = err?.statusMessage || err?.message || 'Failed to create return note'
      error.value = message
      throw new Error(message)
    }
  }

  const updateStockReturnNote = async (payload: UpdateStockReturnNotePayload): Promise<StockReturnNote | null> => {
    if (!payload?.uuid) throw new Error('uuid is required')
    const existingNote = getNoteByUuid(payload.uuid)
    const corporationUuid = payload.corporation_uuid || existingNote?.corporation_uuid
    if (!corporationUuid) throw new Error('corporation_uuid is required for update')
    try {
      const response = await $fetch<any>('/api/stock-return-notes', { method: 'PUT', body: payload })
      const updated: StockReturnNote | null = response?.data ?? response ?? null
      if (!updated) return null
      const normalized = { ...updated, return_note_number: normalizeReturnNumber(updated.return_note_number) }
      const corpNotes = getNotesForCorporation(corporationUuid).filter(n => n.uuid !== normalized.uuid)
      replaceCorporationNotes(corporationUuid, sortNotes([normalized, ...corpNotes]))
      lastFetchedCorporation.value = corporationUuid
      hasDataForCorporation.value.add(corporationUuid)
      return normalized
    } catch (err: any) {
      const message = err?.statusMessage || err?.message || 'Failed to update return note'
      error.value = message
      throw new Error(message)
    }
  }

  const deleteStockReturnNote = async (uuid: string): Promise<boolean> => {
    if (!uuid) return false
    const existing = getNoteByUuid(uuid)
    const corporationUuid = existing?.corporation_uuid
    try {
      await $fetch<any>('/api/stock-return-notes', { method: 'DELETE', query: { uuid } })
      if (corporationUuid) {
        replaceCorporationNotes(corporationUuid, getNotesForCorporation(corporationUuid).filter(n => n.uuid !== uuid))
      } else {
        stockReturnNotes.value = stockReturnNotes.value.filter(n => n.uuid !== uuid)
      }
      return true
    } catch (err: any) {
      const message = err?.statusMessage || err?.message || 'Failed to delete return note'
      error.value = message
      return false
    }
  }

  const clearData = () => {
    stockReturnNotes.value = []
    error.value = null
    lastFetchedCorporation.value = null
    hasDataForCorporation.value.clear()
  }

  const notesByCorporation = computed(() => {
    const grouped: Record<string, StockReturnNote[]> = {}
    stockReturnNotes.value.forEach(note => {
      if (!grouped[note.corporation_uuid]) grouped[note.corporation_uuid] = []
      grouped[note.corporation_uuid].push(note)
    })
    return grouped
  })

  return {
    stockReturnNotes: readonly(stockReturnNotes),
    loading: readonly(loading),
    error: readonly(error),
    fetchStockReturnNotes,
    createStockReturnNote,
    updateStockReturnNote,
    deleteStockReturnNote,
    getNoteByUuid,
    generateNextReturnNumber,
    notesByCorporation,
    clearData,
  }
})
