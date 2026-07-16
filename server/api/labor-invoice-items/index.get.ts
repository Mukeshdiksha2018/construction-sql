import { listLaborInvoiceItems } from '../../utils/laborInvoiceItems'

/**
 * GET /api/labor-invoice-items
 *
 * Modes:
 * - vendor_invoice_uuid → saved labor invoice lines (enriched with PO/CO originals)
 * - purchase_order_uuid / change_order_uuid → labor schedule templates (invoice_amount: 0)
 * - + aggregate_invoiced=true → prior invoiced totals per aggregation key
 *
 * Persistence of labor lines on save remains in vendor-invoices (persistLaborInvoiceItems).
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const vendorInvoiceUuid = String(query.vendor_invoice_uuid ?? '').trim()
  const purchaseOrderUuid = String(query.purchase_order_uuid ?? '').trim()
  const changeOrderUuid = String(query.change_order_uuid ?? '').trim()
  const excludeVendorInvoiceUuid = String(
    query.exclude_vendor_invoice_uuid ?? '',
  ).trim()
  const includeInactive = String(query.include_inactive ?? '') === 'true'
  const aggregateInvoiced = String(query.aggregate_invoiced ?? '') === 'true'

  try {
    const data = await listLaborInvoiceItems({
      vendor_invoice_uuid: vendorInvoiceUuid || undefined,
      purchase_order_uuid: purchaseOrderUuid || undefined,
      change_order_uuid: changeOrderUuid || undefined,
      exclude_vendor_invoice_uuid: excludeVendorInvoiceUuid || undefined,
      include_inactive: includeInactive,
      aggregate_invoiced: aggregateInvoiced,
    })
    return { data }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: error?.message || 'Failed to fetch labor invoice items',
    })
  }
})
