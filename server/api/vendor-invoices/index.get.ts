import { listVendorInvoices } from '../../utils/vendorInvoices'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  try {
    const result = await listVendorInvoices({
      corporation_uuid: String(query.corporation_uuid || ''),
      uuid: query.uuid ? String(query.uuid) : undefined,
      next_invoice_number: query.next_invoice_number as string | undefined,
      project_uuid: query.project_uuid ? String(query.project_uuid) : undefined,
      vendor_uuid: query.vendor_uuid ? String(query.vendor_uuid) : undefined,
      status: query.status ? String(query.status) : undefined,
      invoice_type: query.invoice_type ? String(query.invoice_type) : undefined,
      bill_date_from: query.bill_date_from ? String(query.bill_date_from) : undefined,
      bill_date_to: query.bill_date_to ? String(query.bill_date_to) : undefined,
      page: query.page ? Number(query.page) : undefined,
      page_size: query.page_size ? Number(query.page_size) : undefined,
    })
    return result
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
