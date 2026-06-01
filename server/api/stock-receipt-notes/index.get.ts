import {
  generateNextGrnNumber,
  getStockReceiptNote,
  listStockReceiptNotes,
} from '../../utils/stockReceiptNotes'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const {
    corporation_uuid,
    uuid,
    project_uuid,
    vendor_uuid,
    purchase_order_uuid,
    change_order_uuid,
    entry_date_from,
    entry_date_to,
    next_grn_number,
  } = query

  if (next_grn_number === 'true' || next_grn_number === '1') {
    if (!corporation_uuid) {
      throw createError({ statusCode: 400, statusMessage: 'corporation_uuid is required' })
    }
    const grn = await generateNextGrnNumber(String(corporation_uuid))
    return { data: grn }
  }

  if (!corporation_uuid && !uuid) {
    throw createError({ statusCode: 400, statusMessage: 'corporation_uuid or uuid is required' })
  }

  try {
    if (uuid) {
      const note = await getStockReceiptNote(String(uuid))
      if (!note) throw createError({ statusCode: 404, statusMessage: 'Receipt note not found' })
      return { data: note }
    }

    const data = await listStockReceiptNotes(String(corporation_uuid), {
      projectUuid: project_uuid ? String(project_uuid) : undefined,
      vendorUuid: vendor_uuid ? String(vendor_uuid) : undefined,
      purchaseOrderUuid: purchase_order_uuid ? String(purchase_order_uuid) : undefined,
      changeOrderUuid: change_order_uuid ? String(change_order_uuid) : undefined,
      entryDateFrom: entry_date_from ? String(entry_date_from) : undefined,
      entryDateTo: entry_date_to ? String(entry_date_to) : undefined,
    })
    return { data }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
