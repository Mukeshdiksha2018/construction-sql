export type VendorAddressType = 'default' | 'source' | 'manufacturing'

export type VendorAddress = {
  addressName: string | null
  address: string | null
  city: string | null
  stateID: number | null
  stateName: string | null
  countryID: number | null
  countryName: string | null
  zipCode: string | null
  mobileNum: string | null
  alternativeNum: string | null
  workNum: string | null
  faxNum: string | null
  emailID: string | null
  addressType: VendorAddressType
}

const ADDRESS_TYPES: VendorAddressType[] = ['default', 'source', 'manufacturing']

function safeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : value != null ? String(value).trim() : ''
}

export function createEmptyVendorAddress(type: VendorAddressType): VendorAddress {
  return {
    addressName: null, address: null, city: null, stateID: null, stateName: null,
    countryID: null, countryName: null, zipCode: null, mobileNum: null,
    alternativeNum: null, workNum: null, faxNum: null, emailID: null, addressType: type,
  }
}

export function normalizeVendorAddresses(input: unknown): VendorAddress[] {
  const byType = new Map<VendorAddressType, VendorAddress>()
  for (const type of ADDRESS_TYPES) byType.set(type, createEmptyVendorAddress(type))

  const list = Array.isArray(input) ? input : []
  for (const item of list) {
    if (!item || typeof item !== 'object') continue
    const row = item as Record<string, unknown>
    const rawType = safeString(row.addressType ?? row.type).toLowerCase() as VendorAddressType
    if (!ADDRESS_TYPES.includes(rawType)) continue
    byType.set(rawType, {
      addressName: safeString(row.addressName) || null,
      address: safeString(row.address) || null,
      city: safeString(row.city) || null,
      stateID: row.stateID == null || row.stateID === '' ? null : Number.isFinite(Number(row.stateID)) ? Number(row.stateID) : null,
      stateName: safeString(row.stateName ?? row.state) || null,
      countryID: row.countryID == null || row.countryID === '' ? null : Number.isFinite(Number(row.countryID)) ? Number(row.countryID) : null,
      countryName: safeString(row.countryName ?? row.country) || null,
      zipCode: safeString(row.zipCode ?? row.zip) || null,
      mobileNum: safeString(row.mobileNum) || null,
      alternativeNum: safeString(row.alternativeNum) || null,
      workNum: safeString(row.workNum) || null,
      faxNum: safeString(row.faxNum) || null,
      emailID: safeString(row.emailID) || null,
      addressType: rawType,
    })
  }

  return ADDRESS_TYPES.map(type => byType.get(type) as VendorAddress)
}

export function buildVendorAddressesFromLegacy(input: {
  vendor_address?: unknown
  vendor_city?: unknown
  vendor_state?: unknown
  vendor_country?: unknown
  vendor_zip?: unknown
}): VendorAddress[] {
  return [
    {
      addressName: null,
      address: safeString(input.vendor_address) || null,
      city: safeString(input.vendor_city) || null,
      stateID: null,
      stateName: safeString(input.vendor_state) || null,
      countryID: null,
      countryName: safeString(input.vendor_country) || null,
      zipCode: safeString(input.vendor_zip) || null,
      mobileNum: null, alternativeNum: null, workNum: null, faxNum: null, emailID: null,
      addressType: 'default',
    },
    createEmptyVendorAddress('source'),
    createEmptyVendorAddress('manufacturing'),
  ]
}

export function resolveVendorAddresses(input: unknown, fallbackLegacy?: {
  vendor_address?: unknown; vendor_city?: unknown; vendor_state?: unknown
  vendor_country?: unknown; vendor_zip?: unknown
}): VendorAddress[] {
  const normalized = normalizeVendorAddresses(input)
  const hasAny = normalized.some(a => a.address || a.city || a.stateName || a.countryName || a.zipCode)
  if (hasAny || !fallbackLegacy) return normalized
  return buildVendorAddressesFromLegacy(fallbackLegacy)
}

export function getVendorAddressByType(addresses: VendorAddress[], type: VendorAddressType): VendorAddress {
  return addresses.find(a => a.addressType === type) || createEmptyVendorAddress(type)
}
