import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

/** Raw shape returned by Nimble API3 /v1/VendorContractMaster/List */
export interface NimbleVendorDTO {
  vendorID?: string
  vendorName?: string
  corporationID?: string
  corporationName?: string | null
  clientName?: string | null
  federalID?: string | null
  creditDays?: number | null
  creditDaysID?: string | null
  paymentMethodID?: string | null
  paymentMethodName?: string | null
  /** 1 = active, 0 = inactive */
  status?: number
  addressDetails?: unknown[]
  contractDetails?: unknown[]
}

/** Normalised shape stored in state */
export interface Vendor {
  uuid: string
  vendor_name: string
  corporation_uuid: string
  federal_id: string | null
  payment_method: string | null
  is_active: boolean
}

function normalise(dto: NimbleVendorDTO, corporationUuid: string): Vendor {
  return {
    uuid: dto.vendorID ?? '',
    vendor_name: dto.vendorName ?? '',
    // The API echoes corporationID on each item; fall back to the queried UUID
    // in case the field is missing (same pattern as chart-of-accounts).
    corporation_uuid: dto.corporationID ?? corporationUuid,
    federal_id: dto.federalID ?? null,
    payment_method: dto.paymentMethodName ?? null,
    is_active: dto.status === 1,
  }
}

export const useVendorStore = defineStore('vendors', () => {
  const vendors = ref<Vendor[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /** Per-corporation cache (lowercased UUIDs) */
  const fetchedCorps = ref<Set<string>>(new Set())

  // ── Getters ───────────────────────────────────────────────────────────────

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

  const getVendorById = computed(() => (uuid: string): Vendor | undefined =>
    vendors.value.find(v => v.uuid.toLowerCase() === uuid.toLowerCase()),
  )

  const getVendorName = computed(() => (uuid: string): string => {
    const v = vendors.value.find(v => v.uuid.toLowerCase() === uuid.toLowerCase())
    return v?.vendor_name ?? uuid
  })

  // ── Actions ───────────────────────────────────────────────────────────────

  async function fetchVendors(corporationUuid?: string, forceRefresh = false) {
    if (import.meta.server) return
    if (!corporationUuid) return

    const corp = corporationUuid.toLowerCase()
    if (!forceRefresh && fetchedCorps.value.has(corp)) return

    loading.value = true
    error.value = null

    try {
      const data = await $fetch<{ vendors: NimbleVendorDTO[] }>(
        '/api/nimble/vendors',
        {
          query: { corporation_uuid: corporationUuid },
          credentials: 'include',
        },
      )

      // Replace only this corporation's vendors; preserve other corps' data
      vendors.value = [
        ...vendors.value.filter(v => v.corporation_uuid.toLowerCase() !== corp),
        ...(data.vendors ?? []).map(dto => normalise(dto, corporationUuid)),
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

  async function refresh(corporationUuid?: string) {
    if (!corporationUuid) return
    fetchedCorps.value.delete(corporationUuid.toLowerCase())
    await fetchVendors(corporationUuid, true)
  }

  function clear() {
    vendors.value = []
    fetchedCorps.value.clear()
    loading.value = false
    error.value = null
  }

  return {
    vendors,
    loading,
    error,
    getActive,
    getVendorsForCorporation,
    getActiveForCorporation,
    getVendorById,
    getVendorName,
    fetchVendors,
    refresh,
    clear,
  }
})
