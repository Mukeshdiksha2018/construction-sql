/**
 * Proxy to the Nimble API for vendor list.
 * Used by the PO list resources store to populate the vendor filter dropdown.
 */
export default defineEventHandler(async (event) => {
  const { corporation_uuid } = getQuery(event)
  if (!corporation_uuid) throw createError({ statusCode: 400, statusMessage: 'corporation_uuid is required' })

  const config = useRuntimeConfig()
  const nimbleApi3 = config.nimbleApi3Url as string
  const nimbleToken = config.nimbleToken as string

  if (!nimbleApi3) {
    return { data: [] }
  }

  try {
    // Decode the corporation UUID to get the Nimble CorpID
    const corpIdRaw = event.context?.nimbleCorpId ?? corporation_uuid
    const corpId = String(corpIdRaw).replace(/-/g, '')

    const response = await $fetch<any>(`${nimbleApi3}/v1/VendorContractMaster/List`, {
      method: 'GET',
      query: { CorpID: corpId },
      headers: {
        Authorization: nimbleToken ? `Bearer ${nimbleToken}` : '',
        'Content-Type': 'application/json',
      },
    })

    const vendors = Array.isArray(response?.Data) ? response.Data : (Array.isArray(response) ? response : [])

    const mapped = vendors.map((v: any) => ({
      vendor_uuid: String(v.VendorUUID || v.vendor_uuid || '').toLowerCase(),
      name: v.VendorName || v.name || v.vendor_name || '',
      vendor_name: v.VendorName || v.name || v.vendor_name || '',
      code: v.VendorCode || v.code || '',
    }))

    return { data: mapped }
  } catch (error: any) {
    console.error('[vendors] Error fetching vendors:', error?.message)
    return { data: [] }
  }
})
