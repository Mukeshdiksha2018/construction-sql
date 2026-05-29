import { enrichPoItemsWithUomLabels } from '../../utils/enrichPoItemsUom'
import { getPurchaseOrderItems } from '../../utils/purchaseOrders'

export default defineEventHandler(async (event) => {
  const { purchase_order_uuid } = getQuery(event)
  if (!purchase_order_uuid) throw createError({ statusCode: 400, statusMessage: 'purchase_order_uuid is required' })

  try {
    const items = await getPurchaseOrderItems(String(purchase_order_uuid))
    const enriched = await enrichPoItemsWithUomLabels(items, event)
    return { data: enriched }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
