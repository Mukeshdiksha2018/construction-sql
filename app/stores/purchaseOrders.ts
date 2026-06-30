import { defineStore } from 'pinia'
import { ref, readonly } from 'vue'

export interface POItem {
  id?: number
  uuid?: string
  cost_code_uuid?: string
  item_type_uuid?: string
  sequence_uuid?: string
  item_uuid?: string
  description?: string
  model_number?: string
  location_uuid?: string
  unit_price?: number | null
  uom?: string
  quantity?: number | null
  total?: number | null
  approval_checks?: string[] | string
  source?: string | null
  cost_code_label?: string
  cost_code_number?: string
  cost_code_name?: string
  division_name?: string
  item_type_label?: string
  name?: string
  item_name?: string
  location?: string
  unit_label?: string
  unit_uuid?: string | null
  po_unit_price?: number | null
  po_quantity?: number | null
  po_total?: number | null
  display_metadata?: Record<string, any>
  metadata?: Record<string, any>
}

export interface PurchaseOrder {
  id?: number | string
  uuid?: string
  created_at?: string
  updated_at?: string
  corporation_uuid: string
  project_uuid?: string | null
  po_number?: string | null
  entry_date: string
  po_type?: string | null
  credit_days?: string | null
  credit_days_id?: string | null
  ship_via?: string | null
  freight?: string | null
  shipping_instructions?: string | null
  estimated_delivery_date?: string | null
  include_items?: string | null
  quote_reference?: string | null
  terms_and_conditions?: string | null
  terms_and_conditions_uuid?: string | null
  item_total?: number | null
  freight_charges_percentage?: number | null
  freight_charges_amount?: number | null
  freight_charges_taxable?: boolean
  packing_charges_percentage?: number | null
  packing_charges_amount?: number | null
  packing_charges_taxable?: boolean
  custom_duties_percentage?: number | null
  custom_duties_amount?: number | null
  custom_duties_taxable?: boolean
  other_charges_percentage?: number | null
  other_charges_amount?: number | null
  other_charges_taxable?: boolean
  charges_total?: number | null
  sales_tax_1_percentage?: number | null
  sales_tax_1_amount?: number | null
  sales_tax_2_percentage?: number | null
  sales_tax_2_amount?: number | null
  tax_total?: number | null
  total_po_amount?: number | null
  vendor_uuid?: string | null
  billing_address_uuid?: string | null
  shipping_address_uuid?: string | null
  status?: 'Draft' | 'Ready' | 'Approved' | 'Rejected' | 'Partially_Received' | 'Completed'
  is_active?: boolean
  po_items?: POItem[]
  labor_po_items?: any[]
  location_wise_material?: any[]
  attachments?: any[]
  removed_po_items?: POItem[]
  financial_breakdown?: Record<string, any> | null
  audit_log?: any[]
  project_name?: string | null
  project_id?: string | null
  vendor_name?: string | null
  prepared_by?: string | null
  approved_by?: string | null
  approved_at?: string | null
  print_include_approved_by_vendor?: boolean | null
  print_use_entity_name?: boolean | null
  special_instruction_uuid?: string | null
  currency_conversion_enabled?: boolean
  currency_from?: 'CAD' | 'USD' | null
  currency_to?: 'CAD' | 'USD' | null
  conversion_rate?: number | null
}

export interface CreatePurchaseOrderPayload extends Partial<PurchaseOrder> {
  corporation_uuid: string
  entry_date: string
}

export interface UpdatePurchaseOrderPayload extends Partial<CreatePurchaseOrderPayload> {
  uuid: string
}

interface PaginationInfo {
  page: number
  pageSize: number
  totalRecords: number
  totalPages: number
  hasMore: boolean
}

const comparePOs = (a: PurchaseOrder, b: PurchaseOrder) => {
  const getTime = (po: PurchaseOrder) => {
    const d = po.entry_date || po.created_at || null
    if (!d) return 0
    return new Date(d).getTime()
  }
  return getTime(b) - getTime(a)
}

const sortPOs = (pos: PurchaseOrder[]) => [...pos].sort(comparePOs)

function getCurrentUserInfo() {
  try {
    const config = useRuntimeConfig()
    const nimbleEnabled = !!config.public?.nimbleIntegrations
    if (nimbleEnabled) {
      try {
        const nimbleSession = useNimbleSessionStore?.()
        if (nimbleSession) {
          const name = String(nimbleSession.userName || nimbleSession.userFullName || nimbleSession.email || '').trim()
          if (name) return { user_id: '', user_name: name, user_email: nimbleSession.email || '' }
        }
      } catch {}
    }
  } catch {}
  return { user_id: '', user_name: 'Unknown User', user_email: '' }
}

