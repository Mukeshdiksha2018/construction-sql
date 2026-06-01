import { getLaborChangeOrderItems } from '../../utils/changeOrders'

export default defineEventHandler(async (event) => {
  const { change_order_uuid } = getQuery(event)
  if (!change_order_uuid) {
    throw createError({ statusCode: 400, statusMessage: 'change_order_uuid is required' })
  }

  try {
    const data = await getLaborChangeOrderItems(String(change_order_uuid))
    return { data }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
