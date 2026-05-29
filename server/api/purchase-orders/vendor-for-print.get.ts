/**
 * GET /api/purchase-orders/vendor-for-print?corporation_uuid=&vendor_uuid=
 * Returns one vendor with source/manufacturing addresses for print preview.
 * Uses session cookie / Authorization header (not static nimbleToken alone).
 */
import {
  extractNimbleVendorContractList,
  mapNimbleVendorContractToPoVendor,
  normalizeNimbleEntityId,
  toNimbleCorpId,
} from '../../utils/nimbleVendorMaster'
import { resolveNimbleBearerForEvent } from '../../utils/nimbleBearer'

export default defineEventHandler(async (event) => {
  const { corporation_uuid, vendor_uuid } = getQuery(event)
  if (!corporation_uuid || !vendor_uuid) {
    throw createError({
      statusCode: 400,
      statusMessage: 'corporation_uuid and vendor_uuid are required',
    })
  }

  const config = useRuntimeConfig()
  const nimbleApi3 = String((config as Record<string, unknown>).nimbleApi3Url || '').trim()
  const bearer = resolveNimbleBearerForEvent(event)

  if (!nimbleApi3 || !bearer) {
    return { data: null }
  }

  const vendorKey = normalizeNimbleEntityId(vendor_uuid)
  const corpId = toNimbleCorpId(corporation_uuid)

  try {
    const response = await $fetch<unknown>(`${nimbleApi3}/v1/VendorContractMaster/List`, {
      method: 'GET',
      query: { CorpID: corpId },
      headers: {
        Authorization: `Bearer ${bearer}`,
        'Content-Type': 'application/json',
      },
    })

    const rows = extractNimbleVendorContractList(response)
    const match = rows.find((v) => normalizeNimbleEntityId(v.vendorID) === vendorKey)
    if (!match) {
      return { data: null }
    }

    return { data: mapNimbleVendorContractToPoVendor(match) }
  }
  catch (error: unknown) {
    console.error('[PO Print] vendor-for-print failed', String(error))
    return { data: null }
  }
})