export const usePurchaseOrdersStore = defineStore('purchaseOrders', () => {
  const purchaseOrders = ref<PurchaseOrder[]>([])
  const currentPurchaseOrder = ref<PurchaseOrder | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastFetchedCorporation = ref<string | null>(null)
  const hasDataForCorporation = ref<Set<string>>(new Set())
  const paginationInfo = ref<Record<string, PaginationInfo>>({})

  const replaceCorporationPOs = (corporationUuid: string, pos: PurchaseOrder[]) => {
    const others = purchaseOrders.value.filter(po => po.corporation_uuid !== corporationUuid)
    purchaseOrders.value = sortPOs([...others, ...pos])
  }

  const getPOsForCorporation = (corporationUuid: string) =>
    purchaseOrders.value.filter(po => po.corporation_uuid === corporationUuid)

  const fetchPurchaseOrders = async (
    corporationUuid: string,
    options: {
      force?: boolean
      filters?: {
        project_uuid?: string
        vendor_uuid?: string
        entry_date_from?: string
        entry_date_to?: string
        page?: number
        page_size?: number
      }
    } = {}
  ) => {
    if (!corporationUuid) return

    const { force = false, filters } = options
    const hasListFilters = Boolean(
      filters?.project_uuid ||
      filters?.vendor_uuid ||
      filters?.entry_date_from ||
      filters?.entry_date_to,
    )

    const requestedPage = Number(filters?.page || 1)
    let shouldFetch = force || hasListFilters || requestedPage > 1
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
      if (filters?.page) query.page = String(filters.page)
      if (filters?.page_size) query.page_size = String(filters.page_size)

      const response = await $fetch<any>('/api/purchase-order-forms', { query })
      const rows: PurchaseOrder[] = Array.isArray(response?.data) ? response.data : []

      const shouldReplace = requestedPage <= 1
      if (shouldReplace) {
        replaceCorporationPOs(corporationUuid, rows)
      } else {
        const existing = getPOsForCorporation(corporationUuid)
        const byUuid = new Map<string, PurchaseOrder>()
        existing.forEach((po) => {
          if (po.uuid) byUuid.set(po.uuid, po)
        })
        rows.forEach((po) => {
          if (po.uuid) byUuid.set(po.uuid, po)
        })
        const merged = Array.from(byUuid.values())
        replaceCorporationPOs(corporationUuid, merged)
      }
      if (!hasListFilters) {
        lastFetchedCorporation.value = corporationUuid
        hasDataForCorporation.value.add(corporationUuid)
      }

      if (response?.pagination) paginationInfo.value[corporationUuid] = response.pagination
      return rows
    } catch (err: any) {
      console.error('[PO Store] fetch error:', err)
      error.value = err?.statusMessage || err?.message || 'Failed to fetch purchase orders'
    } finally {
      loading.value = false
    }
  }

  const getPOByUuid = (uuid: string) =>
    purchaseOrders.value.find(po => po.uuid === uuid) ?? null

  const fetchPurchaseOrder = async (uuid: string): Promise<PurchaseOrder | null> => {
    try {
      const response = await $fetch<any>(`/api/purchase-order-forms/${uuid}`)
      const po: PurchaseOrder | null = response?.data ?? null
      if (po) {
        currentPurchaseOrder.value = po
        const corpUuid = po.corporation_uuid
        const others = getPOsForCorporation(corpUuid).filter(p => p.uuid !== po.uuid)
        replaceCorporationPOs(corpUuid, [...others, po])
      }
      return po
    } catch (err: any) {
      console.error('[PO Store] fetchOne error:', err)
      return null
    }
  }

  const createPurchaseOrder = async (payload: CreatePurchaseOrderPayload): Promise<PurchaseOrder | null> => {
    if (!payload?.corporation_uuid) throw new Error('corporation_uuid is required')
    try {
      const userInfo = getCurrentUserInfo()
      const body = { ...payload, ...userInfo }
      const response = await $fetch<any>('/api/purchase-order-forms', { method: 'POST', body })
      const newPO: PurchaseOrder | null = response?.data ?? null
      if (newPO) {
        const corpUuid = newPO.corporation_uuid
        const others = getPOsForCorporation(corpUuid).filter(p => p.uuid !== newPO.uuid)
        replaceCorporationPOs(corpUuid, sortPOs([newPO, ...others]))
        lastFetchedCorporation.value = corpUuid
        hasDataForCorporation.value.add(corpUuid)
        currentPurchaseOrder.value = newPO
      }
      return newPO
    } catch (err: any) {
      const message = err?.statusMessage || err?.message || 'Failed to create purchase order'
      error.value = message
      throw new Error(message)
    }
  }

  const updatePurchaseOrder = async (payload: UpdatePurchaseOrderPayload): Promise<PurchaseOrder | null> => {
    if (!payload?.uuid) throw new Error('uuid is required')
    try {
      const userInfo = getCurrentUserInfo()
      const existing = getPOByUuid(payload.uuid)
      const existingAuditLog = Array.isArray(existing?.audit_log) ? existing.audit_log : []
      const body = { ...payload, ...userInfo, audit_log: existingAuditLog }
      const response = await $fetch<any>(`/api/purchase-order-forms/${payload.uuid}`, { method: 'PUT', body })
      const updated: PurchaseOrder | null = response?.data ?? null
      if (updated) {
        const corpUuid = updated.corporation_uuid
        const others = getPOsForCorporation(corpUuid).filter(p => p.uuid !== updated.uuid)
        replaceCorporationPOs(corpUuid, sortPOs([updated, ...others]))
        if (currentPurchaseOrder.value?.uuid === updated.uuid) currentPurchaseOrder.value = updated
      }
      return updated
    } catch (err: any) {
      const message = err?.statusMessage || err?.message || 'Failed to update purchase order'
      error.value = message
      throw new Error(message)
    }
  }

  const deletePurchaseOrder = async (uuid: string): Promise<boolean> => {
    if (!uuid) return false
    const existing = getPOByUuid(uuid)
    const corporationUuid = existing?.corporation_uuid
    try {
      await $fetch<any>(`/api/purchase-order-forms/${uuid}`, { method: 'DELETE' })
      if (corporationUuid) {
        const others = getPOsForCorporation(corporationUuid).filter(p => p.uuid !== uuid)
        replaceCorporationPOs(corporationUuid, others)
      } else {
        purchaseOrders.value = purchaseOrders.value.filter(p => p.uuid !== uuid)
      }
      if (currentPurchaseOrder.value?.uuid === uuid) currentPurchaseOrder.value = null
      return true
    } catch (err: any) {
      const message = err?.statusMessage || err?.message || 'Failed to delete purchase order'
      error.value = message
      return false
    }
  }

  const savePOItems = async (
    purchaseOrderUuid: string,
    items: POItem[],
    options: { corporation_uuid?: string; project_uuid?: string } = {}
  ) => {
    try {
      const response = await $fetch<any>('/api/purchase-order-items', {
        method: 'POST',
        body: { purchase_order_uuid: purchaseOrderUuid, items, ...options },
      })
      return response?.data ?? []
    } catch (err: any) {
      throw new Error(err?.statusMessage || err?.message || 'Failed to save PO items')
    }
  }

  const saveLaborPOItems = async (
    purchaseOrderUuid: string,
    items: any[],
    options: { corporation_uuid?: string; project_uuid?: string } = {}
  ) => {
    try {
      const response = await $fetch<any>('/api/labor-purchase-order-items', {
        method: 'POST',
        body: { purchase_order_uuid: purchaseOrderUuid, items, ...options },
      })
      return response?.data ?? []
    } catch (err: any) {
      throw new Error(err?.statusMessage || err?.message || 'Failed to save labor PO items')
    }
  }

  const saveLocationWiseMaterial = async (
    purchaseOrderUuid: string,
    items: any[],
    options: { corporation_uuid?: string; project_uuid?: string } = {}
  ) => {
    try {
      const response = await $fetch<any>('/api/po-location-wise-material', {
        method: 'POST',
        body: { purchase_order_uuid: purchaseOrderUuid, items, ...options },
      })
      return response?.data ?? []
    } catch (err: any) {
      throw new Error(err?.statusMessage || err?.message || 'Failed to save location-wise material')
    }
  }

  const clearData = () => {
    purchaseOrders.value = []
    currentPurchaseOrder.value = null
    error.value = null
    lastFetchedCorporation.value = null
    hasDataForCorporation.value.clear()
    paginationInfo.value = {}
  }

  return {
    purchaseOrders: readonly(purchaseOrders),
    currentPurchaseOrder: readonly(currentPurchaseOrder),
    loading: readonly(loading),
    error: readonly(error),
    paginationInfo: readonly(paginationInfo),
    fetchPurchaseOrders,
    fetchPurchaseOrder,
    getPOByUuid,
    createPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
    savePOItems,
    saveLaborPOItems,
    saveLocationWiseMaterial,
    clearData,
  }
})
