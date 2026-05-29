import {
  coerceVendorAddressType,
  resolveVendorAddresses,
  type VendorAddress,
} from './vendorAddresses'

/** Nimble VendorContractMaster row (subset). */
export type NimbleVendorContractRow = {
  vendorID?: string
  vendorName?: string
  corporationID?: string
  federalID?: string | null
  paymentMethodName?: string | null
  status?: number
  addressDetails?: unknown[]
}

export type NimbleVendorContractListResponse = {
  vendorContractMasterList?: NimbleVendorContractRow[]
  Data?: NimbleVendorContractRow[]
}

function safeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : value != null ? String(value).trim() : ''
}

/** Convert Nimble `addressDetails` rows into app `vendor_addresses` shape. */
export function mapNimbleAddressDetailsToVendorAddresses(addressDetails: unknown): VendorAddress[] {
  const list = Array.isArray(addressDetails) ? addressDetails : []
  const mapped: VendorAddress[] = []

  for (const item of list) {
    if (!item || typeof item !== 'object') continue
    const row = item as Record<string, unknown>
    const addressType = coerceVendorAddressType(row.addressType ?? row.type)
    if (!addressType) continue
    mapped.push({
      addressName: safeString(row.addressName) || null,
      address: safeString(row.address) || null,
      city: safeString(row.city) || null,
      stateID:
        row.stateID == null || row.stateID === ''
          ? null
          : Number.isFinite(Number(row.stateID))
            ? Number(row.stateID)
            : null,
      stateName: safeString(row.stateName ?? row.state) || null,
      countryID:
        row.countryID == null || row.countryID === ''
          ? null
          : Number.isFinite(Number(row.countryID))
            ? Number(row.countryID)
            : null,
      countryName: safeString(row.countryName ?? row.country) || null,
      zipCode: safeString(row.zipCode ?? row.zip) || null,
      mobileNum: safeString(row.mobileNum) || null,
      alternativeNum: safeString(row.alternativeNum) || null,
      workNum: safeString(row.workNum) || null,
      faxNum: safeString(row.faxNum) || null,
      emailID: safeString(row.emailID ?? row.email) || null,
      addressType,
    })
  }

  return resolveVendorAddresses(mapped)
}

/** Normalise a Nimble vendor row for PO UI / print preview. */
export function mapNimbleVendorContractToPoVendor(v: NimbleVendorContractRow) {
  const vendorAddresses = mapNimbleAddressDetailsToVendorAddresses(v.addressDetails)
  const defaultAddr = vendorAddresses.find((a) => a.addressType === 'default') ?? vendorAddresses[0]

  const uuid = normalizeNimbleEntityId(v.vendorID)

  return {
    uuid,
    vendor_uuid: uuid,
    vendor_name: safeString(v.vendorName),
    name: safeString(v.vendorName),
    corporation_uuid: safeString(v.corporationID).toLowerCase() || null,
    vendor_federal_id: v.federalID ?? null,
    payment_method: v.paymentMethodName ?? null,
    is_active: v.status === 1,
    vendor_addresses: vendorAddresses,
    vendor_address: defaultAddr?.address ?? '',
    vendor_city: defaultAddr?.city ?? '',
    vendor_state: defaultAddr?.stateName ?? '',
    vendor_country: defaultAddr?.countryName ?? '',
    vendor_zip: defaultAddr?.zipCode ?? '',
    vendor_phone: defaultAddr?.mobileNum ?? defaultAddr?.workNum ?? '',
    vendor_fax: defaultAddr?.faxNum ?? '',
    vendor_email: defaultAddr?.emailID ?? '',
    vendor_contact_name: defaultAddr?.addressName ?? '',
  }
}

export function extractNimbleVendorContractList(response: NimbleVendorContractListResponse | unknown): NimbleVendorContractRow[] {
  if (!response || typeof response !== 'object') return []
  const r = response as NimbleVendorContractListResponse
  if (Array.isArray(r.vendorContractMasterList)) return r.vendorContractMasterList
  if (Array.isArray(r.Data)) return r.Data
  if (Array.isArray(response)) return response as NimbleVendorContractRow[]
  return []
}

/** Nimble CorpID query value (hex ID without dashes). */
export function toNimbleCorpId(corporationUuid: unknown): string {
  return String(corporationUuid ?? '').replace(/-/g, '').trim()
}

/** Compare Nimble IDs (vendor, corp, UOM) regardless of dashes/casing. */
export function normalizeNimbleEntityId(value: unknown): string {
  return String(value ?? '').replace(/-/g, '').trim().toLowerCase()
}
