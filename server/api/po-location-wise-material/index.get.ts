import { getLocationWiseMaterialItems } from '../../utils/purchaseOrders'

export default defineEventHandler(async (event) => {
  const { purchase_order_uuid } = getQuery(event)
  if (!purchase_order_uuid) throw createError({ statusCode: 400, statusMessage: 'purchase_order_uuid is required' })

  try {
    const items = await getLocationWiseMaterialItems(String(purchase_order_uuid))
    return { data: items }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
