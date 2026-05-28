import { replaceLocationWiseMaterialItems } from '../../utils/purchaseOrders'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { purchase_order_uuid, corporation_uuid, project_uuid, items } = body ?? {}

  if (!purchase_order_uuid) throw createError({ statusCode: 400, statusMessage: 'purchase_order_uuid is required' })

  try {
    const result = await replaceLocationWiseMaterialItems(
      String(purchase_order_uuid),
      corporation_uuid ? String(corporation_uuid) : null,
      project_uuid ? String(project_uuid) : null,
      Array.isArray(items) ? items : []
    )
    return { data: result }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
