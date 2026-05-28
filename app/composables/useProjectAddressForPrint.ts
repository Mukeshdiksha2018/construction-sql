/**
 * Resolves project addresses for PO/CO print preview.
 */

export function pickDefaultProjectShipmentAddress(activeAddresses: any[]): any | null {
  if (!Array.isArray(activeAddresses) || activeAddresses.length === 0) return null
  const shipping = activeAddresses.filter(
    a => a && a.is_active !== false && a.address_type === 'shipment'
  )
  if (shipping.length === 0) return null
  return shipping.find(a => a.is_primary) || shipping[0]
}

export function pickDefaultProjectAddressByType(
  activeAddresses: any[],
  addressType: 'bill' | 'final-destination'
): any | null {
  if (!Array.isArray(activeAddresses) || activeAddresses.length === 0) return null
  const rows = activeAddresses.filter(
    a => a && a.is_active !== false && a.address_type === addressType
  )
  if (rows.length === 0) return null
  return rows.find(a => a.is_primary) || rows[0]
}

export async function fetchProjectAddressForPreview(
  projectUuid: string,
  addressUuid: string | null | undefined,
  activeAddresses: any[]
): Promise<any | null> {
  if (!addressUuid) return null
  const found = activeAddresses.find(a => a.uuid === addressUuid)
  if (found) return found
  try {
    const res: any = await $fetch('/api/projects/addresses', {
      method: 'GET',
      query: { project_uuid: projectUuid, address_uuid: addressUuid },
    })
    const list = res?.data
    if (Array.isArray(list) && list[0]) return list[0]
    return null
  } catch (e) {
    console.error('Failed to load project address by uuid for print preview', e)
    return null
  }
}

export async function resolveShippingAddressForPrint(
  projectUuid: string | null | undefined,
  shippingAddressUuid: string | null | undefined,
  shippingAddressCustom: string | null | undefined,
  activeAddresses: any[]
): Promise<any | null> {
  if (shippingAddressCustom && String(shippingAddressCustom).trim()) return null
  let resolved: any | null = null
  if (shippingAddressUuid && projectUuid) {
    resolved = await fetchProjectAddressForPreview(projectUuid, shippingAddressUuid, activeAddresses)
  }
  if (!resolved && projectUuid) {
    resolved = pickDefaultProjectShipmentAddress(activeAddresses)
  }
  return resolved
}
