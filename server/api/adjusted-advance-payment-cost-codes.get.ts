import { listAdjustedAdvancePaymentCostCodes } from '../utils/vendorInvoiceAdvancePayments'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const vendorInvoiceUuid = String(query.vendor_invoice_uuid ?? '').trim()
  const purchaseOrderUuid = String(query.purchase_order_uuid ?? '').trim()
  const changeOrderUuid = String(query.change_order_uuid ?? '').trim()
  const excludeCurrentInvoice = String(query.exclude_current_invoice ?? '') === 'true'

  if (!vendorInvoiceUuid && !purchaseOrderUuid && !changeOrderUuid) {
    throw createError({
      statusCode: 400,
      statusMessage:
        'Either vendor_invoice_uuid or (purchase_order_uuid/change_order_uuid) is required',
    })
  }

  try {
    const data = await listAdjustedAdvancePaymentCostCodes({
      vendor_invoice_uuid: vendorInvoiceUuid || undefined,
      purchase_order_uuid: purchaseOrderUuid || undefined,
      change_order_uuid: changeOrderUuid || undefined,
      exclude_current_invoice: excludeCurrentInvoice,
    })
    return { data }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
