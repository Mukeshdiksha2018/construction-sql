import { listHoldbackReleases } from '../../utils/holdbackReleases'

/**
 * GET /api/holdback-releases
 *
 * Returns holdback_cost_codes rows with release_amount > 0 (active parent invoices only).
 * Query: vendor_invoice_uuid, purchase_order_uuid, change_order_uuid,
 *        holdback_invoice_uuid, exclude_current_invoice
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const vendorInvoiceUuid = String(query.vendor_invoice_uuid ?? '').trim()
  const purchaseOrderUuid = String(query.purchase_order_uuid ?? '').trim()
  const changeOrderUuid = String(query.change_order_uuid ?? '').trim()
  const holdbackInvoiceUuid = String(query.holdback_invoice_uuid ?? '').trim()
  const excludeCurrentInvoice = String(query.exclude_current_invoice ?? '') === 'true'

  try {
    const data = await listHoldbackReleases({
      vendor_invoice_uuid: vendorInvoiceUuid || undefined,
      purchase_order_uuid: purchaseOrderUuid || undefined,
      change_order_uuid: changeOrderUuid || undefined,
      holdback_invoice_uuid: holdbackInvoiceUuid || undefined,
      exclude_current_invoice: excludeCurrentInvoice,
    })
    return { data }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: error?.message || 'Failed to fetch holdback releases',
    })
  }
})
