import { getPurchaseOrderDetailsInvoiceSummary } from '../../utils/reports/getPurchaseOrderDetailsInvoiceSummary'

/** GET /api/reports/purchase-order-details-invoice-summary */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const corporationUuid = String(query.corporation_uuid || '').trim()
  const projectUuid = String(query.project_uuid || '').trim()
  const startDate = String(query.start_date || '').trim().substring(0, 10)
  const endDate = String(query.end_date || '').trim().substring(0, 10)
  const entryDateFrom = String(query.entry_date_from || '').trim()
  const entryDateTo = String(query.entry_date_to || '').trim()
  const vendorUuid = String(query.vendor_uuid || '').trim() || undefined
  const poStatusFilter = String(query.po_status || '').trim() || undefined

  if (!corporationUuid || !projectUuid || !startDate || !endDate) {
    throw createError({
      statusCode: 400,
      statusMessage: 'corporation_uuid, project_uuid, start_date, and end_date are required',
    })
  }

  if (startDate > endDate) {
    throw createError({
      statusCode: 400,
      statusMessage: 'start_date must be on or before end_date',
    })
  }

  try {
    const data = await getPurchaseOrderDetailsInvoiceSummary(event, {
      corporationUuid,
      projectUuid,
      startDate,
      endDate,
      entryDateFrom: entryDateFrom || undefined,
      entryDateTo: entryDateTo || undefined,
      vendorUuid,
      poStatusFilter,
    })
    return { data }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number; statusMessage?: string; message?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? err.message ?? 'Failed to build purchase order invoice summary report',
    })
  }
})
