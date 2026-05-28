import { listPurchaseOrders, getPurchaseOrder, generateNextPoNumber } from '../../utils/purchaseOrders'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { corporation_uuid, uuid, next_po_number, project_uuid, vendor_uuid, entry_date_from, entry_date_to, page, page_size } = query

  if (!corporation_uuid && !uuid) {
    throw createError({ statusCode: 400, statusMessage: 'corporation_uuid or uuid is required' })
  }

  try {
    // Single PO lookup
    if (uuid) {
      const po = await getPurchaseOrder(String(uuid))
      if (!po) throw createError({ statusCode: 404, statusMessage: 'Purchase order not found' })
      return { data: po }
    }

    // Next PO number
    if (next_po_number === 'true' || next_po_number === '1') {
      const nextNum = await generateNextPoNumber(String(corporation_uuid), query.project_id ? String(query.project_id) : null)
      return { data: nextNum }
    }

    // List with filters
    const data = await listPurchaseOrders(String(corporation_uuid), {
      projectUuid: project_uuid ? String(project_uuid) : undefined,
      vendorUuid: vendor_uuid ? String(vendor_uuid) : undefined,
      entryDateFrom: entry_date_from ? String(entry_date_from) : undefined,
      entryDateTo: entry_date_to ? String(entry_date_to) : undefined,
      page: page ? parseInt(String(page)) : 1,
      pageSize: page_size ? parseInt(String(page_size)) : 100,
    })

    return data
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
