import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

/** Vendor row from Nimble SQL `dbo.Business` + `dbo.BusinessInfo` API */
export interface NimbleDbVendor {
  vendor_id: string
  name: string
  company_name: string | null
  corporation_id: string
  account_id: string | null
  status: 0 | 1 | 3
  status_label: 'inactive' | 'active' | 'deleted'
  tax_id: string | null
  contact_person_name: string | null
  credit_limit: number | null
  check_reference: string | null
  federal_id: string | null
  ssn: string | null
  print_check_as: string | null
  is_1099: boolean
  credit_days_id: string | null
  type: number
  bid: string | null
  created_by: string | null
  modified_by: string | null
  created_at: string | null
  modified_at: string | null
}

export interface NimbleVendorInputPayload {
  corporation_id: string
  name: string
  company_name?: string | null
  account_id?: string | null
  status?: 0 | 1 | 3
  tax_id?: string | null
  contact_person_name?: string | null
  credit_limit?: number | null
  check_reference?: string | null
  federal_id?: string | null
  ssn?: string | null
  print_check_as?: string | null
  is_1099?: boolean
  credit_days_id?: string | null
}

/** Vendor address link row from `/api/nimble-vendors/:id/addresses` */
export interface VendorAddressRecord {
  vendor_address_id: number
  vendor_id: string
  address_id: string
  contact_id: string
  address_line_1: string | null
  address_line_2: string | null
  city: string | null
  state_id: number | null
  state_name: string | null
  country_id: number | null
  country_name: string | null
  zip_code: string | null
  contact_name: string | null
  mobile_num: string | null
  alternative_num: string | null
  work_num: string | null
  fax_num: string | null
  email: string | null
  website: string | null
  address_type: number | null
  business_type_id: string | null
  is_default: boolean
  status: number
  status_label: 'inactive' | 'active'
}

export interface VendorAddressInputPayload {
  name?: string | null
  address?: string | null
  address_line_2?: string | null
  city?: string | null
  country_id?: number | null
  state_id?: number | null
  zip_code?: string | null
  business_type_id?: string | null
  address_type?: number | null
  mobile_num?: string | null
  alternative_num?: string | null
  work_num?: string | null
  fax_num?: string | null
  email?: string | null
  website?: string | null
  is_default?: boolean
  is_active?: boolean
}

/** Normalised shape stored in state (dropdown / PO forms) */
export interface Vendor {
  uuid: string
  vendor_name: string
  corporation_uuid: string
  federal_id: string | null
  payment_method: string | null
  is_active: boolean
  vendor_address?: string | null
  vendor_city?: string | null
  vendor_state?: string | null
  vendor_zip?: string | null
  vendor_country?: string | null
}

function normaliseFromSql(dto: NimbleDbVendor): Vendor {
  return {
    uuid: dto.vendor_id.toLowerCase(),
    vendor_name: dto.name,
    corporation_uuid: dto.corporation_id.toLowerCase(),
    federal_id: dto.federal_id ?? dto.tax_id ?? null,
    payment_method: null,
    is_active: dto.status === 1,
  }
}

