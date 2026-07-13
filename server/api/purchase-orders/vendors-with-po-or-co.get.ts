import { fetchVendorUuidsWithPoOrCo, type PoCoOrderType } from '../../utils/vendorsWithPoOrCo'

/** GET /api/purchase-orders/vendors-with-po-or-co */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const corporationUuid = String(query.corporation_uuid || '').trim()
  const projectUuid = String(query.project_uuid || '').trim() || null
  const orderTypeRaw = String(query.order_type || '').trim().toUpperCase()
  const orderType =
    orderTypeRaw === 'MATERIAL' || orderTypeRaw === 'LABOR'
      ? (orderTypeRaw as PoCoOrderType)
      : null

  if (!corporationUuid) {
    throw createError({
      statusCode: 400,
      statusMessage: 'corporation_uuid is required',
    })
  }

  try {
    const vendorUuids = await fetchVendorUuidsWithPoOrCo({
      corporationUuid,
      projectUuid,
      orderType,
    })
    return { data: vendorUuids }
  }
  catch (error: unknown) {
    const err = error as { message?: string }
    throw createError({
      statusCode: 500,
      statusMessage: err.message || 'Failed to load vendors with PO/CO',
    })
  }
})
