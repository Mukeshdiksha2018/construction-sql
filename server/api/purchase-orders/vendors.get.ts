/**
 * Proxy to the Nimble API for vendor list (with addresses for print preview).
 */
import {
  extractNimbleVendorContractList,
  mapNimbleVendorContractToPoVendor,
  toNimbleCorpId,
} from '../../utils/nimbleVendorMaster'
import { getSessionFromEvent } from '../../utils/auth-session'
import { resolveNimbleBearerForEvent } from '../../utils/nimbleBearer'

export default defineEventHandler(async (event) => {
  const { corporation_uuid, include_uuid } = getQuery(event)
  if (!corporation_uuid) throw createError({ statusCode: 400, statusMessage: 'corporation_uuid is required' })

  const config = useRuntimeConfig()
  const nimbleApi3 = config.nimbleApi3Url as string
  const bearer = resolveNimbleBearerForEvent(event)

  if (!nimbleApi3) {
    return { data: [] }
  }

  const session = getSessionFromEvent(event)
  const bearerSource = session?.token ? 'session' : (bearer ? 'nimbleToken-config' : 'none')

  if (!bearer) {
    console.warn('[PO Print Debug] GET /api/purchase-orders/vendors — no bearer token', {
      corporation_uuid,
      include_uuid,
    })
    return { data: [] }
  }

  try {
    const corpId = toNimbleCorpId(event.context?.nimbleCorpId ?? corporation_uuid)

    console.log('[PO Print Debug] GET /api/purchase-orders/vendors — calling Nimble', {
      corpId,
      bearerSource,
      include_uuid,
    })

    const response = await $fetch<unknown>(`${nimbleApi3}/v1/VendorContractMaster/List`, {
      method: 'GET',
      query: { CorpID: corpId },
      headers: {
        Authorization: `Bearer ${bearer}`,
        'Content-Type': 'application/json',
      },
    })

    let mapped = extractNimbleVendorContractList(response).map(mapNimbleVendorContractToPoVendor)

    const includeId = typeof include_uuid === 'string' ? include_uuid.trim().toLowerCase() : ''
    if (includeId && !mapped.some((v) => v.uuid === includeId)) {
      const extra = extractNimbleVendorContractList(response).find(
        (v) => String(v.vendorID || '').toLowerCase() === includeId,
      )
      if (extra) mapped = [...mapped, mapNimbleVendorContractToPoVendor(extra)]
    }

    console.log('[PO Print Debug] GET /api/purchase-orders/vendors — success', {
      vendorCount: mapped.length,
      includeFound: includeId ? mapped.some((v) => v.uuid === includeId) : null,
    })

    return { data: mapped }
  }
  catch (error: any) {
    console.error('[PO Print Debug] GET /api/purchase-orders/vendors — failed', {
      message: error?.message,
      statusCode: error?.statusCode,
      corpId: toNimbleCorpId(event.context?.nimbleCorpId ?? corporation_uuid),
      bearerSource,
    })
    return { data: [] }
  }
})