export const useVendorStore = defineStore('vendors', () => {
  const vendors = ref<Vendor[]>([])
  const nimbleVendors = ref<NimbleDbVendor[]>([])
  const loading = ref(false)
  const nimbleLoading = ref(false)
  const error = ref<string | null>(null)
  const nimbleError = ref<string | null>(null)

  /** Per-corporation cache (lowercased UUIDs) */
  const fetchedCorps = ref<Set<string>>(new Set())
  const nimbleFetchedCorps = ref<Set<string>>(new Set())

  const getActive = computed(() =>
    vendors.value.filter(v => v.is_active),
  )

  const getVendorsForCorporation = computed(() => (corporationUuid: string): Vendor[] => {
    const corp = corporationUuid.toLowerCase()
    return vendors.value.filter(v => v.corporation_uuid.toLowerCase() === corp)
  })

  const getActiveForCorporation = computed(() => (corporationUuid: string): Vendor[] => {
    const corp = corporationUuid.toLowerCase()
    return vendors.value.filter(v => v.corporation_uuid.toLowerCase() === corp && v.is_active)
  })

  const getNimbleVendorsForCorporation = computed(() => (corporationUuid: string): NimbleDbVendor[] => {
    const corp = corporationUuid.toLowerCase()
    return nimbleVendors.value.filter(v => v.corporation_id.toLowerCase() === corp)
  })

  const getVendorById = computed(() => (uuid: string): Vendor | undefined =>
    vendors.value.find(v => v.uuid.toLowerCase() === uuid.toLowerCase()),
  )

  const getVendorName = computed(() => (uuid: string): string => {
    const v = vendors.value.find(v => v.uuid.toLowerCase() === uuid.toLowerCase())
    return v?.vendor_name ?? uuid
  })

  async function fetchVendors(corporationUuid?: string, forceRefresh = false) {
    if (import.meta.server) return
    if (!corporationUuid) return

    const corp = corporationUuid.toLowerCase()
    if (!forceRefresh && fetchedCorps.value.has(corp)) return

    loading.value = true
    error.value = null

    try {
      const data = await $fetch<{ vendors: NimbleDbVendor[] }>(
        '/api/nimble-vendors',
        {
          query: { corporation_uuid: corporationUuid },
          credentials: 'include',
        },
      )

      vendors.value = [
        ...vendors.value.filter(v => v.corporation_uuid.toLowerCase() !== corp),
        ...(data.vendors ?? [])
          .filter(v => v.status !== 3)
          .map(normaliseFromSql),
      ]
      fetchedCorps.value.add(corp)
    }
    catch (err: unknown) {
      const e = err as Record<string, unknown>
      error.value
        = (e?.data as Record<string, unknown>)?.statusMessage as string
          || (e?.statusMessage as string)
          || (err as Error)?.message
          || 'Failed to fetch vendors'
    }
    finally {
      loading.value = false
    }
  }

  async function fetchNimbleDbVendors(corporationUuid?: string, forceRefresh = false) {
    if (import.meta.server) return
    if (!corporationUuid) return

    const corp = corporationUuid.toLowerCase()
    if (!forceRefresh && nimbleFetchedCorps.value.has(corp)) return

    nimbleLoading.value = true
    nimbleError.value = null

    try {
      const data = await $fetch<{ vendors: NimbleDbVendor[] }>(
        '/api/nimble-vendors',
        {
          query: { corporation_uuid: corporationUuid, include_deleted: 'true' },
          credentials: 'include',
        },
      )

      nimbleVendors.value = [
        ...nimbleVendors.value.filter(v => v.corporation_id.toLowerCase() !== corp),
        ...(data.vendors ?? []),
      ]
      nimbleFetchedCorps.value.add(corp)
    }
    catch (err: unknown) {
      const e = err as Record<string, unknown>
      nimbleError.value
        = (e?.data as Record<string, unknown>)?.statusMessage as string
          || (e?.statusMessage as string)
          || (err as Error)?.message
          || 'Failed to fetch vendors'
    }
    finally {
      nimbleLoading.value = false
    }
  }

  async function createNimbleVendor(payload: NimbleVendorInputPayload) {
    const result = await $fetch<{ vendor: NimbleDbVendor }>(
      '/api/nimble-vendors',
      { method: 'POST', body: payload, credentials: 'include' },
    )
    const vendor = result.vendor
    if (vendor) {
      const corp = vendor.corporation_id.toLowerCase()
      nimbleVendors.value = [
        ...nimbleVendors.value.filter(v => v.vendor_id !== vendor.vendor_id),
        vendor,
      ]
      if (vendor.status !== 3) {
        vendors.value = [
          ...vendors.value.filter(v => v.uuid !== vendor.vendor_id),
          normaliseFromSql(vendor),
        ]
      }
      fetchedCorps.value.delete(corp)
      nimbleFetchedCorps.value.delete(corp)
    }
    return vendor
  }

  async function updateNimbleVendor(id: string, payload: NimbleVendorInputPayload) {
    const result = await $fetch<{ vendor: NimbleDbVendor }>(
      `/api/nimble-vendors/${id}`,
      { method: 'PUT', body: payload, credentials: 'include' },
    )
    const vendor = result.vendor
    if (vendor) {
      const corp = vendor.corporation_id.toLowerCase()
      nimbleVendors.value = nimbleVendors.value.map(v =>
        v.vendor_id === vendor.vendor_id ? vendor : v,
      )
      vendors.value = [
        ...vendors.value.filter(v => v.uuid !== vendor.vendor_id),
        ...(vendor.status !== 3 ? [normaliseFromSql(vendor)] : []),
      ]
      fetchedCorps.value.delete(corp)
      nimbleFetchedCorps.value.delete(corp)
    }
    return vendor
  }

  async function deleteNimbleVendor(id: string) {
    const result = await $fetch<{ vendor: NimbleDbVendor }>(
      `/api/nimble-vendors/${id}`,
      { method: 'DELETE', credentials: 'include' },
    )
    const vendor = result.vendor
    if (vendor) {
      const corp = vendor.corporation_id.toLowerCase()
      nimbleVendors.value = nimbleVendors.value.map(v =>
        v.vendor_id === vendor.vendor_id ? vendor : v,
      )
      vendors.value = vendors.value.filter(v => v.uuid !== vendor.vendor_id)
      fetchedCorps.value.delete(corp)
      nimbleFetchedCorps.value.delete(corp)
    }
    return vendor
  }

  async function fetchVendorAddresses(vendorId: string): Promise<VendorAddressRecord[]> {
    const data = await $fetch<{ addresses: VendorAddressRecord[] }>(
      `/api/nimble-vendors/${vendorId}/addresses`,
      { credentials: 'include' },
    )
    return data.addresses ?? []
  }

  async function createVendorAddress(vendorId: string, payload: VendorAddressInputPayload) {
    const result = await $fetch<{ address: VendorAddressRecord }>(
      `/api/nimble-vendors/${vendorId}/addresses`,
      { method: 'POST', body: payload, credentials: 'include' },
    )
    return result.address
  }

  async function updateVendorAddress(
    vendorId: string,
    addressLinkId: number,
    payload: VendorAddressInputPayload,
  ) {
    const result = await $fetch<{ address: VendorAddressRecord }>(
      `/api/nimble-vendors/${vendorId}/addresses/${addressLinkId}`,
      { method: 'PUT', body: payload, credentials: 'include' },
    )
    return result.address
  }

  async function deleteVendorAddress(vendorId: string, addressLinkId: number) {
    const result = await $fetch<{ address: VendorAddressRecord }>(
      `/api/nimble-vendors/${vendorId}/addresses/${addressLinkId}`,
      { method: 'DELETE', credentials: 'include' },
    )
    return result.address
  }

  async function refresh(corporationUuid?: string) {
    if (!corporationUuid) return
    fetchedCorps.value.delete(corporationUuid.toLowerCase())
    await fetchVendors(corporationUuid, true)
  }

  function clear() {
    vendors.value = []
    nimbleVendors.value = []
    fetchedCorps.value.clear()
    nimbleFetchedCorps.value.clear()
    loading.value = false
    nimbleLoading.value = false
    error.value = null
    nimbleError.value = null
  }

  return {
    vendors,
    nimbleVendors,
    loading,
    nimbleLoading,
    error,
    nimbleError,
    getActive,
    getVendorsForCorporation,
    getActiveForCorporation,
    getNimbleVendorsForCorporation,
    getVendorById,
    getVendorName,
    fetchVendors,
    fetchNimbleDbVendors,
    createNimbleVendor,
    updateNimbleVendor,
    deleteNimbleVendor,
    fetchVendorAddresses,
    createVendorAddress,
    updateVendorAddress,
    deleteVendorAddress,
    refresh,
    clear,
  }
})
