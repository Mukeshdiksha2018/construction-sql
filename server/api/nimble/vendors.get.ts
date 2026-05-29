import { requireAuthSession } from '../../utils/auth-session'
import { toNimbleCorpId } from '../../utils/nimbleVendorMaster'
import { toNimbleCorpId } from '../../utils/nimbleVendorMaster'

/**
 * GET /api/nimble/vendors?corporation_uuid=<uuid>
 *
 * Proxies the Nimble API3 vendor master list for a given corporation.
 * Endpoint: {NIMBLE_API3_URL}/v1/VendorContractMaster/List?CorpID=<corporation_uuid>
 *
 * Returns the raw vendor list from Nimble (normalisation is done in the store).
 */

interface NimbleVendorDTO {
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
  status?: number
  addressDetails?: unknown[]
  contractDetails?: unknown[]
}

interface NimbleVendorListResponse {
  vendorContractMasterList?: NimbleVendorDTO[]
  statusCode?: number
  status?: string
}

export default defineEventHandler(async (event) => {
  const session = requireAuthSession(event)
  const config = useRuntimeConfig()

  const api3BaseUrl = String((config as Record<string, unknown>).nimbleApi3Url || '').trim().replace(/\/$/, '')

  if (!api3BaseUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: 'NIMBLE_API3_URL is not configured',
    })
  }

  const { corporation_uuid } = getQuery(event)
  if (!corporation_uuid) {
    throw createError({
      statusCode: 400,
      statusMessage: 'corporation_uuid query parameter is required',
    })
  }

  const corpId = toNimbleCorpId(corporation_uuid)

  try {
    console.log('[PO Print Debug] GET /api/nimble/vendors — calling Nimble', {
      corpId,
      hasToken: !!session.token,
    })

    const data = await $fetch<NimbleVendorListResponse>(
      `${api3BaseUrl}/v1/VendorContractMaster/List`,
      {
        query: { CorpID: corpId },
        headers: { Authorization: `Bearer ${session.token}` },
      },
    )

    const vendors = data?.vendorContractMasterList ?? []
    console.log('[PO Print Debug] GET /api/nimble/vendors — success', {
      vendorCount: vendors.length,
    })
    return { vendors, total: vendors.length }
  }
  catch (err: unknown) {
    console.error('[PO Print Debug] GET /api/nimble/vendors — failed', {
      corpId,
      details: String(err),
      statusCode: (err as { statusCode?: number })?.statusCode,
    })
    const status = (err as { statusCode?: number })?.statusCode ?? 502
    throw createError({
      statusCode: status,
      statusMessage: 'Failed to fetch vendors from Nimble',
      data: { details: String(err) },
    })
  }
})
