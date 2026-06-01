import { defineStore } from 'pinia'
import { computed, readonly, ref } from 'vue'

export interface StockReceiptNote {
  id?: number | string
  uuid: string
  corporation_uuid: string
  project_uuid?: string | null
  purchase_order_uuid?: string | null
  change_order_uuid?: string | null
  receipt_type?: 'purchase_order' | 'change_order' | string
  vendor_uuid?: string | null
  entry_date: string | null
  received_date?: string | null
  shipment_date?: string | null
  grn_number: string
  reference_number?: string | null
  received_by?: string | null
  nimble_received_by_user_id?: string | null
  location_uuid?: string | null
  notes?: string | null
  status: 'Shipment' | 'Received'
  total_received_amount?: number | null
  attachments?: any[]
  metadata?: Record<string, any> | null
  audit_log?: any[]
  is_active?: boolean
  created_at: string
  updated_at: string
}

export interface CreateStockReceiptNotePayload extends Partial<StockReceiptNote> {
  corporation_uuid: string
  entry_date?: string | null
}

export interface UpdateStockReceiptNotePayload extends Partial<CreateStockReceiptNotePayload> {
  uuid: string
}

const compareNotes = (a: StockReceiptNote, b: StockReceiptNote) => {
  const getTime = (note: StockReceiptNote) => {
    const d = note.entry_date || note.created_at || null
    if (!d) return 0
    return new Date(d).getTime()
  }
  return getTime(b) - getTime(a)
}

const sortNotes = (notes: StockReceiptNote[]) => [...notes].sort(compareNotes)

const normalizeGrnNumber = (grnNumber: string | null | undefined): string => {
  if (!grnNumber) return ''
  const numericPart = String(grnNumber).replace(/^GRN-/i, '')
  const num = parseInt(numericPart, 10)
  if (Number.isNaN(num)) return grnNumber
  return `GRN-${num}`
}

const normalizeStatus = (status?: string | null): 'Shipment' | 'Received' => {
  switch (String(status || '').trim().toLowerCase()) {
    case 'received': return 'Received'
    default: return 'Shipment'
  }
}

