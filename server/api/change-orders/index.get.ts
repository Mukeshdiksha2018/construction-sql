import {
  getChangeOrder,
  listChangeOrders,
  generateNextCoNumber,
} from '../../utils/changeOrders'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const {
    corporation_uuid,
    uuid,
    project_uuid,
    vendor_uuid,
    created_date_from,
    created_date_to,
    page,
    page_size,
    next_co_number,
    project_id,
  } = query

  try {
    if (uuid) {
      const co = await getChangeOrder(String(uuid))
      if (!co) throw createError({ statusCode: 404, statusMessage: 'Change order not found' })
      return { data: co }
    }

    if (!corporation_uuid) {
      throw createError({ statusCode: 400, statusMessage: 'corporation_uuid is required' })
    }

    if (next_co_number === 'true' || next_co_number === '1') {
      const nextNum = await generateNextCoNumber(
        String(corporation_uuid),
        project_id ? String(project_id) : null,
      )
      return { data: nextNum }
    }

    return await listChangeOrders(String(corporation_uuid), {
      projectUuid: project_uuid ? String(project_uuid) : undefined,
      vendorUuid: vendor_uuid ? String(vendor_uuid) : undefined,
      createdDateFrom: created_date_from ? String(created_date_from) : undefined,
      createdDateTo: created_date_to ? String(created_date_to) : undefined,
      page: page ? parseInt(String(page), 10) : 1,
      pageSize: page_size ? parseInt(String(page_size), 10) : 100,
    })
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
