import { listStockReturnNotes, getStockReturnNote } from '../../utils/purchaseOrders'

export default defineEventHandler(async (event) => {
  const { corporation_uuid, uuid, project_uuid, vendor_uuid } = getQuery(event)

  if (!corporation_uuid && !uuid) {
    throw createError({ statusCode: 400, statusMessage: 'corporation_uuid or uuid is required' })
  }

  try {
    if (uuid) {
      const note = await getStockReturnNote(String(uuid))
      if (!note) throw createError({ statusCode: 404, statusMessage: 'Return note not found' })
      return { data: note }
    }

    const data = await listStockReturnNotes(String(corporation_uuid), {
      projectUuid: project_uuid ? String(project_uuid) : undefined,
      vendorUuid: vendor_uuid ? String(vendor_uuid) : undefined,
    })
    return { data }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
