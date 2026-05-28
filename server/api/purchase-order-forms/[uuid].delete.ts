import { deletePurchaseOrder } from '../../utils/purchaseOrders'

export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, 'uuid')
  if (!uuid) throw createError({ statusCode: 400, statusMessage: 'uuid is required' })

  try {
    const po = await deletePurchaseOrder(uuid)
    if (!po) throw createError({ statusCode: 404, statusMessage: 'Purchase order not found' })
    return { data: po }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