export const useStockReceiptNotesStore = defineStore('stockReceiptNotes', () => {
  const stockReceiptNotes = ref<StockReceiptNote[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastFetchedCorporation = ref<string | null>(null)
  const hasDataForCorporation = ref<Set<string>>(new Set())

  const replaceCorporationNotes = (corporationUuid: string, notes: StockReceiptNote[]) => {
    const others = stockReceiptNotes.value.filter(n => n.corporation_uuid !== corporationUuid)
    stockReceiptNotes.value = sortNotes([...others, ...notes])
  }

  const getNotesForCorporation = (corporationUuid: string) =>
    stockReceiptNotes.value.filter(n => n.corporation_uuid === corporationUuid)

  const fetchStockReceiptNotes = async (
    corporationUuid: string,
    options: {
      force?: boolean
      filters?: { project_uuid?: string; vendor_uuid?: string; entry_date_from?: string; entry_date_to?: string }
    } = {}
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
      if (filters?.entry_date_from) query.entry_date_from = filters.entry_date_from
      if (filters?.entry_date_to) query.entry_date_to = filters.entry_date_to

      const response = await $fetch<any>('/api/stock-receipt-notes', { query })
      const notes: StockReceiptNote[] = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : [])
      const normalized = notes.map(n => ({ ...n, grn_number: normalizeGrnNumber(n.grn_number) }))
      const sorted = sortNotes(normalized)
      replaceCorporationNotes(corporationUuid, sorted)
      lastFetchedCorporation.value = corporationUuid
      hasDataForCorporation.value.add(corporationUuid)
    } catch (err: any) {
      console.error('[StockReceiptNotes] fetch error:', err)
      error.value = err?.statusMessage || err?.message || 'Failed to fetch stock receipt notes'
    } finally {
      loading.value = false
    }
  }

  const getNoteByUuid = (uuid: string) =>
    stockReceiptNotes.value.find(n => n.uuid === uuid) ?? null

  const generateNextGrnNumber = (corporationUuid: string): string => {
    const corpNotes = getNotesForCorporation(corporationUuid)
    let maxNum = 0
    for (const note of corpNotes) {
      const num = parseInt(String(note.grn_number || '').replace(/^GRN-/i, ''), 10)
      if (!Number.isNaN(num)) maxNum = Math.max(maxNum, num)
    }
    return `GRN-${maxNum + 1}`
  }

  const createStockReceiptNote = async (payload: CreateStockReceiptNotePayload): Promise<StockReceiptNote | null> => {
    if (!payload?.corporation_uuid) throw new Error('corporation_uuid is required')
    try {
      const response = await $fetch<any>('/api/stock-receipt-notes', { method: 'POST', body: payload })
      const newNote: StockReceiptNote | null = response?.data ?? response ?? null
      if (newNote) {
        const normalized = { ...newNote, grn_number: normalizeGrnNumber(newNote.grn_number) }
        const corpUuid = normalized.corporation_uuid
        const existing = getNotesForCorporation(corpUuid).filter(n => n.uuid !== normalized.uuid)
        replaceCorporationNotes(corpUuid, sortNotes([normalized, ...existing]))
        lastFetchedCorporation.value = corpUuid
        hasDataForCorporation.value.add(corpUuid)
        return normalized
      }
      return null
    } catch (err: any) {
      const message = err?.statusMessage || err?.message || 'Failed to create receipt note'
      error.value = message
      throw new Error(message)
    }
  }

  const updateStockReceiptNote = async (payload: UpdateStockReceiptNotePayload): Promise<StockReceiptNote | null> => {
    if (!payload?.uuid) throw new Error('uuid is required')
    const existingNote = getNoteByUuid(payload.uuid)
    const corporationUuid = payload.corporation_uuid || existingNote?.corporation_uuid
    if (!corporationUuid) throw new Error('corporation_uuid is required for update')
    try {
      const response = await $fetch<any>('/api/stock-receipt-notes', { method: 'PUT', body: payload })
      const updated: StockReceiptNote | null = response?.data ?? response ?? null
      if (!updated) return null
      const normalized = { ...updated, grn_number: normalizeGrnNumber(updated.grn_number) }
      const corpNotes = getNotesForCorporation(corporationUuid).filter(n => n.uuid !== normalized.uuid)
      replaceCorporationNotes(corporationUuid, sortNotes([normalized, ...corpNotes]))
      lastFetchedCorporation.value = corporationUuid
      hasDataForCorporation.value.add(corporationUuid)
      return normalized
    } catch (err: any) {
      const message = err?.statusMessage || err?.message || 'Failed to update receipt note'
      error.value = message
      throw new Error(message)
    }
  }

  const deleteStockReceiptNote = async (uuid: string): Promise<boolean> => {
    if (!uuid) return false
    const existing = getNoteByUuid(uuid)
    const corporationUuid = existing?.corporation_uuid
    try {
      await $fetch<any>('/api/stock-receipt-notes', { method: 'DELETE', query: { uuid } })
      if (corporationUuid) {
        replaceCorporationNotes(corporationUuid, getNotesForCorporation(corporationUuid).filter(n => n.uuid !== uuid))
      } else {
        stockReceiptNotes.value = stockReceiptNotes.value.filter(n => n.uuid !== uuid)
      }
      return true
    } catch (err: any) {
      const message = err?.statusMessage || err?.message || 'Failed to delete receipt note'
      error.value = message
      return false
    }
  }

  const clearData = () => {
    stockReceiptNotes.value = []
    error.value = null
    lastFetchedCorporation.value = null
    hasDataForCorporation.value.clear()
  }

  const notesByStatus = computed(() => {
    const grouped: Record<string, StockReceiptNote[]> = {}
    stockReceiptNotes.value.forEach(note => {
      const status = note.status ? normalizeStatus(note.status) : 'Shipment'
      if (!grouped[status]) grouped[status] = []
      grouped[status].push(note)
    })
    return grouped
  })

  const notesByCorporation = computed(() => {
    const grouped: Record<string, StockReceiptNote[]> = {}
    stockReceiptNotes.value.forEach(note => {
      if (!grouped[note.corporation_uuid]) grouped[note.corporation_uuid] = []
      grouped[note.corporation_uuid].push(note)
    })
    return grouped
  })

  return {
    stockReceiptNotes: readonly(stockReceiptNotes),
    loading: readonly(loading),
    error: readonly(error),
    fetchStockReceiptNotes,
    createStockReceiptNote,
    updateStockReceiptNote,
    deleteStockReceiptNote,
    getNoteByUuid,
    generateNextGrnNumber,
    notesByStatus,
    notesByCorporation,
    clearData,
  }
})
